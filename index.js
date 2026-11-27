/**
 * dsh-annotate 的宿主半边。
 *
 * 0.115 起另有 `/annotate-file`：按会话读 md/txt/code/csv（见 registerFileRoute）。
 *
 * 现在只做两件事：
 *  1. 声明本行的 Config（设置页的表单就是它投影出来的，字段必须 `.volatile()`）；
 *  2. 注册 `/doc` 斜杠命令 —— 它在当前会话里发一条用户消息，让模型把刚才的讨论整理成文档。
 *
 * 注意：这是 link 安装的插件（D:\…\annotate），裸导入 `@deepseek-ai/*` 解析不到，
 * 所以 schemastery 跟 computer-use 一样放在 ./vendor 里自带一份。
 */
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import zlib from 'node:zlib'
import z from './vendor/schemastery.js'

/** 设置页里每一个字段都要能“改完立刻生效”，所以全部 volatile。 */
export const Config = z.object({
  autoOpenDoc: z.boolean().default(true)
    .description('这个会话第一次出现文档时，自动把右侧的「文档」页签推出来')
    .volatile(),
  defaultFont: z.number().min(12).max(21).step(1).default(15)
    .description('文档默认字号（12–21）；本地手动调过字号时以本地为准')
    .volatile(),
  keepReplyWindow: z.number().min(1).max(4).step(1).default(4)
    .description('回复锚点队列保留几条（1–4）：同时有多批批注在等回复时用来配对')
    .volatile(),
  wideRightClick: z.boolean().default(true)
    .description('右键唤出范围放宽：在文档正文里右键就开批注框（关掉后必须先用鼠标划中一句话再右键）')
    .volatile(),
  dockDocTab: z.boolean().default(false)
    .description('文档停靠在右侧栏（需要 dsh-better-sidebar）：开着文档会开成右侧栏页签，关着用插件自己的窗口；页签不可用时会自动回落到窗口')
    .volatile(),
  docDir: z.string().default('')
    .description('文档文件存放目录（留空＝${DSH_HOME}/annotate-docs）；方案 B′ 第一步用')
    .volatile(),
  reactions: z.string().default('👍=对，就这么做\n❌=不对，换个做法')
    .description('划句后浮出的表情：一行一个「表情=含义」，点一下就把含义连同选中的句子发出去')
    .volatile(),
})

/** `/doc` 不带参数时发出去的那句话。 */
const DOC_PROMPT = '把刚才讨论的内容整理成一份文档发给我（用 dsh-doc 围栏，只发一份，聊天里不用重复）。'

/**
 * 造一条 user 角色的消息。
 *
 * 不 import `@deepseek-ai/dsh-llm` 的 `createUserMessage`：link 插件解析不到那个包。
 * 它做的事就是补一个 randomUUID、role:'user'、deepFreeze —— 这里等价地手写出来。
 * @param {string} text 消息正文。
 * @returns {{id: string, role: 'user', content: Array<{type: 'text', text: string}>, source: {kind: 'user'}}}
 */
function userMessage(text) {
  const id = globalThis.crypto !== undefined && typeof globalThis.crypto.randomUUID === 'function'
    ? globalThis.crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
  return { id, role: 'user', content: [{ type: 'text', text }], source: { kind: 'user' } }
}

/** 把固定的整理指令和用户补的话拼成一条消息。 */
function docMessageText(rawInput) {
  const extra = String(rawInput === undefined || rawInput === null ? '' : rawInput).trim()
  if (extra === '') return DOC_PROMPT
  return DOC_PROMPT + '\n\n这次重点整理：' + extra
}

/**
 * 注册 `/doc`：给模型的指令，不是打开页签。
 * @param {import('@deepseek-ai/cordis').Context} ctx 宿主上下文。
 */
export function apply(ctx, config) {
  ctx.inject(['commands'], (commandCtx) => {
    commandCtx.effect(() => commandCtx.commands.register({
      name: 'doc',
      description: '把刚才讨论的内容整理成一份文档发给我（发给模型，不是打开页签）',
      input: { hint: '[要重点整理的内容，可省略]' },
      handler: ({ agent, rawInput }) => {
        if (agent === undefined || agent === null) {
          return { kind: 'error', text: '当前会话里没有可用的 agent，换个会话再试。' }
        }
        const message = userMessage(docMessageText(rawInput))
        /* followup：排一条下一轮的用户消息并唤醒驱动器；会话正在跑也只排队，不打断当前回合。 */
        if (typeof agent.followup === 'function') {
          agent.followup(message)
        } else if (typeof agent.steer === 'function') {
          agent.steer(message)
        } else {
          return { kind: 'error', text: '这个 DSH 版本没有 agent.followup，发不出整理指令。' }
        }
        return { kind: 'success', text: '已把整理文档的指令发给模型。' }
      },
    }), 'annotate: /doc 命令')
  })

  registerTranscribeRoute(ctx)
  registerDocRoute(ctx, config)
  registerFileRoute(ctx, config)
  registerClientLogRoute(ctx)
  registerDocTools(ctx, config)
}

/* ------------------------------------------------------------------ 听写 */

/** 单段录音的上限：16k 单声道 30 秒约 1MB，这里给到 8MB 足够。 */
const MAX_AUDIO_BYTES = 8 * 1024 * 1024
/** 本地模型可能是冷的：第一次识别先等它准备好，最长等这么久。 */
const PREPARE_TIMEOUT_MS = 45000
/** 一句话识别的超时。 */
const TRANSCRIBE_TIMEOUT_MS = 60000

/** 读完整请求体。 */
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_AUDIO_BYTES) {
        reject(new Error('audio too large'))
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

/** 统一回一个 JSON，避免各处忘了 setHeader。 */
function sendJson(res, status, body) {
  if (res.writableEnded === true || res.destroyed === true) return
  const text = JSON.stringify(body)
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(text)
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 调 DSH 自己的识别服务。
 *
 * 服务形状（见宿主 `speechToText`）：`snapshot()` 看选中的 provider 与它们的准备状态，
 * `prepare(id)` 预热模型，`resolve({audio, language})` 出一份识别 spec，`transcribe(spec, signal)` 出文字。
 * @param {any} speech 宿主的 speechToText 服务。
 * @param {Uint8Array} audio 16k 单声道 PCM16 WAV。
 * @returns {Promise<string>} 识别出的文字。
 */
async function transcribe(speech, audio) {
  const snapshot = typeof speech.snapshot === 'function' ? speech.snapshot() : null
  const providerId = snapshot === null || snapshot === undefined
    ? undefined
    : (snapshot.selection === undefined || snapshot.selection === null ? undefined : snapshot.selection.providerId)
  const providers = snapshot === null || snapshot === undefined || Array.isArray(snapshot.providers) !== true
    ? []
    : snapshot.providers
  const provider = providers.find(entry => entry !== null && entry !== undefined && entry.id === providerId)
  /* 模型是冷的就等它热起来：第一次录音不至于直接报失败。 */
  if (providerId !== undefined && providerId !== null
    && provider !== undefined && (provider.preparation === undefined || provider.preparation === null
      || provider.preparation.phase !== 'ready')) {
    try {
      speech.prepare(providerId)
    } catch (error) { /* 下面等准备状态时会给出原因 */ }
    const deadline = Date.now() + PREPARE_TIMEOUT_MS
    while (Date.now() < deadline) {
      const current = (typeof speech.snapshot === 'function' ? speech.snapshot() : null)
      const list = current === null || current === undefined || Array.isArray(current.providers) !== true
        ? []
        : current.providers
      const entry = list.find(item => item !== null && item !== undefined && item.id === providerId)
      const phase = entry === undefined || entry.preparation === undefined || entry.preparation === null
        ? ''
        : entry.preparation.phase
      if (phase === 'ready') break
      if (phase === 'failed') {
        const message = entry.preparation.message === undefined ? '语音模型准备失败' : entry.preparation.message
        throw new Error(String(message))
      }
      await sleep(300)
    }
  }
  const spec = speech.resolve({ audio, language: 'zh' })
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TRANSCRIBE_TIMEOUT_MS)
  try {
    const result = await speech.transcribe(spec, controller.signal)
    if (typeof result === 'string') return result
    if (result !== null && result !== undefined && typeof result.text === 'string') return result.text
    return ''
  } finally {
    clearTimeout(timer)
  }
}

/**
 * 开一条本机路由给客户端用：`POST /annotate/transcribe { audio: base64(wav) }` → `{ ok, text }`。
 *
 * 为什么要绕一层：DSH 的识别服务只挂在宿主上下文上，浏览器半边 `ctx.get('speechToText')` 拿到的是 undefined。
 * 客户端录一段 16k 单声道 WAV（这是这个服务要求的格式），发过来由宿主去识别。
 * @param {import('@deepseek-ai/cordis').Context} ctx 宿主上下文。
 */
function registerTranscribeRoute(ctx) {
  ctx.inject(['webServer'], (webCtx) => {
    webCtx.effect(() => webCtx.webServer.register({
      kind: 'prefix',
      path: '/annotate',
      handler: async (req, res) => {
        const url = String(req.url === undefined ? '/' : req.url)
        if (url.startsWith('/annotate/transcribe') !== true) {
          sendJson(res, 404, { ok: false, reason: 'not-found' })
          return
        }
        if (req.method !== 'POST') {
          sendJson(res, 405, { ok: false, reason: 'method-not-allowed' })
          return
        }
        try {
          const raw = await readBody(req)
          let payload = null
          try {
            payload = JSON.parse(raw.toString('utf8'))
          } catch (error) {
            sendJson(res, 400, { ok: false, reason: 'bad-json' })
            return
          }
          const base64 = payload === null || typeof payload !== 'object' ? '' : String(payload.audio === undefined ? '' : payload.audio)
          if (base64 === '') {
            sendJson(res, 400, { ok: false, reason: 'no-audio' })
            return
          }
          const speech = ctx.get('speechToText')
          if (speech === undefined || speech === null || typeof speech.transcribe !== 'function') {
            sendJson(res, 503, { ok: false, reason: 'unsupported', message: '这台机器没有挂载语音识别服务' })
            return
          }
          const audio = new Uint8Array(Buffer.from(base64, 'base64'))
          const text = String(await transcribe(speech, audio)).trim()
          sendJson(res, 200, { ok: true, text })
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          try {
            ctx.logger?.warn?.(`[dsh-annotate] 听写失败：${message}`)
          } catch (logError) { /* 日志失败不影响返回 */ }
          sendJson(res, 500, { ok: false, reason: 'error', message })
        }
      },
    }), 'annotate: 听写路由')
  })
}

/* --------------------------------------------------- 文档文件（方案 B′：一会话一文件夹） */

/** 单份文档的上限，和读 body 的上限一致。 */
const MAX_DOC_BYTES = 8 * 1024 * 1024
/** 每个会话文件夹里的元数据文件名（记录完整会话 id、标题、标题→文件名映射）。 */
const META_NAME = '_session.json'

/** 文档根目录：配置优先，否则 ${DSH_HOME}/annotate-docs。 */
function docsRoot(config) {
  const safe = config === null || config === undefined || typeof config !== 'object' ? {} : config
  const custom = typeof safe.docDir === 'string' ? safe.docDir.trim() : ''
  if (custom !== '') return custom
  const home = typeof process.env.DSH_HOME === 'string' && process.env.DSH_HOME !== ''
    ? process.env.DSH_HOME
    : path.join(os.homedir(), '.dsh')
  return path.join(home, 'annotate-docs')
}

/** 会话短 id：会话 id 一律 session-xxx，取尾巴 8 位当文件夹名。 */
function sessionTailOf(sessionId) {
  const raw = String(sessionId === undefined || sessionId === null ? '' : sessionId)
  const tail = raw.replace(/^session-/u, '').slice(0, 8)
  return tail === '' ? 'nosid' : tail
}

/** 一段能当文件名用的文字：去掉 Windows 非法字符、压缩空白、掐长度。 */
function safeSegment(value, max) {
  const cleaned = String(value === undefined || value === null ? '' : value)
    /* eslint-disable-next-line no-control-regex */
    .replace(/[\\/:*?"<>|\u0000-\u001f]/gu, '-')
    .replace(/\s+/gu, ' ')
    .replace(/^[.\s-]+/u, '')
    .replace(/[.\s-]+$/u, '')
    .trim()
    .slice(0, max)
  return cleaned
}

/** 从正文里抓第一个标题当兜底文件名。 */
function titleFromText(text) {
  const matched = /^#{1,3}\s+(.+)$/mu.exec(String(text === undefined || text === null ? '' : text))
  return matched === null ? '' : String(matched[1]).trim()
}

async function exists(full) {
  try {
    await fs.access(full)
    return true
  } catch (error) {
    return false
  }
}

async function readMeta(dir) {
  try {
    const raw = await fs.readFile(path.join(dir, META_NAME), 'utf8')
    const parsed = JSON.parse(raw)
    if (parsed !== null && typeof parsed === 'object') {
      if (parsed.files === null || typeof parsed.files !== 'object') parsed.files = {}
      return parsed
    }
  } catch (error) { /* 没有或坏了：当空的 */ }
  return { files: {} }
}

async function writeMeta(dir, meta) {
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(path.join(dir, META_NAME), JSON.stringify(meta, null, 2), 'utf8')
}

/** 同名文档不覆盖：`标题.md` 占了就 `标题-2.md`。 */
async function pickName(dir, wanted) {
  let candidate = wanted
  let index = 2
  while (await exists(path.join(dir, candidate + '.md'))) {
    candidate = wanted + '-' + String(index)
    index += 1
  }
  return candidate
}

/** 写一份文档：进 `<root>/<会话尾8位>/<标题>.md`，返回落点。 */
async function saveDoc(root, sessionId, title, text, fileName, tailHint) {
  /* tailHint：文档是从某个会话目录读来的，就写回那个目录。
     以前只按 sid 落目录，sid 一旦被写串，同一份文档就会在别的会话目录里长出一份副本。 */
  const hinted = typeof tailHint === 'string' && /^[0-9a-z]{1,16}$/u.test(tailHint) ? tailHint : ''
  const dir = path.join(root, hinted === '' ? sessionTailOf(sessionId) : hinted)
  await fs.mkdir(dir, { recursive: true })
  const meta = await readMeta(dir)
  /* 只有写进「本会话自己的目录」时才记 sid。带 tailHint 往别的会话目录写的时候，
     以前会把目标目录 _session.json 里的 sid 改成本次写入者的 sid，而 listAll 正是按 meta.sid 列文档，
     于是别人的目录被认领、文档跟着串会话（2026-11-27 Claude 审计指出）。 */
  if (hinted === '' || hinted === sessionTailOf(sessionId)) {
    meta.sid = String(sessionId === undefined || sessionId === null ? '' : sessionId)
  }
  const wanted = safeSegment(title, 40) || safeSegment(titleFromText(text), 40) || '未命名文档'
  let file = typeof meta.files[wanted] === 'string' ? meta.files[wanted] : ''
  /* 客户端知道这份文档叫什么（`fileName`）：同名/无标题的两份文档按 title 路由会写错文件，
     所以指定了就优先用它（仍然过一遍非法字符与路径穿越检查）。 */
  const asked = typeof fileName === 'string' ? fileName.replace(/\.md$/iu, '').trim() : ''
  const askedOk = asked !== '' && asked.indexOf('/') < 0 && asked.indexOf('\\') < 0 && asked.indexOf('..') < 0
  if (askedOk) {
    file = asked
    meta.files[wanted] = file
  } else if (file === '' || (await exists(path.join(dir, file + '.md'))) !== true) {
    file = await pickName(dir, wanted)
    meta.files[wanted] = file
  }
  await fs.writeFile(path.join(dir, file + '.md'), text, 'utf8')
  meta.at = Date.now()
  await writeMeta(dir, meta)
  return { dir, file: file + '.md', title: wanted, full: path.join(dir, file + '.md') }
}

/** 旧版平铺文件（`<会话尾8位>-<哈希>.md`）搬进新结构；只在读的时候顺手做一次。 */
async function migrateLegacy(root, sessionId) {
  const tail = sessionTailOf(sessionId)
  let names = []
  try {
    names = await fs.readdir(root)
  } catch (error) {
    return 0
  }
  let moved = 0
  for (const name of names) {
    if (name.endsWith('.md') !== true) continue
    if (name.startsWith(tail + '-') !== true) continue
    const full = path.join(root, name)
    try {
      const text = await fs.readFile(full, 'utf8')
      await saveDoc(root, sessionId, titleFromText(text) || '未命名文档', text)
      await fs.unlink(full)
      moved += 1
    } catch (error) { /* 单份失败不影响其它 */ }
  }
  return moved
}

/**
 * 列一个会话文件夹里的可读文档（按修改时间倒序）。
 * 默认只列 `.md`（`/annotate-doc/*` 与三个文档工具的契约，不许变）；
 * `opts.others === true` 时改为只列**非 .md** 的文件，并带上 `kind`（0.115 `/annotate-file/list` 用）。
 */
async function listSessionDocs(root, sessionId, opts) {
  const others = opts !== null && opts !== undefined && opts.others === true
  const dir = path.join(root, sessionTailOf(sessionId))
  const meta = await readMeta(dir)
  let names = []
  try {
    names = await fs.readdir(dir)
  } catch (error) {
    return []
  }
  const items = []
  for (const name of names) {
    if (others === true) {
      if (name.endsWith('.md') === true || name === META_NAME) continue
      const full = path.join(dir, name)
      let stat = null
      try {
        stat = await fs.stat(full)
      } catch (error) {
        continue
      }
      if (stat.isFile() !== true) continue
      const kind = fileKindOf(name)
      items.push({
        title: name,
        file: name,
        kind,
        supported: READABLE_KINDS.has(kind),
        bytes: stat.size,
        mtime: stat.mtimeMs,
      })
      continue
    }
    if (name.endsWith('.md') !== true) continue
    const full = path.join(dir, name)
    const stat = await fs.stat(full)
    const file = name.slice(0, -3)
    const titleEntry = Object.entries(meta.files).find(pair => pair[1] === file)
    items.push({
      title: titleEntry === undefined ? file : titleEntry[0],
      file: name,
      bytes: stat.size,
      mtime: stat.mtimeMs,
    })
  }
  items.sort((a, b) => b.mtime - a.mtime)
  return items
}

/* ------------------------------------------------ 通用文件读取（0.115 · P1：md / txt / code / csv） */

/** 扩展名 → 文件类型。P1 只实现 md/txt/code/csv，其余类型认得出但返回 unsupported。 */
const FILE_KIND_BY_EXT = {
  md: 'md', markdown: 'md',
  txt: 'txt', log: 'txt', text: 'txt',
  js: 'code', cjs: 'code', mjs: 'code', jsx: 'code', ts: 'code', tsx: 'code', json: 'code',
  py: 'code', css: 'code', html: 'code', htm: 'code', xml: 'code', yml: 'code', yaml: 'code',
  toml: 'code', ini: 'code', sh: 'code', ps1: 'code', bat: 'code', cmd: 'code', sql: 'code',
  c: 'code', h: 'code', cpp: 'code', hpp: 'code', cs: 'code', java: 'code', kt: 'code',
  go: 'code', rs: 'code', rb: 'code', php: 'code', lua: 'code', swift: 'code', vue: 'code',
  csv: 'csv',
  xlsx: 'xlsx', xlsm: 'xlsx', xls: 'xlsx',
  docx: 'docx', pptx: 'pptx',
  png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', webp: 'image', bmp: 'image', svg: 'image',
}
/** 本版真正能读的类型。 */
const P1_KINDS = new Set(['md', 'txt', 'code', 'csv'])
/** 0.116 起真正能读的类型（P1 四种 + xlsx）。 */
const READABLE_KINDS = new Set([...P1_KINDS, 'xlsx'])
/** 表格上限：超出截断并标 `caps.truncated`。 */
const TABLE_MAX_ROWS = 5000
const TABLE_MAX_COLS = 64

/** 文件名 → kind；认不出的扩展名返回空串。 */
function fileKindOf(name) {
  const base = String(name === undefined || name === null ? '' : name)
  const dot = base.lastIndexOf('.')
  if (dot <= 0 || dot === base.length - 1) return ''
  const ext = base.slice(dot + 1).toLowerCase()
  return Object.prototype.hasOwnProperty.call(FILE_KIND_BY_EXT, ext) ? FILE_KIND_BY_EXT[ext] : ''
}

/**
 * RFC 4180 风格的 CSV 解析：`"` 包裹、`""` 转义、字段内换行、CRLF/LF/CR 都认；去 UTF-8 BOM。
 * 不用 split(',')：引号里的逗号和换行会把表拆坏。
 * 超过 maxRows 行或 maxCols 列就截断，返回 `{ rows, truncated }`。
 */
function parseCsv(text, maxRows, maxCols) {
  const src = String(text === undefined || text === null ? '' : text).replace(/^﻿/u, '')
  const rowLimit = Number.isFinite(maxRows) && maxRows > 0 ? Math.floor(maxRows) : TABLE_MAX_ROWS
  const colLimit = Number.isFinite(maxCols) && maxCols > 0 ? Math.floor(maxCols) : TABLE_MAX_COLS
  const rows = []
  let truncated = false
  let row = []
  let field = ''
  let quoted = false
  let i = 0
  const pushField = () => {
    if (row.length < colLimit) row.push(field)
    else truncated = true
    field = ''
  }
  const pushRow = () => {
    pushField()
    rows.push(row)
    row = []
  }
  while (i < src.length) {
    const ch = src[i]
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') { field += '"'; i += 2; continue }
        quoted = false
        i += 1
        continue
      }
      field += ch
      i += 1
      continue
    }
    if (ch === '"' && field === '') { quoted = true; i += 1; continue }
    if (ch === ',') { pushField(); i += 1; continue }
    if (ch === '\r' || ch === '\n') {
      pushRow()
      if (ch === '\r' && src[i + 1] === '\n') i += 1
      i += 1
      if (rows.length >= rowLimit) {
        if (i < src.length) truncated = true
        return { rows, truncated }
      }
      continue
    }
    field += ch
    i += 1
  }
  /* 末行没有换行符：只要这一行有内容就收下（文件末尾的单个换行不额外多出一个空行）。 */
  if (field !== '' || row.length > 0 || quoted) pushRow()
  return { rows, truncated }
}

/**
 * 路径守卫（纯函数，不碰磁盘）：把客户端给的 `path` 解析成磁盘全路径，并保证它仍在
 * `<root>/<本会话尾巴>/` 内。
 * - 不含分隔符的单纯文件名 → 相对本会话目录；
 * - 含分隔符的相对路径 → 相对 annotate-docs 根（形如 `<尾巴>/x.csv`）；
 * - 绝对路径原样解析。
 * 解析到根目录之外或别的会话目录 → `{ ok:false, status:409, reason:'cross-session' }`。
 */
function resolveSessionFile(root, sessionId, rawPath) {
  const raw = String(rawPath === undefined || rawPath === null ? '' : rawPath).trim()
  if (raw === '' || raw.indexOf('\u0000') >= 0) return { ok: false, status: 400, reason: 'no-path' }
  const tail = sessionTailOf(sessionId)
  const unified = raw.replace(/\\/gu, '/')
  const absolute = path.isAbsolute(raw) || /^[a-zA-Z]:\//u.test(unified)
  const base = absolute ? '' : (unified.indexOf('/') < 0 ? path.join(root, tail) : root)
  const full = absolute ? path.resolve(raw) : path.resolve(base, unified)
  const rel = path.relative(path.resolve(root), full)
  if (rel === '' || rel.startsWith('..') || path.isAbsolute(rel)) {
    return { ok: false, status: 409, reason: 'cross-session' }
  }
  const parts = rel.split(/[\\/]+/u)
  if (parts.length < 2 || parts[0] !== tail) return { ok: false, status: 409, reason: 'cross-session' }
  const name = parts[parts.length - 1]
  if (name === META_NAME) return { ok: false, status: 404, reason: 'missing' }
  return { ok: true, full, rel: parts.join('/'), tail, name }
}

/** 每种 kind 的能力位：md 能写回 / 导出；xlsx（0.116）能导出批注，不能写回。 */
function capsOf(kind) {
  if (kind === 'md') return { read: true, writeBack: true, export: true }
  if (kind === 'xlsx') return { read: true, writeBack: false, export: true }
  return { read: true, writeBack: false, export: false }
}

/* ------------------------------------------------ 0.116 · P2：xlsx 只读解析（自写，不引第三方库） */

/** 单个 zip 条目解压后的上限：防 zip 炸弹（8 MB 的 xlsx 解开一般远小于这个）。 */
const XLSX_ENTRY_MAX = 64 * 1024 * 1024
/** 最多读几张工作表。 */
const XLSX_MAX_SHEETS = 32

/**
 * 读 zip 目录（只支持 stored / deflate，不支持 zip64 与加密），返回 Map<路径, () => Buffer>（按需解压）。
 * 只用 `node:zlib` 的 inflateRawSync；不校验 CRC（只读预览，不往回写）。
 */
function readZip(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 22) throw new Error('不是 zip 文件')
  let eocd = -1
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i -= 1) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break }
  }
  if (eocd < 0) throw new Error('不是 zip 文件（找不到目录尾）')
  const count = buf.readUInt16LE(eocd + 10)
  let at = buf.readUInt32LE(eocd + 16)
  if (count === 0xffff || at === 0xffffffff) throw new Error('不支持 zip64')
  const entries = new Map()
  for (let n = 0; n < count; n += 1) {
    if (at + 46 > buf.length || buf.readUInt32LE(at) !== 0x02014b50) throw new Error('zip 目录损坏')
    const flags = buf.readUInt16LE(at + 8)
    const method = buf.readUInt16LE(at + 10)
    const compSize = buf.readUInt32LE(at + 20)
    const size = buf.readUInt32LE(at + 24)
    const nameLen = buf.readUInt16LE(at + 28)
    const extraLen = buf.readUInt16LE(at + 30)
    const commentLen = buf.readUInt16LE(at + 32)
    const local = buf.readUInt32LE(at + 42)
    const name = buf.slice(at + 46, at + 46 + nameLen).toString('utf8')
    at += 46 + nameLen + extraLen + commentLen
    if ((flags & 1) === 1) throw new Error('加密的 xlsx 不支持')
    entries.set(name, () => {
      if (local + 30 > buf.length || buf.readUInt32LE(local) !== 0x04034b50) throw new Error('zip 条目损坏：' + name)
      const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28)
      const raw = buf.slice(start, start + compSize)
      if (method === 0) return raw
      if (method !== 8) throw new Error('不支持的压缩方式 ' + String(method))
      if (size > XLSX_ENTRY_MAX) throw new Error('条目太大：' + name)
      return zlib.inflateRawSync(raw, { maxOutputLength: XLSX_ENTRY_MAX })
    })
  }
  return entries
}

/** XML 实体解码（&amp; &lt; &gt; &quot; &apos; &#n; &#xh;）。 */
function xmlDecode(text) {
  return String(text === undefined || text === null ? '' : text).replace(/&(#x[0-9a-fA-F]+|#\d+|amp|lt|gt|quot|apos);/gu, (all, code) => {
    if (code === 'amp') return '&'
    if (code === 'lt') return '<'
    if (code === 'gt') return '>'
    if (code === 'quot') return '"'
    if (code === 'apos') return "'"
    const n = code[1] === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10)
    return Number.isFinite(n) ? String.fromCodePoint(n) : all
  })
}

/** 一个标签的属性表（忽略命名空间前缀：`r:id` 存成 `r:id` 与 `id` 两份）。 */
function xmlAttrs(text) {
  const out = {}
  const re = /([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/gu
  let m = re.exec(text)
  while (m !== null) {
    const value = xmlDecode(m[2] !== undefined ? m[2] : m[3])
    out[m[1]] = value
    const colon = m[1].indexOf(':')
    if (colon > 0 && out[m[1].slice(colon + 1)] === undefined) out[m[1].slice(colon + 1)] = value
    m = re.exec(text)
  }
  return out
}

/** 富文本 / 内联字符串：把 `<t>` 拼起来，跳过注音 `<rPh>`。 */
function xmlTexts(fragment) {
  const body = String(fragment).replace(/<rPh\b[\s\S]*?<\/rPh>/gu, '')
  let out = ''
  const re = /<t\b[^>]*>([\s\S]*?)<\/t>/gu
  let m = re.exec(body)
  while (m !== null) {
    out += xmlDecode(m[1])
    m = re.exec(body)
  }
  return out
}

/** `B3` → { row:2, col:1 }（从 0 起）；坏输入 → null。 */
function cellRefToRC(ref) {
  const m = /^\$?([A-Z]{1,3})\$?(\d{1,7})$/u.exec(String(ref).toUpperCase())
  if (m === null) return null
  let col = 0
  for (const ch of m[1]) col = col * 26 + (ch.charCodeAt(0) - 64)
  return { row: Number(m[2]) - 1, col: col - 1 }
}

/** 内置数字格式里哪些是日期 / 时间（ECMA-376 18.8.30）。 */
const XLSX_DATE_FMT_IDS = new Set([14, 15, 16, 17, 18, 19, 20, 21, 22, 27, 30, 36, 45, 46, 47, 50, 57])

/** 自定义格式串是不是日期：去掉引号里的字面量和 [颜色] 之后还含 y / d，或含 m 且同时有 h/s。 */
function isDateFormatCode(code) {
  const plain = String(code === undefined || code === null ? '' : code)
    .replace(/"[^"]*"/gu, '').replace(/\[[^\]]*\]/gu, '').replace(/\\./gu, '').toLowerCase()
  if (/[yd]/u.test(plain)) return true
  return /m/u.test(plain) && /[hs]/u.test(plain)
}

/** Excel 序列号 → `YYYY-MM-DD`（有时间部分就加 ` HH:MM`）。date1904 为 true 时以 1904-01-01 为 0。 */
function excelSerialToDate(serial, date1904) {
  const n = Number(serial)
  if (!Number.isFinite(n)) return String(serial)
  const base = date1904 === true ? Date.UTC(1904, 0, 1) : Date.UTC(1899, 11, 30)
  const ms = Math.round(n * 86400000)
  const d = new Date(base + ms)
  const pad = v => String(v).padStart(2, '0')
  const day = String(d.getUTCFullYear()) + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate())
  const secs = Math.round((n - Math.floor(n)) * 86400)
  if (secs === 0 || secs === 86400) return day
  return day + ' ' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes())
}

/** 解析一张 sheet 的 XML。返回 { rows, truncated, formulas?, merges? }。 */
function parseSheetXml(xml, shared, dateStyles, date1904, maxRows, maxCols) {
  const grid = []
  const formulas = {}
  const sharedFormulas = {}
  let truncated = false
  let width = 0
  let autoRow = -1
  const rowRe = /<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/gu
  let rm = rowRe.exec(xml)
  while (rm !== null) {
    const rowAttrs = xmlAttrs(rm[1])
    const rowIndex = rowAttrs.r !== undefined && /^\d+$/u.test(rowAttrs.r) ? Number(rowAttrs.r) - 1 : autoRow + 1
    autoRow = rowIndex
    const inner = rm[2] === undefined ? '' : rm[2]
    rm = rowRe.exec(xml)
    if (rowIndex >= maxRows) { truncated = true; continue }
    let autoCol = -1
    const cellRe = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/gu
    let cm = cellRe.exec(inner)
    while (cm !== null) {
      const attrs = xmlAttrs(cm[1])
      const body = cm[2] === undefined ? '' : cm[2]
      cm = cellRe.exec(inner)
      const pos = attrs.r !== undefined ? cellRefToRC(attrs.r) : null
      const col = pos === null ? autoCol + 1 : pos.col
      autoCol = col
      if (col >= maxCols) { truncated = true; continue }
      const vMatch = /<v\b[^>]*>([\s\S]*?)<\/v>/u.exec(body)
      const raw = vMatch === null ? '' : xmlDecode(vMatch[1])
      const type = attrs.t === undefined ? 'n' : attrs.t
      let value = ''
      if (type === 's') {
        const idx = Number(raw)
        value = Number.isInteger(idx) && idx >= 0 && idx < shared.length ? shared[idx] : ''
      } else if (type === 'inlineStr') {
        const is = /<is\b[^>]*>([\s\S]*?)<\/is>/u.exec(body)
        value = is === null ? '' : xmlTexts(is[1])
      } else if (type === 'b') {
        value = raw === '1' ? 'TRUE' : (raw === '0' ? 'FALSE' : raw)
      } else if (type === 'str' || type === 'e' || type === 'd') {
        value = raw
      } else if (raw !== '') {
        const style = attrs.s !== undefined ? Number(attrs.s) : 0
        /* 非日期数字去掉二进制浮点尾巴（12.500000000000002 → 12.5），15 位有效数字和 Excel 显示一致。 */
        const num = Number(raw)
        value = dateStyles.has(style)
          ? excelSerialToDate(raw, date1904)
          : (Number.isFinite(num) ? String(Number(num.toPrecision(15))) : raw)
      }
      /* 公式：只取缓存值（<v>），公式原文另放 formulas，不评估。共享公式的从属格没有原文，标出来源。 */
      const fMatch = /<f\b([^>]*?)(?:\/>|>([\s\S]*?)<\/f>)/u.exec(body)
      const ref = colName(col) + String(rowIndex + 1)
      if (fMatch !== null) {
        const fAttrs = xmlAttrs(fMatch[1])
        const text = fMatch[2] === undefined ? '' : xmlDecode(fMatch[2])
        if (text !== '') {
          formulas[ref] = '=' + text
          if (fAttrs.t === 'shared' && fAttrs.si !== undefined) sharedFormulas[fAttrs.si] = { text, ref }
        } else if (fAttrs.t === 'shared' && fAttrs.si !== undefined && sharedFormulas[fAttrs.si] !== undefined) {
          formulas[ref] = '=' + sharedFormulas[fAttrs.si].text + '（共享自 ' + sharedFormulas[fAttrs.si].ref + '）'
        }
      }
      while (grid.length <= rowIndex) grid.push([])
      grid[rowIndex][col] = value
      if (col + 1 > width) width = col + 1
    }
  }
  /* 合并单元格：只在左上角留值，其余清空；区域列表原样给出（裁到上限内）。 */
  const merges = []
  const mergeRe = /<mergeCell\b([^>]*?)\/?>/gu
  let mm = mergeRe.exec(xml)
  while (mm !== null) {
    const range = xmlAttrs(mm[1]).ref
    mm = mergeRe.exec(xml)
    if (typeof range !== 'string') continue
    const [a, b] = range.split(':')
    const from = cellRefToRC(a)
    const to = cellRefToRC(b === undefined ? a : b)
    if (from === null || to === null) continue
    if (from.row >= maxRows || from.col >= maxCols) continue
    merges.push(range)
    for (let r = from.row; r <= Math.min(to.row, maxRows - 1); r += 1) {
      for (let c = from.col; c <= Math.min(to.col, maxCols - 1); c += 1) {
        if (r === from.row && c === from.col) continue
        if (grid[r] !== undefined && grid[r][c] !== undefined) grid[r][c] = ''
      }
    }
  }
  const rows = grid.map((line) => {
    const out = []
    for (let c = 0; c < width; c += 1) out.push(line[c] === undefined ? '' : String(line[c]))
    return out
  })
  const sheet = { rows }
  if (truncated) sheet.truncated = true
  if (Object.keys(formulas).length > 0) sheet.formulas = formulas
  if (merges.length > 0) sheet.merges = merges
  return sheet
}

/** 列序号 → 列名（0→A）。和客户端 colLetters 同一规则。 */
function colName(col) {
  let n = col + 1
  let out = ''
  while (n > 0) {
    const r = (n - 1) % 26
    out = String.fromCharCode(65 + r) + out
    n = Math.floor((n - 1) / 26)
  }
  return out
}

/**
 * xlsx → `{ type:'workbook', sheets:[{ name, rows, truncated?, formulas?, merges? }] }`。
 * 读：workbook.xml（表名与顺序、date1904）、workbook.xml.rels（表 → 文件）、sharedStrings.xml、styles.xml（哪些样式是日期）。
 * 解析不了就抛错（调用方回 415 parse-failed）。
 */
function parseXlsx(buf, maxRows, maxCols) {
  const rowLimit = Number.isFinite(maxRows) && maxRows > 0 ? Math.floor(maxRows) : TABLE_MAX_ROWS
  const colLimit = Number.isFinite(maxCols) && maxCols > 0 ? Math.floor(maxCols) : TABLE_MAX_COLS
  const zip = readZip(buf)
  /* 有的生成器给标签带命名空间前缀（<x:c>、<x:row>）：读入时去掉标签名前缀，属性（r:id、xml:space）不动。 */
  const text = (name) => {
    const get = zip.get(name)
    return get === undefined ? null : get().toString('utf8').replace(/<(\/?)[A-Za-z_][\w.-]*:(?=[A-Za-z_])/gu, '<$1')
  }
  const workbook = text('xl/workbook.xml')
  if (workbook === null) throw new Error('缺少 xl/workbook.xml')
  const date1904 = /<workbookPr\b[^>]*\bdate1904\s*=\s*["'](1|true)["']/u.test(workbook)
  const rels = {}
  const relsXml = text('xl/_rels/workbook.xml.rels') || ''
  const relRe = /<Relationship\b([^>]*?)\/?>/gu
  let rm = relRe.exec(relsXml)
  while (rm !== null) {
    const a = xmlAttrs(rm[1])
    if (a.Id !== undefined && a.Target !== undefined) rels[a.Id] = a.Target
    rm = relRe.exec(relsXml)
  }
  const shared = []
  const sharedXml = text('xl/sharedStrings.xml')
  if (sharedXml !== null) {
    const siRe = /<si\b[^>]*?(?:\/>|>([\s\S]*?)<\/si>)/gu
    let sm = siRe.exec(sharedXml)
    while (sm !== null) {
      shared.push(sm[1] === undefined ? '' : xmlTexts(sm[1]))
      sm = siRe.exec(sharedXml)
    }
  }
  /* 日期样式：cellXfs 第 n 个 xf 的 numFmtId 是内置日期格式，或指向一个日期样子的自定义格式。 */
  const dateStyles = new Set()
  const stylesXml = text('xl/styles.xml')
  if (stylesXml !== null) {
    const custom = {}
    const fmtRe = /<numFmt\b([^>]*?)\/?>/gu
    let fm = fmtRe.exec(stylesXml)
    while (fm !== null) {
      const a = xmlAttrs(fm[1])
      if (a.numFmtId !== undefined) custom[Number(a.numFmtId)] = a.formatCode
      fm = fmtRe.exec(stylesXml)
    }
    const xfs = /<cellXfs\b[^>]*>([\s\S]*?)<\/cellXfs>/u.exec(stylesXml)
    if (xfs !== null) {
      const xfRe = /<xf\b([^>]*?)(?:\/>|>)/gu
      let xm = xfRe.exec(xfs[1])
      let index = 0
      while (xm !== null) {
        const id = Number(xmlAttrs(xm[1]).numFmtId)
        if (XLSX_DATE_FMT_IDS.has(id) || (custom[id] !== undefined && isDateFormatCode(custom[id]))) dateStyles.add(index)
        index += 1
        xm = xfRe.exec(xfs[1])
      }
    }
  }
  const sheets = []
  const sheetRe = /<sheet\b([^>]*?)\/?>/gu
  let sh = sheetRe.exec(workbook)
  while (sh !== null && sheets.length < XLSX_MAX_SHEETS) {
    const a = xmlAttrs(sh[1])
    sh = sheetRe.exec(workbook)
    const target = rels[a['r:id']] !== undefined ? rels[a['r:id']] : rels[a.id]
    if (typeof target !== 'string') continue
    /* Target 可以是相对 xl/ 的（worksheets/sheet1.xml）或绝对的（/xl/worksheets/sheet1.xml）。 */
    const file = target.startsWith('/') ? target.slice(1) : path.posix.normalize('xl/' + target)
    const xml = text(file)
    if (xml === null) continue
    sheets.push({ name: typeof a.name === 'string' && a.name !== '' ? a.name : 'Sheet' + String(sheets.length + 1),
      ...parseSheetXml(xml, shared, dateStyles, date1904, rowLimit, colLimit) })
  }
  if (sheets.length === 0) throw new Error('没有可读的工作表')
  return { type: 'workbook', sheets }
}

/**
 * 读一个会话文件，组出 `/annotate-file` 的响应体与状态码（拆出来便于离线测）。
 * @returns {Promise<{status: number, body: object}>}
 */
async function readSessionFile(root, sessionId, rawPath) {
  const resolved = resolveSessionFile(root, sessionId, rawPath)
  if (resolved.ok !== true) return { status: resolved.status, body: { ok: false, reason: resolved.reason } }
  let stat = null
  try {
    stat = await fs.stat(resolved.full)
  } catch (error) {
    return { status: 404, body: { ok: false, reason: 'missing' } }
  }
  if (stat.isFile() !== true) return { status: 404, body: { ok: false, reason: 'missing' } }
  const kind = fileKindOf(resolved.name)
  const head = { kind, mtime: stat.mtimeMs, bytes: stat.size, title: safeSegment(resolved.name, 120) || resolved.name, file: resolved.name }
  if (READABLE_KINDS.has(kind) !== true) {
    return { status: 415, body: { ok: false, reason: 'unsupported', ...head, caps: { read: false, writeBack: false, export: false } } }
  }
  if (stat.size > MAX_DOC_BYTES) return { status: 413, body: { ok: false, reason: 'too-large', ...head } }
  if (kind === 'xlsx') {
    /* 0.116：xlsx 只读解析。坏文件 / .xls（老二进制格式）/ zip64 → 415 parse-failed，客户端说「解析不了」。 */
    let model = null
    try {
      model = parseXlsx(await fs.readFile(resolved.full), TABLE_MAX_ROWS, TABLE_MAX_COLS)
    } catch (error) {
      return { status: 415, body: { ok: false, reason: 'parse-failed', ...head, message: error instanceof Error ? error.message : String(error) } }
    }
    const truncated = model.sheets.some(sheet => sheet.truncated === true)
    return { status: 200, body: { ok: true, ...head, model, caps: { ...capsOf(kind), truncated } } }
  }
  const text = await fs.readFile(resolved.full, 'utf8')
  if (kind === 'csv') {
    const parsed = parseCsv(text, TABLE_MAX_ROWS, TABLE_MAX_COLS)
    return {
      status: 200,
      body: { ok: true, ...head, model: { type: 'table', rows: parsed.rows }, caps: { ...capsOf(kind), truncated: parsed.truncated } },
    }
  }
  return { status: 200, body: { ok: true, ...head, text, caps: capsOf(kind) } }
}

/**
 * 注册 `/annotate-file`（0.115 新增，不动 `/annotate-doc/*`）。
 *
 * GET /annotate-file?sid=&path=      → 200 { ok, kind, mtime, bytes, title, text?, model?, caps }
 *                                     → 404 missing / 409 cross-session / 415 unsupported 或 parse-failed（xlsx 坏文件，0.116） / 413 too-large
 * GET /annotate-file/list?sid=       → 本会话目录里的非 .md 文件 { ok, items:[{ file, kind, supported, bytes, mtime }] }
 */
function registerFileRoute(ctx, config) {
  ctx.inject(['webServer'], (webCtx) => {
    webCtx.effect(() => webCtx.webServer.register({
      kind: 'prefix',
      path: '/annotate-file',
      handler: async (req, res) => {
        const parsed = new URL(String(req.url === undefined ? '/' : req.url), 'http://dsh.local')
        const root = docsRoot(config)
        try {
          if (req.method !== 'GET') {
            sendJson(res, 405, { ok: false, reason: 'method-not-allowed' })
            return
          }
          const sid = parsed.searchParams.get('sid') || ''
          if (sid === '') {
            sendJson(res, 400, { ok: false, reason: 'no-sid' })
            return
          }
          if (parsed.pathname === '/annotate-file/list') {
            sendJson(res, 200, { ok: true, sid, items: await listSessionDocs(root, sid, { others: true }) })
            return
          }
          if (parsed.pathname === '/annotate-file' || parsed.pathname === '/annotate-file/') {
            const out = await readSessionFile(root, sid, parsed.searchParams.get('path') || '')
            if (out.status === 409) {
              try {
                ctx.logger?.warn?.(`[dsh-annotate] 拒绝跨会话读文件：sid=${sessionTailOf(sid)}`)
              } catch (logError) { /* 忽略 */ }
            }
            sendJson(res, out.status, out.body)
            return
          }
          sendJson(res, 404, { ok: false, reason: 'not-found' })
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          try {
            ctx.logger?.warn?.(`[dsh-annotate] 读文件失败：${message}`)
          } catch (logError) { /* 日志失败不影响返回 */ }
          sendJson(res, 500, { ok: false, reason: 'error', message })
        }
      },
    }), 'annotate: 通用文件读取路由')
  })
}

/** 列所有会话文件夹；顺带标出「DSH 里已经找不到这个会话」的孤立目录。 */
async function listAll(root, ctx) {
  let names = []
  try {
    names = await fs.readdir(root)
  } catch (error) {
    return []
  }
  let sessions = null
  try {
    sessions = ctx.get('sessions')
  } catch (error) { /* 没有这个服务就只能标 unknown */ }
  const out = []
  for (const name of names) {
    const full = path.join(root, name)
    let stat = null
    try {
      stat = await fs.stat(full)
    } catch (error) {
      continue
    }
    if (stat.isDirectory() !== true) continue
    const meta = await readMeta(full)
    const docs = await listSessionDocs(root, meta.sid === undefined ? '' : meta.sid)
    let present = null
    if (sessions !== null && typeof sessions.get === 'function') {
      try {
        present = sessions.get(meta.sid) !== undefined
      } catch (error) {
        present = null
      }
    }
    out.push({ folder: name, sid: meta.sid === undefined ? '' : meta.sid, docs: docs.length, present, mtime: stat.mtimeMs })
  }
  out.sort((a, b) => b.mtime - a.mtime)
  return out
}

/** 用资源管理器打开某个目录。 */
async function openInExplorer(target) {
  const { spawn } = await import('node:child_process')
  spawn('explorer.exe', [target], { detached: true, stdio: 'ignore' }).unref()
}

/**
 * 注册 `/annotate-doc`。
 *
 * POST /annotate-doc { sid, title, text }   → 写一份（进会话文件夹，用标题命名）
 * GET  /annotate-doc/latest?sid=            → 该会话最新一份正文（顺便迁移旧平铺文件）
 * GET  /annotate-doc/list?sid=              → 该会话所有文档
 * GET  /annotate-doc/sessions              → 所有会话文件夹（含孤立标记）
 * POST /annotate-doc/tidy { sid }           → 删掉该会话的整个文件夹
 * POST /annotate-doc/open { sid? }          → 资源管理器打开根目录或该会话目录
 * @param {any} ctx 宿主上下文。
 * @param {any} config 本行的 Config。
 */
function registerDocRoute(ctx, config) {
  ctx.inject(['webServer'], (webCtx) => {
    webCtx.effect(() => webCtx.webServer.register({
      kind: 'prefix',
      path: '/annotate-doc',
      handler: async (req, res) => {
        const url = String(req.url === undefined ? '/' : req.url)
        const parsed = new URL(url, 'http://dsh.local')
        const root = docsRoot(config)
        try {
          await fs.mkdir(root, { recursive: true })

          if (parsed.pathname === '/annotate-doc/sessions') {
            sendJson(res, 200, { ok: true, root, sessions: await listAll(root, ctx) })
            return
          }

          if (parsed.pathname === '/annotate-doc/list') {
            const sid = parsed.searchParams.get('sid') || ''
            if (sid === '') {
              sendJson(res, 400, { ok: false, reason: 'no-sid' })
              return
            }
            await migrateLegacy(root, sid)
            sendJson(res, 200, { ok: true, sid, items: await listSessionDocs(root, sid) })
            return
          }

          if (parsed.pathname === '/annotate-doc/latest') {
            const sid = parsed.searchParams.get('sid') || ''
            if (sid === '') {
              sendJson(res, 400, { ok: false, reason: 'no-sid' })
              return
            }
            await migrateLegacy(root, sid)
            const items = await listSessionDocs(root, sid)
            if (items.length === 0) {
              sendJson(res, 404, { ok: false, reason: 'missing' })
              return
            }
            /* `?file=` 指定要看哪一份：面板正在读 A，就别被「最新的 B」顶掉。
               只接受单纯文件名（禁路径分隔符），找不到就退回最新一份。 */
            const wanted = String(parsed.searchParams.get('file') || '')
            const picked = wanted !== '' && wanted.indexOf('/') < 0 && wanted.indexOf('\\') < 0 && wanted.indexOf('..') < 0
              ? items.find(item => item.file === wanted)
              : undefined
            /* 0.113.4：**指定了文件却找不到，必须报错**，不能退回最新一份。
               退回会让调用方把「B 的正文」存进「A 的键」，面板从此显示错内容（2026-11-27 实测）。 */
            if (wanted !== '' && picked === undefined) {
              sendJson(res, 404, { ok: false, reason: 'no-such-file', file: wanted })
              return
            }
            const chosen = picked === undefined ? items[0] : picked
            const full = path.join(root, sessionTailOf(sid), chosen.file)
            const text = await fs.readFile(full, 'utf8')
            sendJson(res, 200, {
              ok: true,
              sid,
              title: chosen.title,
              file: chosen.file,
              path: full,
              text,
              bytes: chosen.bytes,
              mtime: chosen.mtime,
              exact: picked !== undefined,
            })
            return
          }

          if (req.method === 'POST' && parsed.pathname === '/annotate-doc/tidy') {
            const raw = await readBody(req)
            let payload = null
            try {
              payload = JSON.parse(raw.toString('utf8'))
            } catch (error) {
              sendJson(res, 400, { ok: false, reason: 'bad-json' })
              return
            }
            const sid = payload === null || typeof payload !== 'object' ? '' : String(payload.sid === undefined ? '' : payload.sid)
            if (sid === '') {
              sendJson(res, 400, { ok: false, reason: 'no-sid' })
              return
            }
            const dir = path.join(root, sessionTailOf(sid))
            await fs.rm(dir, { recursive: true, force: true })
            sendJson(res, 200, { ok: true, sid, dir })
            return
          }

          if (req.method === 'POST' && parsed.pathname === '/annotate-doc/open') {
            const raw = await readBody(req)
            let payload = null
            try {
              payload = JSON.parse(raw.toString('utf8'))
            } catch (error) {
              payload = null
            }
            const sid = payload === null || typeof payload !== 'object' ? '' : String(payload.sid === undefined ? '' : payload.sid)
            const target = sid === '' ? root : path.join(root, sessionTailOf(sid))
            await fs.mkdir(target, { recursive: true })
            await openInExplorer(target)
            sendJson(res, 200, { ok: true, target })
            return
          }

          if (req.method === 'POST' && parsed.pathname === '/annotate-doc') {
            const raw = await readBody(req)
            if (raw.length > MAX_DOC_BYTES) {
              sendJson(res, 413, { ok: false, reason: 'too-large' })
              return
            }
            let payload = null
            try {
              payload = JSON.parse(raw.toString('utf8'))
            } catch (error) {
              sendJson(res, 400, { ok: false, reason: 'bad-json' })
              return
            }
            const sid = payload === null || typeof payload !== 'object' ? '' : String(payload.sid === undefined ? '' : payload.sid)
            const title = payload === null || typeof payload !== 'object' ? '' : String(payload.title === undefined ? '' : payload.title)
            const text = payload === null || typeof payload !== 'object' ? '' : String(payload.text === undefined ? '' : payload.text)
            if (sid === '' || text === '') {
              sendJson(res, 400, { ok: false, reason: 'empty' })
              return
            }
            const tailHint = payload === null || typeof payload !== 'object' || typeof payload.tail !== 'string' ? '' : payload.tail
            /* 0.112：只许写进写入者自己的会话目录。tail 指向别的会话 → 拒绝（409），
               结构上杜绝「同一份文档在别人目录里长副本」。客户端从 0.112 起也不会再发这种请求。 */
            if (/^[0-9a-z]{1,16}$/u.test(tailHint) && tailHint !== sessionTailOf(sid)) {
              try {
                ctx.logger?.warn?.(`[dsh-annotate] 拒绝跨会话写盘：sid=${sessionTailOf(sid)} tail=${tailHint}`)
              } catch (logError) { /* 忽略 */ }
              sendJson(res, 409, { ok: false, reason: 'cross-session', sid, tail: tailHint })
              return
            }
            const saved = await saveDoc(root, sid, title, text, payload === null || typeof payload !== 'object' ? '' : payload.fileName, tailHint)
            sendJson(res, 200, { ok: true, sid, title: saved.title, file: saved.file, path: saved.full, bytes: Buffer.byteLength(text) })
            return
          }

          sendJson(res, 404, { ok: false, reason: 'not-found' })
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          try {
            ctx.logger?.warn?.(`[dsh-annotate] 文档存储失败：${message}`)
          } catch (logError) { /* 日志失败不影响返回 */ }
          sendJson(res, 500, { ok: false, reason: 'error', message })
        }
      },
    }), 'annotate: 文档文件路由')
  })
}

/* --------------------------------------------- 文档工具（方案 B′ 第②步：增量写） */

/** 从工具的 exec 里取会话 id；取不到就返回空串（工具会明确报错，不瞎猜）。 */
function sessionIdOf(exec) {
  const session = exec === null || exec === undefined ? null : exec.agent === undefined ? null : exec.agent.session
  const candidates = [
    session?.header?.id,
    session?.id,
    session?.header?.sessionId,
    session?.sessionId,
  ]
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate !== '') return candidate
  }
  return ''
}

/** 参数 schema：只描述字段，不引入 DSH 内部包。 */
function docSchema(fields, required) {
  return {
    type: 'object',
    properties: fields,
    ...(required === undefined || required.length === 0 ? {} : { required }),
  }
}

/** 统一的文本结果。 */
const DOC_VALUE_SCHEMA = docSchema({ summary: { type: 'string' }, text: { type: 'string' } }, ['summary'])

/** 读当前会话最新一份文档；没有就返回 null。 */
async function currentDoc(config, sessionId, title) {
  const root = docsRoot(config)
  await migrateLegacy(root, sessionId)
  const items = await listSessionDocs(root, sessionId)
  if (items.length === 0) return null
  const wanted = safeSegment(title, 40)
  const hit = wanted === '' ? items[0] : (items.find(item => item.title === wanted) ?? items[0])
  const full = path.join(root, sessionTailOf(sessionId), hit.file)
  const text = await fs.readFile(full, 'utf8')
  return { title: hit.title, file: hit.file, text, full }
}

/** 写回指定标题（或最新一份）的文档。 */
async function writeDoc(config, sessionId, title, text) {
  const root = docsRoot(config)
  const meta = await readMeta(path.join(root, sessionTailOf(sessionId)))
  const wanted = safeSegment(title, 40) || titleFromText(text) || '未命名文档'
  const file = typeof meta.files[wanted] === 'string' && meta.files[wanted] !== '' ? meta.files[wanted] : ''
  if (file === '') return saveDoc(root, sessionId, wanted, text)
  const dir = path.join(root, sessionTailOf(sessionId))
  await fs.writeFile(path.join(dir, file + '.md'), text, 'utf8')
  meta.at = Date.now()
  await writeMeta(dir, meta)
  return { dir, file: file + '.md', title: wanted, full: path.join(dir, file + '.md') }
}

/** 文本锚点替换：唯一才改；重复或找不到都拒绝（和 .lab 的可行性验证同一套规则）。 */
function replaceByAnchor(current, anchor, next) {
  if (typeof anchor !== 'string' || anchor.trim() === '') return { ok: false, reason: '锚点为空' }
  const first = current.indexOf(anchor)
  if (first < 0) return { ok: false, reason: '找不到这段原文（可能刚被改过）' }
  if (current.indexOf(anchor, first + 1) >= 0) return { ok: false, reason: '这段原文出现了不止一次，改用更长的一段（前后多带几句）再试' }
  return { ok: true, text: current.slice(0, first) + next + current.slice(first + anchor.length) }
}

/**
 * 注册三个文档工具：读、按锚点替换、追加。
 *
 * 它们改的都是磁盘上那份 `.md`；右侧面板会自动刷新（客户端每 3 秒看一次文件时间戳）。
 * @param {any} ctx 宿主上下文。
 * @param {any} config 本行的 Config。
 */
function registerDocTools(ctx, config) {
  ctx.inject(['tools'], (toolCtx) => {
    toolCtx.effect(() => toolCtx.tools.register({
      name: 'doc_read',
      description: '读当前会话的对话文档（磁盘上那份 .md 的最新内容）。改文档前先调用它拿到原文，'
        + '因为后续 doc_replace 的锚点必须和原文逐字一致。',
      parameters: docSchema({
        title: { type: 'string', description: '要读哪一份（文档标题）；省略＝该会话最新一份' },
      }),
      output: {
        schema: DOC_VALUE_SCHEMA,
        render: (_args, value) => [{ type: 'text', text: value.summary }],
      },
      isConcurrencySafe: () => true,
      async execute(args, exec) {
        const sessionId = sessionIdOf(exec)
        if (sessionId === '') return { summary: '拿不到当前会话，没法定位文档。' }
        const doc = await currentDoc(config, sessionId, args?.title)
        if (doc === null) return { summary: '这个会话还没有落盘的文档。' }
        return { summary: `文档「${doc.title}」共 ${doc.text.length} 字符：\n\n${doc.text}`, text: doc.text }
      },
    }), 'annotate: doc_read')

    toolCtx.effect(() => toolCtx.tools.register({
      name: 'doc_replace',
      description: '把对话文档里的一段原文替换成新文字，只发这一段、不用重发全文。'
        + 'anchor 必须与原文逐字一致且在全文里唯一；不唯一或找不到会被拒绝（把 anchor 前后多带几句再试）。'
        + '改完后用户右侧面板会自动刷新。',
      parameters: docSchema({
        anchor: { type: 'string', description: '要被替换的原文（逐字复制，够长以保证全文唯一）' },
        text: { type: 'string', description: '替换成的新文字（Markdown）' },
        title: { type: 'string', description: '改哪一份（文档标题）；省略＝最新一份' },
      }, ['anchor', 'text']),
      output: {
        schema: DOC_VALUE_SCHEMA,
        render: (_args, value) => [{ type: 'text', text: value.summary }],
      },
      isConcurrencySafe: () => false,
      async execute(args, exec) {
        const sessionId = sessionIdOf(exec)
        if (sessionId === '') return { summary: '拿不到当前会话，没法定位文档。' }
        const doc = await currentDoc(config, sessionId, args?.title)
        if (doc === null) return { summary: '这个会话还没有落盘的文档，先用 doc_append 建一份。' }
        const replaced = replaceByAnchor(doc.text, args?.anchor, String(args?.text === undefined ? '' : args.text))
        if (replaced.ok !== true) return { summary: `没改：${replaced.reason}` }
        const saved = await writeDoc(config, sessionId, doc.title, replaced.text)
        return { summary: `已替换「${doc.title}」里的一段（${doc.text.length} → ${replaced.text.length} 字符），落盘于 ${saved.file}。`, text: replaced.text }
      },
    }), 'annotate: doc_replace')

    toolCtx.effect(() => toolCtx.tools.register({
      name: 'doc_append',
      description: '在对话文档末尾追加内容（不重发全文）。文档不存在时用它创建第一份。',
      parameters: docSchema({
        text: { type: 'string', description: '要追加的 Markdown（会被接在正文末尾，自动补一个空行）' },
        title: { type: 'string', description: '追加到哪一份（文档标题）；省略＝最新一份；不存在则按这个标题新建' },
      }, ['text']),
      output: {
        schema: DOC_VALUE_SCHEMA,
        render: (_args, value) => [{ type: 'text', text: value.summary }],
      },
      isConcurrencySafe: () => false,
      async execute(args, exec) {
        const sessionId = sessionIdOf(exec)
        if (sessionId === '') return { summary: '拿不到当前会话，没法定位文档。' }
        const piece = String(args?.text === undefined ? '' : args.text)
        if (piece.trim() === '') return { summary: '没改：追加内容为空。' }
        /* 0.113.8：**指定了标题但这标题还不存在 → 当成新建**，只写这一份。
           以前 currentDoc 在找不到标题时会退回「最新一份」，于是把旧文档整篇抄进新标题的文件，
           同一个文件里越滚越长（2026-11-27 实测：一份 28KB 的 .md 里叠了 5 篇文档）。 */
        const asked = args?.title === undefined || args.title === null ? '' : String(args.title).trim()
        const doc = await currentDoc(config, sessionId, asked === '' ? undefined : asked)
        const resolvedTitle = doc === null ? '' : String(doc.title)
        const isNew = doc === null || (asked !== '' && resolvedTitle !== safeSegment(asked, 40))
        const next = isNew === true ? piece : (doc.text.replace(/\s*$/u, '') + '\n\n' + piece)
        const title = asked !== '' && isNew === true ? asked : (doc === null ? '' : doc.title)
        const saved = await writeDoc(config, sessionId, title, next)
        return { summary: `已写入「${saved.title}」（现在 ${next.length} 字符），落盘于 ${saved.file}。`, text: next }
      },
    }), 'annotate: doc_append')
  })
}
/**
 * 客户端异常落盘：`POST /annotate-log { text }` → `${DSH_HOME}/annotate-client-debug.log`。
 * 只用来排查「面板渲染不出来」这类看不见的错误，写一行 JSON，不做别的。
 */
function registerClientLogRoute(ctx) {
  ctx.inject(['webServer'], (webCtx) => {
    webCtx.effect(() => webCtx.webServer.register({
      kind: 'prefix',
      path: '/annotate-log',
      handler: async (req, res) => {
        if (req.method !== 'POST') {
          sendJson(res, 405, { ok: false, reason: 'method-not-allowed' })
          return
        }
        try {
          const raw = await readBody(req)
          let text = String(raw.toString('utf8'))
          try {
            const payload = JSON.parse(text)
            text = JSON.stringify(payload)
          } catch (error) {
            /* 不是 JSON 就按纯文本写 */
          }
          const file = path.join(os.homedir(), '.dsh', 'annotate-client-debug.log')
          await fs.mkdir(path.dirname(file), { recursive: true })
          await fs.appendFile(file, text + '\n', 'utf8')
          sendJson(res, 200, { ok: true, file })
        } catch (error) {
          sendJson(res, 500, { ok: false, reason: String(error !== null && error !== undefined && error.message !== undefined ? error.message : error) })
        }
      },
    }), 'annotate: 客户端异常日志')
  })
}