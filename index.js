/**
 * dsh-annotate 的宿主半边。
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

/** 列一个会话文件夹里的可读文档（按修改时间倒序）。 */
async function listSessionDocs(root, sessionId) {
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