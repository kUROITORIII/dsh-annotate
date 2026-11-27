/**
 * dsh-annotate · 客户端半边
 *
 * 选中对话里的一句 → 右键 → 写批注（问一句 / 要改）→ 攒着 → 一次发给 AI。
 * v0.1 不读宿主 DOM：只用手势、Slot 和 InputActions 这些公开接口。
 */
window.__ModuleLoader__.load({
  id: 'dsh-annotate',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const PLUGIN_NAME = 'dsh-annotate'
    const STORAGE_KEY = 'dsh-annotate/v1'

    /* ------------------------------------------------------------------ 样式 */

    const CSS = `
.dsha-btn{display:inline-flex;align-items:center;gap:5px;height:26px;padding:0 9px;border-radius:7px;
  border:1px solid var(--dsw-alias-border-l1);background:transparent;color:var(--dsw-alias-label-secondary);
  font-size:12px;line-height:1;cursor:pointer;white-space:nowrap;font-family:inherit}
.dsha-btn:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.dsha-btn:disabled{opacity:.45;cursor:default}
.dsha-btn-primary{background:var(--dsw-alias-brand-primary);border-color:transparent;color:var(--dsw-alias-bg-base)}
.dsha-btn-primary:hover{filter:brightness(1.08);background:var(--dsw-alias-brand-primary);color:#fff}
.dsha-ico{font-size:13px;line-height:1}
.dsha-surface{position:relative;display:flex;flex-direction:column;gap:10px;width:360px;max-width:min(80vw,460px);
  padding:12px;border-radius:14px;
  background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 97%,transparent);
  border:1px solid var(--dsw-alias-border-l1);
  box-shadow:0 18px 44px rgba(0,0,0,.42);
  color:var(--dsw-alias-label-primary);font-size:12.5px;font-family:inherit}
.dsha-quote{background:color-mix(in srgb,var(--dsw-alias-bg-base) 55%,transparent);
  border:none;border-left:none;border-radius:8px;padding:8px 10px;max-height:66px;overflow:hidden;
  color:var(--dsw-alias-label-secondary);font-size:12px;line-height:1.6;
  display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;word-break:break-word}
.dsha-kinds{display:flex;gap:6px}
.dsha-kind{flex:1;height:27px;border-radius:7px;border:1px solid var(--dsw-alias-border-l1);
  background:transparent;color:var(--dsw-alias-label-secondary);font-size:12px;cursor:pointer;font-family:inherit}
.dsha-kind[data-on="1"]{border-color:rgba(77,107,254,.6);color:#8aa0ff;
  background:rgba(77,107,254,.14)}
.dsha-kind:disabled{opacity:.45;cursor:not-allowed}
.dsha-textarea{width:100%;box-sizing:border-box;resize:none;min-height:52px;padding:8px 10px;
  border-radius:9px;border:1px solid var(--dsw-alias-border-l1);
  background:color-mix(in srgb,var(--dsw-alias-bg-base) 70%,transparent);
  color:var(--dsw-alias-label-primary);font-size:12.5px;line-height:1.6;font-family:inherit;outline:none}
.dsha-textarea:focus{border-color:rgba(77,107,254,.55)}
.dsha-row{display:flex;align-items:center;gap:8px}
.dsha-spacer{flex:1}
.dsha-hint{font-size:12px;color:var(--dsw-alias-label-secondary)}
.dsha-path{font-size:10.5px;line-height:1.4;color:var(--dsw-alias-brand-primary);
  font-family:ui-monospace,Consolas,monospace;word-break:break-all}
.dsha-warn{font-size:11px;line-height:1.55;color:var(--dsw-alias-state-warn-primary);border-radius:6px;
  padding:6px 7px;background:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 12%,transparent)}
.dsha-tag[data-target="file"]{color:var(--dsw-alias-state-success-primary);border-color:currentColor}
.dsha-float{position:fixed;z-index:97;pointer-events:auto}
.dsha-panel{position:fixed;top:64px;left:50%;transform:translateX(-50%);bottom:96px;width:380px;max-width:calc(100vw - 32px);
  display:flex;flex-direction:column;z-index:96;pointer-events:auto;
  border-radius:13px;border:1px solid var(--dsw-alias-border-l1);
  background:var(--dsw-alias-bg-layer-1);box-shadow:0 16px 40px rgba(0,0,0,.34);
  color:var(--dsw-alias-label-primary);font-size:12px;font-family:inherit;overflow:hidden}
.dsha-head{display:flex;align-items:center;gap:8px;padding:11px 12px;border-bottom:1px solid var(--dsw-alias-border-l1)}
.dsha-title{font-size:13px;font-weight:600}
.dsha-body{flex:1;overflow:auto;padding:10px;display:flex;flex-direction:column;gap:8px}
.dsha-card{border:1px solid var(--dsw-alias-border-l1);border-radius:9px;padding:9px;
  background:var(--dsw-alias-bg-layer-2);display:flex;flex-direction:column;gap:6px}
.dsha-card[data-status="sent"]{opacity:.62}
.dsha-card[data-lost="1"]{border-color:rgba(255,170,90,.45);background:rgba(255,170,90,.05)}
.dsha-pick{width:14px;height:14px;margin:0;flex:none;cursor:pointer;accent-color:#4d6bfe}
.dsha-card-quote{color:var(--dsw-alias-label-secondary);font-size:11.5px;line-height:1.5;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
  border-left:2px solid var(--dsw-alias-state-warn-primary);padding-left:7px;word-break:break-word}
.dsha-card-note{font-size:12px;line-height:1.55;white-space:pre-wrap;word-break:break-word}
.dsha-card-foot{display:flex;align-items:center;gap:6px}
.dsha-tag{font-size:10.5px;padding:1px 6px;border-radius:9px;border:1px solid var(--dsw-alias-border-l2);
  color:var(--dsw-alias-label-secondary)}
.dsha-tag[data-kind="edit"]{color:var(--dsw-alias-state-warn-primary);border-color:currentColor}
.dsha-tag[data-kind="question"]{color:var(--dsw-alias-brand-primary);border-color:currentColor}
.dsha-mini{border:none;background:transparent;color:var(--dsw-alias-label-secondary);font-size:12px;
  cursor:pointer;padding:2px 4px;border-radius:4px;font-family:inherit;
  display:inline-flex;align-items:center;gap:6px;max-width:320px}
.dsha-mini:hover{background:var(--dsw-alias-bg-base);color:var(--dsw-alias-state-error-primary)}
.dsha-mini[data-on="1"]{color:var(--dsw-alias-brand-primary);font-weight:600}
.dsha-nav-ico{flex:none;width:1.1em;text-align:center;color:var(--dsw-alias-label-secondary)}
.dsha-btn-attn{border-color:rgba(77,107,254,.55);color:#8aa0ff}
.dsha-attn-dot{width:6px;height:6px;border-radius:50%;background:var(--dsw-alias-brand-primary);
  margin-left:2px;flex:none;animation:dsha-pulse 1.6s ease-in-out infinite}
@keyframes dsha-pulse{0%,100%{opacity:.35;transform:scale(.85)}50%{opacity:1;transform:scale(1)}}
@media (prefers-reduced-motion: reduce){.dsha-attn-dot{animation:none;opacity:.9}}
.dsha-foot{padding:10px 12px;border-top:1px solid var(--dsw-alias-border-l1);display:flex;align-items:center;gap:8px}
.dsha-empty{padding:22px 14px;text-align:center;line-height:1.7;color:var(--dsw-alias-label-secondary);font-size:12px}
.dsha-undo{padding:7px 12px;background:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 16%,transparent);
  display:flex;align-items:center;gap:8px;font-size:11.5px}

/* ---- v0.3：可拖拽/可缩放的浮动卡片，替代原来横在屏幕中间的面板 ---- */
.dsha-panel{position:fixed;left:0;top:0;right:auto;bottom:auto;transform:none;
  display:flex;flex-direction:column;overflow:hidden;pointer-events:auto;
  min-width:280px;min-height:200px;flex:0 0 auto;margin:0;box-sizing:border-box;
  border-radius:14px;border:1px solid var(--dsw-alias-border-l2);
  background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 97%,transparent);
  box-shadow:0 20px 52px rgba(0,0,0,.46),0 0 0 .5px rgba(255,255,255,.05) inset}
.dsha-head{height:42px;padding:0 8px 0 13px;gap:8px;flex:none;cursor:move;user-select:none;
  border-bottom:1px solid var(--dsw-alias-border-l1);
  background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 55%,transparent)}
.dsha-title{font-size:12.5px;font-weight:600;letter-spacing:.3px}
.dsha-count{font-size:10.5px;line-height:17px;padding:0 7px;border-radius:9px;font-weight:600;
  background:color-mix(in srgb,var(--dsw-alias-brand-primary) 18%,transparent);
  color:var(--dsw-alias-brand-primary)}
.dsha-body{padding:10px;gap:9px;flex:1;overflow:auto}
.dsha-card{border-radius:10px;padding:10px 11px;gap:7px;
  background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);
  transition:border-color .15s ease,background .15s ease}
.dsha-card:hover{border-color:var(--dsw-alias-border-l2)}
.dsha-card-quote{font-size:11.5px;line-height:1.6;border-left:2px solid var(--dsw-alias-brand-primary);
  border-radius:2px;padding-left:8px}
.dsha-card-note{font-size:12.5px;line-height:1.6}
.dsha-card-foot{gap:5px;margin-top:1px}
.dsha-tag{font-size:10px;line-height:16px;padding:0 6px;border-radius:999px;letter-spacing:.2px;
  background:color-mix(in srgb,var(--dsw-alias-bg-base) 65%,transparent)}
.dsha-foot{height:48px;padding:0 12px;gap:8px;flex:none;
  border-top:1px solid var(--dsw-alias-border-l1);
  background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 45%,transparent)}
.dsha-btn{height:28px;padding:0 11px;border-radius:8px;font-size:12px;transition:background .15s ease}
.dsha-btn-primary{font-weight:600;box-shadow:0 1px 0 rgba(255,255,255,.14) inset}
.dsha-mini{border-radius:6px;padding:3px 7px}
.dsha-empty{padding:28px 18px;font-size:12px}
.dsha-grip{position:absolute;right:3px;bottom:3px;width:15px;height:15px;cursor:nwse-resize;opacity:.5;z-index:4}
.dsha-grip::after{content:"";position:absolute;right:3px;bottom:3px;width:7px;height:7px;
  border-right:2px solid var(--dsw-alias-label-secondary);
  border-bottom:2px solid var(--dsw-alias-label-secondary)}
.dsha-grip:hover{opacity:.95}
.dsha-edge{position:absolute;z-index:3}
.dsha-edge-e{top:12px;right:0;bottom:14px;width:6px;cursor:ew-resize}
.dsha-edge-w{top:12px;left:0;bottom:14px;width:6px;cursor:ew-resize}
.dsha-edge-s{left:14px;right:14px;bottom:0;height:6px;cursor:ns-resize}
.dsha-edge-n{left:14px;right:14px;top:0;height:6px;cursor:ns-resize}
.dsha-group-wrap{display:flex;flex-direction:column;gap:6px}
.dsha-group{display:flex;align-items:center;gap:6px;width:100%;height:26px;padding:0 6px;
  border:none;border-radius:7px;background:transparent;color:var(--dsw-alias-label-secondary);
  font-size:11.5px;cursor:pointer;font-family:inherit;text-align:left}
.dsha-group:hover{background:color-mix(in srgb,var(--dsw-alias-bg-base) 55%,transparent)}
.dsha-caret{width:10px;font-size:9px;opacity:.65}
.dsha-group-name{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
  font-family:ui-monospace,Consolas,monospace;font-size:11px}
.dsha-group-count{font-size:10px;line-height:15px;padding:0 6px;border-radius:9px;
  background:color-mix(in srgb,var(--dsw-alias-bg-base) 70%,transparent)}
.dsha-dot{width:5px;height:5px;border-radius:50%;background:var(--dsw-alias-brand-primary)}
.dsha-group-body{display:flex;flex-direction:column;gap:7px;padding-left:2px}
/* 编辑器里的常驻标记：批注过的地方一直带底色，不随选区消失。
   先给显式颜色再叠 color-mix：浮层这一层可能取不到主题变量，取不到就退回显式蓝/绿。 */
.dsha-marks{position:fixed;inset:0;pointer-events:none;z-index:45}
.dsha-mark{position:fixed;pointer-events:none;border-radius:3px;
  background:rgba(77,107,254,.46);
  box-shadow:inset 0 -2px 0 rgba(77,107,254,.95);
  transition:background .25s ease,opacity .25s ease}
/* 蓝色：还没回复 / 回复中；绿色：已经回复完成 */
.dsha-mark[data-status="queued"]{background:rgba(77,107,254,.32)}
.dsha-mark[data-status="sent"]{animation:dsha-breathe 1.7s ease-in-out infinite}
.dsha-mark[data-status="sent-idle"]{background:rgba(77,107,254,.36)}
.dsha-mark[data-status="answered"]{
  background:rgba(60,190,120,.42);
  box-shadow:inset 0 -2px 0 rgba(60,190,120,.95)}
.dsha-debug{font-size:10px;color:var(--dsw-alias-state-warn-primary);max-width:170px;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsha-reply{font-size:11.5px;line-height:1.55;border-left:2px solid rgba(60,190,120,.9);
  padding-left:8px;color:var(--dsw-alias-label-secondary);white-space:pre-wrap;word-break:break-word}
/* 预览兜底用的 ::highlight 也跟随同一套语义色 */
::highlight(dsha-q){background-color:color-mix(in srgb,var(--dsw-alias-brand-primary) 14%,transparent);
  text-decoration:underline}
::highlight(dsha-a){background-color:color-mix(in srgb,var(--dsw-alias-brand-primary) 32%,transparent)}
::highlight(dsha-b){background-color:color-mix(in srgb,var(--dsw-alias-brand-primary) 12%,transparent)}
::highlight(dsha-idle){background-color:color-mix(in srgb,var(--dsw-alias-brand-primary) 15%,transparent)}
::highlight(dsha-ans){background-color:color-mix(in srgb,var(--dsw-alias-state-success-primary) 18%,transparent)}
@keyframes dsha-breathe{
  0%,100%{opacity:.42}
  50%{opacity:1}
}
.dsha-surface{border-radius:13px;padding:12px;box-shadow:0 14px 40px rgba(0,0,0,.48);
  border:1px solid var(--dsw-alias-border-l2)}
.dsha-kind{border-radius:8px;height:28px;transition:background .15s ease,border-color .15s ease}
/* ---------------- 文档模式：我们自己渲染的文档面板 ---------------- */
.dsha-fig{margin:10px 0;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;overflow:hidden;
  background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 60%,transparent)}
.dsha-fig-bar{display:flex;align-items:center;gap:8px;padding:5px 8px 5px 10px;
  border-bottom:1px solid var(--dsw-alias-border-l1);background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 85%,transparent)}
.dsha-fig-label{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
  font-size:11.5px;color:var(--dsw-alias-label-secondary)}
.dsha-fig-img{display:block;width:100%;height:auto;background:#fff;padding:10px;box-sizing:border-box}
.dsha-fig-bad{color:var(--dsw-alias-state-warn-primary);font-size:12px;line-height:1.6}
.dsha-doc-li[data-num]::before{content:attr(data-num) ". ";color:var(--dsw-alias-label-secondary)}
.dsha-doc-li[data-task="open"]::before{content:"☐ ";color:var(--dsw-alias-label-secondary)}
.dsha-doc-li[data-task="done"]::before{content:"✓ ";color:var(--dsw-alias-state-success-primary)}
.dsha-doc-li[data-depth="1"]{margin-left:18px}
.dsha-doc-li[data-depth="2"]{margin-left:36px}
.dsha-doc-li[data-depth="3"]{margin-left:54px}
.dsha-doc-li[data-depth="4"]{margin-left:72px}
.dsha-doc-li[data-depth="5"]{margin-left:90px}
.dsha-doc-li[data-depth="6"]{margin-left:108px}
.dsha-doc-code{position:relative}
.dsha-doc-code[data-lang]::before{content:attr(data-lang);position:absolute;right:8px;top:4px;
  font-size:10.5px;color:var(--dsw-alias-label-secondary);opacity:.85;letter-spacing:.02em}
.dsha-doc-body hr,.dsha-doc-hr{border:none;border-top:1px solid var(--dsw-alias-border-l1);margin:14px 0}
.dsha-doc-h5{font-size:.98em;font-weight:600;margin:12px 0 6px}
.dsha-doc-h6{font-size:.92em;font-weight:600;margin:10px 0 4px;color:var(--dsw-alias-label-secondary)}
.dsha-task[data-done="done"]{color:var(--dsw-alias-state-success-primary)}.dsha-doc-card{display:flex;align-items:center;gap:10px;margin:8px 0;padding:10px 12px;max-width:520px;
  border-radius:10px;border:1px solid var(--dsw-alias-border-l1);cursor:pointer;
  background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 92%,transparent);
  font-family:inherit;transition:border-color .12s ease,background .12s ease}
.dsha-doc-card:hover{border-color:var(--dsw-alias-brand-primary);
  background:color-mix(in srgb,var(--dsw-alias-brand-primary) 8%,var(--dsw-alias-bg-layer-2))}
.dsha-doc-card-ico{flex:none;width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;
  font-size:15px;color:var(--dsw-alias-state-success-primary);
  background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 14%,transparent)}
.dsha-doc-card-main{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1}
.dsha-doc-card-title{font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary);
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsha-doc-card-meta{font-size:11.5px;color:var(--dsw-alias-label-secondary)}
.dsha-doc-card-go{flex:none;font-size:16px;color:var(--dsw-alias-label-secondary)}
.dsha-doc-link{display:inline-flex;align-items:center;gap:6px;margin:6px 0 2px;padding:5px 10px;
  border-radius:8px;border:1px solid var(--dsw-alias-border-l1);cursor:pointer;font-family:inherit;
  font-size:12px;color:var(--dsw-alias-label-primary);
  background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 90%,transparent)}
.dsha-doc-link:hover{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary)}.dsha-doc-table-wrap{margin:10px 0;overflow:auto}
.dsha-doc-table{border-collapse:collapse;width:100%;font-size:12px;line-height:1.6}
.dsha-doc-table th,.dsha-doc-table td{border:1px solid var(--dsw-alias-border-l1);padding:5px 8px;text-align:left;vertical-align:top}
.dsha-doc-table th{background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 85%,transparent);
  font-weight:600;color:var(--dsw-alias-label-primary);white-space:nowrap}
.dsha-doc-table tr:nth-child(even) td{background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 35%,transparent)}.dsha-doc{position:fixed;top:72px;right:24px;bottom:96px;width:640px;max-width:calc(100vw - 48px);
  display:flex;flex-direction:column;z-index:55;pointer-events:auto;overflow:hidden;
  border-radius:14px;border:1px solid var(--dsw-alias-border-l2);
  background:var(--dsw-alias-bg-layer-1);box-shadow:0 20px 52px rgba(0,0,0,.46)}
.dsha-doc-head{height:42px;padding:0 12px;display:flex;align-items:center;gap:8px;flex:none;
  border-bottom:1px solid var(--dsw-alias-border-l1);
  background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 55%,transparent)}
.dsha-doc-embedded{position:relative;inset:auto;width:auto;height:100%;max-width:none;
  border:none;border-radius:0;box-shadow:none;background:transparent}
/* 放大阅读：铺到窗口上，正文按阅读宽度居中，不靠 transform（否则线程卡的 fixed 坐标会跑） */
/* 放大阅读：一个可以拖动、可以拉边的窗口（几何存在 docWideBox） */
/* 层级约定：文档窗口 86 < 工具条 90 < 抽屉 94 < 线程卡 95 < 批注面板 96 < 批注浮层 97。
   文档是用来读的，批注是用来操作的 —— 批注永远压在上面，否则一开文档就把批注盖住。 */
.dsha-doc-wide{z-index:86;border-radius:16px;box-shadow:0 32px 80px rgba(0,0,0,.55)}
.dsha-doc-wide .dsha-doc-head{cursor:grab}
.dsha-doc-wide .dsha-doc-head:active{cursor:grabbing}
/* 文档窗口（放大 / 浮动）四面八向都能拖 */
.dsha-doc-grip{position:absolute;z-index:20}
.dsha-doc-grip-n{top:0;left:16px;right:16px;height:10px;cursor:ns-resize;
  box-shadow:inset 0 2px 0 rgba(120,140,255,.22)}
.dsha-doc-grip-s{bottom:0;left:16px;right:16px;height:10px;cursor:ns-resize;
  box-shadow:inset 0 -2px 0 rgba(120,140,255,.22)}
.dsha-doc-grip-w{left:0;top:16px;bottom:16px;width:10px;cursor:ew-resize;
  box-shadow:inset 2px 0 0 rgba(120,140,255,.22)}
.dsha-doc-grip-e{right:0;top:16px;bottom:16px;width:10px;cursor:ew-resize;
  box-shadow:inset -2px 0 0 rgba(120,140,255,.22)}
.dsha-doc-grip-ne{right:0;top:0;width:18px;height:18px;cursor:nesw-resize}
.dsha-doc-grip-nw{left:0;top:0;width:18px;height:18px;cursor:nwse-resize}
.dsha-doc-grip-se{right:0;bottom:0;width:18px;height:18px;cursor:nwse-resize}
.dsha-doc-grip-sw{left:0;bottom:0;width:18px;height:18px;cursor:nesw-resize}
/* 滚动条贴窗口边：body 铺满、内容用自己的窄栏居中 */
.dsha-doc-inner{max-width:none;margin:0 auto;width:100%}
.dsha-doc-wide .dsha-doc-bar{max-width:none;margin:0;width:100%;padding:6px 34px}
.dsha-doc-wide .dsha-doc-bar-inner{max-width:1040px;margin:0 auto}
.dsha-doc-wide .dsha-doc-body{max-width:none;padding:0}
.dsha-doc-wide .dsha-doc-inner{max-width:1040px;padding:26px 34px}
.dsha-doc-wide-hint{display:flex;flex-direction:column;gap:10px;align-items:center;
  justify-content:center;height:100%;font-size:12.5px;color:var(--dsw-alias-label-secondary)}
/* 聊天流里的文档块不再折叠（2026-11-24 用户要求取消：折起来只看到半行字）。
   旧样式留着会误伤，一律不用；正文在右侧看，聊天里完整显示。 */
.dsha-doc-body{flex:1;overflow:auto;padding:20px 24px;font-size:var(--dsha-doc-size,15px);line-height:1.85}
.dsha-doc-bar{display:flex;align-items:center;gap:8px;flex:none;padding:6px 10px;box-sizing:border-box;
  border-bottom:1px solid var(--dsw-alias-border-l1)}
.dsha-doc-bar-inner{display:flex;align-items:center;gap:8px;width:100%}
/* 查找条 */
.dsha-find{display:flex;align-items:center;gap:6px;flex:none;padding:5px 10px;
  border-bottom:1px solid var(--dsw-alias-border-l1);
  background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 40%,transparent)}
.dsha-find input{flex:1;min-width:0;height:22px;border-radius:6px;padding:0 8px;font:inherit;font-size:12px;
  color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-base);
  border:1px solid var(--dsw-alias-border-l2)}
.dsha-find input:focus{outline:none;border-color:rgba(77,107,254,.6)}
.dsha-doc-span[data-status="find"]{background:rgba(255,206,84,.28);border-radius:2px}
.dsha-doc-span[data-status="find-on"]{background:rgba(255,170,40,.62);border-radius:2px}
/* 编辑模式里每段下面的一排小按钮 */
.dsha-blk-tools{display:flex;align-items:center;gap:4px;margin:2px 0 10px;opacity:.55}
.dsha-blk-tools:hover{opacity:1}
.dsha-blk-tools button{font-size:10.5px;line-height:1;padding:3px 6px;border-radius:5px;cursor:pointer;
  color:var(--dsw-alias-label-secondary);background:color-mix(in srgb,var(--dsw-alias-bg-base) 60%,transparent);
  border:1px solid var(--dsw-alias-border-l1);font-family:inherit}
.dsha-blk-tools button:hover{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l2)}
.dsha-mini-on{color:#8aa0ff;background:rgba(77,107,254,.16)}
/* 文档切换下拉 */
.dsha-nav{position:relative;display:inline-flex;align-items:center;gap:5px}
.dsha-nav-menu{position:absolute;top:calc(100% + 6px);left:0;min-width:230px;max-width:330px;z-index:6;
  border:1px solid var(--dsw-alias-border-l2);border-radius:10px;overflow:hidden;
  background:var(--dsw-alias-bg-layer-2);box-shadow:0 18px 40px rgba(0,0,0,.45)}
.dsha-nav-item{display:flex;align-items:center;gap:6px;padding:8px 10px;font-size:12.5px;cursor:pointer;
  color:var(--dsw-alias-label-primary)}
.dsha-nav-item:hover{background:rgba(127,127,127,.12)}
.dsha-nav-item[data-on="1"]{color:#8aa0ff}
.dsha-nav-item span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsha-nav-name{display:flex;flex-direction:column;gap:1px;min-width:0;flex:1}
.dsha-nav-name>span:first-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsha-doc-count{flex:none}
.dsha-doc-caret{flex:none;opacity:.8}
.dsha-doc-file{display:inline-flex;align-items:center;height:18px;font-size:11.5px;line-height:1;min-width:0;
  color:var(--dsw-alias-label-secondary);opacity:.85;max-width:220px;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:ui-monospace,Consolas,monospace}
.dsha-nav-file{font-size:10.5px;line-height:1.2;color:var(--dsw-alias-label-secondary);opacity:.75;
  font-family:ui-monospace,Consolas,monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsha-nav-sep{height:1px;margin:5px 4px;background:var(--dsw-alias-border-l1);opacity:.8}
.dsha-nav-chips{display:flex;gap:4px;margin-left:auto;flex:none}
.dsha-nav-chips .dsha-mini{font-size:11px;padding:1px 5px;border:1px solid var(--dsw-alias-border-l1);border-radius:6px}
.dsha-nav-foot{padding:6px 10px;font-size:11px;border-top:1px solid var(--dsw-alias-border-l1);
  color:var(--dsw-alias-label-secondary)}
.dsha-nav-group{display:flex;flex-direction:column}
.dsha-nav-caret{width:18px;text-align:center;color:var(--dsw-alias-label-secondary);flex:none}
.dsha-nav-item[data-version="1"]{padding-left:28px;font-size:12px;color:var(--dsw-alias-label-secondary)}
/* 批注总览抽屉：用 fixed 直接挂到窗口右侧，避免被侧栏的层叠上下文吃掉。
   top:40 = 正好贴着 DSH 那条 40px 窗口按钮带的下沿：再高会抢窗口按钮的点击，再低（48）就会在上沿露出一条背景缝。 */
.dsha-drawer{position:fixed;top:40px;right:0;bottom:0;width:min(360px,80vw);z-index:94;
  display:flex;flex-direction:column;background:var(--dsw-alias-bg-layer-1);
  border-left:1px solid var(--dsw-alias-border-l2);box-shadow:-14px 0 40px rgba(0,0,0,.38)}
/* 抽屉也能拉宽：左边一条热区 */
.dsha-drawer-grip{position:absolute;left:0;top:0;bottom:0;width:8px;cursor:ew-resize;z-index:5;
  box-shadow:inset 2px 0 0 rgba(120,140,255,.22)}
.dsha-drawer-head{display:flex;align-items:center;gap:8px;padding:8px 10px;flex:none;
  border-bottom:1px solid var(--dsw-alias-border-l1);font-size:12px}
.dsha-drawer-list{flex:1;overflow:auto;padding:8px;display:flex;flex-direction:column;gap:6px}
.dsha-drawer-row{display:flex;flex-direction:column;gap:4px;padding:8px 9px;border-radius:9px;cursor:pointer;
  background:color-mix(in srgb,var(--dsw-alias-bg-base) 45%,transparent)}
.dsha-drawer-row:hover{background:color-mix(in srgb,var(--dsw-alias-bg-base) 70%,transparent)}
.dsha-drawer-quote{font-size:11.5px;line-height:1.5;color:var(--dsw-alias-label-secondary);
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.dsha-drawer-say{font-size:12px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;
  -webkit-box-orient:vertical;overflow:hidden}
.dsha-dot{width:6px;height:6px;border-radius:3px;flex:none;display:inline-block}
.dsha-dot[data-status="queued"]{background:rgba(140,140,150,.8)}
.dsha-dot[data-status="sent"]{background:#4d6bfe}
.dsha-dot[data-status="answered"]{background:#3cbe78}
/* 卡片收紧（2026-11-27）：引文 1 行、批注与回复各 3 行，长内容点「展开全部」。 */
.dsha-card-quote{-webkit-line-clamp:1}
.dsha-card-note{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.dsha-reply{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.dsha-card-open .dsha-card-note,.dsha-card-open .dsha-reply{display:block;-webkit-line-clamp:unset;overflow:visible}
.dsha-search{width:132px;height:22px;padding:0 7px;border-radius:6px;font-family:inherit;font-size:11.5px;
  border:1px solid var(--dsw-alias-border-l1);background:color-mix(in srgb,var(--dsw-alias-bg-base) 70%,transparent);
  color:var(--dsw-alias-label-primary);outline:none}
.dsha-search:focus{border-color:rgba(77,107,254,.55)}
.dsha-flash{font-size:11px;color:#8aa0ff;flex:none}
.dsha-doc-editable{outline:none;border-radius:4px;white-space:pre-wrap;
  box-shadow:inset 0 0 0 1px transparent}
.dsha-doc-editable:hover{box-shadow:inset 0 0 0 1px var(--dsw-alias-border-l1)}
.dsha-doc-editable:focus{box-shadow:inset 0 0 0 1px rgba(77,107,254,.55);
  background:rgba(77,107,254,.06)}
/* 段落右上角的批注标记：用浮动待、跟着正文边界走，不用绝对定位 */
.dsha-doc-body [data-block]{position:relative}
.dsha-block-mark{float:right;margin:1px 0 0 8px;min-width:16px;height:16px;padding:0 4px;
  border-radius:8px;font-size:10px;line-height:16px;text-align:center;cursor:pointer;
  color:#fff;font-weight:600;user-select:none;transition:transform .12s ease}
.dsha-block-mark:hover{transform:scale(1.15)}
.dsha-block-mark[data-status="queued"]{background:rgba(140,140,150,.6)}
.dsha-block-mark[data-status="sent"]{background:#4d6bfe;animation:dsha-breathe 1.7s ease-in-out infinite}
.dsha-block-mark[data-status="answered"]{background:#3cbe78}
.dsha-block-mark[data-lost="1"]{background:#ff8c32}
.dsha-block-mark[data-lost="1"]:hover{background:#ffa14f}
.dsha-doc-body h1{font-size:1.53em;margin:8px 0 14px;line-height:1.4}
.dsha-doc-body h2{font-size:1.27em;margin:22px 0 10px;line-height:1.45}
.dsha-doc-body h3{font-size:1.1em;margin:18px 0 8px;line-height:1.5}
.dsha-doc-body h4{font-size:1em;font-weight:600;margin:14px 0 6px}
.dsha-doc-body p{margin:10px 0}
.dsha-doc-body li{margin:6px 0 6px 20px;list-style:disc}
.dsha-doc-body blockquote{margin:10px 0;padding-left:12px;font-size:.97em;
  border-left:2px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary)}
.dsha-doc-body pre{margin:12px 0;padding:11px 13px;border-radius:8px;overflow:auto;
  background:color-mix(in srgb,var(--dsw-alias-bg-base) 80%,transparent);
  font-family:ui-monospace,Consolas,monospace;font-size:.87em;line-height:1.7}
.dsha-doc-span{border-radius:3px}
.dsha-file-pre{margin:0;padding:12px 14px;border-radius:8px;overflow:auto;white-space:pre;tab-size:4;
  font-family:ui-monospace,Consolas,monospace;font-size:.87em;line-height:1.65;user-select:text;
  background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 60%,transparent)}
.dsha-file-tip{padding:22px 14px;text-align:center;line-height:1.7;color:var(--dsw-alias-label-secondary);font-size:12px}
.dsha-file-notice{display:flex;align-items:center;gap:8px;margin:0 0 10px;padding:6px 10px;border-radius:6px;font-size:12px;
  background:rgba(255,150,60,.14);color:var(--dsw-alias-label-primary)}
.dsha-file-notice button{margin-left:auto}
.dsha-tv-wrap{overflow:auto;max-height:100%}
.dsha-tv{border-collapse:separate;border-spacing:0;font-size:12px;line-height:1.55}
.dsha-tv th,.dsha-tv td{border-right:1px solid var(--dsw-alias-border-l1);border-bottom:1px solid var(--dsw-alias-border-l1);
  padding:4px 8px;text-align:left;vertical-align:top;white-space:pre-wrap;max-width:360px;cursor:cell}
.dsha-tv thead th{position:sticky;top:0;z-index:1;font-weight:600;white-space:nowrap;
  background:var(--dsw-alias-bg-layer-2,#2a2a2e)}
.dsha-tv .dsha-tv-rn{position:sticky;left:0;color:var(--dsw-alias-label-secondary);text-align:right;cursor:default;
  background:var(--dsw-alias-bg-layer-2,#2a2a2e);font-weight:400}
.dsha-tv td[data-on="1"]{outline:2px solid rgba(77,107,254,.8);outline-offset:-2px}
.dsha-tv td[data-status="queued"]{background:rgba(77,107,254,.20)}
.dsha-tv td[data-status="sent"]{background:rgba(77,107,254,.30)}
.dsha-tv td[data-status="answered"]{background:rgba(60,190,120,.28)}
.dsha-tv-foot{padding:6px 2px;font-size:11px;color:var(--dsw-alias-label-secondary)}
.dsha-chip{display:inline-block;padding:1px 8px;border-radius:999px;font-size:11.5px;line-height:1.5;
  border:1px solid transparent;white-space:nowrap}
.dsha-chip[data-tone="green"]{background:rgba(63,185,80,.18);color:#4ec26b;border-color:rgba(63,185,80,.35)}
.dsha-chip[data-tone="blue"]{background:rgba(88,132,255,.18);color:#8aa0ff;border-color:rgba(88,132,255,.35)}
.dsha-chip[data-tone="gray"]{background:rgba(150,150,160,.16);color:#b8b8c0;border-color:rgba(150,150,160,.3)}
.dsha-chip[data-tone="red"]{background:rgba(255,92,92,.16);color:#ff8a8a;border-color:rgba(255,92,92,.32)}
.dsha-chip[data-tone="orange"]{background:rgba(255,166,64,.16);color:#ffb454;border-color:rgba(255,166,64,.32)}
.dsha-chip[data-tone="purple"]{background:rgba(168,120,255,.18);color:#bd9bff;border-color:rgba(168,120,255,.34)}
.dsha-chip-caret{display:inline-block;margin-left:4px;font-size:9px;opacity:0;transition:opacity .12s}
.dsha-tv td[data-pickable="1"] .dsha-chip-caret{opacity:.45}
.dsha-tv td[data-pickable="1"]:hover .dsha-chip-caret,.dsha-tv td[data-on="1"] .dsha-chip-caret{opacity:1}
.dsha-tv td[data-pickable="1"]{cursor:pointer}
.dsha-chip[data-tone="teal"]{background:rgba(45,190,190,.18);color:#4fd1c5;border-color:rgba(45,190,190,.35)}
.dsha-chip[data-tone="magenta"]{background:rgba(220,90,190,.18);color:#f08ad2;border-color:rgba(220,90,190,.35)}
.dsha-chip[data-tone="yellow"]{background:rgba(210,180,60,.18);color:#e3c65a;border-color:rgba(210,180,60,.35)}
.dsha-pick-row{display:flex;align-items:center;gap:2px;border-radius:6px}
.dsha-pick-row:hover{background:rgba(127,127,127,.12)}
.dsha-pick-grow{flex:1;min-width:0}
.dsha-pick-more-btn{border:none;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;
  padding:2px 6px;border-radius:4px;font-size:13px;line-height:1}
.dsha-pick-more-btn:hover{background:rgba(127,127,127,.18);color:var(--dsw-alias-label-primary)}
.dsha-pick-head{padding:2px 6px 6px;font-size:11px;color:var(--dsw-alias-label-secondary)}
.dsha-pick-grid{display:flex;flex-wrap:wrap;gap:6px;padding:2px 4px 6px;max-width:220px}
.dsha-pick-swatch{width:22px;height:22px;border-radius:50%;cursor:pointer;font-size:9px;color:var(--dsw-alias-label-secondary);
  border:1px solid var(--dsw-alias-border-l1);background:transparent}
.dsha-pick-swatch[data-on="1"]{outline:2px solid #8aa0ff;outline-offset:1px}
.dsha-pick-swatch[data-tone="red"]{background:#c4554d}.dsha-pick-swatch[data-tone="orange"]{background:#cb7b3a}
.dsha-pick-swatch[data-tone="yellow"]{background:#c2a43b}.dsha-pick-swatch[data-tone="green"]{background:#3f9d5b}
.dsha-pick-swatch[data-tone="teal"]{background:#2fa3a3}.dsha-pick-swatch[data-tone="blue"]{background:#4a72c4}
.dsha-pick-swatch[data-tone="purple"]{background:#8a5cc4}.dsha-pick-swatch[data-tone="magenta"]{background:#b854a0}
.dsha-pick-danger{color:#ff8a8a}
.dsha-pick-dots{display:inline-flex;gap:3px;margin-left:auto}
.dsha-dot{width:8px;height:8px;border-radius:50%;background:#7f7f8f}
.dsha-dot[data-tone="red"]{background:#c4554d}.dsha-dot[data-tone="orange"]{background:#cb7b3a}
.dsha-dot[data-tone="yellow"]{background:#c2a43b}.dsha-dot[data-tone="green"]{background:#3f9d5b}
.dsha-dot[data-tone="teal"]{background:#2fa3a3}.dsha-dot[data-tone="blue"]{background:#4a72c4}
.dsha-dot[data-tone="purple"]{background:#8a5cc4}.dsha-dot[data-tone="magenta"]{background:#b854a0}
.dsha-pick-sep{height:1px;margin:4px 2px;background:var(--dsw-alias-border-l1);opacity:.7}
.dsha-pick-item{display:flex;align-items:center;gap:8px;background:transparent;border:none;border-radius:6px;
  padding:3px 6px;cursor:pointer;font:inherit;color:var(--dsw-alias-label-primary);text-align:left}
.dsha-pick-item:hover{background:rgba(127,127,127,.14)}
.dsha-pick-item-on{background:rgba(127,127,127,.1)}
.dsha-pick-tick{margin-left:auto;color:#8aa0ff;font-size:11px}
.dsha-cell-pick{position:fixed;z-index:98;display:flex;flex-direction:column;gap:2px;padding:4px;
  border-radius:8px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);
  box-shadow:0 10px 26px rgba(0,0,0,.4);max-height:240px;overflow:auto}
.dsha-cell-pick .dsha-mini{text-align:left;padding:4px 10px;border-radius:6px}
.dsha-cell-pick .dsha-mini:hover{background:var(--dsw-alias-bg-layer-2)}
.dsha-tv-edit{width:100%;box-sizing:border-box;font:inherit;font-size:12px;padding:2px 4px;border-radius:4px;
  border:1px solid var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary)}
.dsha-tv-fx{display:inline-block;margin-right:4px;font-size:10px;font-style:italic;color:#8aa0ff;cursor:help}
.dsha-wb{display:flex;flex-direction:column;min-height:0}
.dsha-wb-tabs{display:flex;flex-wrap:wrap;gap:4px;margin:0 0 8px}
.dsha-wb-count{margin-left:5px;padding:0 5px;border-radius:8px;font-size:10px;background:rgba(77,107,254,.30)}
.dsha-export-wrap{position:relative;display:inline-flex}
.dsha-export-menu{position:absolute;top:100%;left:0;margin-top:4px;min-width:210px;padding:4px;border-radius:8px;z-index:6;
  background:var(--dsw-alias-bg-layer-2,#2a2a2e);border:1px solid var(--dsw-alias-border-l1);box-shadow:0 6px 18px rgba(0,0,0,.25)}
.dsha-export-menu button{display:block;width:100%;text-align:left;margin:2px 0}

.dsha-doc-span[data-status="queued"]{background:rgba(77,107,254,.20);
  box-shadow:inset 0 -2px 0 rgba(77,107,254,.75)}
.dsha-doc-span[data-status="sent"]{background:rgba(77,107,254,.30);
  animation:dsha-breathe 1.7s ease-in-out infinite}
.dsha-doc-span[data-status="answered"]{background:rgba(60,190,120,.28);
  box-shadow:inset 0 -2px 0 rgba(60,190,120,.8)}
/* 右键那一刻的选区：把浏览器的选区高亮接过来，浮层抢焦点后也不会“看起来没选中” */
.dsha-doc-span[data-status="pending"]{background:rgba(77,107,254,.26);
  box-shadow:inset 0 -2px 0 rgba(77,107,254,.75)}
/* 原文被改过、位置是「认回来的」：橙色底，和卡片上的橙红边框一致。
   以后写在这几条之后，覆盖上面的蓝/绿。 */
.dsha-doc-span[data-shifted="1"]{background:rgba(255,170,90,.30);
  box-shadow:inset 0 -2px 0 rgba(255,140,50,.9)}
.dsha-doc-span[data-shifted="1"][data-status="answered"]{background:rgba(255,170,90,.34);
  box-shadow:inset 0 -2px 0 rgba(255,140,50,.95)}
/* 选中即刻弹出的工具条 */
.dsha-toolbar{position:fixed;z-index:90;display:flex;align-items:center;gap:2px;padding:4px;
  border-radius:10px;pointer-events:auto;
  background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 97%,transparent);border:1px solid var(--dsw-alias-border-l2);
  box-shadow:0 10px 26px rgba(0,0,0,.42)}
.dsha-tb{height:26px;padding:0 9px;border:none;border-radius:6px;background:transparent;
  color:var(--dsw-alias-label-secondary);font-size:12px;cursor:pointer;font-family:inherit}
.dsha-tb:hover{background:color-mix(in srgb,var(--dsw-alias-bg-base) 70%,transparent);
  color:var(--dsw-alias-label-primary)}
.dsha-tb-primary{color:#8aa0ff;background:rgba(77,107,254,.16);font-weight:600}
.dsha-tb-sep{width:1px;height:16px;margin:0 3px;background:var(--dsw-alias-border-l1)}
.dsha-tb-group{display:flex;align-items:center;gap:1px}
.dsha-tb-small{padding:0 6px;font-size:11px;min-width:26px}
.dsha-tb[data-on="1"]{color:#8aa0ff;background:rgba(77,107,254,.18);font-weight:600}
/* 划句即刻弹出的表情条：点一下就把这个表情的含义连同选中的句子发给我 */
.dsha-emoji{position:fixed;z-index:91;display:flex;align-items:center;gap:1px;padding:3px 4px;
  border-radius:10px;pointer-events:auto;
  background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 97%,transparent);border:1px solid var(--dsw-alias-border-l2);
  box-shadow:0 10px 26px rgba(0,0,0,.42)}
.dsha-emoji-btn{width:30px;height:28px;padding:0;border:none;border-radius:7px;background:transparent;
  font-size:17px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;
  transition:transform .12s ease,background .12s ease}
.dsha-emoji-btn:hover{background:rgba(77,107,254,.18);transform:scale(1.14)}
.dsha-emoji-btn:active{transform:scale(.94)}
.dsha-emoji-more{color:var(--dsw-alias-label-secondary);font-size:16px;font-weight:600}
.dsha-emoji-add{display:flex;align-items:center;gap:4px;padding:0 2px}
.dsha-emoji-input{height:26px;width:150px;border-radius:6px;padding:0 7px;font-size:11.5px;font-family:inherit;
  color:var(--dsw-alias-label-primary);box-sizing:border-box;outline:none;
  background:color-mix(in srgb,var(--dsw-alias-bg-base) 70%,transparent);border:1px solid var(--dsw-alias-border-l1)}
.dsha-emoji-emoji{width:46px;text-align:center;font-size:15px}
.dsha-emoji-ok{height:26px;padding:0 9px;border:none;border-radius:6px;cursor:pointer;font-size:11.5px;
  font-family:inherit;color:#8aa0ff;background:rgba(77,107,254,.18)}
/* 批注浮层里的表态：单独一颗胶囊，贴在批注卡上沿的外面（卡片里不放它，卡片自己的圆角不受影响）。
   不放「表态」这两个字，只留表情；高度 40px、按钮 36px、表情 20px，和划词那排表情一个量级。
   表情多到比卡片还宽时，表情那一段横向滚动 —— 滚轮也能拨（见 AnnotateSurface 里的 wheel 监听）。 */
.dsha-say-pill{position:absolute;left:0;bottom:calc(100% + 4px);display:flex;align-items:center;gap:2px;
  max-width:100%;height:40px;padding:0 6px;box-sizing:border-box;border-radius:13px;overflow:hidden;
  background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 97%,transparent);border:1px solid var(--dsw-alias-border-l2);
  box-shadow:0 8px 22px rgba(0,0,0,.38)}
.dsha-say-scroll{display:flex;align-items:center;gap:4px;flex:1;min-width:0;overflow-x:auto;overflow-y:hidden;
  scrollbar-width:none}
.dsha-say-scroll::-webkit-scrollbar{display:none}
/* 胶囊末尾的「+」：就地加一个表情（写进 Config.reactions，和划词那排的「+」同一套）；前面一条细线隔开 */
.dsha-say-sep{width:2px;height:20px;border-radius:1px;flex:none;margin:0 4px;background:rgba(255,255,255,.30)}
.dsha-say-add{width:32px;height:32px;padding:0;border:none;border-radius:16px;background:transparent;flex:none;
  color:var(--dsw-alias-label-secondary);font-size:17px;font-weight:600;line-height:1;cursor:pointer;
  display:flex;align-items:center;justify-content:center;font-family:inherit}
.dsha-say-add:hover{background:rgba(255,255,255,.10);color:var(--dsw-alias-label-primary)}
.dsha-say-addrow{display:flex;align-items:center;gap:4px;flex:none}
.dsha-say-input{height:30px;width:132px;box-sizing:border-box;border-radius:8px;padding:0 7px;font-size:11.5px;
  font-family:inherit;color:var(--dsw-alias-label-primary);outline:none;
  background:color-mix(in srgb,var(--dsw-alias-bg-base) 70%,transparent);border:1px solid var(--dsw-alias-border-l1)}
.dsha-say-input:focus{border-color:rgba(77,107,254,.55)}
.dsha-say-emoji{width:50px;text-align:center;font-size:15px}
.dsha-say-ok{height:30px;padding:0 9px;border:none;border-radius:8px;cursor:pointer;font-size:11.5px;
  font-family:inherit;color:#8aa0ff;background:rgba(77,107,254,.18)}
.dsha-say-btn{width:36px;height:36px;padding:0;border:none;border-radius:18px;background:transparent;
  font-size:20px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center}
.dsha-say-btn:hover{background:rgba(255,255,255,.10);transform:scale(1.08)}
/* 设置页：表情 / 含义 / 开关 三列 */
.dsha-set-reacts{display:flex;flex-direction:column;gap:6px;margin-top:8px;max-width:420px}
.dsha-set-react{display:flex;align-items:center;gap:8px}
.dsha-set-emoji{width:52px;flex:none;text-align:center;font-size:15px}
.dsha-set-meaning{flex:1;min-width:0;height:28px;border-radius:7px;padding:0 8px;font-size:12px;
  font-family:inherit;color:var(--dsw-alias-label-primary);box-sizing:border-box;
  background:color-mix(in srgb,var(--dsw-alias-bg-base) 70%,transparent);
  border:1px solid var(--dsw-alias-border-l1);outline:none}
.dsha-set-meaning:focus{border-color:rgba(77,107,254,.55)}
.dsha-set-meaning[disabled]{opacity:.55;cursor:default}
/* 文档里的批注线程卡：像聊天，但只在右栏 */
.dsha-thread{position:fixed;z-index:95;width:340px;max-height:calc(100vh - 64px);display:flex;flex-direction:column;
  gap:8px;padding:10px;border-radius:12px;pointer-events:auto;
  background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 97%,transparent);border:1px solid var(--dsw-alias-border-l2);
  box-shadow:0 16px 40px rgba(0,0,0,.46);font-size:12px}
.dsha-thread-head{display:flex;align-items:center;gap:6px;flex:none;cursor:move;user-select:none}
/* 右下角的缩放把手：两条斜线，和系统窗口的角标一个语感 */
.dsha-thread-grip{position:absolute;right:3px;bottom:3px;width:14px;height:14px;cursor:nwse-resize;
  border-radius:3px;opacity:.75;box-shadow:inset -2px -2px 0 rgba(255,255,255,.30)}
.dsha-thread-grip:hover{opacity:1;box-shadow:inset -2px -2px 0 rgba(255,255,255,.55)}
/* 八向缩放把手：四条边 + 四个角（铁律 6：只给右下角一个 grip 不算能调大小） */
.dsha-thread-drag{position:absolute;z-index:6}
.dsha-thread-drag[data-dir="n"]{left:14px;right:14px;top:-3px;height:8px;cursor:ns-resize}
.dsha-thread-drag[data-dir="s"]{left:14px;right:14px;bottom:-3px;height:8px;cursor:ns-resize}
.dsha-thread-drag[data-dir="w"]{top:14px;bottom:14px;left:-3px;width:8px;cursor:ew-resize}
.dsha-thread-drag[data-dir="e"]{top:14px;bottom:14px;right:-3px;width:8px;cursor:ew-resize}
.dsha-thread-drag[data-dir="nw"]{left:-3px;top:-3px;width:16px;height:16px;cursor:nwse-resize}
.dsha-thread-drag[data-dir="ne"]{right:-3px;top:-3px;width:16px;height:16px;cursor:nesw-resize}
.dsha-thread-drag[data-dir="sw"]{left:-3px;bottom:-3px;width:16px;height:16px;cursor:nesw-resize}
.dsha-thread-drag[data-dir="se"]{right:-3px;bottom:-3px;width:16px;height:16px;cursor:nwse-resize}
.dsha-thread-title{font-size:11.5px;font-weight:600;color:var(--dsw-alias-label-secondary)}
.dsha-thread-quote{background:color-mix(in srgb,var(--dsw-alias-bg-base) 55%,transparent);
  border-radius:7px;padding:6px 8px;font-size:11.5px;line-height:1.55;
  color:var(--dsw-alias-label-secondary);max-height:56px;overflow:hidden;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.dsha-thread-list{display:flex;flex-direction:column;gap:7px;overflow:auto;flex:1;min-height:40px}
.dsha-msg{display:flex;flex-direction:column;gap:2px}
.dsha-msg[data-who="me"]{align-items:flex-end}
.dsha-msg-who{font-size:10px;color:var(--dsw-alias-label-secondary)}
.dsha-msg-text{max-width:92%;padding:6px 9px;border-radius:9px;line-height:1.55;white-space:pre-wrap;
  word-break:break-word;background:color-mix(in srgb,var(--dsw-alias-bg-base) 60%,transparent)}
.dsha-msg[data-who="me"] .dsha-msg-text{background:rgba(77,107,254,.20)}
.dsha-msg[data-who="ai"] .dsha-msg-text{background:rgba(60,190,120,.16)}
.dsha-thread-send{display:flex;align-items:center;gap:8px;padding:6px 10px;
  border-top:1px solid var(--dsw-alias-border-l1);background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 60%,transparent)}.dsha-thread-input{display:flex;align-items:flex-end;gap:6px;flex:none}
.dsha-thread-input .dsha-textarea{min-height:28px;max-height:72px;padding:5px 8px;font-size:12px;line-height:1.45;resize:none}
/* 听写按钮：录音中显示红点，转写中变暗 */
.dsha-mic{width:28px;height:28px;flex:none;border-radius:8px;font-size:13px;line-height:1;cursor:pointer;
  display:inline-flex;align-items:center;justify-content:center;
  color:var(--dsw-alias-label-secondary);background:color-mix(in srgb,var(--dsw-alias-bg-base) 55%,transparent);
  border:1px solid var(--dsw-alias-border-l1)}
.dsha-mic:hover{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l2)}
.dsha-mic-on{color:#ff8f8f;border-color:rgba(255,110,110,.55);background:rgba(255,90,90,.12)}
.dsha-mic-busy{opacity:.55;cursor:progress}
.dsha-mic-dot{width:9px;height:9px;border-radius:5px;background:currentColor}
/* 线程卡的关闭按钮：右下角一个红框方按钮，叉用两根线画，避免字形上偏 */
.dsha-mini.dsha-close{position:relative;width:24px;height:22px;padding:0;font-size:0;line-height:0;
  display:inline-flex;align-items:center;justify-content:center;border-radius:6px;
  color:#ff8f8f;border:1px solid rgba(255,110,110,.5);background:rgba(255,90,90,.08)}
.dsha-mini.dsha-close::before,.dsha-mini.dsha-close::after{content:"";position:absolute;left:50%;top:50%;
  width:10px;height:1.5px;border-radius:1px;background:currentColor}
.dsha-mini.dsha-close::before{transform:translate(-50%,-50%) rotate(45deg)}
.dsha-mini.dsha-close::after{transform:translate(-50%,-50%) rotate(-45deg)}
.dsha-mini.dsha-close:hover{color:#fff;border-color:rgba(255,110,110,.9);background:rgba(255,90,90,.24)}
/* 设置页（插件 → 本行 → 配置） */
.dsha-settings{display:flex;flex-direction:column;gap:2px;max-width:660px;
  color:var(--dsw-alias-label-primary);font-size:12.5px;font-family:inherit}
.dsha-set-row{display:flex;align-items:flex-start;gap:14px;padding:12px 0;
  border-top:1px solid var(--dsw-alias-border-l1)}
.dsha-set-row:first-child{border-top:none}
.dsha-set-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}
.dsha-set-label{font-size:12.5px;font-weight:600;line-height:1.5}
.dsha-set-desc{font-size:11.5px;line-height:1.6;color:var(--dsw-alias-label-secondary)}
.dsha-set-ctl{flex:none;display:flex;align-items:center;gap:6px;padding-top:1px}
.dsha-set-input{height:28px;width:64px;border-radius:7px;padding:0 8px;font-size:12px;
  font-family:inherit;color:var(--dsw-alias-label-primary);box-sizing:border-box;
  background:color-mix(in srgb,var(--dsw-alias-bg-base) 70%,transparent);
  border:1px solid var(--dsw-alias-border-l1);outline:none}
.dsha-set-input:focus{border-color:rgba(77,107,254,.55)}
.dsha-set-input[disabled]{opacity:.55;cursor:default}
.dsha-set-area{width:210px;min-height:56px;box-sizing:border-box;border-radius:7px;padding:6px 8px;
  font-size:11.5px;line-height:1.6;font-family:inherit;resize:vertical;
  color:var(--dsw-alias-label-primary);
  background:color-mix(in srgb,var(--dsw-alias-bg-base) 70%,transparent);
  border:1px solid var(--dsw-alias-border-l1);outline:none}
.dsha-set-area:focus{border-color:rgba(77,107,254,.55)}
.dsha-set-area[disabled]{opacity:.55;cursor:default}
.dsha-set-switch{width:16px;height:16px;margin:0;cursor:pointer;accent-color:#4d6bfe}
.dsha-set-actions{display:flex;align-items:center;gap:10px;padding-top:12px;
  border-top:1px solid var(--dsw-alias-border-l1)}
.dsha-set-note{font-size:11.5px;color:var(--dsw-alias-label-secondary)}
.dsha-set-ver{width:110px;text-align:center;font-family:ui-monospace,Consolas,monospace;font-size:11.5px}
/* 0.113 · 拖动/拉伸/窗口缩放期间：阴影、过渡一律关掉，合成器只搬像素不重算（见设计书 7.4）。 */
:root[data-dsha-dragging="1"] [class*="dsha-"],:root[data-dsha-resizing="1"] [class*="dsha-"]{
  box-shadow:none!important;transition:none!important;animation:none!important}
:root[data-dsha-dragging="1"]{cursor:grabbing}
:root[data-dsha-dragging="1"] [class*="dsha-"]{user-select:none}
`

    function installStyles() {
      const id = 'dsh-annotate-styles'
      if (document.getElementById(id) !== null) return () => {}
      const element = document.createElement('style')
      element.id = id
      element.textContent = CSS
      document.head.appendChild(element)
      return () => { element.remove() }
    }

    /* ============ 0.113 · P0 性能：拖动合帧 / 缩放标记 / 测量 / 事件驱动扫描 ============ */

    const raf = (fn) => (typeof window.requestAnimationFrame === 'function'
      ? window.requestAnimationFrame(fn)
      : window.setTimeout(fn, 16))
    const cancelRaf = (id) => {
      if (typeof window.cancelAnimationFrame === 'function') window.cancelAnimationFrame(id)
      else if (typeof window.clearTimeout === 'function') window.clearTimeout(id)
    }

    /**
     * 拖动/拉伸合帧：pointermove 只记「最后一次要做的提交」，一帧最多提交一次。
     * 以前每个 pointermove 都 commit → 14 个订阅组件全量重渲染，60+ 次/秒。
     */
    function rafGeom() {
      let pending = null
      let frame = 0
      const run = () => {
        frame = 0
        const job = pending
        pending = null
        if (job !== null) job()
      }
      return {
        push(job) {
          pending = job
          if (frame === 0) frame = raf(run)
        },
        /** 松手时调用：把最后一帧立刻落下去。 */
        flush() {
          if (frame !== 0) { cancelRaf(frame); frame = 0 }
          run()
        },
      }
    }

    /** 拖动/拉伸期间在根节点挂 data-dsha-dragging="1"（CSS 据此关阴影与过渡）。 */
    function setDragging(on) {
      try {
        const root = document.documentElement
        if (root === null || root === undefined) return
        if (on) root.setAttribute('data-dsha-dragging', '1')
        else root.removeAttribute('data-dsha-dragging')
      } catch (error) { /* 忽略 */ }
    }

    /** 窗口缩放期间挂 data-dsha-resizing="1"，停 200ms 后摘掉。返回卸载函数。 */
    function installResizeMarker() {
      let timer
      const onResize = () => {
        try { document.documentElement.setAttribute('data-dsha-resizing', '1') } catch (error) { /* 忽略 */ }
        if (timer !== undefined) window.clearTimeout(timer)
        timer = window.setTimeout(() => {
          timer = undefined
          try { document.documentElement.removeAttribute('data-dsha-resizing') } catch (error) { /* 忽略 */ }
        }, 200)
      }
      window.addEventListener('resize', onResize, { passive: true })
      return () => {
        window.removeEventListener('resize', onResize)
        if (timer !== undefined) window.clearTimeout(timer)
        try { document.documentElement.removeAttribute('data-dsha-resizing') } catch (error) { /* 忽略 */ }
      }
    }

    /* ---- 测量（设计书 7.2）：只记次数与耗时，不记正文 ---- */
    const perfNow = () => (typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now())
    function perfBlank() {
      return { since: Date.now(), tick: { n: 0, sum: 0, max: 0 }, scan: { n: 0, sum: 0, max: 0 }, commit: 0, persist: 0, beat: 0, pre: 0, sid: '' }
    }
    const perf = { cur: perfBlank(), last: null }
    function perfAdd(slot, ms) {
      const bucket = perf.cur[slot]
      bucket.n += 1
      bucket.sum += ms
      if (ms > bucket.max) bucket.max = ms
    }
    /** 一行性能日志（纯函数，方便测）。 */
    function perfLine(snap, mode, tail) {
      const avg = (b) => (b.n === 0 ? 0 : b.sum / b.n)
      const f = (x) => (Math.round(x * 10) / 10).toFixed(1)
      const secs = Math.max(1, (Number(snap.until || Date.now()) - snap.since) / 1000)
      return '性能 [' + tail + '] tick 平均 ' + f(avg(snap.tick)) + 'ms/最大 ' + f(snap.tick.max) + 'ms/' + String(snap.tick.n) + ' 次'
        + ' | scan 平均 ' + f(avg(snap.scan)) + 'ms/' + String(snap.scan.n) + ' 次/' + f(snap.scan.n / secs) + '每秒'
        + ' | commit ' + String(snap.commit) + ' | persist ' + String(snap.persist)
        + ' | pre 块 ' + String(snap.pre) + ' | 模式 ' + mode
    }
    /** 每 10 秒收一次账，写一行到 /annotate-log；什么都没发生就不写。 */
    function perfFlush() {
      const snap = perf.cur
      snap.until = Date.now()
      try { snap.pre = document.querySelectorAll('[data-chat-flow] pre').length } catch (error) { snap.pre = 0 }
      perf.last = snap
      perf.cur = perfBlank()
      perf.cur.sid = snap.sid
      if (snap.tick.n === 0 && snap.scan.n === 0 && snap.commit === 0) return
      const text = perfLine(snap, scanMode(), sessionTail(snap.sid))
      try {
        fetch('/annotate-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ at: new Date().toISOString(), text }),
        }).catch(() => {})
      } catch (error) { /* 忽略 */ }
    }

    /* ---- 扫描调度（设计书 7.3） ---- */
    const SCAN = { BEAT_MS: 100, MIN_GAP_MS: 250, IDLE_MS: 1600, STREAM_MS: 250, STREAM_HOLD_MS: 1500, POLL_MS: 300, DISK_MS: 4000 }
    const scanState = { mode: 'event', dirty: true, streamingUntil: 0 }
    function scanMode() { return scanState.mode }
    /** 标脏：下一拍（≤100ms）就扫。why 只用于调试。 */
    function markScanDirty(why) {
      scanState.dirty = true
      scanState.why = typeof why === 'string' ? why : ''
    }

    /**
     * 这一拍要不要真扫（纯函数）。
     * - poll：老行为，固定 300ms 一次（A/B 对照用）；
     * - event：脏了（聊天 DOM 变了 / 切会话 / 开面板 / 窗口聚焦 / 文档变长 / 页签同步 / 磁盘该对账）且距上次 ≥ minGapMs；
     *          流式期间每 250ms；其余时间每 idleMs 兜底一次。
     */
    function shouldScanNow(input) {
      const o = input === null || input === undefined ? {} : input
      const now = Number(o.now) || 0
      const last = Number(o.lastScanAt) || 0
      const gap = now - last
      if (last === 0) return true
      if (o.mode === 'poll') return gap >= SCAN.POLL_MS
      const minGap = Number.isFinite(o.minGapMs) ? o.minGapMs : SCAN.MIN_GAP_MS
      if (o.dirty === true && gap >= minGap) return true
      if (Number(o.streamingUntil) > now && gap >= SCAN.STREAM_MS) return true
      const idle = Number.isFinite(o.idleMs) ? o.idleMs : SCAN.IDLE_MS
      return gap >= idle
    }

    /**
     * 聊天流观察器（全插件一份）：DocPanel 的扫描和 ReplyBridge 的回执都订阅它。
     * [data-chat-flow] 节点被宿主换掉（切会话）时自动重挂。
     */
    const chatWatch = { el: null, observer: null, listeners: new Set() }
    function ensureChatWatch() {
      let flow = null
      try { flow = document.querySelector('[data-chat-flow]') } catch (error) { flow = null }
      if (flow === chatWatch.el) return
      if (chatWatch.observer !== null) {
        try { chatWatch.observer.disconnect() } catch (error) { /* 忽略 */ }
        chatWatch.observer = null
      }
      chatWatch.el = flow
      markScanDirty('flow-swap')
      if (flow === null || typeof MutationObserver !== 'function') return
      try {
        chatWatch.observer = new MutationObserver(() => {
          markScanDirty('mutation')
          for (const fn of [...chatWatch.listeners]) {
            try { fn() } catch (error) { /* 忽略 */ }
          }
        })
        chatWatch.observer.observe(flow, { childList: true, subtree: true, characterData: true })
      } catch (error) {
        chatWatch.observer = null
      }
    }
    function onChatMutation(fn) {
      chatWatch.listeners.add(fn)
      ensureChatWatch()
      return () => { chatWatch.listeners.delete(fn) }
    }

    /* ------------------------------------------------------------- 状态与存储 */

    const subscribers = new Set()
    let state = null

    /* schema 3（0.112.0）：文档库按会话分桶 —— docs[sid][key]。旧的全局 docLibrary 原样保留一个版本，只读不写。 */
    const SCHEMA = 3
    /* 空库：固定一个引用，避免 useMemo 每拍失效。 */
    const EMPTY_LIB = Object.freeze({})
    /* 每个会话的文档库最多留几条（全文存在 localStorage，太多会撞配额）。 */
    const DOCS_PER_SESSION = 40
    /* 最多留几个会话的文档库（按最近一次入库时间）。 */
    const DOCS_SESSIONS_MAX = 24
    const MAX_ITEMS_PER_BATCH = 12
    const MAX_CHARS_PER_BATCH = 8000
    const QUOTE_IN_MSG_MAX = 160
    const NOTE_MAX = 600
    const QUOTE_STORE_MAX = 500
    const TARGET_TTL = 60000

    function emptyState() {
      return { schema: SCHEMA, batchSeq: 0, sessions: {}, open: false, active: null, undo: null, surface: null, debug: '', ui: null, collapsed: {}, docOpen: false, docPending: null, docToolbar: null, doc: null, docEditing: false, docThread: null, docThreadBox: null, docWide: false, docWideBox: null, docFloatBox: null, docDrawer: false, docDrawerW: 340, docPick: '', docView: null, docFont: 15, docFontLocal: false, docSid: '', docs: {}, docLibraryLegacy: null, docMigration: null, docDemote: true, docDemoted: 0, sentTail: '', sentTails: [], picked: {}, reanchorId: '', reanchorHint: '', autoDoc: true, autoDocLocal: false, hideDocBlocks: true, docSeen: '', onlyQueued: false, onlyLost: false, keepReplyWindow: 4, docFind: '', docFindAt: 0, docFindOpen: false, reactions: '', wideRightClick: true, dockDocTab: false, docDetached: false, docNotice: '' }
    }

    /** 聊天引文可以压空白；文件引文必须逐字保留换行，否则模型定位不到原文。 */
    function storeQuote(text, target) {
      const raw = String(text === undefined || text === null ? '' : text)
      if (target === 'file') {
        const trimmed = raw.trim()
        return trimmed.length > QUOTE_STORE_MAX ? trimmed.slice(0, QUOTE_STORE_MAX) + '…' : trimmed
      }
      return clipQuote(raw, QUOTE_STORE_MAX)
    }

    function normalizePath(raw) {
      if (typeof raw !== 'string') return null
      const path = raw.trim().replace(/\\/gu, '/').replace(/^\.\//u, '')
      if (path === '') return null
      if (path.startsWith('/') || /^[a-zA-Z]:/u.test(path)) return null
      if (path.split('/').some(part => part === '..')) return null
      return path
    }

    function clipQuote(text, max) {
      const flat = String(text === undefined || text === null ? '' : text).replace(/\s+/gu, ' ').trim()
      if (flat.length <= max) return flat
      return flat.slice(0, max - 1) + '…'
    }

    /* ------------------------------------------------------------ 表情表态 */

    /** 没配置时用的两条：对 / 错。用户可以在设置页改成自己的说法。 */
    const REACTION_FALLBACK = [
      { emoji: '👍', meaning: '对，就这么做' },
      { emoji: '❌', meaning: '不对，换个做法' },
    ]
    const REACTION_MAX = 8

    /**
     * 把设置页里那几行「表情=含义」解析成表情条。
     * 只认 `=`／`＝` 连接的写法；坏行跳过，全坏才退回默认两条 —— 绝不让表情条变成空白。
     */
    function parseReactions(raw) {
      const text = typeof raw === 'string' ? raw : ''
      const out = []
      for (const line of text.split(/\r?\n/gu)) {
        const item = line.trim()
        if (item === '') continue
        /* 行首带 `-` = 用户在设置页把它关掉了：还留着含义，但不出现在表情条上 */
        if (item.startsWith('-')) continue
        const at = item.search(/[=＝]/u)
        if (at <= 0) continue
        const emoji = item.slice(0, at).trim()
        const meaning = item.slice(at + 1).trim()
        if (emoji === '' || meaning === '') continue
        if (out.some(entry => entry.emoji === emoji)) continue
        out.push({ emoji: emoji.slice(0, 8), meaning: meaning.slice(0, 60) })
        if (out.length >= REACTION_MAX) break
      }
      return out
    }

    /** 当前该显示哪些表情（含默认）。 */
    function reactionList() {
      const parsed = parseReactions(state === null ? '' : state.reactions)
      return parsed.length === 0 ? REACTION_FALLBACK : parsed
    }

    /** 设置页里列出来的候选表情（默认只开前两个，其余等用户拨开关）。 */
    const REACTION_PRESETS = [
      { emoji: '👍', meaning: '对，就这么做', on: true },
      { emoji: '❌', meaning: '不对，换个做法', on: true },
      { emoji: '❤️', meaning: '喜欢这个', on: false },
      { emoji: '🎉', meaning: '可以收了', on: false },
      { emoji: '👀', meaning: '再看看', on: false },
      { emoji: '😂', meaning: '有意思', on: false },
      { emoji: '🚀', meaning: '直接开干', on: false },
      { emoji: '✅', meaning: '确认无误', on: false },
    ]

    /** 整张表（含关掉的）：设置页三列要用它，关掉的行也得留着。 */
    function parseReactionRows(raw) {
      const text = typeof raw === 'string' ? raw : ''
      const out = []
      for (const line of text.split(/\r?\n/gu)) {
        const item = line.trim()
        if (item === '') continue
        const off = item.startsWith('-')
        const body = off ? item.slice(1).trim() : item
        const at = body.search(/[=＝]/u)
        if (at <= 0) continue
        const emoji = body.slice(0, at).trim()
        const meaning = body.slice(at + 1).trim()
        if (emoji === '' || meaning === '') continue
        if (out.some(entry => entry.emoji === emoji)) continue
        out.push({ emoji: emoji.slice(0, 8), meaning: meaning.slice(0, 60), on: !off })
      }
      return out
    }

    /** 表压回文本：关掉的带 `-`，这样开关再打开时含义还在。 */
    function reactionText(rows) {
      const list = Array.isArray(rows) ? rows : []
      return list
        .slice(0, 64)
        .map(row => (row.on === false ? '-' : '') + String(row.emoji) + '=' + String(row.meaning))
        .join('\n')
    }

    /** 设置页要显示的那张表：候选按顺序在前，自定义的跟在后面。 */
    function reactionRows(raw) {
      const stored = parseReactionRows(raw)
      const rows = REACTION_PRESETS.map((preset) => {
        const hit = stored.find(entry => entry.emoji === preset.emoji)
        return hit === undefined
          ? { emoji: preset.emoji, meaning: preset.meaning, on: false }
          : { emoji: hit.emoji, meaning: hit.meaning, on: hit.on }
      })
      for (const entry of stored) {
        if (rows.some(row => row.emoji === entry.emoji)) continue
        rows.push({ emoji: entry.emoji, meaning: entry.meaning, on: entry.on })
      }
      return rows
    }

    /** 加一个自定义表情：同表情改含义，不重复占位，加完是开着的。 */
    function mergeReactionText(current, emoji, meaning) {
      const rows = reactionRows(current)
      const key = String(emoji === undefined || emoji === null ? '' : emoji).trim().slice(0, 8)
      const say = String(meaning === undefined || meaning === null ? '' : meaning).trim().slice(0, 60)
      if (key === '' || say === '') return reactionText(parseReactionRows(current))
      const at = rows.findIndex(row => row.emoji === key)
      const next = at < 0
        ? [...rows, { emoji: key, meaning: say, on: true }]
        : rows.map((row, index) => (index === at ? { emoji: key, meaning: say, on: true } : row))
      return reactionText(next)
    }

    /* ------------------------------------------------ 0.115 · 批注的 ref + locator（P1 落地，P2 直接用） */

    /** ref = { sid, fileKey }：批注挂在哪个会话的哪个文件上。坏输入 → null。 */
    function sanitizeRef(raw) {
      if (raw === null || raw === undefined || typeof raw !== 'object') return null
      const sid = typeof raw.sid === 'string' ? raw.sid : ''
      const fileKey = typeof raw.fileKey === 'string' ? raw.fileKey : ''
      if (sid === '' && fileKey === '') return null
      return { sid, fileKey }
    }

    /**
     * locator：批注在文件里的位置。
     * - md   → { kind:'md', blockIndex, startChar, endChar }
     * - cell → { kind:'cell', sheet, row, col }（row/col 从 0 起，row 0 是表头那一行）
     * - text → { kind:'text', blockIndex:0, startChar, endChar, line }（txt / 代码，line 从 1 起）
     * 认不出的 kind → null。
     */
    function sanitizeLocator(raw) {
      if (raw === null || raw === undefined || typeof raw !== 'object') return null
      const int = (value) => (typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0)
      if (raw.kind === 'md') {
        return { kind: 'md', blockIndex: int(raw.blockIndex), startChar: int(raw.startChar), endChar: int(raw.endChar) }
      }
      if (raw.kind === 'cell') {
        return { kind: 'cell', sheet: typeof raw.sheet === 'string' ? raw.sheet : '', row: int(raw.row), col: int(raw.col) }
      }
      if (raw.kind === 'text') {
        return { kind: 'text', blockIndex: 0, startChar: int(raw.startChar), endChar: int(raw.endChar), line: Math.max(1, int(raw.line)) }
      }
      return null
    }

    /** 列序号 → 列名：0→A，25→Z，26→AA。 */
    function colLetters(col) {
      let n = (typeof col === 'number' && Number.isFinite(col) && col >= 0 ? Math.floor(col) : 0) + 1
      let out = ''
      while (n > 0) {
        const r = (n - 1) % 26
        out = String.fromCharCode(65 + r) + out
        n = Math.floor((n - 1) / 26)
      }
      return out
    }

    /** 单元格名：列名 + 行号（行号从 1 起，表头是第 1 行）。 */
    function cellLabel(row, col) {
      const r = typeof row === 'number' && Number.isFinite(row) && row >= 0 ? Math.floor(row) : 0
      return colLetters(col) + String(r + 1)
    }

    /** 单元格的值（不带单元格名）。 */
    function cellValue(rows, row, col) {
      const line = Array.isArray(rows) ? rows[row] : undefined
      return Array.isArray(line) && line[col] !== undefined && line[col] !== null ? String(line[col]) : ''
    }

    /** 单元格在正文里的文本：`B3: 12.5%`（锚点匹配、断言找原文都用它）。 */
    function cellQuote(rows, row, col) {
      return cellLabel(row, col) + ': ' + cellValue(rows, row, col)
    }

    /** 偏移 → 行号（从 1 起），纯文本批注发出去写成 `文件:行号`。 */
    function lineAtOffset(text, offset) {
      const body = typeof text === 'string' ? text : ''
      const at = Math.max(0, Math.min(typeof offset === 'number' && Number.isFinite(offset) ? Math.floor(offset) : 0, body.length))
      let line = 1
      for (let index = 0; index < at; index += 1) if (body.charCodeAt(index) === 10) line += 1
      return line
    }

    function migrateItem(raw) {
      if (raw === null || typeof raw !== 'object') return null
      const quote = typeof raw.quote === 'string' ? raw.quote : null
      const note = typeof raw.note === 'string' ? raw.note : null
      if (quote === null || note === null) return null
      const target = raw.target === 'file' ? 'file' : (raw.target === 'doc' ? 'doc' : 'chat')
      const statuses = ['queued', 'sent', 'answered', 'resolved']
      const status = statuses.includes(raw.status) ? raw.status : 'queued'
      const item = {
        id: typeof raw.id === 'string' && raw.id !== '' ? raw.id : makeId(),
        target,
        kind: raw.kind === 'question'
          ? 'question'
          : (raw.kind === 'edit' ? (target === 'chat' ? 'question' : 'edit') : 'auto'),
        status,
        anchorState: typeof raw.anchorState === 'string'
          ? raw.anchorState
          : (target === 'chat' ? 'n/a' : 'unset'),
        quote,
        note,
        createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
      }
      if (target === 'doc') {
        item.path = typeof raw.path === 'string' ? raw.path : '对话文档'
        if (typeof raw.blockIndex === 'number') item.blockIndex = raw.blockIndex
        if (typeof raw.startChar === 'number') item.startChar = raw.startChar
        if (typeof raw.endChar === 'number') item.endChar = raw.endChar
      }
      if (target === 'file') {
        const path = normalizePath(raw.path)
        if (path !== null) item.path = path
        if (typeof raw.absPath === 'string') item.absPath = raw.absPath
        if (typeof raw.lineStart === 'number') item.lineStart = raw.lineStart
        if (typeof raw.lineEnd === 'number') item.lineEnd = raw.lineEnd
        if (typeof raw.prefix === 'string') item.prefix = raw.prefix
        if (typeof raw.suffix === 'string') item.suffix = raw.suffix
      }
      if (typeof raw.sentAs === 'string') item.sentAs = raw.sentAs
      if (typeof raw.sentAt === 'number') item.sentAt = raw.sentAt
      /* 分批号与批内序号必须留住：reconcile 靠它们分组、排序，丢了所有历史批注会并成一批。 */
      if (typeof raw.sentBatch === 'string') item.sentBatch = raw.sentBatch
      if (typeof raw.slot === 'number') item.slot = raw.slot
      if (typeof raw.suggested === 'string') item.suggested = raw.suggested
      if (typeof raw.docKey === 'string') item.docKey = raw.docKey
      /* 0.115：ref + locator 与 docKey 并存一个版本；旧条目没有就不补（按 docKey 解析，逻辑不动）。 */
      {
        const ref = sanitizeRef(raw.ref)
        if (ref !== null) item.ref = ref
        const locator = sanitizeLocator(raw.locator)
        if (locator !== null) item.locator = locator
      }
      if (typeof raw.reply === 'string') item.reply = raw.reply
      if (typeof raw.repliedAt === 'number') item.repliedAt = raw.repliedAt
      if (Array.isArray(raw.thread)) {
        item.thread = raw.thread
          .filter(entry => entry !== null && typeof entry === 'object'
            && typeof entry.text === 'string' && (entry.who === 'me' || entry.who === 'ai'))
          .map(entry => ({
            who: entry.who,
            text: entry.who === 'ai' ? cleanReply(entry.text) : entry.text,
            at: typeof entry.at === 'number' ? entry.at : 0,
          }))
          .filter(entry => entry.text !== '')
      }
      if (typeof item.reply === 'string') item.reply = cleanReply(item.reply)
      if (raw.downgraded === true) item.downgraded = true
      if (raw.dirty === true) item.dirty = true
      return item
    }

    function readState() {
      const base = emptyState()
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        if (raw === null) return base
        const parsed = JSON.parse(raw)
        if (parsed === null || typeof parsed !== 'object') return base
        if (typeof parsed.batchSeq === 'number' && Number.isFinite(parsed.batchSeq)) {
          base.batchSeq = Math.max(0, Math.floor(parsed.batchSeq))
        }
        if (typeof parsed.sentTail === 'string') base.sentTail = parsed.sentTail
        if (Array.isArray(parsed.sentTails)) {
          base.sentTails = parsed.sentTails
            .filter(entry => entry !== null && typeof entry === 'object'
              && typeof entry.tail === 'string' && entry.tail !== '')
            .slice(-4)
            .map(entry => ({
              tail: entry.tail,
              batch: typeof entry.batch === 'string' ? entry.batch : '',
              at: typeof entry.at === 'number' ? entry.at : 0,
            }))
        } else if (base.sentTail !== '') {
          /* 旧数据只有一根锚点：迁移成一条队列记录。 */
          base.sentTails = [{ tail: base.sentTail, batch: '', at: 0 }]
        }
        /* 0.113.1：**不再恢复 docPick**。它是「正在看历史版」的锁定键，一旦被持久化，
           重启后列表里最新那份排第一、正文却还是上次点开的那份（用户看到的就是「标题和文档对不上」）。
           0.87 修过一轮，这里把加载这一半也关掉；运行期点列表仍然照常生效。 */
        if (typeof parsed.docFont === 'number' && parsed.docFont >= 11 && parsed.docFont <= 24) {
          base.docFont = parsed.docFont
          /* 本地手动调过字号：设置页里的「默认字号」只当默认值，不再覆盖它。 */
          base.docFontLocal = true
        }
        /* 文档库（schema 3）：按会话分桶。
           - 已经是 3：直接读 docs，旧 docLibrary 原样带着（下个版本再删）。
           - 还是 2：从旧的全局 docLibrary 迁移一次（migrateDocLibrary，纯函数、幂等）。
           旧字段一个字节都不改，回滚到 0.111.x 时它仍然能读到原来的库。 */
        const legacyLib = parsed.docLibrary !== null && typeof parsed.docLibrary === 'object' ? parsed.docLibrary : null
        base.docLibraryLegacy = legacyLib
        if (Number(parsed.schema) >= 3 && parsed.docs !== null && typeof parsed.docs === 'object') {
          base.docs = sanitizeDocs(parsed.docs)
          base.docMigration = { from: 3, kept: 0, orphans: 0, skipped: true }
        } else if (legacyLib !== null) {
          const migrated = migrateDocLibrary(legacyLib)
          base.docs = migrated.docs
          base.docMigration = { from: Number(parsed.schema) || 2, kept: migrated.kept, orphans: migrated.orphans, skipped: false }
        }
        /* 0.112.1：一次性把**聊天键**条目降级为不可信。
           原因：0.111 及更早时期，切会话瞬间聊天区 DOM 可能还是上一个会话的，
           扫描会把 A 的文档以 B 的 sid 写进库并标成可信（trusted=true）。
           这种条目在分桶之后仍会显示在 B 里（2026-11-27 现场：99b5ca3a 显示 059068b6 的「技能三层机制」）。
           降级之后：只有当它自己的会话里聊天重新扫到同一份正文时，才会再被标回可信。
           只做一次（docDemote 标记），不影响正常使用。 */
        if (parsed.docDemote !== true) {
          const demoted = demoteChatTrust(base.docs)
          base.docs = demoted.docs
          base.docDemoted = demoted.demoted
        }
        base.docDemote = true
        if (parsed.dockDocTab === true) base.dockDocTab = true
      if (parsed.docWideBox !== null && typeof parsed.docWideBox === 'object') {
          const box = parsed.docWideBox
          if (typeof box.x === 'number' && typeof box.y === 'number'
            && typeof box.w === 'number' && typeof box.h === 'number') {
            base.docWideBox = { x: box.x, y: box.y, w: box.w, h: box.h }
          }
        }
        if (parsed.docFloatBox !== null && typeof parsed.docFloatBox === 'object') {
          const box = parsed.docFloatBox
          if (typeof box.x === 'number' && typeof box.y === 'number'
            && typeof box.w === 'number' && typeof box.h === 'number') {
            base.docFloatBox = { x: box.x, y: box.y, w: box.w, h: box.h }
          }
        }
        /* 线程卡：只记尺寸（用户说「对话过的窗口才改」—— 位置每次跟着点的句子走） */
        if (parsed.docThreadBox !== null && typeof parsed.docThreadBox === 'object') {
          const box = parsed.docThreadBox
          if (typeof box.w === 'number' && typeof box.h === 'number' && box.w >= 200 && box.h >= 120) {
            base.docThreadBox = { w: box.w, h: box.h }
          }
        }
        if (typeof parsed.docDrawerW === 'number' && parsed.docDrawerW >= 240 && parsed.docDrawerW <= 900) {
          base.docDrawerW = parsed.docDrawerW
        }
        if (typeof parsed.docSeen === 'string') base.docSeen = parsed.docSeen
        if (parsed.onlyLost === true || parsed.onlyLost === false) {
          base.onlyLost = parsed.onlyLost
        }
        if (parsed.onlyQueued === true || parsed.onlyQueued === false) {
          base.onlyQueued = parsed.onlyQueued
        }
        if (parsed.hideDocBlocks === true || parsed.hideDocBlocks === false) {
          base.hideDocBlocks = parsed.hideDocBlocks
        }
        if (parsed.autoDoc === true || parsed.autoDoc === false) {
          base.autoDoc = parsed.autoDoc
          /* 文档下拉菜单里点过：没有设置页的显式覆盖时，以这条本地选择为准。 */
          base.autoDocLocal = true
        }
        if (parsed.ui !== null && typeof parsed.ui === 'object') {          const ui = parsed.ui
          if (typeof ui.x === 'number' && typeof ui.y === 'number'
            && typeof ui.w === 'number' && typeof ui.h === 'number') {
            base.ui = { x: ui.x, y: ui.y, w: ui.w, h: ui.h }
          }
        }
        /* ⚠ 2026-11-27：启动时**不再**恢复「当前文档」。
           以前这里把上次的 doc 原样塞回 state.doc，且不校验它属于哪个会话 ——
           于是别的会话的文档会在重启后继续显示（0.110.1~0.110.5 都没堵住这条路）。
           现在留空：面板每 300ms 按「磁盘 → 对话块 → 文档库」重新取本会话的文档。
           旧字段仍保留在 localStorage 里不删，需要时可以临时把 false 改成 true 回看。 */
        if (false && parsed.doc !== null && typeof parsed.doc === 'object' && Array.isArray(parsed.doc.blocks)) {
          const rebuilt = parsed.doc.blocks
            .filter(block => (
              block !== null && typeof block === 'object'
              && typeof block.text === 'string' && typeof block.kind === 'string'
            ))
            .map((block) => {
              if (Array.isArray(block.runs) && block.runs.length > 0) return block
              /* 表格/图卡/水平线是「结构化块」：它们的字段（rows、task、num…）不能靠 text 重建，
                 一律原样保留，否则加载后一渲染就崩（0.72 就栽在这）。 */
              if (block.kind === 'table' || block.kind === 'svg' || block.kind === 'hr') return block
              /* 旧数据只有 text：重新切一次 runs，把 **粗体** 这类标记解析回来。 */
              return { ...makeBlock(block.kind, block.text), ...block }
            })
          base.doc = {
            id: 'main',
            sid: typeof parsed.doc.sid === 'string' ? parsed.doc.sid : undefined,
            key: typeof parsed.doc.key === 'string' ? parsed.doc.key : undefined,
            blocks: rebuilt,
            source: typeof parsed.doc.source === 'string' ? parsed.doc.source : '',
            editedAt: typeof parsed.doc.editedAt === 'number' ? parsed.doc.editedAt : 0,
            local: parsed.doc.local === true,
            /* 身份也要恢复：以前只存 key，重启后 title/fileName 丢成 undefined，
               于是「同一份文件」的判断永远不成立，外部改动进不来（0.89 修）。 */
            title: typeof parsed.doc.title === 'string' ? parsed.doc.title : undefined,
            fileName: typeof parsed.doc.fileName === 'string' ? parsed.doc.fileName : undefined,
            fileMtime: typeof parsed.doc.fileMtime === 'number' ? parsed.doc.fileMtime : 0,
            /* 续写模型：前 baseCount 段是整篇正文（改它要整篇重发），后面的段都是 `dsh-doc+` 追加进来的。 */
            baseCount: typeof parsed.doc.baseCount === 'number'
              ? parsed.doc.baseCount
              : rebuilt.length,
            appends: Array.isArray(parsed.doc.appends)
              ? parsed.doc.appends
                .filter(part => part !== null && typeof part === 'object' && typeof part.src === 'string')
                .map(part => ({ src: part.src }))
              : [],
          }
        }
        const sessions = parsed.sessions
        if (sessions === null || typeof sessions !== 'object') return base
        const next = {}
        let maxBatch = 0
        for (const [sessionId, list] of Object.entries(sessions)) {
          if (!Array.isArray(list)) continue
          const kept = []
          for (const entry of list) {
            const item = migrateItem(entry)
            if (item === null) continue
            kept.push(item)
            const matched = /^B(\d+)-/u.exec(typeof item.sentAs === 'string' ? item.sentAs : '')
            if (matched !== null) maxBatch = Math.max(maxBatch, Number(matched[1]))
          }
          next[sessionId] = kept
        }
        base.sessions = next
        base.batchSeq = Math.max(base.batchSeq, maxBatch)
      } catch (error) {
        /* JSON 坏了就整库归零（所有批注和文档一次性消失）。至少先把原始串留一份，
           用户还能让我捞回来；顺便给一次可见提示。 */
        try {
          const raw = window.localStorage.getItem(STORAGE_KEY)
          if (typeof raw === 'string' && raw !== '') {
            window.localStorage.setItem(STORAGE_KEY + '.broken.' + String(Date.now()), raw)
          }
        } catch (inner) { /* 备份也失败就没办法了 */ }
        console.warn('[annotate] 本地存储读不出来，已备份原始串并按空处理', error)
      }
      return base
    }

    /* 0.113 · 落盘减重（设计书 7.5）：旧 docLibrary（≈56 KB）只序列化一次，之后每次 persist 直接拼接缓存串。
       不能干脆不写：0.111.x 只从 'dsh-annotate/v1' 的 docLibrary 字段读库，省掉它回滚就读不到了。 */
    const legacyCache = { src: undefined, json: '' }
    function legacyJsonOf(legacy) {
      if (legacy === null || legacy === undefined) return ''
      if (legacyCache.src !== legacy) {
        legacyCache.src = legacy
        legacyCache.json = JSON.stringify(legacy)
      }
      return legacyCache.json
    }
    /** 把旧库缓存串拼进主 JSON（纯函数）：结果与 JSON.stringify({...body, docLibrary}) 等价。 */
    function spliceLegacy(bodyJson, legacyJson) {
      if (typeof legacyJson !== 'string' || legacyJson === '') return bodyJson
      if (bodyJson === '{}') return '{"docLibrary":' + legacyJson + '}'
      return bodyJson.slice(0, -1) + ',"docLibrary":' + legacyJson + '}'
    }

    function persist() {
      perf.cur.persist += 1
      try {
        window.localStorage.setItem(STORAGE_KEY, spliceLegacy(JSON.stringify({
          schema: SCHEMA,
          batchSeq: state.batchSeq,
          sessions: state.sessions,
          ui: state.ui,
          doc: docForStorage(state.doc),
          docPick: state.docPick,
          docFont: state.docFont,
          /* schema 3：按会话分桶的文档库。 */
          docs: state.docs,
          docDemote: state.docDemote === true,
          docDemoted: typeof state.docDemoted === 'number' ? state.docDemoted : 0,
          /* 旧的全局库 docLibrary：不在这里序列化，见 spliceLegacy（0.113）。 */
          docWideBox: state.docWideBox,
          docFloatBox: state.docFloatBox,
          docThreadBox: state.docThreadBox,
          docDrawerW: state.docDrawerW,
          autoDoc: state.autoDoc,
          dockDocTab: state.dockDocTab === true,
          hideDocBlocks: state.hideDocBlocks !== false,
          docSeen: typeof state.docSeen === 'string' ? state.docSeen : '',
          onlyQueued: state.onlyQueued === true,
          onlyLost: state.onlyLost === true,
          sentTails: state.sentTails,
          sentTail: state.sentTail,
        }), legacyJsonOf(state.docLibraryLegacy)))
      } catch (error) {
        console.warn('[annotate] 本地存储写不进去', error)
      }
    }

    /* 流式期间 doc / docLibrary 每 300ms 各提交一次，而 persist() 是「全量 JSON + 同步 localStorage」：
       每拍写一次等于每 300ms 在主线程上切一刀。改成最多 800ms 落一次盘；
       关面板、切会话这种关键时刻仍然直接 persist()。 */
    let persistTimer
    function schedulePersist() {
      if (persistTimer !== undefined) return
      persistTimer = window.setTimeout(() => {
        persistTimer = undefined
        persist()
      }, 800)
    }
    function flushPersist() {
      if (persistTimer === undefined) return
      window.clearTimeout(persistTimer)
      persistTimer = undefined
      persist()
    }

    /* 常量与函数都就位之后再读盘，避免 TDZ：readState 会用到 SCHEMA 与迁移函数。 */
    state = readState()

    function notify() {
      for (const listener of [...subscribers]) {
        try {
          listener()
        } catch (error) {
          console.warn('[annotate] 订阅者出错', error)
        }
      }
    }

    function commit(patch, shouldPersist) {
      perf.cur.commit += 1
      state = { ...state, ...patch }
      if (shouldPersist === true) persist()
      notify()
    }

    /* 文档指纹：判断「这次 putDoc 和现在这份到底是不是同一份」。
       光比长度不够 —— 改一个字的编辑（段数不变）会被当成没变化丢掉，所以要比内容哈希。 */
    function docFingerprint(doc) {
      if (doc === null || doc === undefined) return ''
      const blocks = Array.isArray(doc.blocks) ? doc.blocks : []
      let hash = 2166136261
      const mix = (text) => {
        for (let index = 0; index < text.length; index += 1) {
          hash ^= text.charCodeAt(index)
          hash = Math.imul(hash, 16777619) >>> 0
        }
      }
      for (const block of blocks) {
        mix(String(block === null || block === undefined ? '' : block.kind))
        mix('\u0000')
        mix(String(block === null || block === undefined ? '' : block.text))
        mix('\u0001')
      }
      const appends = Array.isArray(doc.appends) ? doc.appends : []
      for (const part of appends) mix(String(part === null || part === undefined ? '' : part.src))
      /* 0.115：非 md 文件没有 blocks，指纹改看类型 + 正文 / 表格尺寸（md 文档不走这里，指纹不变）。 */
      if (isFileDoc(doc)) {
        mix(String(doc.fileKind) + (doc.unsupported === true ? '!' : '') + (doc.needsLoad === true ? '?' : ''))
        mix(typeof doc.fileText === 'string' ? doc.fileText : '')
        const rows = doc.model !== null && doc.model !== undefined && Array.isArray(doc.model.rows) ? doc.model.rows : []
        mix(String(rows.length) + 'x' + String(rows.length === 0 ? 0 : rows[0].length) + '@' + String(doc.fileMtime || 0))
        /* 0.116：工作簿看每张表的名字与尺寸。 */
        const sheets = doc.model !== null && doc.model !== undefined && Array.isArray(doc.model.sheets) ? doc.model.sheets : []
        for (const sheet of sheets) {
          const sr = Array.isArray(sheet.rows) ? sheet.rows : []
          mix('|' + String(sheet.name) + ':' + String(sr.length) + 'x' + String(sr.length === 0 ? 0 : sr[0].length))
        }
      }
      return [
        String(doc.sid === undefined || doc.sid === null ? '' : doc.sid),
        String(doc.key === undefined || doc.key === null ? '' : doc.key),
        String(doc.baseCount),
        doc.local === true ? '1' : '0',
        String(blocks.length),
        String(appends.length),
        hash.toString(16),
      ].join('|')
    }

    function sameDocShape(a, b) {
      if (a === b) return true
      if (a === null || a === undefined || b === null || b === undefined) return false
      return docFingerprint(a) === docFingerprint(b)
    }

    /* 切换文档时留一条记录：「两份文档来回跳」只能靠它定位。写进 ~/.dsh/annotate-client-debug.log */
    function logDocSwitch(why, next) {
      const from = state.doc
      if (from === null || from === undefined || next === null || next === undefined) return
      const fromKey = String(from.key === undefined ? '' : from.key)
      const toKey = String(next.key === undefined ? '' : next.key)
      if (fromKey === toKey) return
      const line = '文档切换 [' + why + '] ' + fromKey + '(' + String(from.title === undefined ? '' : from.title) + ') → ' + toKey + '(' + String(next.title === undefined ? '' : next.title) + ')'
      try { console.warn('[annotate] ' + line) } catch (error) { /* 忽略 */ }
      try {
        fetch('/annotate-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ at: new Date().toISOString(), text: line }),
        }).catch(() => {})
      } catch (error) { /* 忽略 */ }
    }

    function putDoc(next, extra) {
      /* 0.112：没有会话 id 的文档一律不收。sid 只能由来源（聊天扫描 / 磁盘目录 / 库桶）给出，
         这里不补、不猜 —— 以前「没 sid 就认领给当前会话」正是串会话的入口之一。 */
      if (next !== null && next !== undefined && (typeof next.sid !== 'string' || next.sid === '')) {
        try { console.warn('[annotate] putDoc 拒收：文档没有 sid', String(next.key === undefined ? '' : next.key)) } catch (error) { /* 忽略 */ }
        return
      }
      if (sameDocShape(state.doc, next)) {
        /* 内容没变也要给写穿一个机会：重启后文档是从 localStorage 恢复的，
           这里若直接 return，磁盘上永远不会有文件。 */
        scheduleDocFile(next)
        runtime.docWhy = ''
        return
      }
      /* extra 用来把「换文档」和「退出历史版」放进同一次 commit：
         分两次写会出现「先换文档再清 pick」的中间态，面板闪一下。 */
      const why = runtime.docWhy === undefined || runtime.docWhy === '' ? 'unknown' : runtime.docWhy
      runtime.docWhy = ''
      /* 0.113.3 诊断：谁把当前文档换成了什么。只记键与标题，不记正文。 */
      try {
        const prevKey = state.doc !== null && state.doc !== undefined && typeof state.doc.key === 'string' ? state.doc.key : '-'
        logLine('换文档 why=' + why + ' 新=' + String(next.key || '-') + ' (' + String(next.title || '-') + ') 旧=' + prevKey)
      } catch (error) { /* 忽略 */ }
      logDocSwitch(why, next)
      {
        /* 文档变长（流式续写 / 采纳）：标脏，下一拍就再扫一次，跟上生成（7.3）。 */
        const before = state.doc !== null && state.doc !== undefined && Array.isArray(state.doc.blocks) ? state.doc.blocks.length : 0
        const after = next !== null && next !== undefined && Array.isArray(next.blocks) ? next.blocks.length : 0
        if (after > before) markScanDirty('grow')
      }
      commit(extra === undefined ? { doc: next } : { ...extra, doc: next })
      schedulePersist()
      scheduleDocFile(next)
    }

    /* ---------------- 文档落文件（方案 B′ 第①步） ---------------- */

    /**
     * 用 better-sidebar 打开一个文件。
     *
     * 公开接口是服务的 `openTab({ type:'editor', path, title, id })`；
     * `openFile` 只在 Markdown 表面对象上存在，不是服务方法（曾用它，点了没反应）。
     */
    function openInSidebar(fullPath, line) {
      if (typeof fullPath !== 'string' || fullPath === '') return false
      const service = runtime.ctx === null || runtime.ctx === undefined ? null : runtime.ctx.get('betterSidebar')
      if (service === null || service === undefined) return false
      try {
        if (typeof service.openTab === 'function') {
          const at = Math.max(fullPath.lastIndexOf('/'), fullPath.lastIndexOf('\\'))
          const title = at === -1 ? fullPath : fullPath.slice(at + 1)
          service.openTab({
            type: 'editor',
            title,
            path: fullPath,
            id: 'editor:' + fullPath,
            ...(typeof line === 'number' ? { line } : {}),
          })
          return true
        }
        if (typeof service.openFile === 'function') {
          service.openFile(fullPath, typeof line === 'number' ? { line } : undefined)
          return true
        }
      } catch (error) {
        console.warn('[annotate] 打开侧栏文件失败', error)
      }
      return false
    }

    /** 短 id：会话 id 一律 session-xxx，取尾巴 8 位做前缀。 */
    function sessionTail(sessionId) {
      const raw = typeof sessionId === 'string' ? sessionId : ''
      return raw.replace(/^session-/u, '').slice(0, 8) || 'nosid'
    }

    /* ================= 文档归属（0.112.0）=================
       文档库按会话分桶：state.docs[sid][key] = { title, text, at, sid, trusted }。
       规则只有三条，全部在这里：
         1. 读：一律经 libOf(sid)。结构上拿不到别的会话的条目，不再需要「这份是不是我的」判据。
         2. 写：一律经 libCommit(sid, …)。sid 是写入方显式传进来的会话，不从条目里猜、也不改写。
         3. 文件键 file:<尾巴>/<名> 只能放进尾巴等于 sessionTail(sid) 的那个桶。 */

    /** 一条库条目整理成标准形状；坏条目返回 null。纯函数。 */
    function sanitizeLibEntry(key, value, ownerSid) {
      if (value === null || value === undefined || typeof value !== 'object') return null
      if (typeof value.text !== 'string') return null
      return {
        title: typeof value.title === 'string' && value.title !== '' ? value.title : '未命名文档',
        text: value.text,
        at: typeof value.at === 'number' ? value.at : 0,
        sid: ownerSid,
        /* 文件键天然可信（目录就是归属）；聊天键要本会话聊天里真的扫到过才可信。 */
        trusted: String(key).indexOf('file:') === 0 ? true : value.trusted === true,
      }
    }

    /** 文件键属于哪个会话尾巴；不是文件键返回 ''。纯函数。 */
    function fileKeyTail(key) {
      const k = String(key === undefined || key === null ? '' : key)
      if (k.indexOf('file:') !== 0) return ''
      const at = k.indexOf('/', 5)
      return at > 5 ? k.slice(5, at) : ''
    }

    /** 这条键能不能放进 sid 的桶：文件键看目录尾巴，聊天键只要 sid 有效。纯函数。 */
    function keyFitsSession(key, sid) {
      if (typeof sid !== 'string' || sid === '') return false
      const tail = fileKeyTail(key)
      if (String(key).indexOf('file:') === 0) return tail !== '' && tail === sessionTail(sid)
      return String(key) !== ''
    }

    /**
     * schema 2 → 3：把旧的全局 docLibrary 拆进各会话的桶。纯函数、幂等（同样的输入永远同样的输出）。
     * - 条目没有 sid：进不了任何桶（孤儿）。它们仍留在旧字段里，回滚能找回。
     * - 文件键的目录尾巴和 sid 对不上：说明 sid 被写串过 → 孤儿。
     * - 聊天键：放进它记录的 sid 桶，可信标记原样保留（0.111 起旧聊天键默认不可信，不会显示）。
     */
    function migrateDocLibrary(legacy) {
      const docs = {}
      let kept = 0
      let orphans = 0
      if (legacy === null || legacy === undefined || typeof legacy !== 'object') return { docs, kept, orphans }
      for (const [key, value] of Object.entries(legacy)) {
        const sid = value !== null && value !== undefined && typeof value === 'object' && typeof value.sid === 'string' ? value.sid : ''
        const entry = sid === '' ? null : sanitizeLibEntry(key, value, sid)
        if (entry === null || keyFitsSession(key, sid) !== true) { orphans += 1; continue }
        if (docs[sid] === undefined) docs[sid] = {}
        docs[sid][key] = entry
        kept += 1
      }
      return { docs, kept, orphans }
    }

    /** schema 3 的 docs 读回来时再过一遍：桶名必须是会话 id，键必须属于这个桶。纯函数。 */
    function sanitizeDocs(raw) {
      const docs = {}
      if (raw === null || raw === undefined || typeof raw !== 'object') return docs
      for (const [sid, bucket] of Object.entries(raw)) {
        if (typeof sid !== 'string' || sid === '' || bucket === null || typeof bucket !== 'object') continue
        const clean = {}
        for (const [key, value] of Object.entries(bucket)) {
          if (keyFitsSession(key, sid) !== true) continue
          const entry = sanitizeLibEntry(key, value, sid)
          if (entry !== null) clean[key] = entry
        }
        if (Object.keys(clean).length > 0) docs[sid] = clean
      }
      return docs
    }

    /**
     * 一次性把所有「聊天键」条目的可信标记降级（纯函数、幂等）。
     * 文件键不动：目录就是归属证据。
     * 返回 { docs, demoted }。 */
    function demoteChatTrust(docs) {
      const out = {}
      let demoted = 0
      if (docs === null || docs === undefined || typeof docs !== 'object') return { docs: out, demoted }
      for (const [sid, bucket] of Object.entries(docs)) {
        if (bucket === null || typeof bucket !== 'object') continue
        const clean = {}
        for (const [key, entry] of Object.entries(bucket)) {
          if (String(key).indexOf('file:') === 0) { clean[key] = entry; continue }
          if (entry !== null && entry !== undefined && entry.trusted === true) {
            clean[key] = { ...entry, trusted: false }
            demoted += 1
          } else {
            clean[key] = entry
          }
        }
        out[sid] = clean
      }
      return { docs: out, demoted }
    }

    /** 桶太大就按 at 留最近 limit 条；keepKey 那条必留。纯函数。 */
    function trimBucket(bucket, limit, keepKey) {
      const entries = Object.entries(bucket).filter(([, v]) => v !== null && v !== undefined)
      if (entries.length <= limit) return bucket
      entries.sort((a, b) => Number(b[1].at || 0) - Number(a[1].at || 0))
      const out = {}
      entries.slice(0, limit).forEach(([k, v]) => { out[k] = v })
      if (typeof keepKey === 'string' && keepKey !== '' && out[keepKey] === undefined && bucket[keepKey] !== undefined) {
        out[keepKey] = bucket[keepKey]
      }
      return out
    }

    /** 会话太多就丢掉最久没动的桶；keepSid 必留。纯函数。 */
    function trimDocs(docs, maxSessions, keepSid) {
      const sids = Object.keys(docs)
      if (sids.length <= maxSessions) return docs
      const newest = (bucket) => Object.values(bucket).reduce((m, v) => Math.max(m, Number(v && v.at) || 0), 0)
      sids.sort((a, b) => newest(docs[b]) - newest(docs[a]))
      const out = {}
      sids.slice(0, maxSessions).forEach(sid => { out[sid] = docs[sid] })
      if (typeof keepSid === 'string' && keepSid !== '' && out[keepSid] === undefined && docs[keepSid] !== undefined) {
        out[keepSid] = docs[keepSid]
      }
      return out
    }

    /** 唯一的读口：某个会话的文档库（只读，别改返回值）。 */
    function libOf(sid) {
      if (typeof sid !== 'string' || sid === '') return {}
      const all = state === null || state === undefined || state.docs === null || state.docs === undefined ? {} : state.docs
      const bucket = all[sid]
      return bucket === null || bucket === undefined ? {} : bucket
    }

    /** 某会话库里的一条（看历史版 / 批注取标题都用它）。 */
    function libEntryOf(sid, key) {
      if (typeof key !== 'string' || key === '') return undefined
      return libOf(sid)[key]
    }

    /**
     * 唯一的写口：整桶替换 sid 的文档库。
     * 放不进这个桶的键（别的会话目录的文件键）直接丢弃并记一笔 —— 结构上就写不串。
     * extra：要和库一起原子提交的其它字段（如 doc / docPick）。
     */
    function libCommit(sid, bucket, extra, persistNow) {
      if (typeof sid !== 'string' || sid === '') return
      const clean = {}
      let refused = 0
      for (const [key, value] of Object.entries(bucket === null || bucket === undefined ? {} : bucket)) {
        if (value === null || value === undefined) continue
        if (keyFitsSession(key, sid) !== true) { refused += 1; continue }
        clean[key] = { ...value, sid }
      }
      if (refused > 0) {
        try { console.warn('[annotate] 文档库拒收 ' + String(refused) + ' 条不属于本会话的键 [' + sessionTail(sid) + ']') } catch (error) { /* 忽略 */ }
      }
      const keepKey = state.doc !== null && state.doc !== undefined && state.doc.sid === sid ? state.doc.key : ''
      const all = { ...(state.docs === null || state.docs === undefined ? {} : state.docs) }
      const trimmed = trimBucket(clean, DOCS_PER_SESSION, keepKey)
      if (Object.keys(trimmed).length === 0) delete all[sid]
      else all[sid] = trimmed
      commit({ ...(extra === undefined ? {} : extra), docs: trimDocs(all, DOCS_SESSIONS_MAX, sid) }, persistNow === true)
      if (persistNow !== true) schedulePersist()
    }

    /** 当前文档是否属于 sid：sid 必须一致；文件键还要求目录尾巴一致。纯函数。 */
    function docBelongsTo(doc, sid) {
      if (doc === null || doc === undefined || typeof sid !== 'string' || sid === '') return false
      if (typeof doc.sid !== 'string' || doc.sid !== sid) return false
      const key = typeof doc.key === 'string' ? doc.key : ''
      if (key.indexOf('file:') === 0) return fileKeyTail(key) === sessionTail(sid)
      return true
    }

    /** 诊断用：sid 只留前后各 4 位。 */
    function sidBrief(sid) {
      const raw = typeof sid === 'string' ? sid.replace(/^session-/u, '') : ''
      if (raw === '') return '-'
      return raw.length <= 8 ? raw : raw.slice(0, 4) + '…' + raw.slice(-4)
    }

    /** 诊断用：键只留前缀（不带正文）。 */
    function keyBrief(key) {
      const k = typeof key === 'string' ? key : ''
      if (k === '') return '-'
      return k.length <= 28 ? k : k.slice(0, 28) + '…'
    }

    /** 诊断两行：本会话桶 + 全局。纯函数，方便测。 */
    function docDiagLines(docs, legacy, migration, sid, doc) {
      const tail = sessionTail(sid)
      const bucket = docs !== null && docs !== undefined && docs[sid] !== undefined ? docs[sid] : {}
      let chat = 0
      let file = 0
      let trusted = 0
      for (const [key, entry] of Object.entries(bucket)) {
        if (String(key).indexOf('file:') === 0) file += 1
        else chat += 1
        if (entry !== null && entry !== undefined && entry.trusted !== false) trusted += 1
      }
      const total = chat + file
      const active = doc === null || doc === undefined
        ? 'active=(-, -)'
        : 'active=(' + keyBrief(doc.key) + ', ' + sidBrief(doc.sid) + (docBelongsTo(doc, sid) ? '' : ' ≠本会话') + ')'
      const line1 = '文档诊断 [' + tail + '] lib=聊天键' + String(chat) + '/文件键' + String(file)
        + ' trusted=' + String(trusted) + '/' + String(total) + ' ' + active
      const buckets = docs === null || docs === undefined ? {} : docs
      const all = Object.values(buckets).reduce((n, b) => n + Object.keys(b || {}).length, 0)
      const legacyCount = legacy === null || legacy === undefined ? 0 : Object.keys(legacy).length
      const mig = migration === null || migration === undefined
        ? '迁移=无'
        : (migration.skipped === true ? '迁移=已是3' : '迁移=' + String(migration.from) + '→3 保留' + String(migration.kept) + ' 孤儿' + String(migration.orphans))
      const line2 = '文档诊断 [' + tail + '] 全局 schema=' + String(SCHEMA) + ' 会话桶=' + String(Object.keys(buckets).length)
        + ' 条目=' + String(all) + ' 旧库=' + String(legacyCount) + ' ' + mig
      return [line1, line2]
    }

    const docDiagSent = new Set()
    /** 每个会话首次加载文档时写两行诊断到 /annotate-log（不带正文）。 */
    function sendDocDiag(sid) {
      if (typeof sid !== 'string' || sid === '' || docDiagSent.has(sid)) return
      docDiagSent.add(sid)
      const lines = docDiagLines(state.docs, state.docLibraryLegacy, state.docMigration, sid, state.doc)
      /* 诊断加强：把本会话库里的条目逐条写出来（键尾、标题、时间），用来核对「文件名和文档是否对得上」。
         只在本会话第一次加载时写一次；不带正文。 */
        try {
          const bucket = state.docs !== null && state.docs !== undefined && typeof sid === 'string' ? (state.docs[sid] || {}) : {}
          const entries = Object.entries(bucket)
            .map(([key, value]) => ({ key: String(key), title: String(value && value.title ? value.title : ''), at: Number(value && value.at) || 0 }))
            .sort((a, b) => b.at - a.at)
            .slice(0, 12)
          for (const one of entries) {
            const tailPart = one.key.indexOf('/') >= 0 ? one.key.slice(one.key.indexOf('/') + 1) : one.key
            lines.push('库条目 [' + sessionTail(sid) + '] ' + tailPart + ' | 标题=' + one.title + ' | at=' + new Date(one.at).toISOString().slice(11, 19))
          }
          const cur = state.doc
          if (cur !== null && cur !== undefined) {
            lines.push('当前文档 [' + sessionTail(sid) + '] key=' + String(cur.key || '') + ' | 标题=' + String(cur.title || '') + ' | 文件名=' + String(cur.fileName || ''))
          }
        } catch (error) { /* 诊断失败不影响功能 */ }
      for (const text of lines) {
        try { console.info('[annotate] ' + text) } catch (error) { /* 忽略 */ }
        try {
          fetch('/annotate-log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ at: new Date().toISOString(), text }),
          }).catch(() => {})
        } catch (error) { /* 忽略 */ }
      }
    }

    let docFileTimer
    let docFileSig = ''
    /** 写穿：内容指纹变了才 600ms 落一次盘；失败只 warn，绝不打断编辑。 */
    function scheduleDocFile(doc) {
      const sid = doc === null || doc === undefined || typeof doc.sid !== 'string' ? '' : doc.sid
      const text = doc === null || doc === undefined || typeof doc.source !== 'string' ? '' : doc.source
      if (sid === '' || text === '') return
      if (shouldWriteDoc(doc) !== true) return
      /* **只有「本地改过」的内容才允许写盘。**
         以前从聊天采纳来的、从文件读来的内容也会写回去：模型用 doc_replace 改了文件，
         客户端下一拍把内存里的旧文写回，外部改动就被顶掉
         （2026-11-26：文件被改回「## 1. 一句话」，就是这条）。 */
      const title = typeof doc.title === 'string' ? doc.title : ''
      let hash = 2166136261
      for (let index = 0; index < text.length; index += 1) {
        hash ^= text.charCodeAt(index)
        hash = Math.imul(hash, 16777619) >>> 0
      }
      const sig = sid + '|' + text.length + '|' + hash.toString(16)
      if (sig === docFileSig) return
      docFileSig = sig
      if (docFileTimer !== undefined) window.clearTimeout(docFileTimer)
      docFileTimer = window.setTimeout(() => {
        docFileTimer = undefined
        try {
          void fetch('/annotate-doc', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sid, title, text,
              /* 把这份文档的文件名一起带上：同名/无标题的两份按 title 路由会写错文件（0.101）。 */
              fileName: typeof doc.fileName === 'string' ? doc.fileName : '',
              /* 从某个会话目录读来的文档，写回那个目录：只按 sid 落盘的话，sid 一旦写串就会
                 在别的会话目录里长出副本（2026-11-27 实测同一份文档出现在 3 个目录）。 */
              tail: (function () {
                const k = typeof doc.key === 'string' ? doc.key : ''
                if (k.indexOf('file:') !== 0) return ''
                const at = k.indexOf('/', 5)
                return at > 5 ? k.slice(5, at) : ''
              })(),
            }),
          }).catch(() => {})
        } catch (error) { /* 落盘失败不影响主流程 */ }
      }, 600)
    }

    /** 从磁盘读回本会话最新那份；找不到就返回 null。 */
    async function readDocFile(sessionId, wantedFile) {
      try {
        const asked = typeof wantedFile === 'string' && wantedFile !== ''
          ? '&file=' + encodeURIComponent(wantedFile) : ''
        const one = await fetch('/annotate-doc/latest?sid=' + encodeURIComponent(sessionId) + asked).then(response => response.json())
        if (one === null || one.ok !== true || typeof one.text !== 'string' || one.text === '') return null
        const blocks = parseMarkdownDoc(one.text)
        return {
          sid: sessionId,
          key: 'file:' + sessionTail(sessionId) + '/' + String(one.file === undefined ? '' : one.file),
          /* 必须带上文件名：`shouldWriteDoc` 靠它判断「这份已经有文件了，别再写」。
             以前这里漏了，于是从磁盘读回来的文档每次启动都当新文档再写一遍，
             在别的会话目录里反复长副本（2026-11-27 实测：重启后 9 秒又写回）。 */
          fileName: String(one.file === undefined ? '' : one.file),
          title: typeof one.title === 'string' ? one.title : '',
          source: one.text,
          blocks,
          baseCount: blocks.length,
          local: false,
          appends: [],
        }
      } catch (error) {
        return null
      }
    }

    /**
     * 把磁盘上「本会话目录里已有、但库里还没有」的文档并进文档库。
     * 为什么需要：工具（doc_append / doc_replace）直接写盘，不带聊天块，
     * 而库只从聊天扫描更新 —— 于是刚写好的文档在面板里看不到（2026-11-27 用户报）。
     * 规则：每个会话首次同步只登记、不切画面（避免启动时抢走正在看的那份）；
     * 之后新出现的文件才自动切过去（表示「刚给你写了一份」）。 */
    /**
     * 纯函数：磁盘清单里哪些条目本会话库里还没有（按会话尾巴过滤 + 去掉 .md 后缀）。
     * items: [{ file, title, mtime }]；bucket: 本会话文档库。
     * 返回 [{ key, file, title, at }]。 */
    /**
     * 纯函数：列表去重 —— 同一个标题既有聊天键条目又有文件条目时，只留文件条目。
     * 聊天键那条是当初从聊天里扫到的旧副本，和磁盘上的文件同名但内容可能不同（用户看到的"2 版"）。 */
    function dedupeDocList(entries) {
      const list = Array.isArray(entries) ? entries : []
      const fileTitles = new Set()
      for (const one of list) {
        const key = String(one === null || one === undefined ? '' : one.key)
        if (key.indexOf('file:') === 0) fileTitles.add(String(one.title || ''))
      }
      return list.filter((one) => {
        const key = String(one === null || one === undefined ? '' : one.key)
        if (key.indexOf('file:') === 0) return true
        return fileTitles.has(String(one.title || '')) !== true
      })
    }

    /** UTF-8 字节数（浏览器与 Node 的行为一致）。 */
    function textBytes(text) {
      if (typeof text !== 'string' || text === '') return 0
      try {
        return new TextEncoder().encode(text).length
      } catch (error) {
        return text.length
      }
    }

    /** 库里的正文和磁盘上的字节数对不上 → 说明当初取错了文件，需要重取。 */
    function needsTextRefresh(text, bytes) {
      const size = Number(bytes)
      if (!Number.isFinite(size) || size <= 0) return false
      return textBytes(typeof text === 'string' ? text : '') !== size
    }

    /** 文档键 → 文件名（file:<尾巴>/<名> → 名；聊天键返回空串）。 */
    function fileNameOfKey(key) {
      const k = typeof key === 'string' ? key : ''
      if (k.indexOf('file:') !== 0) return ''
      const at = k.indexOf('/', 5)
      return at > 5 ? k.slice(at + 1) : ''
    }

    /* ------------------------------------------------ 0.115 · 非 Markdown 文件（txt / code / csv） */

    /** 文件名 → kind（与宿主 fileKindOf 同一张表的子集；只用于图标与派发，认不出返回空串）。 */
    const CLIENT_FILE_KINDS = {
      md: 'md', markdown: 'md', txt: 'txt', log: 'txt', text: 'txt', csv: 'csv',
      xlsx: 'xlsx', xlsm: 'xlsx', xls: 'xlsx', docx: 'docx', pptx: 'pptx',
      png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', webp: 'image', bmp: 'image', svg: 'image',
    }
    const CLIENT_CODE_EXTS = 'js cjs mjs jsx ts tsx json py css html htm xml yml yaml toml ini sh ps1 bat cmd sql c h cpp hpp cs java kt go rs rb php lua swift vue'.split(' ')
    function fileKindOfName(name) {
      const base = String(name === undefined || name === null ? '' : name)
      const dot = base.lastIndexOf('.')
      if (dot <= 0 || dot === base.length - 1) return ''
      const ext = base.slice(dot + 1).toLowerCase()
      if (Object.prototype.hasOwnProperty.call(CLIENT_FILE_KINDS, ext)) return CLIENT_FILE_KINDS[ext]
      return CLIENT_CODE_EXTS.indexOf(ext) >= 0 ? 'code' : ''
    }

    /** 这份文档是不是「非 Markdown 文件」（txt / code / csv / 不支持的类型）。 */
    function isFileDoc(doc) {
      return doc !== null && doc !== undefined && typeof doc.fileKind === 'string'
        && doc.fileKind !== '' && doc.fileKind !== 'md'
    }

    /**
     * `/annotate-file` 的响应 → 面板里的文档对象。
     * 关键：**正文不放进 `source`**（放 `fileText` / `model`）。`source` 是 Markdown 那条链路的字段：
     * 写穿、入库、库同步、写回都看它；非 md 文件放进去就会被当成 Markdown 入库或写成 `x.csv.md`。
     */
    function fileDocOf(sessionId, body) {
      const one = body === null || body === undefined || typeof body !== 'object' ? {} : body
      const file = String(one.file === undefined ? '' : one.file)
      const kind = typeof one.kind === 'string' && one.kind !== '' ? one.kind : fileKindOfName(file)
      const doc = {
        id: 'main',
        sid: sessionId,
        key: 'file:' + sessionTail(sessionId) + '/' + file,
        fileName: file,
        fileKind: kind === '' ? 'unknown' : kind,
        title: typeof one.title === 'string' && one.title !== '' ? one.title : file,
        source: '',
        blocks: [],
        baseCount: 0,
        local: false,
        appends: [],
        fileMtime: typeof one.mtime === 'number' ? one.mtime : 0,
        caps: one.caps !== null && typeof one.caps === 'object' ? one.caps : { read: false, writeBack: false, export: false },
      }
      if (one.ok !== true) {
        doc.unsupported = true
        /* 0.116：xlsx 认得但这一份解析不了（坏文件 / 老 .xls / zip64）。 */
        if (one.reason === 'parse-failed') doc.parseFailed = true
        return doc
      }
      const cleanRows = rows => (Array.isArray(rows) ? rows : []).map(row => (Array.isArray(row) ? row.map(cell => String(cell)) : []))
      if (one.model !== null && one.model !== undefined && one.model.type === 'table' && Array.isArray(one.model.rows)) {
        doc.model = { type: 'table', rows: cleanRows(one.model.rows) }
      } else if (one.model !== null && one.model !== undefined && one.model.type === 'workbook' && Array.isArray(one.model.sheets)) {
        doc.model = {
          type: 'workbook',
          sheets: one.model.sheets.map((sheet, index) => {
            const out = {
              name: typeof sheet.name === 'string' && sheet.name !== '' ? sheet.name : 'Sheet' + String(index + 1),
              rows: cleanRows(sheet.rows),
            }
            if (sheet.truncated === true) out.truncated = true
            if (sheet.formulas !== null && typeof sheet.formulas === 'object') out.formulas = { ...sheet.formulas }
            if (Array.isArray(sheet.merges)) out.merges = sheet.merges.map(String)
            return out
          }),
        }
      } else {
        doc.fileText = typeof one.text === 'string' ? one.text : ''
      }
      return doc
    }

    /** 打开文件失败时给用户的一句话；成功（或「不支持预览」走文档对象显示）返回空串。 */
    function fileOpenNotice(status, body) {
      const reason = body !== null && body !== undefined && typeof body.reason === 'string' ? body.reason : ''
      if (status === 409 || reason === 'cross-session') return '这个文件不在本会话的目录里，不能在这里打开。'
      if (status === 404 || reason === 'missing') return '找不到这个文件（可能已经被移走或删除）。'
      if (status === 413 || reason === 'too-large') return '文件太大（超过 8 MB），暂不预览。'
      if (status === 415 || reason === 'unsupported') return ''
      if (status >= 400 || (body !== null && body !== undefined && body.ok === false)) return '文件读取失败，稍后再试。'
      return ''
    }

    /** 落 localStorage 的文档：非 md 文件不存正文 / 表格（可能有 5000×64），重开面板时按文件名重读。 */
    function docForStorage(doc) {
      if (isFileDoc(doc) !== true) return doc
      const out = { ...doc }
      delete out.model
      delete out.fileText
      if (out.unsupported !== true) out.needsLoad = true
      return out
    }

    /**
     * 非 md 文件的「伪段落」：只给「原文还在不在」这类判断用（docBlocksNow / 线程卡）。
     * 纯文本 → 一整块；表格 → 每个单元格一块，正文是 `B3: 值`（和单元格批注的引文同形）。
     */
    const fileBlocksCache = new WeakMap()
    function fileDocBlocks(doc) {
      if (isFileDoc(doc) !== true) return []
      const cached = fileBlocksCache.get(doc)
      if (cached !== undefined) return cached
      let out = []
      if (doc.model !== null && doc.model !== undefined && Array.isArray(doc.model.rows)) {
        const rows = doc.model.rows
        rows.forEach((row, r) => {
          if (!Array.isArray(row)) return
          row.forEach((ignored, c) => out.push({ kind: 'cell', text: cellQuote(rows, r, c) }))
        })
      } else if (doc.model !== null && doc.model !== undefined && Array.isArray(doc.model.sheets)) {
        /* 0.116：工作簿每张表的每个单元格一块，正文带表名（`Sheet1!B3: 值`），值本身仍能被逐字找到。 */
        for (const sheet of doc.model.sheets) {
          const rows = Array.isArray(sheet.rows) ? sheet.rows : []
          rows.forEach((row, r) => {
            if (!Array.isArray(row)) return
            row.forEach((ignored, c) => out.push({ kind: 'cell', text: String(sheet.name) + '!' + cellQuote(rows, r, c) }))
          })
        }
      } else if (typeof doc.fileText === 'string' && doc.fileText !== '') {
        out = [{ kind: 'pre', text: doc.fileText }]
      }
      fileBlocksCache.set(doc, out)
      return out
    }

    /** 从宿主读一个本会话文件并切到面板；越界 / 找不到时在面板顶上给一句提示。 */
    async function openSessionFile(sessionId, file) {
      if (typeof sessionId !== 'string' || sessionId === '' || typeof file !== 'string' || file === '') return false
      let status = 0
      let body = null
      try {
        const response = await fetch('/annotate-file?sid=' + encodeURIComponent(sessionId) + '&path=' + encodeURIComponent(file))
        status = response.status
        body = await response.json()
      } catch (error) {
        commit({ docNotice: fileOpenNotice(500, null) })
        return false
      }      const notice = fileOpenNotice(status, body)
      if (notice !== '') {
        /* 重开面板时按名字重读失败（文件没了）：别一直停在「正在读取」。 */
        const stale = isFileDoc(state.doc) && state.doc.needsLoad === true && state.doc.fileName === file
        commit(stale ? { docNotice: notice, doc: null } : { docNotice: notice })
        return false
      }
      const kind = body !== null && typeof body.kind === 'string' ? body.kind : ''
      if (kind === 'md' && body.ok === true && typeof body.text === 'string') {
        /* md 仍走原来那条链路（键、写穿规则都不变）。 */
        const blocks = parseMarkdownDoc(body.text)
        runtime.docWhy = 'file-open'
        putDoc({
          id: 'main', sid: sessionId,
          key: 'file:' + sessionTail(sessionId) + '/' + String(body.file || file),
          fileName: String(body.file || file), title: String(body.title || file),
          source: body.text, blocks, baseCount: blocks.length, local: false, appends: [],
        }, { docPick: '', docView: null, docNotice: '' })
        return true
      }
      runtime.docWhy = 'file-open'
      putDoc(fileDocOf(sessionId, { file, ...body }), { docPick: '', docView: null, docNotice: '' })
      return true
    }

    function freshDiskDocs(bucket, items, tail, now) {
      const out = []
      const mine = bucket === null || bucket === undefined ? {} : bucket
      if (Array.isArray(items) !== true) return out
      for (const item of items) {
        const file = String(item === null || item === undefined || item.file === undefined ? '' : item.file)
        if (file.endsWith('.md') !== true) continue
        /* 键必须**保留 .md**：readDocFile / 历史库里的文件键都是 `file:<尾巴>/<名>.md`，
           0.112.5 这里去掉了后缀，导致同一个文件在库里出现两条（列表标题和打开的文档对不上，2026-11-27）。 */
        const key = tail + file
        const shortKey = tail + file.replace(/\.md$/iu, '')
        if (mine[key] !== undefined) continue
        const replaces = mine[shortKey] !== undefined ? shortKey : ''
        out.push({
          key,
          file,
          replaces,
          title: typeof item.title === 'string' && item.title !== '' ? item.title : file,
          at: Number(item.mtime) || Number(now) || 0,
        })
      }
      return out
    }

    /**
     * 纯函数：清掉 0.112.5 造成的重复条目（同一个文件既有 `x.md` 又有 `x` 两种键）。
     * 保留带 .md 的那条（与磁盘、readDocFile 一致）。返回 { bucket, removed }。 */
    function healDiskKeys(bucket, items, tail) {
      const out = { bucket: { ...(bucket === null || bucket === undefined ? {} : bucket) }, removed: 0 }
      if (Array.isArray(items) !== true) return out
      for (const item of items) {
        const file = String(item === null || item === undefined || item.file === undefined ? '' : item.file)
        if (file.endsWith('.md') !== true) continue
        const shortKey = tail + file.replace(/\.md$/iu, '')
        const fullKey = tail + file
        if (out.bucket[shortKey] !== undefined && out.bucket[fullKey] !== undefined) {
          delete out.bucket[shortKey]
          out.removed += 1
        }
      }
      return out
    }

    /**
     * 启动后第一次同步：直接把面板切到磁盘上最新的那份（除非用户正在本地编辑）。
     * 为什么需要：库里通常已经「全都有」，于是 fresh 为空、不会切；而聊天块那条路又被
     * 历史块挡掉了 —— 结果启动后停在几小时前的旧文档（2026-11-27）。 */
    async function switchToNewestOnDisk(sessionId) {
      const current = state.doc
      if (current !== null && current !== undefined && current.local === true) return
      const one = await readDocFile(sessionId)
      if (one === null || one === undefined) return
      if (current !== null && current !== undefined && current.key === one.key
        && current.source === one.source) return
      runtime.docWhy = 'disk-first'
      if (state.docPick !== '' || state.docView !== null) commit({ docPick: '', docView: null })
      putDoc(one)
    }

    async function syncDocsFromDisk(sessionId) {
      if (typeof sessionId !== 'string' || sessionId === '') return
      const now = Date.now()
      if (runtime.diskSyncAt[sessionId] !== undefined && now - runtime.diskSyncAt[sessionId] < 4000) return
      runtime.diskSyncAt[sessionId] = now
      let listed = null
      try {
        listed = await fetch('/annotate-doc/list?sid=' + encodeURIComponent(sessionId)).then(response => response.json())
      } catch (error) {
        return
      }
      if (listed === null || listed.ok !== true || Array.isArray(listed.items) !== true) return
      const tail = 'file:' + sessionTail(sessionId) + '/'
      const healed = healDiskKeys(libOf(sessionId), listed.items, tail)
      if (healed.removed > 0) libCommit(sessionId, healed.bucket)
      const bucket = libOf(sessionId)
      const firstSync = runtime.diskKnown[sessionId] !== true
      runtime.diskKnown[sessionId] = true
      /* 0.113.4：已有条目的正文可能和磁盘对不上（旧版本取错文件留下的）。
         按 UTF-8 字节数比对，对不上就重取一次；服务器现在会 404 而不是退回别的文件。 */
      const repaired = { ...bucket }
      const repairedKeys = new Set()
      let repairCount = 0
      for (const item of (Array.isArray(listed.items) ? listed.items : [])) {
        const file = String(item === null || item === undefined || item.file === undefined ? '' : item.file)
        if (file.endsWith('.md') !== true) continue
        const key = tail + file
        const entry = repaired[key]
        if (entry === undefined || entry === null) continue
        if (needsTextRefresh(entry.text, item.bytes) !== true) continue
        try {
          const got = await fetch('/annotate-doc/latest?sid=' + encodeURIComponent(sessionId) + '&file=' + encodeURIComponent(file)).then(response => response.json())
          if (got !== null && got.ok === true && typeof got.text === 'string' && got.text !== '') {
            repaired[key] = { ...entry, text: got.text, at: Number(item.mtime) || entry.at, title: String(got.title || entry.title) }
            repairedKeys.add(key)
            repairCount += 1
          }
        } catch (error) { /* 下一轮再试 */ }
      }
      if (repairCount > 0) {
        libCommit(sessionId, repaired)
        logLine('文档修复 [' + sessionTail(sessionId) + '] 重取正文 ' + String(repairCount) + ' 份（字节数和磁盘对不上）')
        /* 关键：当前文档如果就是被修的那份，要按修好的正文重建。
           否则 state.doc 里还留着错的 blocks —— 键已经是新文档、正文还是旧的，
           面板画的正是 doc.blocks，于是「标题和内容对不上」（2026-11-27 现场）。 */
        const cur = state.doc
        const curKey = cur !== null && cur !== undefined && typeof cur.key === 'string' ? cur.key : ''
        if (curKey !== '' && repairedKeys.has(curKey) && cur.local !== true) {
          const fixed = repaired[curKey]
          if (fixed !== undefined && typeof fixed.text === 'string') {
            const freshBlocks = parseMarkdownDoc(fixed.text)
            runtime.docWhy = 'repair'
            putDoc({
              ...cur,
              blocks: freshBlocks,
              baseCount: freshBlocks.length,
              source: fixed.text,
              title: fixed.title || cur.title,
              fileName: cur.fileName,
            })
          }
        }
      }
      if (firstSync === true) {
        try { await switchToNewestOnDisk(sessionId) } catch (error) { /* 下一轮再试 */ }
      }
      const fresh = freshDiskDocs(bucket, listed.items, tail, now)
      if (fresh.length === 0) return
      const nextBucket = { ...bucket }
      const loaded = []
      for (const one of fresh) {
        let text = ''
        try {
          const got = await fetch('/annotate-doc/latest?sid=' + encodeURIComponent(sessionId) + '&file=' + encodeURIComponent(one.file)).then(response => response.json())
          if (got !== null && got.ok === true && typeof got.text === 'string') text = got.text
        } catch (error) {
          text = ''
        }
        if (text === '') continue
        if (typeof one.replaces === 'string' && one.replaces !== '') delete nextBucket[one.replaces]
        nextBucket[one.key] = { title: one.title, text, at: one.at, sid: sessionId, trusted: true }
        loaded.push({ ...one, text })
      }
      if (loaded.length === 0) return
      libCommit(sessionId, nextBucket)
      /* 首次同步也切到最新那份：以前首次只登记不切，于是启动时采纳到旧文档后永不改动，
         列表里「最新」是新的、正文还是旧的（2026-11-27 用户报的"文件名和文档没对上"）。 */
      const newest = loaded.slice().sort((a, b) => b.at - a.at)[0]
      const current = state.doc
      if (current !== null && current !== undefined && current.local === true) return
      const blocks = parseMarkdownDoc(newest.text)
      runtime.docWhy = 'disk-new'
      /* 新文件来了就退出历史版，否则正文被 docPick 锁着不换。 */
      if (state.docPick !== '' || state.docView !== null) commit({ docPick: '', docView: null })
      putDoc({
        id: 'main',
        sid: sessionId,
        key: newest.key,
        fileName: newest.file,
        title: newest.title,
        source: newest.text,
        blocks,
        baseCount: blocks.length,
        local: false,
        appends: [],
      })
    }

    /**
     * 清掉本地文档库里「指向的文件已经不在磁盘上」的条目。
     * 背景：文档副本删掉后，localStorage 里的库条目还在，面板会继续显示它（2026-11-27）。
     * 每个会话每次启动只跑一次。 */
    /** 往 ~/.dsh/annotate-client-debug.log 写一行（诊断用，失败静默）。 */
    function logLine(text) {
      try {
        fetch('/annotate-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ at: new Date().toISOString(), text }),
        }).catch(() => {})
      } catch (error) { /* 忽略 */ }
    }

    async function purgeMissingDocs(sessionId, force) {
      if (typeof sessionId !== 'string' || sessionId === '') return
      if (force !== true && runtime.docPurged[sessionId] === true) return
      runtime.docPurged[sessionId] = true
      let items = []
      try {
        const res = await fetch('/annotate-doc/list?sid=' + encodeURIComponent(sessionId)).then(r => r.json())
        if (res !== null && res.ok === true && Array.isArray(res.items)) items = res.items
      } catch (error) {
        return
      }
      const tail = 'file:' + sessionTail(sessionId) + '/'
      const present = new Set(items.map(it => String(it.file === undefined ? '' : it.file).replace(/\.md$/iu, '')))
      /* 只动本会话自己的桶：别的会话的条目在结构上就不在这里。 */
      const lib = libOf(sessionId)
      const next = {}
      let changed = false
      for (const [key, entry] of Object.entries(lib)) {
        if (String(key).indexOf(tail) === 0) {
          const name = String(key).slice(tail.length).replace(/\.md$/iu, '')
          if (present.has(name) !== true) { changed = true; continue }
        }
        next[key] = entry
      }
      if (changed) libCommit(sessionId, next, undefined, true)
      try {
        fetch('/annotate-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ at: new Date().toISOString(), text: '文档清理 [' + sessionTail(sessionId) + '] 磁盘 ' + String(present.size) + ' 份，库清理 ' + (changed ? '有' : '无') }),
        }).catch(() => {})
      } catch (error) { /* 忽略 */ }
      const cur = state.doc
      /* 0.115：非 md 文件不在 /annotate-doc/list 里，别把它当「磁盘上没了」放下。 */
      if (cur !== null && cur !== undefined && isFileDoc(cur) !== true && typeof cur.key === 'string' && cur.key.indexOf(tail) === 0) {
        const name = String(cur.key).slice(tail.length).replace(/\.md$/iu, '')
        if (present.has(name) !== true) commit({ doc: null, docPick: '', docView: null })
      }
    }

    /** 文件被工具改过就重读：每 3 秒看一次 mtime，比上次新才拉正文。 */
    let docFileMtime = 0
    let docFileCheckedAt = 0
    async function refreshDocFile(sessionId) {
      if (typeof sessionId !== 'string' || sessionId === '') return
      const now = Date.now()
      if (now - docFileCheckedAt < 3000) return
      docFileCheckedAt = now
      /* 0.115：非 md 文件不走 /annotate-doc/latest（那条只认 .md，会一直 404）。 */
      if (isFileDoc(state.doc)) return
      try {
        /* 已经知道是哪份文件就带上 `?file=`：否则宿主的「最新一份」可能把面板拽到别的文档上。 */
        const knownFile = state.doc !== null && state.doc !== undefined && typeof state.doc.fileName === 'string'
          ? state.doc.fileName
          : ''
        /* 当前这份还没对上文件（典型是刚在聊天里采纳）：先让 scheduleDocFile 把它写下去，
           别让「最新一份」把它顶成别的文档（会看起来像面板自己跳）。 */
        if (knownFile === '' && state.doc !== null && state.doc !== undefined) return
        const url = '/annotate-doc/latest?sid=' + encodeURIComponent(sessionId)
          + (knownFile === '' ? '' : '&file=' + encodeURIComponent(knownFile))
        const one = await fetch(url).then(response => response.json())
        if (one === null || one.ok !== true || typeof one.text !== 'string') return
        const current = state.doc
        const mtime = typeof one.mtime === 'number' ? one.mtime : 0
        const seen = mtime <= docFileMtime
        if (mtime > 0) docFileMtime = Math.max(docFileMtime, mtime)
        /* 宽限只挡「没有新写盘」的旧内容，不挡真正的更新。 */
        if (seen && Date.now() - docChatTouchedAt < 4000) return
        if (shouldReloadFile(one, current, state.docEditing) !== true) return
        const prevKey = current === null || current === undefined ? '' : String(current.key === undefined ? '' : current.key)
        /* 被文件顶掉的聊天块记进本会话的 adopted：否则下一拍又被聊天采纳，来回抢。 */
        if (prevKey !== '' && prevKey.indexOf('file:') !== 0) adoptedSetOf(sessionId).add(prevKey)
        docSwitchCount += 1
        const blocks = parseMarkdownDoc(one.text)
        /* 正在看历史版时，这次刷新要**同时退出历史版**，否则文件内容进不了面板
           （0.87 之前正是被持久化的 docPick 锁死的）。 */
        const leavePick = state.docPick !== '' || state.docView !== null
        putDoc({
          sid: sessionId,
          key: 'file:' + sessionTail(sessionId) + '/' + String(one.file === undefined ? '' : one.file),
          title: typeof one.title === 'string' ? one.title : '',
          fileName: String(one.file === undefined ? '' : one.file),
          fileMtime: mtime,
          source: one.text,
          blocks,
          baseCount: blocks.length,
          local: false,
          appends: [],
        }, leavePick ? { docPick: '', docView: null } : undefined)
      } catch (error) { /* 读不到就算了，下一拍再试 */ }
    }

    /* 本会话已经采纳过的聊天块。
       以前是**一个全局 Set + 一个 sid**：面板有两个实例（页签 + 嵌入窗）时，
       两边的 sessionId 不同 → 每边都把对边的记录清掉 → 聊天版本每拍重新采纳，
       把磁盘上的新内容顶回去（现象：doc_replace 改了文件，面板里还是旧标题），
       并且和文件刷新互相抢（现象：面板闪）。现在**按会话分开存**。 */
    const docAdoptedBySid = new Map()

    function adoptedSetOf(sessionId) {
      const key = typeof sessionId === 'string' && sessionId !== '' ? sessionId : ''
      let set = docAdoptedBySid.get(key)
      if (set === undefined) {
        set = new Set()
        /* 只留最近 8 个会话，防止无限增长。 */
        if (docAdoptedBySid.size > 8) docAdoptedBySid.clear()
        docAdoptedBySid.set(key, set)
      }
      return set
    }
    /* 流式生成判定：上一次扫到的正文 + 它连续稳定的拍数。 */
    let chatSeenText = ''
    let chatSeenTicks = 0
    /* 刚从聊天采纳/更新完的时间：这段时间内不理会「文件刷新」，等写盘的旧内容先落定。 */
    let docChatTouchedAt = 0
    /* 补两个被引用却从没定义的符号：以前 state.doc 为空时 tick 每拍在这里抛错，
       刷新根本走不到，「清理文档库」两个菜单项也会 ReferenceError。 */
    const docFileTried = new Set()
    /* 面板「换了一份文档」的次数：一直涨就说明还在切换循环里（调试用，静止时应停在个位数）。 */
    let docSwitchCount = 0

    /** 批注导出：一条一行，带原文、要求、状态和 AI 回复。 */
    function annotationsToMarkdown(list, title) {
      const rows = Array.isArray(list) ? list : []
      const head = '# 批注：' + (typeof title === 'string' && title !== '' ? title : '对话文档')
      const out = [head, '', '共 ' + String(rows.length) + ' 条 · 导出于 ' + new Date().toISOString().slice(0, 16).replace('T', ' '), '']
      rows.forEach((entry, index) => {
        if (entry === null || entry === undefined) return
        const where = entry.target === 'doc'
          ? '第 ' + String((typeof entry.blockIndex === 'number' ? entry.blockIndex : 0) + 1) + ' 段'
          : (typeof entry.path === 'string' ? entry.path : '聊天')
        out.push('## ' + String(index + 1) + '. ' + where + ' · ' + String(entry.status === undefined ? '' : entry.status))
        out.push('')
        out.push('> ' + String(entry.quote === undefined ? '' : entry.quote).replace(/\n/gu, ' '))
        out.push('')
        out.push('**批注**：' + String(entry.note === undefined ? '' : entry.note))
        if (typeof entry.reply === 'string' && entry.reply.trim() !== '') {
          out.push('')
          out.push('**回复**：' + entry.reply.trim())
        }
        out.push('')
      })
      return out.join('\n')
    }

    /** CSV：字段里含逗号/引号/换行时按 RFC4180 转义。 */
    function annotationsToCsv(list) {
      const rows = Array.isArray(list) ? list : []
      const cell = (value) => {
        const text = String(value === undefined || value === null ? '' : value)
        return '"' + text.replace(/"/gu, '""') + '"'
      }
      const out = [['序号', '位置', '状态', '原文', '批注', '回复'].map(cell).join(',')]
      rows.forEach((entry, index) => {
        if (entry === null || entry === undefined) return
        const where = entry.target === 'doc'
          ? '第' + String((typeof entry.blockIndex === 'number' ? entry.blockIndex : 0) + 1) + '段'
          : (typeof entry.path === 'string' ? entry.path : '聊天')
        out.push([index + 1, where, entry.status, entry.quote, entry.note, entry.reply].map(cell).join(','))
      })
      return out.join('\r\n')
    }

    /** 批注状态 → 导出里给人看的中文。 */
    const STATUS_LABEL = { queued: '待发送', sent: '已发送', answered: '已回复', resolved: '已解决' }

    /** 这条批注是不是挂在这份文件的单元格上（先认 ref.fileKey，旧条目认 docKey）。 */
    function isCellAnnotationOf(entry, docKey) {
      if (entry === null || entry === undefined || entry.target !== 'doc') return false
      const loc = entry.locator
      if (loc === null || loc === undefined || loc.kind !== 'cell') return false
      const key = entry.ref !== null && entry.ref !== undefined && typeof entry.ref.fileKey === 'string' && entry.ref.fileKey !== ''
        ? entry.ref.fileKey
        : (typeof entry.docKey === 'string' ? entry.docKey : '')
      return key !== '' && key === docKey
    }

    /**
     * 0.116 · 表格批注导出（批注.csv）：列 `文件,工作表,单元格,值,批注,状态,回复`；
     * 按工作表顺序 → 行 → 列 → 创建时间排序；UTF-8 带 BOM（Excel 直接双击不乱码）、CRLF、RFC 4180 转义。
     * 「值」取文件里现在的值（读不到就用批注当时的引文）。
     */
    function cellAnnotationsToCsv(list, doc) {
      const key = doc !== null && doc !== undefined && typeof doc.key === 'string' ? doc.key : ''
      const name = doc !== null && doc !== undefined && typeof doc.fileName === 'string' ? doc.fileName : ''
      const model = doc !== null && doc !== undefined ? doc.model : null
      const sheets = model !== null && model !== undefined && Array.isArray(model.sheets)
        ? model.sheets
        : [{ name: '', rows: model !== null && model !== undefined && Array.isArray(model.rows) ? model.rows : [] }]
      const order = new Map(sheets.map((sheet, index) => [String(sheet.name), index]))
      const rowsOf = sheetName => {
        const hit = sheets.find(sheet => String(sheet.name) === sheetName)
        return hit === undefined ? [] : hit.rows
      }
      const cell = (value) => {
        const text = String(value === undefined || value === null ? '' : value)
        return /[",\r\n]/u.test(text) || /^\s|\s$/u.test(text) ? '"' + text.replace(/"/gu, '""') + '"' : text
      }
      const picked = (Array.isArray(list) ? list : []).filter(entry => isCellAnnotationOf(entry, key))
      picked.sort((a, b) => {
        const sa = order.has(a.locator.sheet) ? order.get(a.locator.sheet) : 9999
        const sb = order.has(b.locator.sheet) ? order.get(b.locator.sheet) : 9999
        if (sa !== sb) return sa - sb
        if (a.locator.row !== b.locator.row) return a.locator.row - b.locator.row
        if (a.locator.col !== b.locator.col) return a.locator.col - b.locator.col
        return String(a.createdAt).localeCompare(String(b.createdAt))
      })
      const out = [['文件', '工作表', '单元格', '值', '批注', '状态', '回复'].join(',')]
      for (const entry of picked) {
        const loc = entry.locator
        const sheetName = typeof loc.sheet === 'string' ? loc.sheet : ''
        const rows = rowsOf(sheetName)
        const now = Array.isArray(rows) && Array.isArray(rows[loc.row]) && rows[loc.row][loc.col] !== undefined
          ? String(rows[loc.row][loc.col])
          : String(entry.quote === undefined ? '' : entry.quote)
        const thread = Array.isArray(entry.thread) ? entry.thread : []
        const lastAi = thread.filter(item => item !== null && item !== undefined && item.who === 'ai').slice(-1)[0]
        const reply = typeof entry.reply === 'string' && entry.reply !== '' ? entry.reply : (lastAi === undefined ? '' : lastAi.text)
        out.push([name, sheetName, cellLabel(loc.row, loc.col), now, entry.note,
          STATUS_LABEL[entry.status] || String(entry.status || ''), reply].map(cell).join(','))
      }
      return '﻿' + out.join('\r\n') + '\r\n'
    }

    /** 导出文件名：`<原名去扩展> · 批注.csv`。 */
    function cellExportName(fileName) {
      const base = String(fileName === undefined || fileName === null ? '' : fileName).replace(/\.[^./\\]+$/u, '')
      return (base === '' ? '表格' : base) + ' · 批注.csv'
    }

    /** 文档「看过了」的标记：内容戳（编辑时间 + 块数）变了才算新内容。 */
    function docStampOf(doc) {
      if (doc === null || doc === undefined) return ''
      const at = typeof doc.editedAt === 'number' ? doc.editedAt : 0
      const count = Array.isArray(doc.blocks) ? doc.blocks.length : 0
      return String(at) + '|' + String(count)
    }

    /** 调试开关：本机 localStorage 里 `dsh-annotate/debug` = `1` 时才显示诊断数字。 */
    function debugTraceOn() {
      try {
        return window.localStorage.getItem('dsh-annotate/debug') === '1'
      } catch (error) {
        return false
      }
    }
    /** 当前文档的块（批注面板判断「原文还在不在」用同一份）。 */
    function docBlocksNow() {
      const doc = state.doc
      if (isFileDoc(doc)) return fileDocBlocks(doc)
      if (doc === null || doc === undefined || Array.isArray(doc.blocks) !== true) return []
      return doc.blocks
    }

    /** 整篇里是否还能找到这句原文（逐字，找不到再用模糊匹配兜一次）。 */
    function quoteInDocBlocks(blocks, quote) {
      const needle = String(quote === undefined || quote === null ? '' : quote).trim()
      if (needle === '') return false
      const list = Array.isArray(blocks) ? blocks : []
      for (const block of list) {
        const text = block === null || block === undefined ? '' : block.text
        if (typeof text !== 'string' || text === '') continue
        if (text.indexOf(needle) >= 0) return true
        if (fuzzyQuoteInBlock(text, needle) !== null) return true
      }
      return false
    }

    /**
     * 给「改过几个字」的引文找区间：先逐字找，找不到就取引文与正文的**最长公共子串**当锚点，
     * 再把区间按引文长度展开。这样区间一定落在被改的那句上，不会把整段涂掉。
     * 返回 null 表示完全没有共同片段（真失效）。
     */
    function anchorSpanFor(text, quote) {
      const body = String(text === undefined || text === null ? '' : text)
      const needle = String(quote === undefined || quote === null ? '' : quote).trim()
      if (body === '' || needle === '') return null
      const at = body.indexOf(needle)
      if (at >= 0) return { from: at, to: at + needle.length, exact: true }
      /* 最长公共子串（引文里连续出现在正文中的那一段）：记录它在引文里的位置和正文里的位置。 */
      let bestLen = 0
      let bestInQuote = -1
      let bestInBody = -1
      for (let start = 0; start < needle.length; start += 1) {
        for (let length = needle.length - start; length > bestLen; length -= 1) {
          const piece = needle.slice(start, start + length)
          const hit = body.indexOf(piece)
          if (hit < 0) continue
          bestLen = length
          bestInQuote = start
          bestInBody = hit
          break
        }
      }
      if (bestLen < 2) return null
      /* 把区间从公共片段左右各补到引文长度：左边补回 bestInQuote 个字，右边补足剩下的。 */
      let from = bestInBody - bestInQuote
      if (from < 0) from = 0
      const to = Math.min(body.length, from + needle.length)
      return { from, to, exact: false }
    }

    /**
     * 「结论回写」的计划：把批注的回答写回文档。
     *   mode = 'replace'：用回答替换被批注的那句（改稿）
     *   mode = 'append' ：把那句所在段之后插入回答（补一段）
     * 纯函数，方便离线断言。返回 null 表示找不到那句原文。
     */
    function planWriteBack(source, quote, reply, mode, blockKind) {
      const text = String(source === undefined || source === null ? '' : source)
      const body = String(reply === undefined || reply === null ? '' : reply).trim()
      const needle = String(quote === undefined || quote === null ? '' : quote).trim()
      if (text === '' || body === '' || needle === '') return null
      /* 代码块 / 图卡 / 表格里不能写：往里插 `\n\n` 会把围栏或表格拆坏（子代理实测：
         代码块里插入后变成 ```js…R…``` 两个围栏）。 */
      if (blockKind === 'code' || blockKind === 'svg' || blockKind === 'table') return null
      /* 引文在全文出现多次时**拒绝**：光靠 quote 会改到第一处（子代理反例：
         `# 方案` 里有两句「默认用 J8」，标后一句却改了前一句）。 */
      const first = text.indexOf(needle)
      let anchor = null
      if (first >= 0) {
        if (text.indexOf(needle, first + 1) >= 0) return null
        anchor = { from: first, to: first + needle.length }
      } else {
        anchor = anchorSpanFor(text, needle)
        /* 模糊锚点要求至少重合一半，否则宁可拒绝也不乱改。 */
        if (anchor === null || (anchor.to - anchor.from) < Math.max(4, Math.ceil(needle.length / 2))) return null
        if (text.indexOf(text.slice(anchor.from, anchor.to), anchor.to) >= 0) return null
      }
      if (mode === 'append') {
        let end = text.indexOf('\n\n', anchor.to)
        if (end < 0) end = text.length
        return { text: text.slice(0, end) + '\n\n' + body + text.slice(end), from: anchor.from, to: anchor.to }
      }
      /* 替换时把**紧跟在引文后面的标点**一起吃掉：
         批注引文通常不带句号，只换到「：」就把「。」留在原地
         （2026-11-26 实测：回答以「：」结尾，拼出来是「：。」）。
         回答以**任何**标点结尾都算（冒号也一样）：否则「…重新定位：」+ 原句号
         又变成「：。」——这正是 0.102 没盖住的那种。 */
      let endAt = anchor.to
      const tail = text.slice(endAt, endAt + 1)
      const puncts = '。．.，,；;：:！!？?、'
      if (puncts.indexOf(tail) >= 0 && puncts.indexOf(body.slice(-1)) >= 0) endAt += 1
      return { text: text.slice(0, anchor.from) + body + text.slice(endAt), from: anchor.from, to: endAt }
    }

    /**
     * 把回答收拾成引用块：每行前面加 `> `，空行变成 `>`。
     * 追加进文档时用它，好处是「这是批注结论」和正文一眼可分，也不破坏原有段落结构。
     */
    function asBlockquote(reply) {
      const lines = String(reply === undefined || reply === null ? '' : reply).trim().split(/\r?\n/u)
      return lines.map(line => (line.trim() === '' ? '>' : '> ' + line)).join('\n')
    }

    /** 按标题后缀给个类型图标；认不出就当普通文档。 */
    function typeIconOf(title) {
      const text = String(title === undefined || title === null ? '' : title)
      if (/\.(xlsx|xls|csv)$/iu.test(text)) return '\u25A6'
      if (/\.(pptx|ppt)$/iu.test(text)) return '\u25EB'
      if (/\.(docx|doc)$/iu.test(text)) return '\u25A4'
      return '\u25A4'
    }

    /** 存一段文本到本地文件（导出用；和下载 PNG 同一套 Blob + a.click）。 */
    function downloadText(name, text, mime) {
      try {
        const blob = new Blob([text], { type: mime + ';charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        setTimeout(() => URL.revokeObjectURL(url), 2000)
        return true
      } catch (error) {
        return false
      }
    }

    /* ---------------------------------------------------------------- 文档「谁说了算」判据 */
    /*
     * 三条路径都会想改 state.doc：聊天扫描（每 300ms）、文件刷新（每 3s）、本地编辑。
     * 以前刷新的闸门比较的是两套永不相等的东西——聊天块给 `blk12#0`，文件给 `file:…/x.md`
     * ——于是每 3 秒无条件切一枪，切完又写盘刷新 mtime，聊天侧再切回来：面板就来回跳。
     * 现在把判据抽成纯函数（离线可测），规则见下。
     */
    function shouldTakeFile(file, current, pick) {
      if (file === null || file === undefined || file.ok !== true) return false
      if (typeof file.text !== 'string' || file.text === '') return false
      if (pick !== '' && pick !== undefined) return false            /* 正在看历史版，别抢 */
      if (current === null || current === undefined) return true     /* 面板还空着：可以认领 */
      if (current.local === true) return false                       /* 手改过：等用户点「载入最新版」 */
      if (current.source === file.text) return false                 /* 内容一样：不产生切换 */
      if (typeof current.fileName === 'string' && current.fileName !== '') {
        return current.fileName === file.file                        /* 只认同一个文件的更新 */
      }
      return file.title === current.title                            /* 首次认领必须同名文档 */
    }

    /**
     * 这次扫到的聊天文档该怎么处理：
     *   'wait'   —— 正文还在变（流式生成中），先别动，否则每个 tick 换一次 = 面板闪
     *   'update' —— 同一块的内容变长/定稿：就地更新，别新建
     *   'adopt'  —— 新块：认领
     *   'skip'   —— 不该动（看历史版 / 手改过 / 已采纳过）
     */
    function chatDocAction(scanText, lastText, stableTicks, chatKey, adopted, current, pick, historical) {
      if (typeof scanText !== 'string' || scanText === '') return 'skip'
      if (scanText !== lastText) return 'wait'                      /* 内容还在变 */
      if (stableTicks < 1) return 'wait'                            /* 至少要连两拍一样 */
      if (pick !== '' && pick !== undefined) return 'skip'
      if (current !== null && current !== undefined && current.local === true) return 'skip'
      /* 启动那一刻聊天里已经存在的块是**历史**：它们不是「刚生成的那份」，
         拿它们当当前文档就会把面板钉在几小时前的旧文档上（2026-11-27 用户报的"右边没变化"）。
         只有页面加载之后新出现的块才允许被采纳。 */
      if (historical === true) return 'skip'
      const sameKey = current !== null && current !== undefined
        && String(current.key === undefined ? '' : current.key) === String(chatKey === undefined ? '' : chatKey)
      if (sameKey) return current.source === scanText ? 'skip' : 'update'
      return adopted.has(chatKey) !== true ? 'adopt' : 'skip'
    }
    /**
     * 磁盘上的文件和面板里这份不一样（且本地没在编辑）就该重读。
     * 与「正在看历史版」无关——历史版是快照视图，不该挡住文件更新；
     * 也不看 title/fileName（重启后这两个字段可能没有），只看内容。
     */
    /**
     * 要不要把这份文档写回磁盘。
     * 规则：**只有本地改过（local）或还没有对应文件时才写**。
     * 从聊天采纳、从文件读回来的内容一律不写——它们是「别人写的」，写回去会把外部改动顶掉。
     */
    function shouldWriteDoc(doc) {
      if (doc === null || doc === undefined) return false
      if (typeof doc.source !== 'string' || doc.source === '') return false
      if (typeof doc.sid !== 'string' || doc.sid === '') return false
      if (doc.local === true) return true
      /* 白名单：只有「本会话聊天里真的扫到的那份」才允许落盘（origin 由聊天采纳时打上）。
         从文档库 / 磁盘采纳来的一律不写 —— 那正是副本自己繁殖、并且写到别人目录的来源
         （2026-11-27，Claude 审计指出 shouldWriteDoc 用排除法默认 true）。 */
      if (doc.origin === 'chat') return true
      return false
      /* 下面这段保留成注释，说明旧的排除法为什么错：
         fileKnown === true → false；file: 键 → false；其余 → true（默认放行）。 */
      /* 键是 file:<尾巴>/<名> 就说明这份是从某个会话目录的文件读出来的，一律不回写。
         以前只看 fileName，而「从文档库采纳」的这条路径不带 fileName，
         于是每次启动都把自己再写一遍，在目录里反复长副本（2026-11-27）。 */
      if (typeof doc.key === 'string' && doc.key.indexOf('file:') === 0) return false
      return true
    }
    function shouldReloadFile(file, current, docEditing) {
      if (file === null || file === undefined || file.ok !== true) return false
      if (typeof file.text !== 'string' || file.text === '') return false
      if (docEditing === true) return false
      if (current === null || current === undefined) return true
      if (current.local === true) return false
      return current.source !== file.text
    }

    function shouldAdopt(chatKey, adopted, current, pick) {
      if (chatKey === '' || chatKey === undefined) return false
      if (pick !== '' && pick !== undefined) return false
      if (current !== null && current !== undefined && current.local === true) return false
      return adopted.has(chatKey) !== true                           /* 同一个块只采纳一次 */
    }
    /** 面板空着时从磁盘认领本会话最新一份；认领不到就算了（别写空文档）。 */
    async function restoreDocFromFile(sessionId) {
      if (typeof sessionId !== 'string' || sessionId === '') return false
      const one = await readDocFile(sessionId)
      if (one === null || one === undefined) return false
      const current = state.doc
      if (current !== null && current !== undefined && current.local === true) return false
      if (current !== null && current !== undefined && typeof current.source === 'string'
        && current.source !== '' && shouldTakeFile({ ok: true, file: one.key, title: one.title, text: one.source }, current, state.docPick) !== true) {
        return false
      }
      runtime.docWhy = 'file-restore'
      putDoc(one)
      return true
    }
    /** 写一个会话的批注列表（立刻落盘）。 */
    function putItems(sessionId, list) {
      commit({ sessions: { ...state.sessions, [sessionId]: list } }, true)
    }

    function itemsOf(sessionId) {
      if (typeof sessionId !== 'string' || sessionId === '') return []
      const list = state.sessions[sessionId]
      return Array.isArray(list) ? list : []
    }

    function makeId() {
      return 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
    }

    function resolveTarget(input) {
      if (input === null || typeof input !== 'object') return { target: 'chat' }
      if (input.target === 'doc') {
        return {
          target: 'doc',
          path: typeof input.path === 'string' ? input.path : '对话文档',
          blockIndex: typeof input.blockIndex === 'number' ? input.blockIndex : 0,
          startChar: typeof input.startChar === 'number' ? input.startChar : 0,
          endChar: typeof input.endChar === 'number' ? input.endChar : 0,
          /* 0.115：表格单元格 / 纯文本的位置；不给就在 addAnnotation 里按 md 段落补一份。 */
          locator: sanitizeLocator(input.locator),
        }
      }
      if (input.target !== 'file') return { target: 'chat' }
      const path = normalizePath(input.path)
      if (path === null) return { target: 'chat' }
      return {
        target: 'file',
        path,
        absPath: typeof input.absPath === 'string' ? input.absPath : '',
        lineStart: typeof input.lineStart === 'number' ? input.lineStart : null,
        lineEnd: typeof input.lineEnd === 'number' ? input.lineEnd : null,
        prefix: typeof input.prefix === 'string' ? input.prefix : '',
        suffix: typeof input.suffix === 'string' ? input.suffix : '',
        dirty: input.dirty === true,
      }
    }

    function decideKind(input, resolved) {
      /* 不再在前端猜“这是提问还是改动”：聊天是只读的只能问，其余交给模型判断。 */
      if (resolved.target === 'chat') return { kind: 'question', downgraded: true }
      return { kind: 'auto', downgraded: false }
    }

    function addAnnotation(sessionId, input) {
      const resolved = resolveTarget(input)
      /* 重划：把已有那条指到新的原文上，不再新建一条。 */
      if (resolved.target === 'file' && typeof state.reanchorId === 'string' && state.reanchorId !== '') {
        const targetId = state.reanchorId
        const list = itemsOf(sessionId)
        const existing = list.find(entry => entry.id === targetId)
        if (existing !== undefined) {
          const patched = {
            ...existing,
            path: resolved.path,
            quote: storeQuote(input.quote, 'file'),
            anchorState: 'ok',
            /* 锚点字段整体覆盖：新选区没有行号就删掉旧的，免得「新路径 + 旧行号」。 */
            absPath: resolved.absPath,
            lineStart: resolved.lineStart,
            lineEnd: resolved.lineEnd,
            prefix: resolved.prefix,
            suffix: resolved.suffix,
          }
          if (resolved.absPath === '') delete patched.absPath
          if (resolved.lineStart === null) delete patched.lineStart
          if (resolved.lineEnd === null) delete patched.lineEnd
          if (resolved.prefix === '') delete patched.prefix
          if (resolved.suffix === '') delete patched.suffix
          if (resolved.dirty === true) patched.dirty = true
          else delete patched.dirty
          /* 用户在重划时顺手写的话不能丢，追加到线程里。 */
          const note = String(input.note === undefined || input.note === null ? '' : input.note).trim()
          if (note !== '' && note !== existing.note) {
            const thread = Array.isArray(existing.thread) ? existing.thread.slice() : []
            thread.push({ who: 'me', text: note, at: new Date().toISOString() })
            patched.thread = thread
          }
          putItems(sessionId, list.map(entry => (entry.id === targetId ? patched : entry)))
          commit({ reanchorId: '', reanchorHint: '' })
          return { item: patched, downgraded: false, reanchored: true }
        }
      }
      const decided = decideKind(input, resolved)
      const item = {
        id: makeId(),
        target: resolved.target,
        kind: decided.kind,
        status: 'queued',
        anchorState: resolved.target === 'chat'
          ? 'n/a'
          : (resolved.target === 'doc' || resolved.lineStart !== null ? 'ok' : 'unset'),
        quote: storeQuote(input.quote, resolved.target),
        note: String(input.note),
        createdAt: new Date().toISOString(),
      }
      if (resolved.target === 'doc') {
        item.path = resolved.path
        item.blockIndex = resolved.blockIndex
        item.startChar = resolved.startChar
        item.endChar = resolved.endChar
        /* 批注挂在哪一份文档上：看历史版时写它的 key 和标题，正文里只在那份上着色，发出去的也是那份的名字。 */
        const pickKey = typeof state.docPick === 'string' ? state.docPick : ''
        const library = libOf(sessionId)
        if (pickKey !== '' && library[pickKey] !== undefined) {
          item.docKey = pickKey
          if (typeof library[pickKey].title === 'string' && library[pickKey].title !== '') {
            item.path = library[pickKey].title
          }
        } else if (state.doc !== null && typeof state.doc.key === 'string' && state.doc.key !== '') {
          item.docKey = state.doc.key
        }
        /* 0.115：新建批注一律写 ref + locator（与 docKey 并存一个版本）。 */
        item.ref = { sid: String(sessionId === undefined || sessionId === null ? '' : sessionId), fileKey: typeof item.docKey === 'string' ? item.docKey : '' }
        item.locator = resolved.locator !== null && resolved.locator !== undefined
          ? resolved.locator
          : { kind: 'md', blockIndex: resolved.blockIndex, startChar: resolved.startChar, endChar: resolved.endChar }
      }
      if (resolved.target === 'file') {
        item.path = resolved.path
        if (resolved.absPath !== '') item.absPath = resolved.absPath
        if (resolved.lineStart !== null) item.lineStart = resolved.lineStart
        if (resolved.lineEnd !== null) item.lineEnd = resolved.lineEnd
        if (resolved.prefix !== '') item.prefix = resolved.prefix
        if (resolved.suffix !== '') item.suffix = resolved.suffix
        if (resolved.dirty === true) item.dirty = true
      }
      if (decided.downgraded === true) item.downgraded = true
      item.thread = [{ who: 'me', text: String(input.note), at: item.createdAt }]
      putItems(sessionId, [...itemsOf(sessionId), item])
      return { item, downgraded: decided.downgraded }
    }

    function removeAnnotation(sessionId, id) {
      const list = itemsOf(sessionId)
      const index = list.findIndex(entry => entry.id === id)
      if (index < 0) return
      const removed = list[index]
      putItems(sessionId, list.filter(entry => entry.id !== id))
      commit({ undo: { sessionId, item: removed, index, at: Date.now() } })
    }

    function undoRemove() {
      const undo = state.undo
      if (undo === null) return
      const list = itemsOf(undo.sessionId).slice()
      const at = Math.min(undo.index, list.length)
      list.splice(at, 0, undo.item)
      putItems(undo.sessionId, list)
      commit({ undo: null })
    }

    function markStatus(sessionId, ids, status) {
      const target = new Set(ids)
      const next = itemsOf(sessionId).map(entry => (target.has(entry.id) ? { ...entry, status } : entry))
      putItems(sessionId, next)
    }

    /** 把一段话直接发到聊天（用于文档线程里的追问）。 */
    function sendChatText(text) {
      const actions = runtime.actions
      if (actions === null) return false
      try {
        const span = actions.captureInsertion()
        if (actions.insertText(text, span) !== true) actions.setDraft(text)
      } catch (error) {
        console.warn('[annotate] 追问写入输入框失败', error)
        return false
      }
      window.setTimeout(() => {
        try {
          actions.submit()
        } catch (error) {
          console.warn('[annotate] 追问发送失败', error)
        }
      }, 90)
      return true
    }

    /** 聊天流里的「正文段落」，按文档顺序；跳过思考块、工具行、状态脚注和文档围栏。 */
    function replyParagraphs(flow) {
      let nodes = []
      try {
        nodes = [...flow.querySelectorAll('p, li, h1, h2, h3, h4, pre')]
      } catch (error) {
        nodes = []
      }
      const out = []
      for (const node of nodes) {
        let noisy = false
        let element = node
        for (let depth = 0; depth < 6 && element !== null; depth += 1) {
          const cls = typeof element.className === 'string' ? element.className : ''
          if (/think|reason|status|usage|footer|meta|tool-call/i.test(cls)) {
            noisy = true
            break
          }
          element = element.parentElement
        }
        if (noisy) continue
        const text = node.textContent
        if (typeof text !== 'string' || text.trim() === '') continue
        const first = text.split('\n')[0].trim().toLowerCase()
        /* 文档围栏不是回复，别把整篇文档挂进线程卡。 */
        if (first === 'dsh-doc' || first === 'dsh-doc+') continue
        out.push({ node, text: text.trim() })
      }
      return out
    }

    /** 我发出去那条消息所在的最深元素：它之后的内容才算回复。 */
    function anchorOf(flow, tail) {
      if (tail === '') return null
      let all = []
      try {
        all = [...flow.querySelectorAll('*')]
      } catch (error) {
        return null
      }
      let found = null
      for (const element of all) {
        const text = element.textContent
        if (typeof text === 'string' && text.includes(tail)) found = element
      }
      return found
    }

    /** 某段文字属于哪种聊天节点（user / assistant-step / turn-tail / tool-call …）。 */
    function nodeKind(node) {
      if (node === null || node.closest === undefined) return ''
      const holder = node.closest('[data-chat-flow-kind]')
      if (holder === null) return ''
      return String(holder.getAttribute('data-chat-flow-kind') || '')
    }

    const USER_KINDS = ['user', 'steering', 'turn-trigger']

    /** 锚点之后、下一位用户消息之前，属于助理正文的段落。 */
    function paragraphsAfter(flow, anchor) {
      let boundary = null
      try {
        for (const holder of flow.querySelectorAll('[data-chat-flow-kind]')) {
          const kind = String(holder.getAttribute('data-chat-flow-kind') || '')
          if (USER_KINDS.indexOf(kind) < 0) continue
          if (anchor.contains(holder)) continue
          if ((anchor.compareDocumentPosition(holder) & 4) !== 4) continue
          boundary = holder
          break
        }
      } catch (error) {
        boundary = null
      }
      const strict = []
      const loose = []
      const blocked = ['turn-tail', 'tool-call', 'turn-process', 'command', 'manual-compaction',
        'model-retry', 'turn-error', 'turn-max-tokens', 'unknown-surface', 'compaction']
      for (const item of replyParagraphs(flow)) {
        if (anchor.contains(item.node)) continue
        if ((anchor.compareDocumentPosition(item.node) & 4) !== 4) continue
        if (boundary !== null && (boundary.compareDocumentPosition(item.node) & 4) === 4) break
        if (/(关于「[^」]*」的批注|@批注追问)/u.test(item.text)) break
        const kind = nodeKind(item.node)
        /* 只要助手正文：费用、耗时、工具、思考都是别的插件挂上来的节点。 */
        if (kind === 'assistant-step') {
          strict.push(item.text)
          continue
        }
        if (kind !== '' && blocked.indexOf(kind) >= 0) continue
        if (kind === '') loose.push(item.text)
      }
      return strict.length > 0 ? strict : loose
    }

    /** 把回报行洗成一句人话：去掉编号前缀和回执标记；只砍平台状态字样，不砍正文。 */
    function cleanReply(text) {
      let out = String(text)
      out = out.replace(/^\s*【[^】]{1,24}】\s*/u, '')
      out = out.replace(/^\s*已答\s*→?\s*/u, '').replace(/^\s*已改\s*[·:：]?\s*/u, '')
      const cut = /(运行中思考|深度求索中)/u.exec(out)
      if (cut !== null) out = out.slice(0, cut.index)
      /* 费用 / 耗时 / token 这类别的插件挂上来的脚注不是回复，整行丢掉。 */
      out = out.split('\n')
        .filter(line => !/(本论费用|费用\s*[≈:]|用时|已完成\s*[，,]?\s*用时|上下文|缓存|输入\s*\d|输出\s*\d|已按.{0,16}结算|单价为|每百万\s*Token|API\s*≈|Plan\s*≈|≈\s*[¥$])/u.test(line))
        .join('\n')
      out = out.replace(/[ \t]*(本论费用|已按.{0,16}结算|单价为|API\s*≈|Plan\s*≈)[^\n]*$/u, '')
      return out.replace(/[，,、\s]+$/u, '').replace(/[「」]+$/u, '').replace(/[ \t]+/gu, ' ').trim()
    }

    function markSent(sessionId, assignments, batchId, tail) {
      const slots = new Map(assignments.map(item => [item.id, item.slot]))
      const stamp = Date.now()
      const next = itemsOf(sessionId).map(entry => (
        slots.has(entry.id)
          /* sentTail 记在条目自己身上：队列会被裁掉，老批注要靠它才能配上回复。 */
          ? { ...entry, status: 'sent', sentAt: stamp, sentBatch: batchId, slot: slots.get(entry.id), sentTail: typeof tail === 'string' ? tail : (typeof entry.sentTail === 'string' ? entry.sentTail : '') }
          : entry
      ))
      putItems(sessionId, next)
    }

    /**
     * 临时回执桥：从聊天流里读回「【E1】已改 · …」这类回报行，把对应批注翻成 answered。
     * 正式的侧车（结构化回写）还没接，这条先让绿色能自动出现。
     */
    /**
     * 手动发送自愈：用户可能自己把批注那段话发出去（不是点「发送 N 条」），
     * 那样插件没机会标记已发送，条目会一直停在「待发送」。
     * 做法：把排队中的条目压成和发送时一行一样的文本，看聊天流里有没有；
     * 有就补记成已发送，并带上 sentTail，后面的回复照样能配对。
     * @param {string} sessionId 会话。
     * @param {Element} flow 聊天流根节点。
     * @returns {boolean} 有没有改动（改了要让调用方重新取一次列表）。
     */
    function adoptManuallySent(sessionId, flow) {
      let queued = []
      try {
        queued = itemsOf(sessionId).filter(entry => entry.status === 'queued')
      } catch (error) {
        return false
      }
      if (queued.length === 0) return false
      const text = typeof flow.textContent === 'string' ? flow.textContent : ''
      if (text === '') return false
      const adopt = []
      const next = itemsOf(sessionId).map((entry) => {
        if (entry.status !== 'queued') return entry
        const line = renderOneLine(entry)
        /* 必须整行命中（带「→」那种形状），只在别处出现过引文不算。 */
        if (line.indexOf('→') < 0 || text.indexOf(line) < 0) return entry
        const tail = line.slice(-24)
        const stamp = Date.now()
        adopt.push({ tail, entryId: entry.id, at: stamp })
        return { ...entry, status: 'sent', sentAt: stamp, sentBatch: '', slot: 0, sentTail: tail }
      })
      if (adopt.length === 0) return false
      putItems(sessionId, next)
      const tails = [
        ...(Array.isArray(state.sentTails) ? state.sentTails : []),
        ...adopt,
      ].slice(-replyTailLimit())
      commit({ sentTails: tails, sentTail: adopt[0].tail }, true)
      console.info('[annotate] 检测到手动发送的批注，已补记为已发送：' + String(adopt.length) + ' 条')
      return true
    }

    function reconcileReplies(sessionId) {
      const flow0 = document.querySelector('[data-chat-flow]')
      if (flow0 !== null) adoptManuallySent(sessionId, flow0)
      let sent = []
      try {
        sent = itemsOf(sessionId).filter(entry => entry.status === 'sent')
      } catch (error) {
        return
      }
      if (sent.length === 0) return
      const flow = flow0
      if (flow === null) return
      /* 每条发出去的请求各留一个锚点：多批、追问同时在路上也不会互相覆盖。 */
      const queue = Array.isArray(state.sentTails) ? state.sentTails : []
      /* 队列只留最近几条（默认 4），更老的批注靠「条目自己记的 sentTail」补上 ——
         否则重启/多批之后，老的那几条永远配不上回复、永远蓝。 */
      const slots = queue.slice()
      const known = new Set()
      slots.forEach((slot) => {
        if (slot !== null && typeof slot === 'object' && typeof slot.tail === 'string') known.add(slot.tail)
      })
      sent
        .slice()
        .sort((a, b) => Number(b.sentAt === undefined ? 0 : b.sentAt) - Number(a.sentAt === undefined ? 0 : a.sentAt))
        .slice(0, 4)
        .forEach((entry) => {
          const tail = typeof entry.sentTail === 'string' ? entry.sentTail : ''
          if (tail === '' || known.has(tail)) return
          known.add(tail)
          slots.push({
            tail,
            batch: '',
            at: Number(entry.sentAt === undefined ? 0 : entry.sentAt),
            entryId: entry.id,
          })
        })
      if (slots.length === 0) return

      let chosen = null
      for (let position = slots.length - 1; position >= 0 && chosen === null; position -= 1) {
        const slot = slots[position]
        if (slot === null || typeof slot !== 'object' || typeof slot.tail !== 'string' || slot.tail === '') continue
        /* 长尾在渲染里可能被折行/压空白的改动弄丢，退一级用最后 12 个字再找一次。 */
        let anchor = anchorOf(flow, slot.tail)
        if (anchor === null && slot.tail.length > 12) anchor = anchorOf(flow, slot.tail.slice(-12))
        if (anchor === null) continue
        const parts = paragraphsAfter(flow, anchor)
        if (parts.length === 0) continue

        const batchId = typeof slot.batch === 'string' ? slot.batch : ''
        let batch = batchId === ''
          ? sent.slice().sort((a, b) => Number(b.sentAt === undefined ? 0 : b.sentAt) - Number(a.sentAt === undefined ? 0 : a.sentAt)).slice(0, 1)
          : sent
            .filter(entry => String(entry.sentBatch === undefined ? '' : entry.sentBatch) === batchId)
            .sort((a, b) => Number(a.slot === undefined ? 0 : a.slot) - Number(b.slot === undefined ? 0 : b.slot))
        /* 这条锚点是从「条目自己记的 sentTail」来的：直接认那一条，别再按批次扩散。 */
        if (slot.entryId !== undefined && slot.entryId !== null) {
          batch = sent.filter(entry => entry.id === slot.entryId)
        }
        /* 旧数据自愈：0.33.1 之前 sentBatch 存的是时间戳，而这条锚点的 at 也是发送那一刻的时间戳，
           两者只差几毫秒 —— 按时间就近认回来，别让已经发出去的批注永远蓝着。 */
        if (batch.length === 0 && batchId !== '') {
          const at = Number(slot.at)
          if (Number.isFinite(at) && at > 0) {
            batch = sent.filter((entry) => {
              const stamp = Number(entry.sentBatch)
              return Number.isFinite(stamp) && stamp > 0 && Math.abs(stamp - at) <= 500
            })
          }
        }
        if (batch.length === 0) continue

        const pairs = []
        if (batch.length === 1) {
          pairs.push({ entry: batch[0], text: parts.join('\n\n') })
        } else if (parts.length === batch.length) {
          batch.forEach((entry, index) => pairs.push({ entry, text: parts[index] }))
        } else {
          /* 条数对不上就不猜，保持蓝色 */
          continue
        }
        /* 流式回复会一轮轮变长：同一批必须连续两轮读到一模一样的内容才收，避免把半句定成答案。 */
        const signature = pairs.map(pair => pair.entry.id + ':' + pair.text).join('|')
        const slotKey = (batchId === '' ? 'follow' : batchId) + '@' + String(pairs[0] === undefined ? '' : pairs[0].entry.id)
        if (runtime.replySeen[slotKey] !== signature) {
          runtime.replySeen[slotKey] = signature
          continue
        }
        chosen = { pairs, position, slotKey }
      }
      if (chosen === null) return

      const byId = new Map(chosen.pairs.map(pair => [pair.entry.id, pair.text]))
      const next = itemsOf(sessionId).map((entry) => {
        if (!byId.has(entry.id)) return entry
        const clean = cleanReply(byId.get(entry.id))
        if (clean === '') return entry
        const fresh = /新文[:：][ \t]*(.+)$/u.exec(clean)
        const thread = Array.isArray(entry.thread) ? entry.thread.slice() : []
        const last = thread[thread.length - 1]
        if (last === undefined || last.who !== 'ai' || last.text !== clean) {
          thread.push({ who: 'ai', text: clean, at: Date.now() })
        }
        const patch = { ...entry, status: 'answered', reply: clean, repliedAt: Date.now(), thread }
        /* 模型建议改原文时只记建议，绝不覆盖用来定位的引文。 */
        if (fresh !== null && fresh[1].trim().length >= 4) patch.suggested = fresh[1].trim()
        return patch
      })
      const changed = next.some((entry, index) => entry !== itemsOf(sessionId)[index])
      if (changed) putItems(sessionId, next)
      delete runtime.replySeen[chosen.slotKey]
      commit({ sentTails: queue.filter((entry, index) => index !== chosen.position) }, true)
    }

    function useStore() {
      const [, bump] = React.useState(0)
      React.useEffect(() => {
        let alive = true
        const listener = () => { if (alive) bump(value => value + 1) }
        subscribers.add(listener)
        return () => { alive = false; subscribers.delete(listener) }
      }, [])
      return state
    }

    /** 根作用域的侧栏拿不到 inputActions，由会话作用域的按钮把它挂过来。
     *  `target` 是文件选区的唯一接缝：谁采到「文件 + 行号 + 原文」谁就往这里写，
     *  AnnotateSurface 消费后立刻清空，绝不跨批次残留。 */
    const runtime = { actions: null, target: null, targetAt: 0, trace: '', ctx: null, replyScan: { refs: [], total: 0 }, replySeen: {}, lostCache: new Map(), autoOpen: {}, settingsForm: null, dockDispose: null, dockOn: null, docPurged: {}, diskSyncAt: {}, diskKnown: {}, chatBaseline: {}, settleLogged: {} }

    function freshTarget() {
      if (runtime.target === null) return null
      if (Date.now() - runtime.targetAt > TARGET_TTL) {
        runtime.target = null
        return null
      }
      return runtime.target
    }

    function clearTarget() {
      runtime.target = null
      runtime.targetAt = 0
    }

    /* --------------------------------------------------------------- 发送拼装 */

    function sortForPayload(list) {
      const questions = list
        .filter(entry => entry.kind === 'question')
        .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)))
      const edits = list
        .filter(entry => entry.kind !== 'question')
        .sort((a, b) => {
          const pathA = a.path === undefined ? '' : a.path
          const pathB = b.path === undefined ? '' : b.path
          if (pathA !== pathB) return pathA < pathB ? -1 : 1
          const lineA = typeof a.lineStart === 'number' ? a.lineStart : 0
          const lineB = typeof b.lineStart === 'number' ? b.lineStart : 0
          if (lineA !== lineB) return lineA - lineB
          return String(a.createdAt).localeCompare(String(b.createdAt))
        })
      return { questions, edits }
    }

    function sizeOf(entry) {
      return clipQuote(entry.quote, QUOTE_IN_MSG_MAX).length + clipQuote(entry.note, NOTE_MAX).length + 60
    }

    function planBatches(list) {
      const { questions, edits } = sortForPayload(list)
      const batches = []
      let current = { questions: [], edits: [], chars: 0 }
      const flush = () => {
        if (current.questions.length + current.edits.length === 0) return
        batches.push(current)
        current = { questions: [], edits: [], chars: 0 }
      }
      const full = () => current.questions.length + current.edits.length >= MAX_ITEMS_PER_BATCH
      /* 问题先装箱：模型要"先答后改"，问题不该被改动的条目挤到第二批。 */
      for (const entry of questions) {
        const size = sizeOf(entry)
        if (full() || (current.chars + size > MAX_CHARS_PER_BATCH && current.chars > 0)) flush()
        current.questions.push(entry)
        current.chars += size
      }
      for (const entry of edits) {
        const size = sizeOf(entry)
        if (full() || current.chars + size > MAX_CHARS_PER_BATCH) flush()
        current.edits.push(entry)
        current.chars += size
      }
      flush()
      return batches
    }

    function renderQuote(raw) {
      const flat = String(raw === undefined || raw === null ? '' : raw)
        .replace(/\r\n?/gu, '\n')
        .replace(/\s*\n\s*/gu, '⏎')
        .trim()
      const text = flat.length > QUOTE_IN_MSG_MAX ? flat.slice(0, QUOTE_IN_MSG_MAX - 1) + '…' : flat
      return '「' + text + '」'
    }

    /** 一条批注压成一行：位置 + 原文 + 要求（不带编号，像人说话）。 */
    function renderOneLine(entry) {
      /* 0.115：表格单元格写成「文件名 · B3」，纯文本写成「文件名:行号」；md 段落仍是「第N段」。 */
      const loc = entry !== null && entry !== undefined && entry.target === 'doc' && entry.locator !== null
        && entry.locator !== undefined && typeof entry.locator === 'object' ? entry.locator : null
      if (loc !== null && (loc.kind === 'cell' || loc.kind === 'text')) {
        const name = typeof entry.path === 'string' && entry.path !== '' ? entry.path : '文件'
        const at = loc.kind === 'cell'
          ? name + ' · ' + (typeof loc.sheet === 'string' && loc.sheet !== '' ? loc.sheet + '!' : '') + cellLabel(loc.row, loc.col)
          : name + ':' + String(typeof loc.line === 'number' ? loc.line : 1)
        return `${at} ${renderQuote(entry.quote)} → ${clipQuote(entry.note, NOTE_MAX)}`
      }
      const where = entry.target === 'doc'
        ? `第${String((typeof entry.blockIndex === 'number' ? entry.blockIndex : 0) + 1)}段 `
        : (typeof entry.path === 'string'
          ? entry.path + (typeof entry.lineStart === 'number' ? ':' + String(entry.lineStart) : '') + ' '
          : '')
      return `${where}${renderQuote(entry.quote)} → ${clipQuote(entry.note, NOTE_MAX)}`
    }

    function buildPayload(batch, index, total) {
      const assignments = []
      const lines = []
      let counter = 0
      const all = [...batch.questions, ...batch.edits]
      for (const entry of all) {
        lines.push(renderOneLine(entry))
        assignments.push({ id: entry.id, slot: counter })
        counter += 1
      }
      /* 自动生成的那一行用引用块包起来：DSH 会把它渲染成小一号、灰色、带左边竖条，
         和用户自己写的正文一眼分开（用户 2026-11-25 提的）。 */
      const head = `关于「${typeof all[0].path === 'string' ? all[0].path : '对话文档'}」的批注`
        + (total > 1 ? ` · 第 ${index + 1}/${total} 批` : '')
      return {
        text: ['> ' + head, '', ...lines].join('\n'),
        assignments,
      }
    }
    let sending = false

    function deliver(pending, sessionId) {
      const actions = runtime.actions
      if (actions === null || pending.length === 0 || sending) {
        return { sent: 0, remaining: pending.length }
      }
      const batches = planBatches(pending)
      if (batches.length === 0) return { sent: 0, remaining: pending.length }
      const batch = batches[0]
      const index = state.batchSeq
      const total = index + batches.length
      /* 只有这次真的拆成多批时才标「第 N/M 批」；一次发一条就别把那串数字塞给用户看。
         批次号本身（index+1）照旧用于配对，只是标题上不显示。 */
      const split = batches.length > 1
      const built = buildPayload(batch, split ? index : 0, split ? total : 1)
      const ids = built.assignments.map(entry => entry.id)

      sending = true
      let written = false
      try {
        const span = actions.captureInsertion()
        written = actions.insertText(built.text, span)
      } catch (error) {
        console.warn('[annotate] 写入输入框失败', error)
        written = false
      }
      if (written !== true) {
        /* insertText 不通再试 setDraft；它返回 void，只能靠抛异常判断失败。 */
        try {
          actions.setDraft(built.text)
          written = true
        } catch (error) {
          console.warn('[annotate] 兜底写入也失败，放弃这次发送', error)
          written = false
        }
      }
      if (written !== true) {
        sending = false
        return { sent: 0, remaining: pending.length }
      }

      /* 批次号必须两边同一个值：markSent 记在条目的 sentBatch 上，锚点队列记在 slot.batch 上，
         reconcileReplies 就是靠它把「这一批的回复」对回「这一批的批注」——以前一边是时间戳、
         一边是 "1"，永远匹配不上，所以批注发出去就一直蓝着收不到回复。 */
      const batchId = String(index + 1)
      const tail = built.text.slice(-24)
      markSent(sessionId, built.assignments, batchId, tail)
      /* 记下这条消息的末尾几个字，作为以后从聊天流里切出回复的锚点（按批排队，不互相覆盖）。 */
      const tails = [
        ...(Array.isArray(state.sentTails) ? state.sentTails : []),
        { tail, batch: batchId, at: Date.now() },
      ].slice(-replyTailLimit())
      commit({ batchSeq: index + 1, sentTail: tail, sentTails: tails }, true)
      window.setTimeout(() => {
        try {
          actions.submit()
        } catch (error) {
          console.warn('[annotate] 提交失败，把状态退回待发送', error)
          markStatus(sessionId, ids, 'queued')
        } finally {
          sending = false
        }
      }, 90)
      return { sent: ids.length, remaining: pending.length - ids.length }
    }

    /** 批注内容预检：拦住"111"、快捷键、抄原文、界面文案这类无效输入，别让它白烧一个回合。 */
    function validateNote(note, quote) {
      const text = String(note === undefined || note === null ? '' : note).trim()
      if (text === '') return null
      if (/^(?:ctrl|cmd|alt|shift|win|meta)(?:\s*\+\s*[a-z0-9]+)+$/iu.test(text)) {
        return '这看起来是快捷键，不是批注内容——你可能把 Ctrl+Enter 打进来了'
      }
      if (/^[\s\d\p{P}\p{S}]+$/u.test(text)) {
        return '只有数字或符号，模型没法执行——补一句具体要改成什么'
      }
      if (UI_NOISE.includes(text)) {
        return '这看着是界面上的按钮文字，不是批注内容'
      }
      if (text.length < 2) return '太短了，至少写两个字'
      const origin = String(quote === undefined || quote === null ? '' : quote).trim()
      if (origin !== '' && text === origin) {
        return '和原文一字不差，这条没有可改的内容'
      }
      return null
    }

    /** 不再让用户选「要改 / 问一句」：从内容自己判断。 */
    function inferKind(note) {
      const text = String(note === undefined || note === null ? '' : note).trim()
      if (text === '') return 'edit'
      if (/[?？]\s*$/u.test(text)) return 'question'
      if (/(为什么|为啥|是不是|能不能|可不可以|是否|怎么|如何|会不会|要不要|有没有)/u.test(text)) {
        return 'question'
      }
      return 'edit'
    }

    /* ------------------------------------------------------------ 批注输入浮层 */

    function AnnotateSurface(props) {
      const { readText, dismiss, clearSelection, sessionId } = props
      const captured = React.useRef(null)
      if (captured.current === null) {
        const picked = freshTarget()
        let text = ''
        if (picked !== null) {
          text = picked.quote === undefined ? '' : String(picked.quote)
        } else {
          try {
            text = (readText() === null ? '' : readText()).replace(/\s+/g, ' ').trim()
          } catch (error) {
            text = ''
          }
        }
        captured.current = {
          target: picked,
          full: text,
          short: text.length > QUOTE_STORE_MAX ? text.slice(0, QUOTE_STORE_MAX) : text,
        }
      }
      const target = captured.current.target
      /* 聊天兜底（右键唤不出框时自己开的那条路）也是「有目标但只读」：它仍然是 target:'chat'。 */
      const onFile = target !== null && target.kind !== 'chat'
      const truncated = captured.current.full.length > captured.current.short.length
      const [note, setNote] = React.useState('')
      const [sayOpen, setSayOpen] = React.useState(false)
      /* 胶囊末尾「+」就地加表情：表情 / 含义两个小输入，加完写进 Config.reactions。 */
      const [sayAdd, setSayAdd] = React.useState(false)
      const [newEmoji, setNewEmoji] = React.useState('')
      const [newMeaning, setNewMeaning] = React.useState('')
      const areaRef = React.useRef(null)
      const sayScrollRef = React.useRef(null)

      React.useEffect(() => {
        const area = areaRef.current
        if (area !== null) area.focus()
      }, [])

      /* 表态胶囊比批注卡还宽时：滚轮直接横向拨它（React 的 onWheel 是被动监听，preventDefault 无效，所以自己挂）。
         加表情时那个滚动盒会卸载再装回来，所以跟着 sayAdd 重挂一次。 */
      React.useEffect(() => {
        const box = sayScrollRef.current
        if (box === null) return undefined
        const onWheel = (event) => {
          if (box.scrollWidth <= box.clientWidth + 1) return
          const delta = event.deltaY !== 0 ? event.deltaY : event.deltaX
          if (delta === 0) return
          event.preventDefault()
          box.scrollLeft += delta
        }
        box.addEventListener('wheel', onWheel, { passive: false })
        return () => box.removeEventListener('wheel', onWheel)
      }, [sayAdd])

      const addReaction = () => {
        const key = newEmoji.trim()
        const say = newMeaning.trim()
        if (key === '' || say === '') return
        const next = mergeReactionText(state.reactions, key, say)
        commit({ reactions: next }, true)
        writePluginConfig({ reactions: next })
        setNewEmoji('')
        setNewMeaning('')
        setSayAdd(false)
      }

      const kind = onFile ? inferKind(note) : 'question'
      const warning = validateNote(note, captured.current.short)
      const ready = note.trim().length > 0 && warning === null

      const submit = (andSend) => {
        if (!ready) return
        const payload = {
          kind,
          quote: captured.current.short,
          note: note.trim(),
        }
        if (onFile) {
          payload.target = target.kind === 'doc' ? 'doc' : 'file'
          payload.path = target.path
          if (target.kind === 'doc') {
            payload.blockIndex = target.blockIndex
            payload.startChar = target.startChar
            payload.endChar = target.endChar
            if (target.locator !== undefined && target.locator !== null) payload.locator = target.locator
          } else {
            payload.absPath = target.absPath === undefined ? '' : target.absPath
            payload.lineStart = target.lineStart
            payload.lineEnd = target.lineEnd
            payload.prefix = target.prefix
            payload.suffix = target.suffix
            payload.dirty = target.dirty
          }
        } else {
          payload.target = 'chat'
        }
        const added = addAnnotation(sessionId, payload)
        clearTarget()
        try {
          clearSelection()
        } catch (error) {
          console.warn('[annotate] 清除选区失败', error)
        }
        dismiss()
        if (andSend === true) {
          const item = added === null || added === undefined ? null : added.item
          if (item !== null) {
            window.setTimeout(() => { deliver([item], sessionId) }, 140)
          }
        }
      }

      return h('div', { className: 'dsha-surface', role: 'dialog', 'aria-label': '添加批注' },
        /* 表态：单独一颗胶囊，贴在批注卡上沿的外面（不在卡里）；只放表情，不写「表态」两个字。
           表情比卡片宽时横向滚动，滚轮直接拨（见 sayScrollRef 的 wheel 监听）；末尾「+」就地加一个。 */
        h('div', { className: 'dsha-say-pill' },
          sayAdd
            ? h('div', { className: 'dsha-say-addrow' },
              h('input', {
                className: 'dsha-say-input dsha-say-emoji',
                value: newEmoji,
                placeholder: '表情',
                autoFocus: true,
                onChange: event => setNewEmoji(event.target.value),
                onKeyDown: (event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    addReaction()
                  } else if (event.key === 'Escape') {
                    event.preventDefault()
                    setSayAdd(false)
                  }
                },
              }),
              h('input', {
                className: 'dsha-say-input',
                value: newMeaning,
                placeholder: '含义，比如「就这么做」',
                onChange: event => setNewMeaning(event.target.value),
                onKeyDown: (event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    addReaction()
                  } else if (event.key === 'Escape') {
                    event.preventDefault()
                    setSayAdd(false)
                  }
                },
              }),
              h('button', {
                type: 'button',
                className: 'dsha-say-ok',
                title: '加进表情条（写进插件设置）',
                onClick: addReaction,
              }, '加'))
            : h('div', { className: 'dsha-say-scroll', ref: sayScrollRef },
              reactionList().map(reaction => h('button', {
                key: reaction.emoji,
                type: 'button',
                className: 'dsha-say-btn',
                title: reaction.meaning,
                onClick: () => {
                  setNote(previous => {
                    const head = String(previous).trim()
                    return (head === '' ? '' : head + ' ') + reaction.emoji + ' ' + reaction.meaning
                  })
                },
              }, reaction.emoji))),
          h('span', { className: 'dsha-say-sep' }),
          h('button', {
            type: 'button',
            className: 'dsha-say-add',
            title: sayAdd ? '收起' : '加一个自己的表情',
            onClick: () => setSayAdd(value => !value),
          }, sayAdd ? '×' : '+')),
        h('div', { className: 'dsha-quote', title: captured.current.full }, captured.current.short),
        onFile
          ? h('div', { className: 'dsha-path' }, target.path + (typeof target.lineStart === 'number' ? ':' + String(target.lineStart) : ''))
          : null,
        truncated ? h('div', { className: 'dsha-hint' }, '选区太长，只记前 ' + String(QUOTE_STORE_MAX) + ' 字') : null,
        onFile
          ? null
          : h('div', { className: 'dsha-warn' }, '聊天消息是只读的，这里只能问；要让我动文件，请到右边的文档或文件里划句。'),
        h('textarea', {
          ref: areaRef,
          className: 'dsha-textarea',
          rows: 3,
          value: note,
          placeholder: '写批注…（Enter 发送 · Shift+Enter 换行）',
          onChange: event => setNote(event.target.value),
          onKeyDown: event => {
            if (event.key === 'Enter' && event.shiftKey !== true && event.isComposing !== true) {
              event.preventDefault()
              submit(true)
            } else if (event.key === 'Escape') {
              event.preventDefault()
              dismiss()
            }
          },
        }),
        warning === null ? null : h('div', { className: 'dsha-warn' }, warning),
        h('div', { className: 'dsha-row' },
          h('span', { className: 'dsha-hint' }, '选中 ' + String(captured.current.short.length) + ' 字'),
          h('div', { className: 'dsha-spacer' }),
          /* 新批注这一版也要能听写：线程卡里有，浮层里没有的话第一次就得打字。 */
          h(MicButton, { value: note, onChange: setNote, targetRef: areaRef }),
          h(CopyButton, { text: captured.current.full }),
          h('button', { type: 'button', className: 'dsha-btn', onClick: () => dismiss() }, '取消'),
          h('button', {
            type: 'button',
            className: 'dsha-btn',
            disabled: !ready,
            title: '只存着，不发送，回头在面板里一起发（适合通读长文档）',
            onClick: () => submit(false),
          }, '预批注'),
          h('button', {
            type: 'button',
            className: 'dsha-btn dsha-btn-primary',
            disabled: !ready,
            title: '加完立刻发出去（Enter）',
            onClick: () => submit(true),
          }, '添加并发送'),
        ),
      )
    }

    /* ---------------------------------------------------------------- 文档按钮 */

    /* 右键被插件接管后，系统菜单里的「复制」就没了 —— 这里补一颗。
       优先用 navigator.clipboard，权限/环境不允许时退到 textarea + execCommand。 */
    function copyText(text, done) {
      const mark = () => { try { done() } catch (error) { /* 忽略 */ } }
      try {
        if (typeof navigator !== 'undefined' && navigator.clipboard !== undefined
          && navigator !== null && typeof navigator.clipboard.writeText === 'function') {
          navigator.clipboard.writeText(text).then(mark).catch(() => legacyCopy(text, mark))
          return
        }
      } catch (error) {
        /* 落到 legacy */
      }
      legacyCopy(text, mark)
    }

    function legacyCopy(text, done) {
      try {
        const area = document.createElement('textarea')
        area.value = text
        area.style.position = 'fixed'
        area.style.left = '-9999px'
        document.body.appendChild(area)
        area.select()
        const ok = document.execCommand('copy')
        area.remove()
        if (ok === true) done()
      } catch (error) {
        /* 复制不了就算了，别让整个批注框挂掉 */
      }
    }

    function CopyButton(props) {
      const [done, setDone] = React.useState(false)
      const text = typeof props.text === 'string' ? props.text : ''
      return h('button', {
        type: 'button',
        className: 'dsha-btn',
        title: '复制选中的原文（右键被插件接管了，这里补上复制；Ctrl+C 也能用）',
        onClick: () => copyText(text, () => {
          setDone(true)
          window.setTimeout(() => setDone(false), 1400)
        }),
      }, done ? '已复制' : '复制')
    }
    function DocButton(props) {
      const store = useStore()
      /* 侧栏「文档」页签是常驻的：它拿到的 scope.sessionId 是**注册那一刻**的会话，
         切会话不会变，于是页签一直显示老会话的文档（2026-11-27 现场：显示 059068b6 的「技能三层机制」）。
         顶栏按钮挂在每个会话头部，切会话必重渲染 —— 让它把当前会话报上来，页签按这个跟随。 */
      const liveSid = props !== null && props !== undefined && props.scope !== null && props.scope !== undefined
        && typeof props.scope.sessionId === 'string'
        ? props.scope.sessionId
        : ''
      React.useEffect(() => {
        /* 一次性诊断：顶栏按钮到底拿没拿到会话（拿到哪个槽位）。只记形状，不记内容。 */
        if (runtime.docProbeOnce !== true) {
          runtime.docProbeOnce = true
          let keys = []
          try { keys = Object.keys(props === null || props === undefined ? {} : props) } catch (error) { keys = ['取不到'] }
          const scope = props !== null && props !== undefined && props.scope !== null && props.scope !== undefined
            ? Object.keys(props.scope).join(',') : '-'
          logLine('文档探针 [按钮] props键=' + keys.slice(0, 8).join('|') + ' scope键=' + scope + ' 取到sid=' + (liveSid === '' ? '无' : sessionTail(liveSid)))
        }
        if (liveSid === '') return
        if (state.docSid === liveSid) return
        commit({ docSid: liveSid })
      }, [liveSid])
      /* 停靠模式下文档在右侧栏里，浮层不渲染 —— 这里把「看得见」按停靠算，
         否则按钮会一直亮提示点、tooltip 还写着「收起」。 */
      const docked = store.dockDocTab === true && store.docDetached !== true
      const open = store.docOpen === true || docked
      /* 「有文档、但面板没开」时给个提示点：模型写完文档常说「写在右边了」，
         关着面板的人不知道去哪找（2026-11-26 用户提的场景）。 */
      const hasDoc = store.doc !== null && store.doc !== undefined
      const stamp = docStampOf(store.doc)
      const unseen = hasDoc && stamp !== '' && String(store.docSeen === undefined ? '' : store.docSeen) !== stamp
      const attention = unseen && open !== true
      return h('button', {
        type: 'button',
        className: attention ? 'dsha-btn dsha-btn-attn' : 'dsha-btn',
        title: docked ? '把右侧栏的「文档」页签推到前面' : (open ? '收起对话文档' : (hasDoc ? '这轮生成了文档，点开看' : '打开对话文档')),
        'aria-pressed': open ? 'true' : 'false',
        onClick: () => {
          /* 停靠模式：把右侧栏的页签推到前面（浮层此时不渲染，切 docOpen 等于点了个空）。
             否则：开关自己的窗口。 */
          if (store.dockDocTab === true) {
            openDocTab()
            return
          }
          commit({ docOpen: !open })
        },
      }, h('span', { className: 'dsha-ico' }, '\u25A4'), h('span', null, '文档'),
        attention ? h('span', { className: 'dsha-attn-dot', 'aria-hidden': 'true' }) : null)
    }

    /**
     * 顶栏小开关：聊天里那份 dsh-doc 原文块要不要收起来。
     * 默认收起（正文只在右侧面板看）；想看原文时点一下就行，选择记在本机。
     */
    function DocBlockToggle() {
      const store = useStore()
      const hidden = store.hideDocBlocks !== false
      return h('button', {
        type: 'button',
        className: 'dsha-btn',
        title: hidden ? '聊天里的文档原文已收起，点一下显示原文' : '聊天里显示文档原文，点一下收起',
        'aria-pressed': hidden ? 'true' : 'false',
        onClick: () => commit({ hideDocBlocks: !hidden }, true),
      }, h('span', { className: 'dsha-ico' }, hidden ? '\u25A3' : '\u25A1'),
        h('span', null, hidden ? '原文已收' : '显示原文'))
    }
    /* ------------------------------------------------------------ 聊天里的表情条 */

    /**
     * 聊天里划句也能表态：选中文字浮出一排表情，点一下就把这个表情的含义连同选中的句子发出去。
     *
     * 聊天消息是只读的，所以只发一条「关于这段话」的批注（target: chat），和右键批注同一条通道；
     * 回答照旧落在面板里那句话下面。
     */
    function ChatReactions() {
      const store = useStore()
      const [spot, setSpot] = React.useState(null)
      const list = reactionList()

      React.useEffect(() => {
        const inBar = node => node instanceof Element && node.closest('.dsha-emoji') !== null
        const onUp = (event) => {
          if (inBar(event.target)) return
          /* 等浏览器把选区定下来再量位置 */
          window.setTimeout(() => {
            const selection = window.getSelection()
            if (selection === null || selection.isCollapsed === true || selection.rangeCount === 0) {
              setSpot(null)
              return
            }
            const range = selection.getRangeAt(0)
            const node = range.startContainer.nodeType === 1
              ? range.startContainer
              : range.startContainer.parentElement
            const flow = node === null ? null : node.closest('[data-chat-flow]')
            if (flow === null) {
              setSpot(null)
              return
            }
            const text = clipQuote(selection.toString(), QUOTE_STORE_MAX)
            if (text === '') {
              setSpot(null)
              return
            }
            const rect = range.getBoundingClientRect()
            setSpot({
              x: rect.left + Math.min(Math.max(rect.width / 2, 0), 120),
              y: rect.top,
              quote: text,
            })
          }, 0)
        }
        const onDown = (event) => {
          if (inBar(event.target)) return
          setSpot(null)
        }
        const onScroll = () => setSpot(null)
        document.addEventListener('mouseup', onUp, true)
        document.addEventListener('pointerdown', onDown, true)
        window.addEventListener('scroll', onScroll, true)
        return () => {
          document.removeEventListener('mouseup', onUp, true)
          document.removeEventListener('pointerdown', onDown, true)
          window.removeEventListener('scroll', onScroll, true)
        }
      }, [])

      if (spot === null || list.length === 0) return null

      const sessionId = store.active
      const send = (reaction) => {
        if (sessionId === null || sessionId === undefined || sessionId === '') return
        const added = addAnnotation(sessionId, {
          target: 'chat',
          quote: spot.quote,
          note: reaction.emoji + ' ' + reaction.meaning,
        })
        setSpot(null)
        try {
          const selection = window.getSelection()
          if (selection !== null) selection.removeAllRanges()
        } catch (error) {
          /* 清不掉选区也不挡发送 */
        }
        const item = added === null || added === undefined ? null : added.item
        if (item !== null) {
          window.setTimeout(() => { deliver([item], sessionId) }, 140)
        }
      }
      return h(EmojiBar, {
        left: Math.max(8, Math.min(spot.x, window.innerWidth - 320)),
        /* 让开 DSH 自带的那颗「引用」浮钮（它也在选区上方），撞一起就点不着了 */
        top: Math.max(8, spot.y - 92),
        onPick: send,
      })
    }

    /**
     * 划词后那一排表情：按钮 + 末尾一个「+」。
     *
     * 「+」展开一个小输入条（表情 + 含义），加完写进宿主配置（`reactions`），
     * 下次划词就多一个按钮 —— 不逼用户去设置页敲格式。
     */
    function EmojiBar(props) {
      useStore()
      const [adding, setAdding] = React.useState(false)
      const [emoji, setEmoji] = React.useState('')
      const [meaning, setMeaning] = React.useState('')
      const list = reactionList()
      const add = () => {
        const key = emoji.trim()
        const say = meaning.trim()
        if (key === '' || say === '') return
        const next = mergeReactionText(state.reactions, key, say)
        commit({ reactions: next }, true)
        writePluginConfig({ reactions: next })
        setAdding(false)
        setEmoji('')
        setMeaning('')
      }
      return h('div', {
        className: 'dsha-emoji',
        style: { left: String(props.left) + 'px', top: String(props.top) + 'px' },
      },
        adding
          ? h('div', { className: 'dsha-emoji-add' },
            h('input', {
              className: 'dsha-emoji-input dsha-emoji-emoji',
              value: emoji,
              placeholder: '表情',
              autoFocus: true,
              onChange: event => setEmoji(event.target.value),
            }),
            h('input', {
              className: 'dsha-emoji-input',
              value: meaning,
              placeholder: '含义，比如「就这么做」',
              onChange: event => setMeaning(event.target.value),
              onKeyDown: (event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  add()
                } else if (event.key === 'Escape') {
                  event.preventDefault()
                  setAdding(false)
                }
              },
            }),
            h('button', { type: 'button', className: 'dsha-emoji-ok', onClick: add }, '加'))
          : null,
        list.map(reaction => h('button', {
          key: reaction.emoji,
          type: 'button',
          className: 'dsha-emoji-btn',
          title: reaction.meaning + ' · 点一下立刻发出去',
          onClick: () => props.onPick(reaction),
        }, reaction.emoji)),
        adding
          ? null
          : h('button', {
            type: 'button',
            className: 'dsha-emoji-btn dsha-emoji-more',
            title: '加一个自己的表情（含义会原样发给我）',
            onClick: () => setAdding(true),
          }, '+'))
    }

    /* ---------------------------------------------------------------- 标题栏按钮 */

    function AnnotateButton(props) {
      const store = useStore()
      const sessionId = props.sessionId
      const list = itemsOf(sessionId)
      const pending = list.filter(entry => entry.status === 'queued')

      const open = store.open === true && store.active === sessionId

      React.useEffect(() => {
        runtime.actions = props.inputActions === undefined ? null : props.inputActions
      }, [props.inputActions])

      React.useEffect(() => {
        if (state.active !== sessionId) commit({ active: sessionId })
      }, [sessionId])

      return h('button', {
        type: 'button',
        className: 'dsha-btn',
        title: open ? '收起批注' : '划句批注：选中一句话后右键',
        'aria-pressed': open ? 'true' : 'false',
        onClick: () => commit({ open: !open, active: sessionId }),
      },
        h('span', { className: 'dsha-ico' }, '\u270E'),
        /* 只留一个数：待发的在面板里写着，标题栏不必再挂个小方块（那个底色在这个上下文里是浅灰的，看着像白块） */
        h('span', null, list.length === 0 ? '批注' : '批注 ' + String(list.length)),
      )
    }

    /* ------------------------------------------------------------------ 侧栏面板 */

    const MIN_TOP = 46
    const MIN_W = 280
    const MIN_H = 200

    /** 界面上的按钮/提示文案，被误粘进输入框时不该当成批注发出去。 */
    const UI_NOISE = [
      '加完立刻发出去', '先攒着', '预批注', '直接批注', '要改', '问一句',
      '定位', '已回复', '删除', '清空', '关闭', '取消', '发送', '添加',
    ]

    /** 存下来的几何可能来自更小的窗口或误拖到屏外，渲染前一律夹回可视区。 */
    function clampGeometry(ui) {
      const w = Math.max(MIN_W, Math.min(ui.w, Math.max(MIN_W, window.innerWidth - 24)))
      const h = Math.max(MIN_H, Math.min(ui.h, Math.max(MIN_H, window.innerHeight - MIN_TOP - 12)))
      const x = Math.max(0, Math.min(ui.x, Math.max(0, window.innerWidth - w)))
      const y = Math.max(MIN_TOP, Math.min(ui.y, Math.max(MIN_TOP, window.innerHeight - h)))
      return { x, y, w, h }
    }

    /** 面板默认落在聊天列右侧、右侧栏左边，不再横在屏幕正中。 */
    function defaultGeometry() {
      const width = 380
      const height = Math.min(560, Math.max(320, window.innerHeight - 240))
      let x = Math.max(16, window.innerWidth - width - 24)
      try {
        const flow = document.querySelector('[data-chat-flow]')
        if (flow !== null) {
          const rect = flow.getBoundingClientRect()
          if (rect.width > 200) {
            x = Math.max(16, Math.min(rect.right - width - 10, window.innerWidth - width - 16))
          }
        }
      } catch (error) {
        /* 量不到就用视口兜底 */
      }
      return { x, y: 72, w: width, h: height }
    }

    function AnnotatePanel() {
      const store = useStore()

      /* 所有 hook 必须在早返回之前：否则开关面板时 hook 数量变化，React 会抛 #310（渲染更多 hook）。 */
      const [clearArm, setClearArm] = React.useState(null)
      /* 抽屉搜索词 + 卡片「展开全部」状态：都只是显示层，不影响发送集合。 */
      const [query, setQuery] = React.useState('')
      const [openCards, setOpenCards] = React.useState({})
      React.useEffect(() => {
        if (state.ui === null) commit({ ui: defaultGeometry() }, true)
      }, [])
      if (store.open !== true || store.active === null) return null

      const sessionId = store.active
      const geo = clampGeometry(store.ui === null ? defaultGeometry() : store.ui)



      const beginDrag = (event) => {
        if (event.button !== 0) return
        /* 按钮、输入框、文本域、下拉、可编辑区里按下去都不算「拖动标题栏」：
           以前只排除 button，输入框被 preventDefault 掉，光标进不去（点不了/打不了字）。 */
        if (event.target instanceof Element
          && event.target.closest('button, input, textarea, select, [contenteditable="true"]') !== null) return
        event.preventDefault()
        const base = { mx: event.clientX, my: event.clientY, x: geo.x, y: geo.y }
        /* 0.113：一帧最多提交一次几何（7.4）。 */
        const frame = rafGeom()
        setDragging(true)
        const move = (moving) => {
          /* 在窗口外松手时 pointerup 收不到，靠按键状态兜底解绑。 */
          if (moving.buttons === 0) {
            up()
            return
          }
          frame.push(() => commit({
            ui: {
              ...geo,
              x: Math.max(0, Math.min(base.x + (moving.clientX - base.mx), Math.max(0, window.innerWidth - geo.w))),
              /* 顶到窗口最上面时标题栏会被 DSH 自己的标题条抢走，所以留一条拖动余量。 */
              y: Math.max(MIN_TOP, Math.min(base.y + (moving.clientY - base.my), Math.max(MIN_TOP, window.innerHeight - geo.h))),
            },
          }))
        }
        const up = () => {
          window.removeEventListener('pointermove', move)
          window.removeEventListener('pointerup', up)
          window.removeEventListener('pointercancel', up)
          frame.flush()
          setDragging(false)
          persist()
        }
        window.addEventListener('pointermove', move)
        window.addEventListener('pointerup', up)
        window.addEventListener('pointercancel', up)
      }

      /** mode: 'e' 调宽 / 's' 调高 / 'se' 一起 / 'w' 左边缘（改宽+移 x） / 'n' 上边缘（改高+移 y）。 */
      const beginResize = (event, mode) => {
        event.preventDefault()
        event.stopPropagation()
        const base = { mx: event.clientX, my: event.clientY, x: geo.x, y: geo.y, w: geo.w, h: geo.h }
        const frame = rafGeom()
        setDragging(true)
        const move = (moving) => {
          /* 同上：窗口外松手也要能解绑。 */
          if (moving.buttons === 0) {
            up()
            return
          }
          const dx = moving.clientX - base.mx
          const dy = moving.clientY - base.my
          let w = base.w
          let h = base.h
          let x = base.x
          let y = base.y

          if (mode === 'e' || mode === 'se') {
            w = Math.max(MIN_W, Math.min(base.w + dx, window.innerWidth - base.x - 8))
          } else if (mode === 'w') {
            w = Math.max(MIN_W, Math.min(base.w - dx, base.x + base.w))
            x = base.x + base.w - w
          }
          if (mode === 's' || mode === 'se') {
            h = Math.max(MIN_H, Math.min(base.h + dy, window.innerHeight - base.y - 8))
          } else if (mode === 'n') {
            h = Math.max(MIN_H, Math.min(base.h - dy, base.y + base.h - MIN_TOP))
            y = base.y + base.h - h
          }
          frame.push(() => commit({ ui: { x, y, w, h } }))
        }
        const up = () => {
          window.removeEventListener('pointermove', move)
          window.removeEventListener('pointerup', up)
          window.removeEventListener('pointercancel', up)
          frame.flush()
          setDragging(false)
          persist()
        }
        window.addEventListener('pointermove', move)
        window.addEventListener('pointerup', up)
        window.addEventListener('pointercancel', up)
      }
      const list = itemsOf(sessionId)
      const pending = list.filter(entry => entry.status === 'queued')

      const picked = store.picked === undefined || store.picked === null ? {} : store.picked
      const chosen = pending.filter(entry => picked[entry.id] === true)
      const toSend = chosen.length > 0 ? chosen : pending
      const stale = store.undo !== null && Date.now() - store.undo.at < 10000
      /* 清空要连点两下，但计时只对当前会话有效：切走再点一下不该把别的会话清空。 */
      const armed = clearArm !== null && clearArm !== undefined
        && clearArm.sid === sessionId
        && Date.now() - clearArm.at <= 3000

      const send = () => {
        if (toSend.length === 0) return
        const result = deliver(toSend, sessionId)
        if (result.sent === 0) console.warn('[annotate] 没能把批注写进输入框')
        else commit({ picked: {} })
      }

      const dirtyCount = pending.filter(entry => entry.dirty === true).length
      const batchCount = toSend.length === 0 ? 0 : planBatches(toSend).length
      const firstBatchSize = Math.min(toSend.length, MAX_ITEMS_PER_BATCH)

      /* 只有「这个文件的编辑器正开着、却找不到引文」才算丢；文件没打开不算丢。
         结果缓存 800ms：拖动面板时每帧都会重渲染，别每帧去扫一遍编辑器 DOM。 */
      const fileInEditor = (entry) => {
        if (typeof entry.path !== 'string' || entry.path === '') return false
        try {
          return visibleEditors().some(element => editorPathOf(element) === entry.path)
        } catch (error) {
          return false
        }
      }

      const lostNow = (entry) => {
        /* 已经写回文档的批注：原句本来就被回答替换掉了，不该再报「原文找不到」。 */
        if (entry.status === 'resolved') return false
        const key = entry.id + '|' + String(entry.quote) + '|'
          + String(entry.lineStart) + '|' + String(entry.path)
          + '|' + String(state.doc === null || state.doc === undefined ? 0 : state.doc.editedAt)
          + '|' + String(docBlocksNow().length)
        const now = Date.now()
        const cache = runtime.lostCache
        if (cache.size > 300) cache.clear()
        const hit = cache.get(entry.id)
        if (hit !== undefined && hit.key === key && now - hit.at < 800) return hit.value
        const value = entry.target === 'file'
          ? (fileInEditor(entry) && locateEntryQuote(entry) === null && previewRangeFor(entry) === null)
          /* 文档批注：整篇里都找不到这句原文，才算「失效」。
             以前只判定 file 目标，文档批注即使原文被改掉也一声不响（用户看到的
             就是「重启后高亮没了，也没人告诉我为什么」）。 */
          : (entry.target === 'doc' && quoteInDocBlocks(docBlocksNow(), entry.quote) !== true)
        cache.set(entry.id, { key, at: now, value })
        return value
      }

      const card = (entry, index) => {
        const lost = lostNow(entry)
        const longText = String(entry.note === undefined ? '' : entry.note).length
          + String(entry.reply === undefined ? '' : entry.reply).length > 140
        const expanded = openCards[entry.id] === true
        return h('div', {
          key: entry.id,
          className: openCards[entry.id] === true ? 'dsha-card dsha-card-open' : 'dsha-card',
          'data-status': entry.status,
          'data-lost': lost ? '1' : '0',
        },
          h('div', { className: 'dsha-card-quote', title: entry.quote }, entry.quote),
          typeof entry.path === 'string'
            ? h('div', { className: 'dsha-path' }, entry.path + (typeof entry.lineStart === 'number' ? ':' + String(entry.lineStart) : ' : 无行号'))
            : null,
          h('div', { className: 'dsha-card-note' }, entry.note),
          typeof entry.reply === 'string' && entry.reply !== ''
            ? h('div', { className: 'dsha-reply', title: entry.reply }, entry.reply)
            : null,
          lost
            ? h('div', { className: 'dsha-warn' }, '原文找不到了：可以在编辑器里重新划一句，把这条指过去，也可以直接删掉。')
            : null,
          entry.downgraded === true
            ? h('div', { className: 'dsha-hint' }, '聊天消息只读，已按「问一句」发出')
            : null,
          h('div', { className: 'dsha-card-foot' },
            entry.status !== 'queued' ? null : h('input', {
              type: 'checkbox',
              className: 'dsha-pick',
              checked: picked[entry.id] === true,
              title: '勾上就只发勾选的',
              onChange: () => commit({
                picked: { ...picked, [entry.id]: picked[entry.id] !== true },
              }),
            }),
            /* 位置就是身份，不再编号 */
            h('span', { className: 'dsha-dot', 'data-status': entry.status }),
            h('span', { className: 'dsha-tag', 'data-kind': entry.kind },
              entry.kind === 'question' ? '问' : (entry.kind === 'auto' ? '批注' : '改')),
            h('div', { className: 'dsha-spacer' }),
            entry.target === 'file'
              ? h('button', {
                type: 'button',
                className: 'dsha-mini',
                title: '跳到文件里的这一句',
                onClick: () => jumpToEntry(entry),
              }, '定位')
              : null,
            lost
              ? h('button', {
                type: 'button',
                className: 'dsha-mini',
                title: '在编辑器里选一句新原文，把这条改指过去',
                onClick: () => commit({
                  reanchorId: entry.id,
                  reanchorHint: '在编辑器里选中新的句子，右键即可把这条改指过去',
                }),
              }, '重划')
              : null,
            h('button', {
              type: 'button',
              className: 'dsha-mini',
              onClick: () => removeAnnotation(sessionId, entry.id),
            }, '删除'),
          ),
        )
      }

      /* 分组口径：主对话 / 每份文档各一组 / 每个文件一组。
         以前只认 target==='file'，文档批注（target==='doc'）全掉进「对话」，
         想找没发出去的预批注得在混在一起的列表里翻。 */
      const docTitleOf = (docKey) => {
        const found = libEntryOf(sessionId, docKey)
        if (found !== null && found !== undefined && typeof found.title === 'string' && found.title.trim() !== '') {
          return '📄 ' + found.title.trim()
        }
        return '📄 文档'
      }
      const groupKeyOf = (entry) => {
        if (entry.target === 'doc') return docTitleOf(entry.docKey)
        if (entry.target === 'file' && typeof entry.path === 'string' && entry.path !== '') return '🗂 ' + entry.path
        return '💬 主对话'
      }
      const grouped = []
      {
        const byKey = new Map()
        /* 「只看未发」/「只看失效」：只影响显示，不影响 list 本身（发送集合、计数都按 list 算）。 */
        const onlyQueued = state.onlyQueued === true
        const onlyLost = state.onlyLost === true
        const needle = query.trim().toLowerCase()
        list.forEach((entry, index) => {
          if (onlyQueued && entry.status !== 'queued') return
          if (onlyLost && lostNow(entry) !== true) return
          /* 搜索：只过滤「显示」，list / pending / toSend 都不动（发送范围不跟搜索走）。 */
          if (needle !== '') {
            const hay = [entry.quote, entry.note, entry.reply, entry.path]
              .filter(text => typeof text === 'string').join('\n').toLowerCase()
            if (hay.indexOf(needle) < 0) return
          }
          const key = groupKeyOf(entry)
          if (!byKey.has(key)) byKey.set(key, [])
          byKey.get(key).push({ entry, index })
        })
        for (const [key, rows] of byKey) {
          /* 没发出去的排前面：找预批注不用滚。 */
          rows.sort((a, b) => {
            const left = a.entry.status === 'queued' ? 0 : 1
            const right = b.entry.status === 'queued' ? 0 : 1
            if (left !== right) return left - right
            return String(b.entry.createdAt === undefined ? '' : b.entry.createdAt)
              .localeCompare(String(a.entry.createdAt === undefined ? '' : a.entry.createdAt))
          })
          grouped.push({ key, rows })
        }
        /* 主对话永远排第一，其余按名字排，方便认。 */
        grouped.sort((a, b) => {
          const left = a.key.indexOf('主对话') >= 0 ? 0 : 1
          const right = b.key.indexOf('主对话') >= 0 ? 0 : 1
          if (left !== right) return left - right
          return a.key.localeCompare(b.key)
        })
      }

      /* 导出当前会话的全部批注（含 AI 回复）：Markdown 给人看，CSV 进表格。 */
      const exportAnnotations = (kind) => {
        try {
          const title = state.doc !== null && state.doc !== undefined && typeof state.doc.title === 'string'
            ? state.doc.title
            : '对话文档'
          const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/gu, '')
          if (kind === 'csv') {
            downloadText('批注-' + stamp + '.csv', annotationsToCsv(list), 'text/csv')
            return
          }
          downloadText('批注-' + stamp + '.md', annotationsToMarkdown(list, title), 'text/markdown')
        } catch (error) {
          /* 导出失败不影响面板 */
        }
      }

      const panel = h('div', {
        className: 'dsha-panel',
        role: 'complementary',
        'aria-label': '划句批注',
        style: {
          left: String(geo.x) + 'px',
          top: String(geo.y) + 'px',
          width: String(geo.w) + 'px',
          height: String(geo.h) + 'px',
          zIndex: 9999,
        },
      },
        h('div', {
          className: 'dsha-head',
          title: '拖动移动 · 双击复位',
          onPointerDown: beginDrag,
          onDoubleClick: (event) => {
            if (event.target instanceof Element
              && event.target.closest('input, button, textarea, select') !== null) return
            commit({ ui: defaultGeometry() }, true)
          },
        },
          h('span', { className: 'dsha-title' }, '划句批注'),
          h('input', {
            type: 'search',
            className: 'dsha-search',
            value: query,
            placeholder: '搜批注 / 回复 / 文件…',
            title: '只过滤显示，不影响要发送的批注',
            onChange: event => setQuery(event.target.value),
            onPointerDown: event => event.stopPropagation(),
            onDoubleClick: event => event.stopPropagation(),
          }),
          query.trim() === ''
            ? null
            : h('span', { className: 'dsha-hint' }, '命中 ' + String(grouped.reduce((sum, group) => sum + group.rows.length, 0))),
          pending.length > 0
            ? h('span', { className: 'dsha-count' },
              chosen.length > 0
                ? '已选 ' + String(chosen.length) + ' / 共 ' + String(pending.length)
                : String(pending.length) + ' 条待发')
            : null,
          h('div', { className: 'dsha-spacer' }),
          list.length === 0
            ? null
            : h('button', {
              type: 'button',
              className: 'dsha-mini',
              'data-on': state.onlyQueued === true ? '1' : '0',
              title: '只显示还没发出去的批注',
              onClick: () => commit({ onlyQueued: state.onlyQueued !== true }, true),
            }, state.onlyQueued === true ? '只看未发 ✓' : '只看未发'),
          list.length === 0
            ? null
            : h('button', {
              type: 'button',
              className: 'dsha-mini',
              'data-on': state.onlyLost === true ? '1' : '0',
              title: '只显示原文被改掉、定位不到的批注',
              onClick: () => commit({ onlyLost: state.onlyLost !== true }, true),
            }, state.onlyLost === true ? '只看失效 ✓' : '只看失效'),
          list.length === 0
            ? null
            : h('button', {
              type: 'button',
              className: 'dsha-mini',
              title: '把全部批注导出为 Markdown（含 AI 回复）',
              onClick: () => exportAnnotations('md'),
            }, '导出 .md'),
          list.length === 0
            ? null
            : h('button', {
              type: 'button',
              className: 'dsha-mini',
              title: '把全部批注导出为 CSV（可进 Excel）',
              onClick: () => exportAnnotations('csv'),
            }, '导出 .csv'),
          h('button', {
            type: 'button',
            className: 'dsha-mini',
            onClick: () => commit({ open: false }),
          }, '关闭'),
        ),
        store.reanchorHint === '' || store.reanchorHint === undefined
          ? null
          : h('div', { className: 'dsha-undo' },
            h('span', null, store.reanchorHint),
            h('button', {
              type: 'button',
              className: 'dsha-mini',
              onClick: () => commit({ reanchorId: '', reanchorHint: '' }),
            }, '取消'),
          ),
        stale ? h('div', { className: 'dsha-undo' },
          h('span', null, '已删除一条批注'),
          h('button', { type: 'button', className: 'dsha-mini', onClick: undoRemove }, '撤销'),
        ) : null,
        list.length === 0
          ? h('div', { className: 'dsha-empty' },
            '还没有批注。',
            h('br'),
            '在对话里用鼠标选中一句话，然后',
            h('strong', null, '右键'),
            '。',
            h('br'),
            h('span', { className: 'dsha-hint' },
              '工具卡、代码块和正在生成的内容不能批注。'),
          )
          : h('div', { className: 'dsha-body' },
            grouped.map((group) => {
              const open = store.collapsed[group.key] !== true
              const left = group.rows.filter(row => row.entry.status === 'queued').length
              return h('div', { className: 'dsha-group-wrap', key: group.key },
                h('button', {
                  type: 'button',
                  className: 'dsha-group',
                  title: group.key,
                  onClick: () => commit({
                    collapsed: { ...store.collapsed, [group.key]: open },
                  }),
                },
                  h('span', { className: 'dsha-caret' }, open ? '▾' : '▸'),
                  h('span', { className: 'dsha-group-name' }, group.key),
                  h('span', { className: 'dsha-group-count' }, String(group.rows.length)),
                  left > 0 ? h('span', { className: 'dsha-dot' }) : null,
                ),
                open
                  ? h('div', { className: 'dsha-group-body' },
                    group.rows.map(row => card(row.entry, row.index)))
                  : null,
              )
            }),
          ),
        dirtyCount > 0
          ? h('div', { className: 'dsha-warn' },
            h('span', null, '有 ' + String(dirtyCount) + ' 条所在的文件还没保存，先保存更稳。'),
            h('button', {
              type: 'button',
              className: 'dsha-mini',
              title: '只把已保存的那些发出去',
              onClick: () => {
                const safe = toSend.filter(entry => entry.dirty !== true)
                if (safe.length > 0) deliver(safe, sessionId)
              },
            }, '先发已保存的'))
          : null,
        h('div', { className: 'dsha-foot' },
          h('button', {
            type: 'button',
            className: 'dsha-btn dsha-btn-primary',
            disabled: toSend.length === 0,
            onClick: send,
          }, '发送 ' + String(firstBatchSize) + ' 条'),
          h('span', { className: 'dsha-hint' }, chosen.length > 0
            ? '只发勾选的'
            : (batchCount > 1 ? '先发第 1 批，剩下的再发' : '会先填进输入框再发送')),
          h('div', { className: 'dsha-spacer' }),
          list.length > 0 ? h('button', {
            type: 'button',
            className: 'dsha-btn',
            onClick: () => {
              if (armed !== true) {
                setClearArm({ sid: sessionId, at: Date.now() })
                window.setTimeout(() => setClearArm(null), 3200)
                return
              }
              setClearArm(null)
              putItems(sessionId, [])
            },
          }, armed ? '再点一次清空' : '清空') : null,
        ),
        h('div', {
          className: 'dsha-edge dsha-edge-n',
          title: '拖动调整高度',
          onPointerDown: event => beginResize(event, 'n'),
        }),
        h('div', {
          className: 'dsha-edge dsha-edge-w',
          title: '拖动调整宽度',
          onPointerDown: event => beginResize(event, 'w'),
        }),
        h('div', {
          className: 'dsha-edge dsha-edge-e',
          title: '拖动调整宽度',
          onPointerDown: event => beginResize(event, 'e'),
        }),
        h('div', {
          className: 'dsha-edge dsha-edge-s',
          title: '拖动调整高度',
          onPointerDown: event => beginResize(event, 's'),
        }),
        h('div', {
          className: 'dsha-grip',
          title: '拖动缩放（宽高一起）',
          onPointerDown: event => beginResize(event, 'se'),
        }),
      )
      return panel
    }

    /* ------------------------------------------- 右侧文件编辑器（CodeMirror 6） */
    /* 全部假设都集中在这一段；任何一条失效都只让"文件批注"降级，不影响聊天批注。 */

    function editorRootOf(target) {
      try {
        if (!(target instanceof Element)) return null
        return target.closest('.cm-editor')
      } catch (error) {
        return null
      }
    }

    /** 复刻 EditorView.findFromDOM：CM6 把 tile 挂在 .cm-content 的 cmTile 私有字段上。 */
    function viewOf(root) {
      try {
        const content = root.querySelector('.cm-content')
        if (content === null) return null
        const tile = content.cmTile
        if (tile === null || tile === undefined) return null
        if (tile.view !== undefined && tile.view !== null) return tile.view
        if (tile.root !== undefined && tile.root !== null) return tile.root.view || null
        return null
      } catch (error) {
        return null
      }
    }

    function selectionOf(root, view) {
      try {
        if (view !== null && view.state !== undefined) {
          const main = view.state.selection.main
          if (main.empty === true) return null
          const text = view.state.sliceDoc(main.from, main.to)
          if (String(text).trim() === '') return null
          return { text, from: main.from, to: main.to }
        }
        const selection = window.getSelection()
        if (selection === null || selection.isCollapsed === true) return null
        if (selection.anchorNode === null || selection.focusNode === null) return null
        if (!root.contains(selection.anchorNode) || !root.contains(selection.focusNode)) return null
        const text = selection.toString()
        if (text.trim() === '') return null
        return { text, from: null, to: null }
      } catch (error) {
        return null
      }
    }

    function fileInfoOf(root) {
      try {
        const host = root.closest('[data-dsh-native-tab-host]')
          || root.closest('[data-dsh-better-sidebar]')
          || document.body
        let input = host.querySelector('input[class*="editorPathInput"]')
        if (input === null) {
          const candidates = Array.from(host.querySelectorAll('input[title]'))
            .filter(el => /^(?:[A-Za-z]:[\\/]|\/|\\\\)/u.test(el.title === undefined ? '' : el.title))
          if (candidates.length === 1) input = candidates[0]
        }
        if (input === null) return null
        const abs = input.title === undefined ? '' : input.title
        const rel = input.value === undefined ? '' : input.value
        if (abs === '') return null
        const posix = rel !== '' && rel !== abs ? rel.replace(/\\/gu, '/') : abs.replace(/\\/gu, '/')
        return { abs, rel, posixPath: posix, dirty: host.querySelector('[class*="dirtyDot"]') !== null }
      } catch (error) {
        return null
      }
    }

    function linesOf(view, from, to) {
      if (view === null || from === null) return {}
      try {
        const doc = view.state.doc
        let lineEnd = doc.lineAt(to).number
        if (to > from && doc.sliceString(to - 1, to) === '\n' && lineEnd > doc.lineAt(from).number) {
          lineEnd -= 1
        }
        return { lineStart: doc.lineAt(from).number, lineEnd }
      } catch (error) {
        return {}
      }
    }

    function contextOf(view, from, to) {
      if (view === null || from === null) return {}
      try {
        const doc = view.state.doc
        return {
          prefix: doc.sliceString(Math.max(0, from - 30), from),
          suffix: doc.sliceString(to, Math.min(doc.length, to + 30)),
        }
      } catch (error) {
        return {}
      }
    }

    /** 选区落在词中间时，向前后吸附到词边界；CJK 会扩到整串（受 24 字上限约束）。 */
    function snapRange(view, from, to) {
      try {
        const doc = view.state.doc
        const isWord = (ch) => ch !== '' && /[\p{L}\p{N}_]/u.test(ch)
        let a = from
        let b = to
        let guard = 24
        while (a > 0 && guard > 0) {
          if (!isWord(doc.sliceString(a - 1, a)) || !isWord(doc.sliceString(a, a + 1))) break
          a -= 1
          guard -= 1
        }
        guard = 24
        while (b < doc.length && guard > 0) {
          if (!isWord(doc.sliceString(b - 1, b)) || !isWord(doc.sliceString(b, b + 1))) break
          b += 1
          guard -= 1
        }
        if (a === from && b === to) return null
        return { text: doc.sliceString(a, b), from: a, to: b }
      } catch (error) {
        return null
      }
    }

    /** 右键落在右侧编辑器里且有选区时，把「文件 + 行号 + 原文」写进 runtime.target 并弹出浮层。 */
    function openFileSurface(root, event, trace) {
      const mark = typeof trace === 'function' ? trace : () => {}
      const view = viewOf(root)
      mark('3|view=' + (view === null ? 'null' : 'ok'))
      let picked = selectionOf(root, view)
      if (picked !== null && view !== null && picked.from !== null) {
        const snapped = snapRange(view, picked.from, picked.to)
        if (snapped !== null) {
          picked = snapped
          mark('3b|已吸附到词边界')
        }
      }
      if (picked === null) {
        commit({ debug: '在编辑器内，但没有选区（view=' + (view === null ? 'null' : 'ok') + '）' })
        mark('4|无选区|view=' + (view === null ? 'null' : 'ok'))
        return false
      }
      mark('5|选区=' + String(picked.text.length) + '字')
      const info = fileInfoOf(root)
      if (info === null) {
        commit({ debug: '有选区，但读不到文件路径（editorPathInput 没找到）' })
        mark('6|无路径')
        return false
      }
      mark('7|路径=' + info.posixPath)
      if (state.active === null) {
        commit({ debug: '有选区有路径，但没有活动会话' })
        mark('8|无会话')
        return false
      }
      const lines = linesOf(view, picked.from, picked.to)
      const context = contextOf(view, picked.from, picked.to)
      runtime.target = {
        kind: 'file',
        path: info.posixPath,
        absPath: info.abs,
        lineStart: typeof lines.lineStart === 'number' ? lines.lineStart : undefined,
        lineEnd: typeof lines.lineEnd === 'number' ? lines.lineEnd : undefined,
        prefix: context.prefix,
        suffix: context.suffix,
        quote: picked.text,
        dirty: info.dirty,
      }
      runtime.targetAt = Date.now()
      const x = Math.max(8, Math.min(event.clientX + 10, window.innerWidth - 380))
      /* 上边留 54：浮层顶上还挂着一颗表情胶囊，别让它顶出窗口。 */
      const y = Math.max(54, Math.min(event.clientY + 12, window.innerHeight - 280))
      commit({
        surface: { sessionId: state.active, x, y },
        debug: '已捕获 ' + info.posixPath + (typeof lines.lineStart === 'number' ? ':' + String(lines.lineStart) : '') + '（view=' + (view === null ? 'null' : 'ok') + '）',
      })
      mark('OK|' + info.posixPath + ':' + (typeof lines.lineStart === 'number' ? String(lines.lineStart) : '-'))
      return true
    }

    function installEditorHooks() {
      const describe = (target) => {
        try {
          if (!(target instanceof Element)) return '非元素'
          const cls = typeof target.className === 'string' && target.className !== ''
            ? '.' + target.className.split(/\s+/u)[0]
            : ''
          return target.tagName + cls
        } catch (error) {
          return '?'
        }
      }
      const onContextMenu = (event) => {
        /* 诊断已收尾：标题栏不再被改写（曾用 document.title 做外部可读的探针）。 */
        const trace = (mark) => {
          try { runtime.trace = String(mark).slice(0, 150) } catch (error) { /* 忽略 */ }
        }
        trace('0|进入监听|' + describe(event.target))
        let root = null
        try {
          root = editorRootOf(event.target)
        } catch (error) {
          root = null
        }
        if (root === null) {
          const preview = previewRootOf(event.target)
          if (preview === null) {
            commit({ debug: '右键@' + describe(event.target) + '（不在编辑器或预览内）' })
            trace('1|无编辑器容器|' + describe(event.target))
            return
          }
          let openedPreview = false
          try {
            openedPreview = openPreviewSurface(preview, event)
          } catch (error) {
            commit({ debug: '预览右键处理失败：' + String(error && error.message) })
            openedPreview = false
          }
          if (openedPreview) event.preventDefault()
          return
        }
        trace('2|找到编辑器')
        let opened = false
        try {
          opened = openFileSurface(root, event, trace)
        } catch (error) {
          commit({ debug: '编辑器右键处理失败：' + String(error && error.message) })
          trace('9|异常|' + String(error && error.message))
          opened = false
        }
        if (opened) event.preventDefault()
      }
      /**
       * 主对话里的兜底：DSH 自己的右键批注偶尔会把系统菜单吞掉却没开框（表现就是「右键没反应」）。
       *
       * 做法：先让 DSH 自己走完，等 60ms 再看 —— 已经有 .dsha-surface 说明它开框了，什么都不做；
       * 没有才自己开一个 target:'chat' 的。这里**不提前 preventDefault**：判不出来就把系统菜单放行。
       */
      const onChatContextMenu = (event) => {
        if (state.wideRightClick === false) return
        const target = event.target
        if (!(target instanceof Element)) return
        if (target.closest(MENU_SKIP_SELECTOR) !== null) return
        const flow = target.closest('[data-chat-flow]')
        if (flow === null) return
        const live = window.getSelection()
        if (live === null || live.isCollapsed === true || live.rangeCount === 0) return
        const range = live.getRangeAt(0)
        const startElement = range.startContainer.nodeType === 1
          ? range.startContainer
          : range.startContainer.parentElement
        if (startElement === null || !flow.contains(startElement)) return
        const quote = clipQuote(live.toString(), QUOTE_STORE_MAX)
        if (quote.length < 2) return
        const spot = spotForMouse(event)
        window.setTimeout(() => {
          /* 60ms 内 DSH 已经开了框，或用户点别处取消了选区 —— 都别再弹。 */
          try {
            if (document.querySelector('.dsha-surface') !== null) return
          } catch (error) {
            return
          }
          const still = window.getSelection()
          if (still === null || still.isCollapsed === true) return
          const sessionId = state.active
          if (sessionId === null || sessionId === undefined || sessionId === '') return
          runtime.target = { kind: 'chat', quote }
          runtime.targetAt = Date.now()
          commit({ surface: { sessionId, x: spot.x, y: spot.y }, debug: '主对话右键：自己开框' })
        }, 60)
      }
      document.addEventListener('contextmenu', onContextMenu, true)
      document.addEventListener('contextmenu', onChatContextMenu, true)
      return () => {
        document.removeEventListener('contextmenu', onContextMenu, true)
        document.removeEventListener('contextmenu', onChatContextMenu, true)
      }
    }

    /** 文件批注的浮层：位置由调用方（右键点）给，组件自己不算位置。 */
    function FileSurfaceHost() {
      const store = useStore()
      const surface = store.surface
      const hostRef = React.useRef(null)
      const close = () => {
        clearTarget()
        commit({ surface: null, docPending: null })
      }
      React.useEffect(() => {
        const onKey = (event) => { if (event.key === 'Escape') close() }
        /* 点空白处就关掉：以前只能点右下角「关闭」，很别扭。 */
        const onDown = (event) => {
          const host = hostRef.current
          if (host === null) return
          if (event.target instanceof Node && host.contains(event.target)) return
          close()
        }
        document.addEventListener('keydown', onKey)
        const timer = window.setTimeout(() => {
          document.addEventListener('pointerdown', onDown, true)
        }, 0)
        return () => {
          document.removeEventListener('keydown', onKey)
          document.removeEventListener('pointerdown', onDown, true)
          window.clearTimeout(timer)
        }
      }, [surface])
      /* 贴着窗口底部开框时整张卡会被裁掉一截（全屏文档里最明显，窗口底 320px 的钳位挡不住）：
         装进来以后量一次真实高度，装不下就往上顶；还装不下就贴到顶。 */
      React.useEffect(() => {
        if (surface === null || surface === undefined) return
        const host = hostRef.current
        if (host === null) return
        const rect = host.getBoundingClientRect()
        if (rect.height <= 0) return
        if (rect.bottom <= window.innerHeight - 8) return
        /* 上边留 54 是给卡片顶上那颗表情胶囊的 */
        const nextY = Math.max(54, Math.min(surface.y, window.innerHeight - rect.height - 8))
        if (nextY === surface.y) return
        commit({ surface: { ...surface, y: nextY } })
      }, [surface])
      if (surface === null || surface === undefined) return null
      return h('div', {
        ref: hostRef,
        className: 'dsha-float',
        style: { left: String(surface.x) + 'px', top: String(surface.y) + 'px' },
      }, h(AnnotateSurface, {
        key: String(runtime.targetAt),
        readText: () => null,
        dismiss: close,
        clearSelection: () => {},
        sessionId: surface.sessionId,
        initialKind: surface.kind,
      }))
    }

    /* ------------------------------------------------- 编辑器内的常驻高亮 */
    /* 不 import CodeMirror、也不建 Decoration（另一个实例的类身份不兼容），
       改成用 view.coordsAtPos 算屏幕矩形，自己画一层 pointer-events:none 的覆盖层。 */

    const docCache = new WeakMap()

    function visibleEditors() {
      try {
        return [...document.querySelectorAll('.cm-editor')].filter(el => el.getClientRects().length > 0)
      } catch (error) {
        return []
      }
    }

    function docTextOf(view) {
      const cached = docCache.get(view)
      const length = view.state.doc.length
      if (cached !== undefined && cached.length === length) return cached.text
      const text = view.state.doc.toString()
      docCache.set(view, { length, text })
      return text
    }

    /** 一个编辑器当前打开的是哪个文件（工作区相对路径），读不到就是空串。 */
    function editorPathOf(element) {
      try {
        const info = fileInfoOf(element)
        return info === null ? '' : info.posixPath
      } catch (error) {
        return ''
      }
    }

    /* ---------------------------------------------------------- 预览模式适配 */
    /* 预览是渲染后的 HTML：没有 EditorView，但选区就是原生选区，高亮用 CSS Custom Highlight。 */

    function previewRootOf(target) {
      try {
        if (!(target instanceof Element)) return null
        return target.closest('[class*="editorMd"]')
      } catch (error) {
        return null
      }
    }

    function visiblePreviews() {
      try {
        /* 不能用 offsetParent：侧栏里有 position:fixed / transform 时它会一直是 null。 */
        return [...document.querySelectorAll('[class*="editorMd"]')]
          .filter(el => el.getClientRects().length > 0)
      } catch (error) {
        return []
      }
    }

    /** 把预览容器的文本节点拼成一条，再按引文取回 Range。跨元素也能命中。 */
    function rangeInPreview(root, quote) {
      if (typeof quote !== 'string' || quote === '') return null
      try {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null)
        const parts = []
        let total = 0
        let node = walker.nextNode()
        while (node !== null) {
          const text = node.nodeValue === null ? '' : node.nodeValue
          if (text !== '') {
            parts.push({ node, start: total, text })
            total += text.length
          }
          node = walker.nextNode()
        }
        if (parts.length === 0) return null
        const full = parts.map(part => part.text).join('')
        const at = full.indexOf(quote)
        if (at < 0) return null
        const end = at + quote.length
        let startNode = null
        let startOffset = 0
        let endNode = null
        let endOffset = 0
        for (const part of parts) {
          const from = part.start
          const to = part.start + part.text.length
          if (startNode === null && at >= from && at < to) {
            startNode = part.node
            startOffset = at - from
          }
          if (end > from && end <= to) {
            endNode = part.node
            endOffset = end - from
            break
          }
        }
        if (startNode === null || endNode === null) return null
        const range = document.createRange()
        range.setStart(startNode, startOffset)
        range.setEnd(endNode, endOffset)
        return range
      } catch (error) {
        return null
      }
    }

    const PREVIEW_NAMES = ['dsha-q', 'dsha-idle', 'dsha-a', 'dsha-b', 'dsha-ans']

    /** 预览里的常驻高亮：用 CSS Custom Highlight，真正的 Dom Range，能跨元素。 */
    function paintPreviewHighlights(entries) {
      try {
        if (typeof CSS === 'undefined' || CSS.highlights === undefined || typeof Highlight === 'undefined') {
          return
        }
        for (const name of PREVIEW_NAMES) CSS.highlights.delete(name)
        const buckets = new Map()
        for (const entry of entries) {
          const wantPath = typeof entry.path === 'string' ? entry.path : ''
          for (const root of visiblePreviews()) {
            const here = editorPathOf(root)
            if (wantPath !== '' && here !== '' && here !== wantPath) continue
            const range = rangeInPreview(root, entry.quote)
            if (range === null) continue
            let name = 'dsha-q'
            if (entry.status === 'sent') name = Math.floor(Date.now() / 600) % 2 === 0 ? 'dsha-a' : 'dsha-b'
            else if (entry.status === 'sent-idle') name = 'dsha-idle'
            else if (entry.status === 'answered') name = 'dsha-ans'
            if (!buckets.has(name)) buckets.set(name, [])
            buckets.get(name).push(range)
            break
          }
        }
        for (const [name, ranges] of buckets) CSS.highlights.set(name, new Highlight(...ranges))
      } catch (error) {
        /* 浏览器不支持就当没有高亮，不影响批注本身 */
      }
    }

    /** 精确引文找不到时的回锚候选：取首尾各 8 字（改过之后通常还能命中）。 */
    function anchorNeedles(quote) {
      const text = typeof quote === 'string' ? quote.trim() : ''
      if (text === '') return []
      const out = [text]
      if (text.length > 12) {
        out.push(text.slice(0, 8))
        out.push(text.slice(-8))
      }
      return out.filter(item => item.length >= 4)
    }

    /** 一条批注在哪个编辑器、哪一段字符上。优先用行号提示，其次全文唯一命中。 */
    /* 按「批注条目」去定位：文件类批注用（entry 里有 path/lineStart/quote）。
       以前这个函数也叫 locateQuote，被下面 3 参数那版同名覆盖，导致文件高亮、定位、丢失判定全部落空。
       现在改名为 locateEntryQuote，两个各司其职。 */
    /**
     * 最长公共子串：把 quote 对齐到 blockText 上，返回对齐到的区间。
     * 用于「原文被改了几个字」的情况——逐字对不上，但大部分还在。
     * @param {string} blockText 段落正文。
     * @param {string} quote 批注当时的原文。
     * @returns {{from: number, to: number, length: number} | null}
     */
    function bestCommonSpan(blockText, quote) {
      if (typeof blockText !== 'string' || typeof quote !== 'string') return null
      const n = blockText.length
      const m = quote.length
      if (n === 0 || m === 0 || n > 4000 || m > 400) return null
      let best = 0
      let bestEnd = 0
      let prev = new Uint16Array(m + 1)
      let cur = new Uint16Array(m + 1)
      for (let i = 1; i <= n; i += 1) {
        cur[0] = 0
        const code = blockText.charCodeAt(i - 1)
        for (let j = 1; j <= m; j += 1) {
          if (code === quote.charCodeAt(j - 1)) {
            const value = prev[j - 1] + 1
            cur[j] = value
            if (value > best) {
              best = value
              bestEnd = i
            }
          } else {
            cur[j] = 0
          }
        }
        const swap = prev
        prev = cur
        cur = swap
      }
      if (best === 0) return null
      return { from: bestEnd - best, to: bestEnd, length: best }
    }

    /**
     * 模糊认句：原文改了几个字之后，用公共子串把高亮重新对上。
     *
     * 只在**够长**（≥8 字）、**够像**（公共子串 ≥60%）且**在段里唯一**时才认，
     * 任一条件不满足就返回 null —— 宁可只留段右角标记，也不把高亮画到别的句子上。
     * @param {string} blockText 段落正文。
     * @param {string} quote 批注当时的原文。
     * @returns {{from: number, to: number, length: number} | null}
     */
    /**
     * 子序列对齐：quote 的字符有多少能在 block 里按顺序找到，以及覆盖到 block 的哪一段。
     * 这是「改了几个字」的正确度量——连续片段会碎掉，子序列不会。
     * @param {string} blockText 段落正文。
     * @param {string} quote 批注当时的原文。
     * @returns {{matched: number, first: number, last: number} | null}
     */
    function subsequenceStats(blockText, quote) {
      if (typeof blockText !== 'string' || typeof quote !== 'string') return null
      const n = blockText.length
      const m = quote.length
      if (n === 0 || m === 0 || n > 1200 || m > 200) return null
      /* 表大小 (m+1)*(n+1)：最多约 24 万格，Uint16 约 480KB，只在这种兜底路径上用。 */
      const width = n + 1
      const table = new Uint16Array((m + 1) * width)
      for (let i = 1; i <= m; i += 1) {
        const code = quote.charCodeAt(i - 1)
        const row = i * width
        const prevRow = (i - 1) * width
        for (let j = 1; j <= n; j += 1) {
          if (code === blockText.charCodeAt(j - 1)) {
            table[row + j] = table[prevRow + j - 1] + 1
          } else {
            const up = table[prevRow + j]
            const left = table[row + j - 1]
            table[row + j] = up > left ? up : left
          }
        }
      }
      const matched = table[m * width + n]
      if (matched === 0) return null
      /* 回溯出对齐到的首尾位置（只为了知道高亮大概落在哪儿）。 */
      let i = m
      let j = n
      let last = -1
      let first = -1
      while (i > 0 && j > 0) {
        if (quote.charCodeAt(i - 1) === blockText.charCodeAt(j - 1)) {
          if (last < 0) last = j - 1
          first = j - 1
          i -= 1
          j -= 1
          continue
        }
        const up = table[(i - 1) * width + j]
        const left = table[i * width + (j - 1)]
        if (up >= left) i -= 1
        else j -= 1
      }
      if (last < 0 || first < 0) return null
      return { matched, first, last }
    }

    /**
     * 把片段扩到整句边界：向前后找句读（。！？；：或换行），把整句都圈进去。
     * 否则「改了几个字」时只有没改的那半句有颜色，看着像高亮被截断。
     * @param {string} blockText 段落正文。
     * @param {{from: number, to: number}} span 已命中的片段。
     * @returns {{from: number, to: number, length: number}}
     */
    function expandToSentence(blockText, span) {
      if (typeof blockText !== 'string' || span === null || span === undefined) return span
      const isBreak = (char) => '。！？；：\n'.indexOf(char) >= 0
      let from = span.from
      while (from > 0 && isBreak(blockText.charAt(from - 1)) !== true) from -= 1
      let to = span.to
      while (to < blockText.length && isBreak(blockText.charAt(to)) !== true) to += 1
      if (to < blockText.length && blockText.charAt(to) !== '\n') to += 1
      /* 整段没有标点（很长）时别把整段都涂上，只留原来的片段。 */
      if (to - from > 200) return { from: span.from, to: span.to, length: span.to - span.from }
      return { from, to, length: to - from }
    }

    /**
     * @param {string} blockText 段落正文。
     * @param {string} quote 批注当时的原文。
     * @param {boolean} [lenient] 原段内用的宽松模式：段落已经确定，门槛可以放宽（短句改字也认得出）。
     * @returns {{from: number, to: number, length: number} | null}
     */
    function fuzzyQuoteInBlock(blockText, quote, lenient) {
      if (typeof blockText !== 'string' || typeof quote !== 'string') return null
      const wanted = quote.trim()
      const loose = lenient === true
      /* 短句（<8 字，比如只划了「一段一个框」）也要能认：宽松模式覆盖率 60%、片段 2 字；
         严格模式（跨段搬运用）覆盖率 80%、片段 3 字，且必须段内唯一。 */
      const shortMode = wanted.length < 8
      if (wanted.length < (loose === true ? 3 : 4)) return null
      /* 1) 覆盖率：原文的字符有多少还能按顺序找到，才算「同一句被改过」。 */
      const stats = subsequenceStats(blockText, wanted)
      if (stats === null) return null
      const minRatio = loose === true ? 0.6 : (shortMode === true ? 0.8 : 0.7)
      if (stats.matched / wanted.length < minRatio) return null
      /* 2) 要有一段连续片段；宽松模式 2 字就够，严格模式 3/6 字。 */
      const span = bestCommonSpan(blockText, wanted)
      if (span === null) return null
      const minSpan = loose === true ? 2 : (shortMode === true ? 3 : 6)
      if (span.length < Math.max(minSpan, Math.floor(wanted.length * (loose === true ? 0.2 : 0.3)))) return null
      if (loose !== true) {
        const piece = blockText.slice(span.from, span.to)
        const first = blockText.indexOf(piece)
        if (first !== span.from) return null
        if (blockText.indexOf(piece, first + 1) >= 0) return null
      }
      /* 3) 认出这一句之后扩到整句：改字前半句、后半句都算同一句，用户点到就开卡。 */
      return expandToSentence(blockText, span)
    }

    function locateEntryQuote(entry) {
      const wantPath = typeof entry.path === 'string' ? entry.path : ''
      const needles = anchorNeedles(entry.quote)
      if (needles.length === 0) return null
      for (const element of visibleEditors()) {
        /* 关键：必须对上文件。否则两个内容相近的文件会互相串高亮。 */
        const here = editorPathOf(element)
        if (wantPath !== '' && here !== '' && here !== wantPath) continue
        const view = viewOf(element)
        if (view === null) continue
        let text
        try {
          text = docTextOf(view)
        } catch (error) {
          continue
        }
        for (const needle of needles) {
          let at = -1
          if (typeof entry.lineStart === 'number' && entry.lineStart > 0) {
            try {
              const line = view.state.doc.line(Math.min(entry.lineStart, view.state.doc.lines))
              const candidate = text.indexOf(needle, line.from)
              if (candidate >= 0 && candidate <= line.to) at = candidate
            } catch (error) {
              at = -1
            }
          }
          if (at < 0) at = text.indexOf(needle)
          if (at >= 0) return { view, from: at, to: at + needle.length }
        }
      }
      return null
    }

    function rectsForRange(view, from, to) {
      const out = []
      try {
        const doc = view.state.doc
        let pos = from
        while (pos <= to) {
          const line = doc.lineAt(pos)
          const end = Math.min(to, line.to)
          const start = view.coordsAtPos(pos, 1)
          const stop = view.coordsAtPos(end, -1)
          if (start !== null && stop !== null && Math.abs(start.top - stop.top) < 3) {
            out.push({
              left: Math.min(start.left, stop.left),
              top: start.top,
              width: Math.max(2, Math.abs(stop.right - start.left)),
              height: Math.max(8, start.bottom - start.top),
            })
          }
          if (line.to >= to) break
          pos = line.to + 1
        }
      } catch (error) {
        /* 忽略单条的几何失败 */
      }
      return out
    }

    function previewRangeFor(entry) {
      const wantPath = typeof entry.path === 'string' ? entry.path : ''
      const needles = anchorNeedles(entry.quote)
      if (needles.length === 0) return null
      for (const root of visiblePreviews()) {
        const here = editorPathOf(root)
        if (wantPath !== '' && here !== '' && here !== wantPath) continue
        for (const needle of needles) {
          const range = rangeInPreview(root, needle)
          if (range !== null) return { range, root }
        }
      }
      return null
    }

    /** 把矩形裁到容器可视区内；完全在外面的直接丢掉，否则滚动后会留下漂在外面的色块。 */
    function clipRect(rect, bound) {
      const left = Math.max(rect.left, bound.left)
      const right = Math.min(rect.left + rect.width, bound.right)
      const top = Math.max(rect.top, bound.top)
      const bottom = Math.min(rect.top + rect.height, bound.bottom)
      if (right - left < 1 || bottom - top < 1) return null
      return { left, top, width: right - left, height: bottom - top }
    }

    function scrollToRange(range) {
      try {
        const element = range.startContainer.parentElement
        if (element !== null) element.scrollIntoView({ block: 'center', behavior: 'smooth' })
        const selection = window.getSelection()
        if (selection !== null) {
          selection.removeAllRanges()
          selection.addRange(range)
        }
      } catch (error) {
        /* 滚不动就算了，高亮还在 */
      }
    }

    /** 预览里右键：没有编辑器，用原生选区 + 文件路径就能建批注（没有行号）。 */
    function openPreviewSurface(root, event) {
      if (state.active === null) return false
      const selection = window.getSelection()
      if (selection === null || selection.isCollapsed === true || selection.rangeCount === 0) return false
      const text = selection.toString()
      if (text.trim() === '') return false
      const info = fileInfoOf(root)
      if (info === null) return false
      runtime.target = {
        kind: 'file',
        path: info.posixPath,
        absPath: info.abs,
        quote: text,
        dirty: info.dirty,
      }
      runtime.targetAt = Date.now()
      const x = Math.max(8, Math.min(event.clientX + 10, window.innerWidth - 380))
      /* 同上：留 54px 给浮层顶上那颗表情胶囊。 */
      const y = Math.max(54, Math.min(event.clientY + 12, window.innerHeight - 280))
      commit({ surface: { sessionId: state.active, x, y }, debug: '预览里捕获 ' + info.posixPath })
      return true
    }

    /** 点面板里的批注 → 先让右侧栏切到那个文件，再跳到那一句。 */
    function jumpToEntry(entry) {
      const settle = (tag) => {
        const hit = locateEntryQuote(entry)
        if (hit === null) {
          /* 预览模式没有 CodeMirror，改在渲染后的 DOM 里找。 */
          const range = previewRangeFor(entry)
          if (range !== null) {
            scrollToRange(range.range)
            commit({ debug: tag + '：预览里定位成功' })
            return true
          }
          commit({ debug: tag + '：没找到原文（编辑 ' + String(visibleEditors().length) + ' / 预览 ' + String(visiblePreviews().length) + '）' })
          return false
        }
        try {
          hit.view.dispatch({
            selection: { anchor: hit.from, head: hit.to },
            scrollIntoView: true,
          })
          hit.view.focus()
          commit({ debug: tag + '：定位成功' })
          return true
        } catch (error) {
          commit({ debug: tag + '：定位异常 ' + String(error && error.message) })
          return false
        }
      }

      /* 跨文件：文件没开就先把它的 tab 打开（走 openInSidebar → openTab）。 */
      try {
        const ctx = runtime.ctx
        const service = ctx === null ? null : ctx.get('betterSidebar')
        const target = typeof entry.absPath === 'string' && entry.absPath !== ''
          ? entry.absPath
          : entry.path
        const canOpen = service !== null && service !== undefined
          && (typeof service.openTab === 'function' || typeof service.openFile === 'function')
        if (!canOpen) {
          commit({ debug: '定位：拿不到 betterSidebar.openTab，只能文档内跳' })
          return settle('文档内')
        }
        if (typeof target !== 'string' || target === '') {
          commit({ debug: '定位：这条批注没存路径' })
          return settle('文档内')
        }
        commit({ debug: '定位：切到 ' + target })
        openInSidebar(target, typeof entry.lineStart === 'number' ? entry.lineStart : undefined)
        /* 切 tab 后编辑器可能还没布局，稍等再定位一次。 */
        window.setTimeout(() => settle('跨文件'), 320)
        return true
      } catch (error) {
        console.warn('[annotate] 跨文件跳转失败，退回文档内定位', error)
        commit({ debug: '定位：openFile 抛错 ' + String(error && error.message) })
      }
      return settle('文档内')
    }

    function HighlightLayer() {
      const store = useStore()
      const [boxes, setBoxes] = React.useState([])

      const sessionId = store.active
      const marks = sessionId === null
        ? []
        : itemsOf(sessionId).filter(entry => (
          entry.target === 'file'
          && typeof entry.path === 'string'
          && entry.status !== 'resolved'
        ))
      const markCount = marks.length
      /* 状态变化必须触发重算：只靠条数会漏掉「queued → sent」这一步，闪烁就不会开始。 */
      const signature = marks.map(entry => entry.id + ':' + entry.status).join('|')
      const marksRef = React.useRef(marks)
      marksRef.current = marks

      React.useEffect(() => {
        if (markCount === 0) {
          setBoxes([])
          return undefined
        }
        let frame
        /* 「已发送」只闪一阵子：没有回执信号时不能让它永远闪下去。 */
        const displayStatus = (entry) => {
          if (entry.status !== 'sent') return entry.status
          const at = typeof entry.sentAt === 'number' ? entry.sentAt : 0
          return at > 0 && Date.now() - at > 120000 ? 'sent-idle' : 'sent'
        }
        const paint = () => {
          frame = undefined
          const next = []
          for (const entry of marksRef.current) {
            const status = displayStatus(entry)
            const hit = locateEntryQuote(entry)
            if (hit !== null) {
              const bound = hit.view.dom.getBoundingClientRect()
              const rects = rectsForRange(hit.view, hit.from, hit.to)
              rects.forEach((rect, index) => {
                const clipped = clipRect(rect, bound)
                if (clipped === null) return
                next.push({ key: entry.id + ':' + String(index), status, ...clipped })
              })
              continue
            }
            /* 预览模式没有 CodeMirror：直接用 Range 的客户矩形，和编辑器共用这层覆盖。 */
            const previewHit = previewRangeFor(entry)
            if (previewHit === null) continue
            const previewBound = previewHit.root.getBoundingClientRect()
            let index = 0
            for (const rect of previewHit.range.getClientRects()) {
              const clipped = clipRect(
                { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
                previewBound,
              )
              if (clipped === null) continue
              next.push({ key: entry.id + ':p' + String(index), status, ...clipped })
              index += 1
            }
          }
          setBoxes(next)
        }
        const schedule = () => {
          if (frame === undefined) frame = window.requestAnimationFrame(paint)
        }
        schedule()
        window.addEventListener('scroll', schedule, true)
        window.addEventListener('resize', schedule)
        let tick = 0
        const interval = window.setInterval(() => {
          tick += 1
          schedule()
          if (tick % 10 === 0 && sessionId !== null) {
            try {
              reconcileReplies(sessionId)
            } catch (error) {
              /* 读不到聊天流就算了，下一轮再试 */
            }
          }
        }, 200)
        return () => {
          window.removeEventListener('scroll', schedule, true)
          window.removeEventListener('resize', schedule)
          window.clearInterval(interval)
          if (frame !== undefined) window.cancelAnimationFrame(frame)
        }
      }, [sessionId, markCount, signature])

      if (boxes.length === 0) return null
      return h('div', { className: 'dsha-marks', 'aria-hidden': 'true' },
        boxes.map(box => h('div', {
          key: box.key,
          className: 'dsha-mark',
          'data-status': box.status,
          style: {
            left: String(Math.round(box.left)) + 'px',
            top: String(Math.round(box.top)) + 'px',
            width: String(Math.round(box.width)) + 'px',
            height: String(Math.round(box.height)) + 'px',
          },
        })))
    }

    /* -------------------------------------------------------------------- 文档模式 */
    /* 文档是我们自己渲染的：偏移、高亮、选区全在自己的 DOM 里，不依赖 CodeMirror 或别的插件。 */

    const DOC_PATH = '对话文档'
    /* 文档栏上会显示它：一眼看出跑的是不是刚改的那份客户端。 */
    const PLUGIN_VERSION = '0.121.1'

    /** 在聊天流里找最新一份 ```dsh-doc 围栏（助手输出的文档）。 */
    /** 测量包一层（7.2）：真实实现在 scanDocBlocksRaw。 */
    function scanDocBlocks() {
      const t0 = perfNow()
      try {
        return scanDocBlocksRaw()
      } finally {
        perfAdd('scan', perfNow() - t0)
      }
    }
    function scanDocBlocksRaw() {
      try {
        const flow = document.querySelector('[data-chat-flow]')
        if (flow === null) return { found: null, foundKey: '', mode: 'full', list: [], classes: [], probe: '聊天流没找到' }
        const codes = [...flow.querySelectorAll('pre code')]
        const marksOf = (element) => {
          const out = []
          let node = element
          for (let depth = 0; depth < 4 && node !== null; depth += 1) {
            const cls = typeof node.className === 'string' ? node.className : ''
            const lang = node.getAttribute === undefined ? null : node.getAttribute('data-language')
            const dataLang = node.dataset === undefined ? undefined : node.dataset.language
            out.push([cls, lang, dataLang])
            node = node.parentElement
          }
          return out
        }
        /* 两种写法都认：围栏语言写成 dsh-doc / dsh-doc+（块里没有哨兵行），
           以及普通围栏、正文首行是哨兵。dsh-doc+ 表示「接着往下续写」。 */
        const docMode = (element) => {
          const chain = marksOf(element)
          const has = (token) => chain.some(([cls, lang, dataLang]) => (
            String(cls).includes(token)
            || String(lang) === token
            || String(dataLang) === token
          ))
          if (has('dsh-doc+')) return 'append'
          if (has('dsh-doc') || has('language-doc')) return 'full'
          return null
        }
        const classes = codes.slice(-8).map((element) => {
          const chain = marksOf(element)
          return chain.map(([cls, lang, dataLang]) => String(cls) + (lang === null ? '' : '{lang:' + String(lang) + '}') + (dataLang === undefined ? '' : '{d:' + String(dataLang) + '}')).join(' < ')
        })
        const probe = codes.length === 0
          ? '一个 pre code 都没有'
          : marksOf(codes[codes.length - 1]).map(([cls, lang]) => String(cls) + (lang === null ? '' : '/lang=' + String(lang))).join(' | ')
        /* 按对话顺序分组：一份整篇文档 + 跟在它后面的所有续写块 = 一份可查看的文档。 */
        const groups = []
        /* 同一节点里的第几份整篇 —— 键用它，**不用标题**。
           标题是流式长出来的（# 标 → # 标题 → …），拿标题当键 = 每拍一个新键：
           文档库堆十几条、批注记着的 docKey 对不上、高亮和段角标整批消失（角标 float 还会重排段落）。 */
        const perNode = new Map()
        let latest = null
        let latestKey = ''
        for (let index = 0; index < codes.length; index += 1) {
          const element = codes[index]
          const text = typeof element.textContent === 'string' ? element.textContent : ''
          if (text.trim() === '') continue
          const byClass = docMode(element)
          let mode = byClass
          let body = text
          if (mode === null) {
            /* 普通围栏：认首行哨兵，dsh-doc 是整篇，dsh-doc+ 是往后面续写。 */
            const lines = text.split('\n')
            const first = lines[0] === undefined ? '' : lines[0].trim().toLowerCase()
            if (first === 'dsh-doc') mode = 'full'
            else if (first === 'dsh-doc+') mode = 'append'
            if (mode !== null) body = lines.slice(1).join('\n')
          }
          if (mode === null) continue
          const holder = typeof element.closest === 'function'
            ? element.closest('[data-chat-node-key]')
            : null
          const base = holder === null || holder === undefined
            ? 'blk' + String(index)
            : String(holder.getAttribute('data-chat-node-key') || 'blk' + String(index))
          if (mode === 'full') {
            const ordinal = perNode.get(base) === undefined ? 0 : perNode.get(base)
            perNode.set(base, ordinal + 1)
            const key = base + '#' + String(ordinal)
            groups.push({ key, holder: base, source: body, appends: [] })
            latest = { body, mode, key }
            latestKey = key
            continue
          }
          /* 增量只能接到「同一个聊天节点里的上一份整篇」后面：否则第二份文档的第一段增量会挂到
             第一份屁股上 —— 正文在两份之间来回换，就是「两份互相闪」。 */
          const lastGroup = groups.length === 0 ? null : groups[groups.length - 1]
          if (lastGroup !== null && lastGroup.holder === base) {
            lastGroup.appends.push(body)
            latest = { body, mode, key: lastGroup.key }
            latestKey = lastGroup.key
          }
        }
        /* 这里**不做**「猜哪块是文档」的兜底：试过（首行是 # 标题、≥8 行、≥2 个标题、全流唯一），
           结果是在哨兵块被虚拟列表卸载的那几拍里，把别的 markdown 代码块猜成了文档、还顶掉了真文档。
           缺哨兵时改成由用户点「导入为文档」（见 DocPanel 的空状态），宁可多点一下，不许猜错。 */
        /* 哨兵缺失时的候选：最近一个「首行是 # 标题、≥8 行」的代码块。只报出来，绝不自动导入。 */
        let candidate = ''
        /* 只有「一份文档都没识别出来」时才去找候选：否则流式生成期间这个候选值每 300ms 都在变，
           setState 一拍一次、整块重渲染，正文看起来就在闪（这个坑踩过一次）。 */
        if (latest === null) {
          for (let index = codes.length - 1; index >= 0; index -= 1) {
            const text = typeof codes[index].textContent === 'string' ? codes[index].textContent : ''
            const lines = text.split('\n')
            if (lines.length < 8) continue
            if (/^#\s+/u.test(String(lines[0] === undefined ? '' : lines[0]).trim()) !== true) continue
            candidate = text
            break
          }
        }
        const list = groups.map((entry) => {
          const text = entry.appends.reduce((acc, part) => acc + (part === '' ? '' : '\n\n' + part), entry.source)
          const heading = /^#{1,6}\s*(.+)$/mu.exec(text)
          const plain = text.split('\n').filter(line => line.trim() !== '')[0] || '未命名文档'
          return {
            key: entry.key,
            title: (heading === null ? plain : heading[1]).replace(/[*`]/gu, '').trim().slice(0, 40),
            text,
          }
        })
        list.reverse()
        return {
          found: latest === null ? null : latest.body,
          /* foundKey 必须和 found 来自**同一份**：以前这里取「最后一个整篇组」，
             而 found 可能是一份增量，两者不同源 → 下面加载时的 key 守卫形同虚设。 */
          foundKey: latest === null ? '' : latestKey,
          mode: latest === null ? 'full' : latest.mode,
          list,
          classes,
          probe,
          candidate,
        }
      } catch (error) {
        return { found: null, foundKey: '', mode: 'full', list: [], classes: [], probe: String(error && error.message) }
      }
    }

    function findLatestDocBlock() {
      return scanDocBlocks().found
    }

    /** 把 markdown 行内语法解析成 runs（导入文档时用，保证 `**粗体**` 能正确上样式）。 */
    function parseInlineRuns(text) {
      const runs = []
      const pattern = /(\*\*[^*]+\*\*|~~[^~]+~~|`[^`]+`|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/u
      let rest = text
      while (rest !== '') {
        const matched = pattern.exec(rest)
        if (matched === null) {
          runs.push({ text: rest })
          break
        }
        if (matched.index > 0) runs.push({ text: rest.slice(0, matched.index) })
        const token = matched[0]
        let inner = token
        let style = {}
        if (token.startsWith('**')) {
          inner = token.slice(2, -2)
          style = { bold: true }
        } else if (token.startsWith('~~')) {
          inner = token.slice(2, -2)
          style = { strike: true }
        } else if (token.startsWith('`')) {
          inner = token.slice(1, -1)
          style = { code: true }
        } else if (token.startsWith('*')) {
          inner = token.slice(1, -1)
          style = { italic: true }
        } else {
          const link = /^\[([^\]]+)\]\(([^)]+)\)$/u.exec(token)
          if (link !== null) {
            inner = link[1]
            style = { href: link[2] }
          }
        }
        runs.push({ text: inner, ...style })
        rest = rest.slice(matched.index + token.length)
      }
      if (runs.length === 0) runs.push({ text: '' })
      return runs
    }

    function makeBlock(kind, raw) {
      const runs = parseInlineRuns(String(raw).trim())
      return { kind, text: runsText(runs), runs }
    }

    /** 编辑模式里保存时：把 contentEditable 的 DOM 解析回 runs，粗体、行内码、链接都保住。 */
    function runsFromDom(element) {
      const out = []
      const pushText = (text, style) => {
        if (text === '') return
        const run = { text, ...style }
        const last = out[out.length - 1]
        if (last !== undefined && RUN_KEYS.every(key => last[key] === run[key])) last.text += text
        else out.push(run)
      }
      const walk = (node, style) => {
        for (const child of node.childNodes) {
          if (child.nodeType === 3) {
            pushText(String(child.nodeValue === null ? '' : child.nodeValue), style)
            continue
          }
          if (child.nodeType !== 1) continue
          const tag = String(child.tagName || '').toLowerCase()
          if (tag === 'br') {
            pushText('\n', style)
            continue
          }
          const next = { ...style }
          if (tag === 'strong' || tag === 'b') next.bold = true
          if (tag === 'em' || tag === 'i') next.italic = true
          if (tag === 's' || tag === 'del' || tag === 'strike') next.strike = true
          if (tag === 'code') next.code = true
          if (tag === 'a') {
            const href = child.getAttribute === undefined ? null : child.getAttribute('href')
            if (typeof href === 'string') next.href = href
          }
          const inline = child.style
          if (inline !== undefined && inline !== null) {
            const weight = String(inline.fontWeight || '')
            if (weight === '700' || weight === 'bold') next.bold = true
            if (String(inline.fontStyle || '') === 'italic') next.italic = true
            if (String(inline.textDecoration || '').includes('line-through')) next.strike = true
            if (String(inline.color || '') !== '') next.color = String(inline.color)
            if (String(inline.fontFamily || '').includes('mono')) next.code = true
          }
          if (tag === 'div' || tag === 'p') {
            if (out.length > 0) pushText('\n', style)
            walk(child, style)
            continue
          }
          walk(child, next)
        }
      }
      walk(element, {})
      const tidy = out.map(run => ({ ...run, text: run.text.replace(/\u00a0/gu, ' ') }))
      const merged = []
      for (const run of tidy) {
        if (run.text === '') continue
        const last = merged[merged.length - 1]
        if (last !== undefined && RUN_KEYS.every(key => last[key] === run[key])) last.text += run.text
        else merged.push(run)
      }
      const text = merged.map(run => run.text).join('').replace(/\n+$/u, '').replace(/[ \t]+$/gu, '')
      if (text === '') return { text: '', runs: [{ text: '' }] }
      return { text, runs: merged }
    }

    /** runs → markdown，导出时用。 */
    function runsMarkdown(block) {
      const runs = runsOf(block)
      return runs.map((run) => {
        let text = run.text
        if (text === '') return ''
        if (run.code === true) text = '`' + text + '`'
        if (run.strike === true) text = '~~' + text + '~~'
        if (run.italic === true) text = '*' + text + '*'
        if (run.bold === true) text = '**' + text + '**'
        if (typeof run.href === 'string' && run.href !== '') text = '[' + text.replace(/\[/gu, '\\[') + '](' + run.href + ')'
        return text
      }).join('')
    }

    /** 相对时间，下拉里标版本新旧用。 */
    function whenText(at) {
      const ms = Date.now() - Number(at === undefined || at === null ? 0 : at)
      if (!Number.isFinite(ms) || ms < 0) return ''
      if (ms < 60000) return '刚刚'
      if (ms < 3600000) return String(Math.max(1, Math.round(ms / 60000))) + ' 分钟前'
      if (ms < 86400000) return String(Math.max(1, Math.round(ms / 3600000))) + ' 小时前'
      return String(Math.max(1, Math.round(ms / 86400000))) + ' 天前'
    }

    /** 整篇文档 + 文末批注清单，导出一份能带走的 markdown。 */
    function docToMarkdown(blocks, marks) {
      const lines = []
      for (const block of blocks) {
        const body = runsMarkdown(block)
        if (block.kind === 'h1') lines.push('# ' + body)
        else if (block.kind === 'h2') lines.push('## ' + body)
        else if (block.kind === 'h3') lines.push('### ' + body)
        else if (block.kind === 'h4') lines.push('#### ' + body)
        else if (block.kind === 'li') {
          const pad = ' '.repeat(Math.max(0, Math.min(6, Number(block.depth) || 0)) * 2)
          const box = block.task === undefined || block.task === null ? '' : (block.task === 'done' ? '[x] ' : '[ ] ')
          const dot = typeof block.num === 'number' ? String(block.num) + '. ' : '- '
          lines.push(pad + dot + box + body)
        }
        else if (block.kind === 'quote') lines.push('> ' + body)
        else if (block.kind === 'code') lines.push('```' + String(block.lang === undefined || block.lang === null || block.lang === 'svg' ? '' : block.lang) + '\n' + body + '\n```')
        else if (block.kind === 'hr') lines.push('---')
        else if (block.kind === 'svg') lines.push('```svg\n' + String(block.text) + '\n```')
        else if (block.kind === 'table') {
          const rows = tableRowsOf(block)
          const width = rows.reduce((most, row) => Math.max(most, row.length), 0)
          const cell = value => String(value === undefined ? '' : value).replace(/\|/gu, '\\\\|')
          const line = row => '| ' + Array.from({ length: width }, (_, at) => cell(row[at])).join(' | ') + ' |'
          /* 表格原样写回：表头 + 分隔行 + 数据行，导出的 md 能再被别处解析。 */
          const table = [line(rows[0] === undefined ? [] : rows[0]),
            '|' + Array.from({ length: width }, () => ' --- ').join('|') + '|'].concat(rows.slice(1).map(line))
          lines.push(table.join('\n'))
        }
        else lines.push(body)
        /* 列表项之间不留空行，其余块之间留一行 */
        if (block.kind !== 'li') lines.push('')
      }
      const list = (Array.isArray(marks) ? marks : [])
        .filter(entry => entry.status !== 'resolved')
        .slice()
        .sort((a, b) => Number(a.blockIndex === undefined ? 0 : a.blockIndex) - Number(b.blockIndex === undefined ? 0 : b.blockIndex))
      if (list.length > 0) {
        lines.push('---')
        lines.push('')
        lines.push('## 批注')
        lines.push('')
        for (const entry of list) {
          lines.push('> ' + String(entry.quote === undefined ? '' : entry.quote).replace(/\n/gu, ' '))
          lines.push('')
          lines.push('我：' + String(entry.note === undefined ? '' : entry.note))
          if (typeof entry.reply === 'string' && entry.reply !== '') {
            lines.push('')
            lines.push(entry.reply.replace(/\n/gu, '\n\n'))
          }
          lines.push('')
        }
      }
      return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n'
    }

    /** 极简 markdown：标题、列表、引用、代码块、段落；行内只处理 **粗体** 和 `代码`。 */
    /* ---------------------------------------------------------------- 图卡（```svg） */
    /* 模型直接写 SVG，不做 JSX 转译：插件零构建，引不进 Babel。
       这里只负责「过滤 + 显示 + 存成 PNG」，图里不跑任何脚本。 */

    /** 把一段 SVG 源码收拾成可安全渲染的样子；挡不住就明确拒绝，绝不半渲染。 */
    function sanitizeSvg(raw) {
      const text = String(raw === undefined || raw === null ? '' : raw)
      const start = text.search(/<svg\b/iu)
      const end = text.lastIndexOf('</svg>')
      if (start < 0 || end < 0 || end < start) return { ok: false, reason: '没有完整的 <svg>…</svg>' }
      let svg = text.slice(start, end + 6)
      svg = svg.replace(/<script\b[\s\S]*?<\/script\s*>/giu, '')
      svg = svg.replace(/<script\b[^>]*\/>/giu, '')
      svg = svg.replace(/<foreignObject\b[\s\S]*?<\/foreignObject\s*>/giu, '')
      svg = svg.replace(/<(image|iframe|embed|object)\b[\s\S]*?(<\/\1\s*>|\/>)/giu, '')
      svg = svg.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/giu, '')
      /* href 只留同文档锚点（渐变、箭头 marker 都靠 #id）；javascript: 与外链一律删。 */
      svg = svg.replace(/\s(?:xlink:href|href)\s*=\s*("(?!#)[^"]*"|'(?!#)[^']*')/giu, '')
      svg = svg.replace(/url\(\s*['"]?(?:\w+:)?\/\/[^)]*\)/giu, 'none')
      if (!/xmlns\s*=/iu.test(svg)) svg = svg.replace(/<svg\b/iu, '<svg xmlns="http://www.w3.org/2000/svg"')
      if (svg.length > 200000) return { ok: false, reason: '图太大（超过 200KB）' }
      return { ok: true, svg }
    }

    /** 从 viewBox 取宽高比；取不到给 760×556（Claude 那批图的常见尺寸）。 */
    function svgSizeOf(svg) {
      const matched = /viewBox\s*=\s*["']\s*([-\d.]+)[\s,]+([-\d.]+)[\s,]+([-\d.]+)[\s,]+([-\d.]+)/iu.exec(String(svg))
      if (matched !== null) {
        const w = Number(matched[3])
        const h = Number(matched[4])
        if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) return { w, h }
      }
      return { w: 760, h: 556 }
    }

    /** 图的名字：优先 aria-label，其次 title；都没有就叫「图」。 */
    function svgLabelOf(svg) {
      const text = String(svg)
      const aria = /aria-label\s*=\s*["']([^"']{1,80})["']/iu.exec(text)
      if (aria !== null) return aria[1]
      const title = /<title[^>]*>([^<]{1,80})<\/title>/iu.exec(text)
      if (title !== null) return title[1]
      return '图'
    }

    /** 文件名里不能有的字符换掉，留中文。 */
    function safeFileName(name) {
      const base = String(name === undefined || name === null ? '' : name)
        .replace(/[\\/:*?"<>|\s]+/gu, '-')
        .replace(/^-+|-+$/gu, '')
        .slice(0, 60)
      return base === '' ? 'figure' : base
    }

    /**
     * 把 SVG 存成 PNG：SVG → data URL → Image → canvas → Blob → 下载。
     * 不依赖任何第三方库；同源 data URL 不会污染 canvas。
     */
    function downloadSvgPng(svgText, name) {
      return new Promise((resolve) => {
        try {
          const size = svgSizeOf(svgText)
          const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(String(svgText))
          const image = new Image()
          image.onload = () => {
            try {
              const scale = 2
              const width = Math.max(1, Math.round(image.naturalWidth > 0 ? image.naturalWidth : size.w))
              const height = Math.max(1, Math.round(image.naturalHeight > 0 ? image.naturalHeight : size.h))
              const canvas = document.createElement('canvas')
              canvas.width = width * scale
              canvas.height = height * scale
              const paint = canvas.getContext('2d')
              if (paint === null) { resolve(false); return }
              /* 白底：网页深色主题下导出的图贴进 Word 也不会变成透明块。 */
              paint.fillStyle = '#ffffff'
              paint.fillRect(0, 0, canvas.width, canvas.height)
              paint.drawImage(image, 0, 0, canvas.width, canvas.height)
              canvas.toBlob((blob) => {
                if (blob === null) { resolve(false); return }
                const link = document.createElement('a')
                link.href = URL.createObjectURL(blob)
                link.download = safeFileName(name) + '.png'
                link.click()
                window.setTimeout(() => { try { URL.revokeObjectURL(link.href) } catch (error) { /* 忽略 */ } }, 4000)
                resolve(true)
              }, 'image/png')
            } catch (error) { resolve(false) }
          }
          image.onerror = () => resolve(false)
          image.src = url
        } catch (error) { resolve(false) }
      })
    }

    /** 图卡外壳：标题条 + 「下载 PNG」+ 图本身。 */
    function renderSvgFigure(block, index) {
      const clean = sanitizeSvg(block.text)
      if (clean.ok !== true) {
        return h('div', { key: 'b' + String(index), className: 'dsha-doc-p dsha-fig-bad', 'data-block': String(index) },
          '图块渲染不了：' + clean.reason)
      }
      const size = svgSizeOf(clean.svg)
      const label = svgLabelOf(clean.svg)
      const src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(clean.svg)
      return h('div', { key: 'b' + String(index), className: 'dsha-fig', 'data-block': String(index) },
        h('div', { className: 'dsha-fig-bar' },
          h('span', { className: 'dsha-fig-label', title: label }, label),
          h('button', {
            type: 'button',
            className: 'dsha-mini',
            title: '把这个图存成 PNG（白底、两倍分辨率）',
            onClick: () => { void downloadSvgPng(clean.svg, label) },
          }, '下载 PNG')),
        h('img', {
          className: 'dsha-fig-img',
          src,
          alt: label,
          draggable: false,
          style: { aspectRatio: String(size.w) + ' / ' + String(size.h) },
        }))
    }
    /* ---------------------------------------------------------------- 表格（GFM 管道表） */
    /**
     * 把 `|a|b|` 拆成 ['a','b']；两头的空管道丢掉，单元格里的空白 trim。
     * 状态机而不是 split('|')：`\|` 是转义的管道，反引号里的 `|`（如 `a|b`）也不算分隔，
     * 以前这两种都会把一行拆成 6、7 列（真实文档里就有）。
     */
    function splitTableRow(line) {
      const text = String(line).trim()
      const cells = []
      let cell = ''
      let inCode = false
      let escaped = false
      let started = false
      for (let at = 0; at < text.length; at += 1) {
        const ch = text[at]
        if (escaped) {
          cell += ch
          escaped = false
          continue
        }
        if (ch === '\\') {
          escaped = true
          continue
        }
        if (ch === '`') {
          inCode = !inCode
          cell += ch
          continue
        }
        if (ch === '|' && !inCode) {
          started = true
          cells.push(cell.trim())
          cell = ''
          continue
        }
        cell += ch
      }
      cells.push(cell.trim())
      /* `|a|b|` 这种首尾带管道的写法，两端会各多出一个空单元格。 */
      if (started && cells.length > 0 && cells[0] === '' && text.startsWith('|')) cells.shift()
      if (cells.length > 1 && cells[cells.length - 1] === '' && text.endsWith('|')) cells.pop()
      return cells
    }

    /** 表格的行：优先用解析时存下的 rows；旧存档只有 text 时按管道拆回来。 */
    function tableRowsOf(block) {
      if (block !== null && block !== undefined && Array.isArray(block.rows) && block.rows.length > 0) {
        return block.rows.filter(row => Array.isArray(row))
      }
      const text = String(block === null || block === undefined || block.text === undefined ? '' : block.text)
      const rows = []
      for (const line of text.split('\n')) {
        if (line.trim() === '') continue
        if (isTableDivider(line)) continue
        if (line.indexOf('|') < 0) continue
        rows.push(splitTableRow(line))
      }
      return rows
    }
    /** 是不是 |---|---| 这种分隔行（允许 :---: 对齐）。 */
    function isTableDivider(line) {
      const text = String(line).trim()
      if (text.indexOf('|') < 0) return false
      return /^\|?[\s:|-]+\|[\s:|-]*$/u.test(text) && text.indexOf('-') >= 0
    }
    function parseMarkdownDoc(source) {
      const lines = String(source).replace(/\r\n?/gu, '\n').split('\n')
      const blocks = []
      let inCode = false
      let codeLines = []
      let codeLang = ''
      for (let cursor = 0; cursor < lines.length; cursor += 1) {
        const line = lines[cursor]
        /* 表格：本行有管道 + 下一行是 |---| 分隔 ⇒ 从这里吃到第一个不像表格的行为止。 */
        if (!inCode && line.indexOf('|') >= 0 && cursor + 1 < lines.length && isTableDivider(lines[cursor + 1])) {
          const rows = [splitTableRow(line)]
          cursor += 2
          while (cursor < lines.length && lines[cursor].indexOf('|') >= 0 && lines[cursor].trim() !== '') {
            rows.push(splitTableRow(lines[cursor]))
            cursor += 1
          }
          cursor -= 1
          blocks.push({
            kind: 'table',
            rows,
            /* text 只用于查找/导出：每行用 | 连起来，和原文一一对应。 */
            text: rows.map(row => row.join(' | ')).join('\n'),
          })
          continue
        }
        if (/^\s*```/u.test(line)) {
          if (inCode) {
            /* ```svg 单独成「图卡」：内容不进代码块样式，交给 renderSvgFigure 画。 */
            blocks.push(codeLang === 'svg'
              ? { kind: 'svg', text: codeLines.join('\n') }
              : { kind: 'code', text: codeLines.join('\n'), lang: codeLang })
            codeLines = []
            inCode = false
            codeLang = ''
          } else {
            const info = /^\s*```+\s*([^\s`]*)/u.exec(line)
            codeLang = info === null ? '' : String(info[1]).toLowerCase()
            inCode = true
          }
          continue
        }
        if (inCode) {
          codeLines.push(line)
          continue
        }
        const heading = /^(#{1,6})\s+(.*)$/u.exec(line)
        if (heading !== null) {
          blocks.push(makeBlock('h' + String(heading[1].length), heading[2]))
          continue
        }
        const bullet = /^(\s*)[-*]\s+(.*)$/u.exec(line)
        if (bullet !== null) {
          /* 缩进 2 空格算一层：以前 2/4 空格全被抹平成同级。depth 只影响缩进，不进正文。 */
          const depth = Math.min(6, Math.floor(bullet[1].replace(/\t/gu, '  ').length / 2))
          /* GFM 任务列表：以前 `[ ]` 会原样留在正文里（显示成「• [ ] …」）。 */
          const task = /^\[([ xX])\]\s*(.*)$/u.exec(bullet[2])
          const base = task !== null ? { ...makeBlock('li', task[2]), task: task[1] === ' ' ? 'open' : 'done' } : makeBlock('li', bullet[2])
          blocks.push(depth > 0 ? { ...base, depth } : base)
          continue
        }
        const ordered = /^(\s*)(\d+)\.\s+(.*)$/u.exec(line)
        if (ordered !== null) {
          /* 编号只存字段，不拼回 text：拼回去会让已存批注的偏移整体错位。 */
          const depth = Math.min(6, Math.floor(ordered[1].replace(/\t/gu, '  ').length / 2))
          const item = { ...makeBlock('li', ordered[3]), num: Number(ordered[2]) }
          blocks.push(depth > 0 ? { ...item, depth } : item)
          continue
        }
        if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/u.test(line)) {
          /* 水平线：以前当成一段正文，正文里就显示一串 ---（HANDOFF 里 14 处）。 */
          blocks.push({ kind: 'hr', text: '' })
          continue
        }
        const quote = /^\s*>\s?(.*)$/u.exec(line)
        if (quote !== null) {
          blocks.push(makeBlock('quote', quote[1]))
          continue
        }
        if (line.trim() === '') continue
        blocks.push(makeBlock('p', line))
      }
      if (inCode) blocks.push(codeLang === 'svg' ? { kind: 'svg', text: codeLines.join('\n') } : { kind: 'code', text: codeLines.join('\n'), lang: codeLang })
      return blocks
    }

    /** 把一段文字切成带样式的片段，偏移与原文一一对应。 */
    function inlineSegments(text) {
      const segments = []
      const pattern = /(\*\*[^*]+\*\*|`[^`]+`)/u
      let rest = text
      let offset = 0
      while (rest !== '') {
        const matched = pattern.exec(rest)
        if (matched === null) {
          segments.push({ text: rest, bold: false, code: false })
          break
        }
        if (matched.index > 0) {
          segments.push({ text: rest.slice(0, matched.index), bold: false, code: false })
          offset += matched.index
        }
        const token = matched[0]
        const inner = token.startsWith('**') ? token.slice(2, -2) : token.slice(1, -1)
        segments.push({ text: inner, bold: token.startsWith('**'), code: token.startsWith('`') })
        offset += token.length
        rest = rest.slice(matched.index + token.length)
      }
      return segments
    }

    /** 按批注区间切分片段，返回可直接渲染的 React 节点。 */
    function segmentsWithMarks(text, ranges) {
      const segments = inlineSegments(text)
      const out = []
      let cursor = 0
      for (const segment of segments) {
        const start = cursor
        const end = cursor + segment.text.length
        cursor = end
        let pieces = [{ from: start, to: end }]
        for (const range of ranges) {
          const nextPieces = []
          for (const piece of pieces) {
            if (range.to <= piece.from || range.from >= piece.to) {
              nextPieces.push(piece)
              continue
            }
            if (range.from > piece.from) nextPieces.push({ from: piece.from, to: range.from })
            nextPieces.push({
              from: Math.max(piece.from, range.from),
              to: Math.min(piece.to, range.to),
              mark: range.id,
              status: range.status,
              shifted: range.shifted === true,
            })
            if (range.to < piece.to) nextPieces.push({ from: range.to, to: piece.to })
          }
          pieces = nextPieces
        }
        for (const piece of pieces) {
          const slice = segment.text.slice(piece.from - start, piece.to - start)
          if (slice === '') continue
          out.push({
            key: String(out.length),
            text: slice,
            bold: segment.bold,
            code: segment.code,
            mark: piece.mark,
            status: piece.status,
            shifted: piece.shifted === true,
          })
        }
      }
      return out
    }

    /**
     * 右键落在这些地方属于「操作」而不是「文章」：不该弹批注框，右键要留给它们自己
     * （否则点「导出」、拖线程卡、改字号时右键也会跳出批注框，还顺手吞掉系统菜单）。
     */
    const MENU_SKIP_SELECTOR = 'button,input,textarea,select,option,a,.dsha-doc-bar,.dsha-doc-head,'
      + '.dsha-thread,.dsha-drawer,.dsha-find,.dsha-nav,.dsha-block-mark,.dsha-toolbar,.dsha-emoji,'
      + '[contenteditable="true"]'

    /** 段落的纯文本：右上角那个批注数标记（.dsha-block-mark）不是正文，量偏移时得剔掉。 */
    function blockPlainText(blockElement) {
      try {
        const copy = blockElement.cloneNode(true)
        for (const badge of copy.querySelectorAll('.dsha-block-mark')) badge.remove()
        return typeof copy.textContent === 'string' ? copy.textContent : ''
      } catch (error) {
        return ''
      }
    }

    /**
     * 选区拖到下一段时的退化：只认起点这一段，从起点截到块尾。
     * 以前这里直接返回 null，结果是「拖了半句话横跨两段 → 什么都没弹」，用户以为插件没反应。
     */
    function clipToBlockEnd(start, blockText) {
      const body = typeof blockText === 'string' ? blockText : ''
      const raw = typeof start === 'number' && Number.isFinite(start) ? start : 0
      const at = Math.max(0, Math.min(Math.floor(raw), body.length))
      const text = body.slice(at)
      return text.trim() === '' ? null : { start: at, end: body.length, text }
    }

    /**
     * 开框前的最后一道核对：文档每 300ms 会被重新加载，选区算出来的偏移可能已经挂在别的句子上。
     *
     * - 偏移处正好是这句话 → 直接用；
     * - 对不上就在这一段里反查，**唯一命中**才纠正（多处命中就放弃，宁可不弹也不挂错句子）；
     * - 找不到 → null，调用方放行，不 preventDefault。
     */
    function locateQuote(blockText, start, quote) {
      const body = typeof blockText === 'string' ? blockText : ''
      const word = typeof quote === 'string' ? quote : ''
      if (body === '' || word === '') return null
      const raw = typeof start === 'number' && Number.isFinite(start) ? Math.floor(start) : 0
      const at = Math.max(0, Math.min(raw, Math.max(0, body.length - word.length)))
      if (body.slice(at, at + word.length) === word) return { start: at, end: at + word.length }
      const found = body.indexOf(word)
      if (found < 0) return null
      if (body.indexOf(word, found + 1) >= 0) return null
      return { start: found, end: found + word.length }
    }

    /**
     * 「现在」正文里的段落：右键处理器注册在很久以前，闭包里的 doc 可能已经被刷新过好几次。
     * 所以每次都从 live state 里现取，历史版也按 docPick 现解析。
     */
    function liveDocBlocks(sessionId, pick) {
      const current = state === null || state === undefined ? null : state.doc
      if (typeof pick === 'string' && pick !== '') {
        const entry = state === null || state === undefined ? undefined : libEntryOf(sessionId, pick)
        return entry !== undefined && typeof entry.text === 'string' ? parseMarkdownDoc(entry.text) : []
      }
      if (current === null || current === undefined) return []
      const sid = current.sid
      if (typeof sid === 'string' && sid !== '' && sid !== sessionId) return []
      return Array.isArray(current.blocks) ? current.blocks : []
    }

    /**
     * 浮层位置：跟**鼠标**走，不跟选区起点。
     *
     * 用户是右键在哪个字上、框就该开在哪儿；贴着选区左上角会出现「我明明点的是这里，
     * 框却跑到那一句开头去了」的错位感（长段落里差一整行）。
     * 上边至少 54：卡片顶上还挂着一颗表情胶囊，不许顶出窗口。
     */
    function spotForMouse(event) {
      return {
        x: Math.max(8, Math.min(Math.round(event.clientX + 8), window.innerWidth - 380)),
        y: Math.max(54, Math.min(Math.round(event.clientY + 12), window.innerHeight - 320)),
      }
    }

    /**
     * 选区在某个块里的字符偏移（相对于该块的纯文本）。
     *
     * `allowCrossBlock` = 选区的终点跑到了下一段也认：只算起点这一段，截到块尾。
     * 老调用（选中工具条）保持原样：跨段就返回 null，那条路径没打算为跨段改行为。
     */
    function offsetsInBlock(blockElement, allowCrossBlock) {
      try {
        const selection = window.getSelection()
        if (selection === null || selection.isCollapsed === true || selection.rangeCount === 0) return null
        const range = selection.getRangeAt(0)
        if (!blockElement.contains(range.startContainer)) return null
        /* 从批注数标记上起手拖出来的「选区」不是正文，别拿它当引文。 */
        const startElement = range.startContainer.nodeType === 1
          ? range.startContainer
          : range.startContainer.parentElement
        if (startElement !== null && startElement.closest('.dsha-block-mark') !== null) return null
        const before = document.createRange()
        before.selectNodeContents(blockElement)
        before.setEnd(range.startContainer, range.startOffset)
        const start = before.toString().length
        if (blockElement.contains(range.endContainer)) {
          const text = selection.toString()
          if (text.trim() === '') return null
          return { start, end: start + text.length, text }
        }
        if (allowCrossBlock !== true) return null
        return clipToBlockEnd(start, blockPlainText(blockElement))
      } catch (error) {
        return null
      }
    }

    /** 线程卡缩放的最小尺寸：再小就装不下引文 + 输入框。 */
    const MIN_THREAD_W = 260
    const MIN_THREAD_H = 180

    /* ------------------------------------------------------------------ 听写 */

    /** 16k 单声道 PCM16 的 WAV 编码 —— DSH 的识别服务只吃这个格式。 */
    function encodeWav(samples, sampleRate) {
      const length = samples.length
      const buffer = new ArrayBuffer(44 + length * 2)
      const view = new DataView(buffer)
      const writeText = (offset, text) => {
        for (let index = 0; index < text.length; index += 1) {
          view.setUint8(offset + index, text.charCodeAt(index))
        }
      }
      writeText(0, 'RIFF')
      view.setUint32(4, 36 + length * 2, true)
      writeText(8, 'WAVE')
      writeText(12, 'fmt ')
      view.setUint32(16, 16, true)
      view.setUint16(20, 1, true)
      view.setUint16(22, 1, true)
      view.setUint32(24, sampleRate, true)
      view.setUint32(28, sampleRate * 2, true)
      view.setUint16(32, 2, true)
      view.setUint16(34, 16, true)
      writeText(36, 'data')
      view.setUint32(40, length * 2, true)
      let offset = 44
      for (let index = 0; index < length; index += 1) {
        const raw = samples[index]
        const value = raw < -1 ? -1 : (raw > 1 ? 1 : raw)
        view.setInt16(offset, value < 0 ? value * 0x8000 : value * 0x7fff, true)
        offset += 2
      }
      return new Uint8Array(buffer)
    }

    /** 任意采样率的单声道 → 16k（OfflineAudioContext 重采样）。 */
    async function toSixteenK(samples, sampleRate) {
      if (Math.round(sampleRate) === 16000) return samples
      const seconds = samples.length / sampleRate
      const length = Math.max(1, Math.round(seconds * 16000))
      const offline = new OfflineAudioContext(1, length, 16000)
      const render = offline.createBuffer(1, samples.length, sampleRate)
      render.copyToChannel(samples, 0)
      const source = offline.createBufferSource()
      source.buffer = render
      source.connect(offline.destination)
      source.start(0)
      const out = await offline.startRendering()
      return out.getChannelData(0)
    }

    function base64Of(bytes) {
      let binary = ''
      const step = 0x8000
      for (let index = 0; index < bytes.length; index += step) {
        binary += String.fromCharCode.apply(null, bytes.subarray(index, index + step))
      }
      return window.btoa(binary)
    }

    /** 合并所有分块，从第 from 个样本开始取一段（录音是边录边增长的）。 */
    function sliceFrom(chunks, from) {
      const total = chunks.reduce((sum, part) => sum + part.length, 0)
      const start = Math.max(0, Math.min(from, total))
      const out = new Float32Array(total - start)
      let offset = 0
      let index = 0
      for (const part of chunks) {
        const begin = index
        index += part.length
        if (index <= start) continue
        const skip = start > begin ? start - begin : 0
        out.set(part.subarray(skip), offset)
        offset += part.length - skip
      }
      return offset === out.length ? out : out.subarray(0, offset)
    }

    /** 一小段音频的响度（均方根）。用来判断「这段有没有人在说话」。 */
    function loudnessOf(samples) {
      if (samples.length === 0) return 0
      let sum = 0
      for (let index = 0; index < samples.length; index += 1) {
        const value = samples[index]
        sum += value * value
      }
      return Math.sqrt(sum / samples.length)
    }

    /**
     * 在一段的最后 `windowMs` 里找最安静的位置，用它当切点 —— 硬切在词中间会丢字，
     * 落在停顿处基本无损。
     */
    function quietCutOf(samples, sampleRate, windowMs) {
      const span = Math.max(1, Math.round(sampleRate * (windowMs / 1000)))
      const from = Math.max(0, samples.length - span)
      const step = Math.max(1, Math.round(sampleRate / 200))
      let bestAt = samples.length
      let best = Number.POSITIVE_INFINITY
      for (let index = from; index < samples.length - step; index += step) {
        let sum = 0
        for (let k = 0; k < step; k += 1) {
          const value = samples[index + k]
          sum += value * value
        }
        if (sum < best) {
          best = sum
          bestAt = index
        }
      }
      /* 太靠前就别切（切出来的那段没意义），退回整段。 */
      return bestAt < samples.length * 0.35 ? samples.length : bestAt
    }

    /**
     * 开一段录音，返回能停下来的句柄。
     *
     * 一次录完整段、停止后再整段识别（v0.35.0 试过每 1.5 秒切一段的「边录边出字」，
     * 用户反馈切得太碎，改回整段；分块那套辅助函数暂时留着，等做实时对话时再用）。
     */
    async function startRecording() {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      let context
      let source
      let node
      try {
        context = new AudioContext()
        source = context.createMediaStreamSource(stream)
      } catch (error) {
        /* 这一步失败时麦克风流已经开了：不关掉，系统里的红点会一直亮着，用户还以为在录。 */
        try { stream.getTracks().forEach(track => track.stop()) } catch (inner) { /* 已停 */ }
        throw error
      }
      /* ScriptProcessor 虽然过时，但不需要额外模块文件；只收数据，输出保持静音。
         它也可能抛（处理器个数/采样率不支持），同样要先把流关掉。 */
      try {
        node = context.createScriptProcessor(4096, 1, 1)
      } catch (error) {
        try { stream.getTracks().forEach(track => track.stop()) } catch (inner) { /* 已停 */ }
        try { context.close() } catch (inner) { /* 已关 */ }
        throw error
      }
      const rate = context.sampleRate
      const chunks = []
      node.onaudioprocess = (event) => {
        try {
          chunks.push(new Float32Array(event.inputBuffer.getChannelData(0)))
        } catch (error) { /* 这一块丢了不影响整段 */ }
      }
      source.connect(node)
      node.connect(context.destination)
      return {
        rate,
        async stop() {
          try { node.disconnect() } catch (error) { /* 已断开 */ }
          try { source.disconnect() } catch (error) { /* 已断开 */ }
          try { stream.getTracks().forEach(track => track.stop()) } catch (error) { /* 已停 */ }
          const whole = sliceFrom(chunks, 0)
          try { await context.close() } catch (error) { /* 已关 */ }
          if (whole.length === 0) return null
          return encodeWav(await toSixteenK(whole, rate), 16000)
        },
      }
    }

    /**
     * 八向缩放的坐标计算（纯函数，可离线断言）。
     *
     * 东/南只改宽高；西/北要同时改 x/y，并把宽高反向补偿 —— 否则往左拖会变成「整块平移」。
     * @param {{dir: string, left: number, top: number, w: number, h: number}} info 开始拖时卡片的矩形。
     * @param {{x: number, y: number}} pointer 当前指针位置。
     * @param {{minW: number, minH: number, maxW: number, maxH: number, minY: number}} limits 边界。
     * @returns {{x: number, y: number, w: number, h: number}} 新的几何。
     */
    function resizeBox(info, pointer, limits) {
      const dir = String(info.dir)
      let left = info.left
      let top = info.top
      let w = info.w
      let h = info.h
      if (dir.indexOf('e') >= 0) w = pointer.x - info.left
      if (dir.indexOf('s') >= 0) h = pointer.y - info.top
      if (dir.indexOf('w') >= 0) {
        left = Math.min(pointer.x, info.left + info.w - limits.minW)
        w = info.left + info.w - left
      }
      if (dir.indexOf('n') >= 0) {
        top = Math.min(pointer.y, info.top + info.h - limits.minH)
        h = info.top + info.h - top
      }
      w = Math.max(limits.minW, Math.min(w, limits.maxW))
      h = Math.max(limits.minH, Math.min(h, limits.maxH))
      return {
        x: Math.max(0, Math.round(left)),
        y: Math.max(limits.minY, Math.round(top)),
        w: Math.round(w),
        h: Math.round(h),
      }
    }

    /** 把 WAV 交给宿主那条路由，拿回文字。 */
    async function transcribeWav(bytes) {
      const url = new URL('annotate/transcribe', document.baseURI).toString()
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio: base64Of(bytes) }),
      })
      let body = null
      try { body = await response.json() } catch (error) { body = null }
      if (body === null || body.ok !== true) {
        const why = body === null
          ? 'HTTP ' + String(response.status)
          : String(body.message === undefined ? (body.reason === undefined ? 'unknown' : body.reason) : body.message)
        throw new Error(why)
      }
      return String(body.text === undefined ? '' : body.text)
    }

    /** 简笔麦克风。 */
    function micIcon() {
      return h('svg', {
        width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none',
        stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
      },
        h('path', { d: 'M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z' }),
        h('path', { d: 'M19 11a7 7 0 0 1-14 0' }),
        h('path', { d: 'M12 18v3' }))
    }

    /**
     * 听写按钮：点一下开始录，再点一下停止，整段送去识别后一次贴进输入框。
     *
     * 识别交给 DSH 自己的本地模型（宿主 `speechToText`），经 `/annotate/transcribe` 中转。
     * v0.35.0 试过「每 1.5 秒切一段、边录边出字」，用户反馈切得太碎，已改回整段识别；
     * 分块的辅助函数（sliceFrom / loudnessOf / quietCutOf）留着，做实时对话时还要用。
     */
    function MicButton(props) {
      const [state, setState] = React.useState('')
      const recRef = React.useRef(null)
      /* 把识别结果写进输入框：有选区就替换选区，没选区就接在末尾。 */
      const applyText = (text) => {
        const piece = String(text === undefined || text === null ? '' : text)
        if (piece === '') return
        const head = String(props.value === undefined || props.value === null ? '' : props.value)
        const area = props.targetRef === undefined || props.targetRef === null ? null : props.targetRef.current
        if (area !== null && typeof area.selectionStart === 'number') {
          const start = area.selectionStart
          const end = typeof area.selectionEnd === 'number' ? area.selectionEnd : start
          if (end > start) {
            if (typeof props.onChange === 'function') props.onChange(head.slice(0, start) + piece + head.slice(end))
            /* 光标停在插入的那段后面，接着说还能接上。 */
            const caret = start + piece.length
            window.setTimeout(() => {
              try {
                area.focus()
                area.setSelectionRange(caret, caret)
              } catch (error) { /* 输入框已经不在 */ }
            }, 0)
            return
          }
        }
        if (typeof props.onChange === 'function') props.onChange(head + piece)
      }
      React.useEffect(() => () => {
        const rec = recRef.current
        if (rec !== null) { rec.stop().catch(() => {}) }
      }, [])
      const busy = state === 'busy'
      const listening = state === 'rec'
      const toggle = async () => {
        if (busy) return
        if (listening) {
          const rec = recRef.current
          recRef.current = null
          if (rec === null) { setState(''); return }
          setState('busy')
          try {
            const wav = await rec.stop()
            const text = wav === null ? '' : await transcribeWav(wav)
            if (text !== '') {
              applyText(text)
              setState('')
            } else {
              setState('err:没听到内容')
            }
          } catch (error) {
            setState('err:' + String(error === null || error === undefined ? '识别失败' : (error.message || error)))
          }
          return
        }
        try {
          recRef.current = await startRecording()
          setState('rec')
        } catch (error) {
          const message = error === null || error === undefined ? '打不开麦克风' : String(error.message || error)
          setState('err:' + message)
        }
      }
      const failed = state.indexOf('err:') === 0
      return h('span', { style: { display: 'inline-flex', alignItems: 'center', gap: '4px', flex: 'none' } },
        h('button', {
          type: 'button',
          className: listening ? 'dsha-mic dsha-mic-on' : (busy ? 'dsha-mic dsha-mic-busy' : 'dsha-mic'),
          title: listening ? '说完点一下收尾（边说边出字）' : '听写：边说边出字',
          disabled: busy,
          onClick: toggle,
        }, listening ? h('span', { className: 'dsha-mic-dot' }) : micIcon()),
        failed
          ? h('span', { className: 'dsha-hint' }, '听写失败：' + state.slice(4).slice(0, 40))
          : null)
    }

    function ThreadCard(props) {
      const store = useStore()
      const sessionId = props.sessionId
      const entryId = props.entryId
      const [draft, setDraft] = React.useState('')
      /* ---- 拖动 / 缩放 / 夹回可视区（钩子必须在下面的 early return 之前） ---- */
      const boxRef = React.useRef(null)
      const dragRef = React.useRef(null)
      const threadAreaRef = React.useRef(null)
      const geo = state.docThread === null || state.docThread === undefined ? {} : state.docThread
      const boxW = Number(geo.w) > 0 ? Math.round(Number(geo.w)) : null
      const boxH = Number(geo.h) > 0 ? Math.round(Number(geo.h)) : null
      /* 用户定下的尺寸：只给「对话过的卡片」用（没有对话的卡片保持默认大小）。 */
      const talkRef = React.useRef(false)
      const writeBackAtRef = React.useRef(0)
      const [wbConfirm, setWbConfirm] = React.useState('')
      React.useEffect(() => {
        /* 0.113：线程卡的拖动/缩放也按帧合并（7.4）。 */
        const frame = rafGeom()
        const onMove = (event) => {
          const info = dragRef.current
          const current = state.docThread
          if (info === null || current === null || current === undefined) return
          /* 在窗口外松手收不到 pointerup：按“键已经松开”就地解绑，别让卡片粘着鼠标。 */
          if (event.buttons === 0) { dragRef.current = null; frame.flush(); setDragging(false); return }
          setDragging(true)
          if (info.mode === 'move') {
            const x = Math.max(8, Math.min(Math.round(event.clientX - info.dx), window.innerWidth - info.w - 8))
            const y = Math.max(42, Math.min(Math.round(event.clientY - info.dy), window.innerHeight - info.h - 8))
            frame.push(() => {
              const live = state.docThread
              if (live === null || live === undefined) return
              commit({ docThread: { ...live, x, y } })
            })
            return
          }
          /* 八向缩放：东/南改宽高，西/北同时改 x/y 并把宽高反向补偿。 */
          const next = resizeBox(
            { dir: info.dir, left: info.left, top: info.top, w: info.w, h: info.h },
            { x: event.clientX, y: event.clientY },
            {
              minW: MIN_THREAD_W,
              minH: MIN_THREAD_H,
              maxW: window.innerWidth - 16,
              maxH: window.innerHeight - 56,
              minY: 42,
            },
          )
          frame.push(() => {
            const live = state.docThread
            if (live === null || live === undefined) return
            commit({ docThread: { ...live, x: next.x, y: next.y, w: next.w, h: next.h } })
          })
        }
        const onUp = () => {
          const info = dragRef.current
          dragRef.current = null
          frame.flush()
          if (info !== null) setDragging(false)
          /* 只记尺寸，而且只从「对话过的卡片」上记：没对话过的卡片不覆盖你的偏好。 */
          if (info === null || info.mode !== 'resize' || talkRef.current !== true) return
          const geo = state.docThread
          if (geo === null || geo === undefined) return
          const w = Number(geo.w)
          const h = Number(geo.h)
          if (!(w > 0) || !(h > 0)) return
          commit({ docThreadBox: { w: Math.round(w), h: Math.round(h) } }, true)
        }
        window.addEventListener('pointermove', onMove)
        window.addEventListener('pointerup', onUp)
        window.addEventListener('pointercancel', onUp)
        return () => {
          window.removeEventListener('pointermove', onMove)
          window.removeEventListener('pointerup', onUp)
          window.removeEventListener('pointercancel', onUp)
        }
      }, [])
      /* 卡片高度随内容变，靠估算夹不住：装进来量一次，露到窗口外就整体往回挪。 */
      React.useEffect(() => {
        const host = boxRef.current
        const current = state.docThread
        if (host === null || current === null || current === undefined) return
        const rect = host.getBoundingClientRect()
        if (rect.height <= 0) return
        const x = Math.max(8, Math.min(Number(current.x) || 0, Math.max(8, window.innerWidth - rect.width - 8)))
        const y = Math.max(42, Math.min(Number(current.y) || 0, Math.max(42, window.innerHeight - rect.height - 8)))
        if (x !== current.x || y !== current.y) commit({ docThread: { ...current, x, y } })
      })
      const beginMove = (event) => {
        if (event.button !== 0) return
        const target = event.target
        if (target instanceof Element && target.closest('button') !== null) return
        const host = boxRef.current
        if (host === null) return
        const rect = host.getBoundingClientRect()
        event.preventDefault()
        dragRef.current = {
          mode: 'move',
          dx: event.clientX - rect.left,
          dy: event.clientY - rect.top,
          w: rect.width,
          h: rect.height,
        }
      }
      const beginResize = (event, dir) => {
        if (event.button !== 0) return
        const host = boxRef.current
        if (host === null) return
        const rect = host.getBoundingClientRect()
        event.preventDefault()
        event.stopPropagation()
        dragRef.current = {
          mode: 'resize',
          dir: String(dir),
          left: rect.left,
          top: rect.top,
          w: rect.width,
          h: rect.height,
        }
      }
      const entry = itemsOf(sessionId).find(item => item.id === entryId)
      if (entry === undefined) return null
      const thread = Array.isArray(entry.thread) ? entry.thread : []
      /* 对话过的卡片才用你存下的尺寸；没对话过的保持默认大小。 */
      const hasTalk = thread.length > 0
      talkRef.current = hasTalk
      const saved = hasTalk && state.docThreadBox !== null && state.docThreadBox !== undefined
        ? state.docThreadBox
        : null
      const styleW = boxW !== null ? boxW : (saved !== null && Number(saved.w) > 0 ? Math.round(Number(saved.w)) : null)
      const styleH = boxH !== null ? boxH : (saved !== null && Number(saved.h) > 0 ? Math.round(Number(saved.h)) : null)
      const boxStyle = {
        ...props.style,
        ...(styleW === null ? {} : { width: String(styleW) + 'px' }),
        ...(styleH === null ? {} : { height: String(styleH) + 'px' }),
      }
      /* 结论回写：把回答写进文档（用户点按钮才执行；写完把这条标成已处理）。 */
      const writeBack = (target, mode) => {
        const doc = state.doc
        if (doc === null || doc === undefined || typeof doc.source !== 'string') {
          commit({ reanchorHint: '当前没有打开的文档，没法写回' })
          return
        }
        /* 0.115：txt / 代码 / 表格是只读预览（caps.writeBack=false）。 */
        if (isFileDoc(doc)) {
          commit({ reanchorHint: '这类文件目前只读，不支持把结论写回' })
          return
        }
        /* 看历史版时不能写回：那会改「现在这份」，而你以为改的是眼前那份。 */
        if (state.docPick !== '' && state.docPick !== undefined) {
          commit({ reanchorHint: '正在看历史版：先回到最新那份再写回' })
          return
        }
        /* 续写拼接（dsh-doc+）的内容只进了 blocks，不在 source 里，写回会对不上。 */
        if (Array.isArray(doc.appends) === true && doc.appends.length > 0) {
          commit({ reanchorHint: '这份文档是续写拼起来的，先在编辑器里另存一份再写回' })
          return
        }
        /* 连点保护：append 没有「已处理」状态兜底，1.2 秒内只认第一次。 */
        if (Date.now() - writeBackAtRef.current < 1200) return
        const blockIndex = typeof target.blockIndex === 'number' ? target.blockIndex : -1
        const kindOfBlock = Array.isArray(doc.blocks) === true && blockIndex >= 0 && doc.blocks[blockIndex] !== undefined
          ? doc.blocks[blockIndex].kind
          : undefined
        /* 追加时把回答变成引用块：正文能读，结论也一眼能认出来（用户 2026-11-26 定）。 */
        const replyForPlan = mode === 'append' ? asBlockquote(target.reply) : target.reply
        const plan = planWriteBack(doc.source, target.quote, replyForPlan, mode, kindOfBlock)
        if (plan === null) {
          commit({ reanchorHint: kindOfBlock === 'table' || kindOfBlock === 'code' || kindOfBlock === 'svg'
            ? '这句话在表格/代码块里，写回会破坏结构，先在正文里重划到普通段落'
            : '找不到这句原文（或它在全文里不止一处），先在正文里重划一次' })
          return
        }
        const planText = plan.text
        writeBackAtRef.current = Date.now()
        const nextBlocks = parseMarkdownDoc(planText)
        /* local: true —— 这是「用户在面板里做的编辑」，允许写盘（0.91 的写盘规则）。 */
        putDoc({
          ...doc,
          source: planText,
          blocks: nextBlocks,
          baseCount: nextBlocks.length,
          editedAt: Date.now(),
          local: true,
        })
        if (mode === 'replace' && sessionId !== null && sessionId !== undefined) {
          const list = itemsOf(sessionId).map((item) => (
            item.id === target.id ? { ...item, status: 'resolved' } : item
          ))
          putItems(sessionId, list)
          props.onClose()
        }
        commit({ reanchorHint: mode === 'replace' ? '已写回文档（这条批注标为已处理）' : '已在段后追加一段' })
      }

      const send = () => {
        const text = draft.trim()
        if (text === '') return
        /* 看历史版时，线程卡里的「所在块」要从那一版的原文解析，不能拿最新那份的段落。 */
        const blocks = (() => {
          if (state.docPick !== '' && state.docPick !== undefined) {
            const entry = libEntryOf(sessionId, state.docPick)
            if (entry !== undefined && typeof entry.text === 'string') return parseMarkdownDoc(entry.text)
          }
          return state.doc === null ? [] : state.doc.blocks
        })()
        const index = typeof entry.blockIndex === 'number' ? entry.blockIndex : -1
        const block = blocks[index]
        /* 不附加任何回复格式要求：正常问答，配对靠锚点，不靠前缀。 */
        const payload = [
          '@批注追问',
          '引文：「' + entry.quote + '」',
          block === undefined ? '' : '所在块：' + clipQuote(block.text, 120),
          '追问：' + text,
        ].filter(line => line !== '').join('\n')
        if (!sendChatText(payload)) return
        const tails = [
          ...(Array.isArray(state.sentTails) ? state.sentTails : []),
          { tail: payload.slice(-24), batch: '', at: Date.now() },
        ].slice(-replyTailLimit())
        commit({ sentTails: tails })
        const nextThread = thread.concat([{ who: 'me', text, at: Date.now() }])
        putItems(sessionId, itemsOf(sessionId).map(item => (
          item.id === entryId
            ? { ...item, thread: nextThread, status: 'sent', sentAt: Date.now(), sentTail: payload.slice(-24) }
            : item
        )))
        setDraft('')
      }
      return h('div', {
        className: 'dsha-thread',
        ref: boxRef,
        style: boxStyle,
      },
        h('div', {
          className: 'dsha-thread-head',
          title: '拖动移动 · 双击复位大小',
          onPointerDown: beginMove,
          onDoubleClick: () => {
            const current = state.docThread
            if (current === null || current === undefined) return
            commit({ docThread: { ...current, w: null, h: null } })
          },
        },
          h('span', { className: 'dsha-thread-title' }, '批注'),
          h('div', { className: 'dsha-spacer' }),
          h('button', {
            type: 'button',
            className: 'dsha-mini dsha-close',
            title: '关闭这条批注',
            onClick: props.onClose,
          }, '×'),
        ),
        h('div', { className: 'dsha-thread-quote' }, entry.quote),
        h('div', { className: 'dsha-thread-list' },
          thread.map((msg, number) => h('div', {
            key: String(number),
            className: 'dsha-msg',
            'data-who': msg.who,
          },
            h('div', { className: 'dsha-msg-text' }, msg.text)))),
        /* 预批注（还没发出去）在这里给一个「发出」：右边点开一条批注就能直接发，
           不用再跑去左边的面板。 */
        /* 结论回写：把这条批注的回答写进文档。默认不动，用户点才写（0.100.0 起）。
           0.104：「追加到段后」是主按钮（不动原文，最安全），追加时自动变成引用块；
           「写回这段」会替换原句，降级为次要按钮并要二次确认。 */
        entry.target === 'doc' && typeof entry.reply === 'string' && entry.reply.trim() !== ''
          ? h('div', { className: 'dsha-thread-send' },
            h('span', { className: 'dsha-hint' }, wbConfirm === '' ? '回答可以写进文档' : wbConfirm),
            h('div', { className: 'dsha-spacer' }),
            h('button', {
              type: 'button',
              className: 'dsha-btn dsha-btn-primary',
              title: '把这段回答作为引用块，加在被批注那段之后（原句保留）',
              onClick: () => {
                setWbConfirm('')
                writeBack(entry, 'append')
              },
            }, '追加到段后'),
            h('button', {
              type: 'button',
              className: 'dsha-mini',
              title: '会替换掉被批注的原句，先点一次确认',
              onClick: () => {
                if (wbConfirm === '') {
                  setWbConfirm('替换会改掉原句，再点一次确认')
                  window.setTimeout(() => setWbConfirm(''), 4000)
                  return
                }
                setWbConfirm('')
                writeBack(entry, 'replace')
              },
            }, '写回这段'))
          : null,
        entry.status === 'queued'
          ? h('div', { className: 'dsha-thread-send' },
            h('span', { className: 'dsha-hint' }, '还没发出去'),
            h('div', { className: 'dsha-spacer' }),
            h('button', {
              type: 'button',
              className: 'dsha-btn dsha-btn-primary',
              title: '把这条批注发到输入框（和其他待发的一起按批发送）',
              onClick: () => {
                const result = deliver([entry], sessionId)
                /* deliver 返回 { sent, remaining }；写不进输入框就会是 0。 */
                if (result.sent === 0) commit({ reanchorHint: '没能写进输入框，试试左边面板的「发送」' })
                else commit({ reanchorHint: '' })
              },
            }, '发出这条'))
          : null,
        h('div', { className: 'dsha-thread-input' },
          h('textarea', {
            ref: threadAreaRef,
            className: 'dsha-textarea',
            rows: 1,
            value: draft,
            placeholder: '接着说…（Enter 发送）',
            onChange: event => setDraft(event.target.value),
            onKeyDown: (event) => {
              if (event.key === 'Enter' && event.shiftKey !== true && event.isComposing !== true) {
                event.preventDefault()
                send()
              }
            },
          }),
          h(MicButton, { value: draft, onChange: setDraft, targetRef: threadAreaRef }),
          h('button', {
            type: 'button',
            className: 'dsha-btn dsha-btn-primary',
            disabled: draft.trim() === '',
            onClick: send,
          }, '发送')),
        h('div', { className: 'dsha-thread-grip', title: '拖动改大小', onPointerDown: event => beginResize(event, 'se') }),
        h('div', { className: 'dsha-thread-drag', 'data-dir': 'n', title: '拖动调整高度', onPointerDown: event => beginResize(event, 'n') }),
        h('div', { className: 'dsha-thread-drag', 'data-dir': 's', title: '拖动调整高度', onPointerDown: event => beginResize(event, 's') }),
        h('div', { className: 'dsha-thread-drag', 'data-dir': 'w', title: '拖动调整宽度', onPointerDown: event => beginResize(event, 'w') }),
        h('div', { className: 'dsha-thread-drag', 'data-dir': 'e', title: '拖动调整宽度', onPointerDown: event => beginResize(event, 'e') }),
        h('div', { className: 'dsha-thread-drag', 'data-dir': 'nw', title: '拖动调整宽高', onPointerDown: event => beginResize(event, 'nw') }),
        h('div', { className: 'dsha-thread-drag', 'data-dir': 'ne', title: '拖动调整宽高', onPointerDown: event => beginResize(event, 'ne') }),
        h('div', { className: 'dsha-thread-drag', 'data-dir': 'sw', title: '拖动调整宽高', onPointerDown: event => beginResize(event, 'sw') }),
        h('div', { className: 'dsha-thread-drag', 'data-dir': 'se', title: '拖动调整宽高', onPointerDown: event => beginResize(event, 'se') }),
      )
    }

    /** 字号只认 12–21 的整数；拿不到合法值就返回 null，让调用方保留原值。 */
    function clampFont(raw) {
      if (typeof raw !== 'number' || !Number.isFinite(raw)) return null
      return Math.min(21, Math.max(12, Math.floor(raw)))
    }

    /** 回复锚点队列只留 1–4 条。 */
    function clampReplyWindow(raw) {
      if (typeof raw !== 'number' || !Number.isFinite(raw)) return null
      return Math.min(4, Math.max(1, Math.floor(raw)))
    }

    /** 当前生效的锚点队列长度；设置页没给过值就是 4。 */
    function replyTailLimit() {
      const value = clampReplyWindow(state.keepReplyWindow)
      return value === null ? 4 : value
    }

    /** 打开文档。
     *  默认（dockDocTab 关）：开**我们自己的窗口**，不依赖任何第三方插件。
     *  打开 dockDocTab 时：优先停靠到 dsh-better-sidebar 的右侧栏页签；
     *  页签不可用（没装 / 没注册上 / 调不通）就**自动回落**到自己的窗口，绝不出现「点了没反应」。
     *  历史：0.106.0 之前无条件优先页签，side-bar 一重启页签注册就丢，
     *  只留下一个没有视图的空页签（占位文案「这类内容还没有可用的查看方式」）。 */
    function openDocTab() {
      if (state.dockDocTab === true) {
        try {
          const service = runtime.ctx === null ? null : runtime.ctx.get('betterSidebar')
          if (service !== null && service !== undefined && typeof service.openTab === 'function') {
            service.openTab({ type: 'dsh-annotate:doc', title: '文档' })
            return true
          }
        } catch (error) {
          /* 回落 */
        }
        /* 停靠模式但页签不可用（没装/注册失败）：临时当「拖出来」处理，窗口照常出现，
           不让用户看到"点了没反应"。 */
        commit({ docOpen: true })
        return true
      }
      commit({ docOpen: true })
      return true
    }

    /**
     * 把设置页/宿主配置同步进本地状态。
     *
     * 生效值的归属（别再加第三个来源）：
     * - autoOpenDoc：设置页显式写过 → 听设置页；否则文档下拉菜单点过 → 听本地；都没有 → 用配置默认。
     * - defaultFont：本地手动调过字号 → 本地优先；否则用配置默认。
     * - keepReplyWindow：只由配置决定。
     */
    function applyPluginConfig(snapshot) {
      if (snapshot === null || snapshot === undefined || snapshot.status !== 'ready') return
      const value = snapshot.value
      if (value === null || typeof value !== 'object') return
      const user = snapshot.user !== null && typeof snapshot.user === 'object' ? snapshot.user : {}
      const patch = {}
      if (user.autoOpenDoc !== undefined || state.autoDocLocal !== true) {
        patch.autoDoc = value.autoOpenDoc !== false
      }
      if (state.docFontLocal !== true) {
        const font = clampFont(value.defaultFont)
        if (font !== null) patch.docFont = font
      }
      const window = clampReplyWindow(value.keepReplyWindow)
      if (window !== null) patch.keepReplyWindow = window
      /* 表情条对照表：宿主里存的是原文，本地只存同一份字符串，改完立刻生效。 */
      if (typeof value.reactions === 'string' && value.reactions !== state.reactions) {
        patch.reactions = value.reactions
      }
      /* 右键唤出范围只由配置决定（没配就是宽模式）。 */
      if (typeof value.wideRightClick === 'boolean' && value.wideRightClick !== state.wideRightClick) {
        patch.wideRightClick = value.wideRightClick
      }
      /* 文档停靠：开着就把「文档」交给右侧栏页签，关着就用插件自己的窗口（默认关＝零依赖）。 */
      const dock = value.dockDocTab === true
      if (dock !== (state.dockDocTab === true)) {
        patch.dockDocTab = dock
      }
      let changed = false
      for (const key of Object.keys(patch)) {
        if (state[key] !== patch[key]) changed = true
      }
      if (changed) commit(patch)
    }

    /** 从客户端写回宿主配置（下拉菜单这类本地入口用；设置页自己走 form.mutate）。 */
    function writePluginConfig(patch) {
      const form = runtime.settingsForm
      if (form === null || form === undefined) return
      try {
        const snapshot = form.getSnapshot()
        if (snapshot.status !== 'ready' || snapshot.revision === undefined) return
        const ops = Object.keys(patch).map(key => ({ op: 'set', path: [key], value: patch[key] }))
        if (ops.length === 0) return
        const answer = form.mutate(ops, snapshot.revision)
        if (answer !== null && typeof answer === 'object' && typeof answer.catch === 'function') {
          answer.catch(() => { /* 写不进宿主就只改本地，不打断用户操作 */ })
        }
      } catch (error) {
        /* 没有设置服务（例如精简客户端）：只改本地 */
      }
    }

    /**
     * 聊天流里的文档围栏**不再折叠**（用户 2026-11-24：折起来只看到半行字，太难受）。
     * 函数留成空实现，调用点不用改；顺手把历史残留的 data-dsha-fold 标记清掉。
     */
    /**
     * 在聊天里给每份 dsh-doc 块挂一颗「📄 打开文档」胶囊。
     *
     * 模型写完文档通常只说一句「方案写在右边了」；文档栏没开时，用户在主对话里没有任何入口。
     * 这里直接注入一个按钮（不是折叠代码块，折叠会影响阅读原文档）：
     *   · 点它 = 打开右侧「文档」页签；
     *   · React 重渲染会把注入节点冲掉，所以每拍补一次；文本没变就不重写，避免闪。
     */
    /* 2026-11-26 决定（用户选「最稳妥」）：不再往 DSH 的聊天 DOM 里注入卡片、也不再隐藏原文。
       注入会被 React 重渲染冲掉、可能闪，还会让聊天里出现/消失文字。
       文档入口改成两条不会失败的：①文档出现时自动打开右侧「文档」页签（maybeOpenDocTab）
       ②会话顶部已有的「文档」「批注」按钮。 */
    /**
     * 把聊天里 `dsh-doc` 代码块**收起来**：正文只该在右侧文档面板里看。
     *
     * 这一版只做「隐藏」，**不新增节点、不绑事件**——之前那版注入卡片会被 React 重渲染冲掉、
     * 还可能闪，用户 2026-11-26 选了最稳的做法。隐藏只改 DSH 自己节点的 style，
     * 冲掉了下一拍再设一次，失败也无害（顶多原文又露出来）。
     */
    /* 只记得我们自己藏过谁：DSH 自己收起的代码块不能碰，否则放出来又收起 = 聊天里闪。 */
    const docHiddenPres = new WeakSet()

    function markDocLinks() {
      try {
        const flow = document.querySelector('[data-chat-flow]')
        if (flow === null) return
        const seen = new Set()
        /* 开关关掉：只把我们藏过的放出来，然后什么都不做。 */
        if (state.hideDocBlocks === false) {
          for (const pre of Array.from(docHiddenPres)) {
            pre.style.display = ''
            docHiddenPres.delete(pre)
          }
          return
        }
        for (const code of flow.querySelectorAll('pre code')) {
          const pre = typeof code.closest === 'function' ? code.closest('pre') : null
          if (pre === null || pre === undefined) continue
          const text = String(code.textContent === undefined ? '' : code.textContent)
          const first = String(text.split('\n')[0] === undefined ? '' : text.split('\n')[0]).trim().toLowerCase()
          const classes = String(code.className === undefined ? '' : code.className) + ' '
            + String(pre.className === undefined ? '' : pre.className)
          const isDoc = classes.indexOf('dsh-doc') >= 0
            || classes.indexOf('language-doc') >= 0
            || first === 'dsh-doc'
            || first === 'dsh-doc+'
          if (isDoc) {
            seen.add(pre)
            if (pre.style.display !== 'none') pre.style.display = 'none'
            docHiddenPres.add(pre)
          }
        }
        /* 不再是文档块（消息被改写过）才还原——只还原我们自己藏过的。 */
        for (const pre of Array.from(docHiddenPres)) {
          if (seen.has(pre) === true) continue
          pre.style.display = ''
          docHiddenPres.delete(pre)
        }
      } catch (error) {
        /* 隐藏失败不影响任何功能 */
      }
    }
    /** 旧名字保留：外部每拍会调它，这里顺手补文档胶囊。 */
    function foldDocBlocks() {
      try {
        markDocLinks()
      } catch (error) {
        /* 忽略 */
      }
    }

    /** 这个会话里第一次出现对话文档时，自动把「文档」页签推出来（每个会话只做一次）。 */
    function maybeOpenDocTab(sessionId) {
      if (sessionId === null || sessionId === '') return
      if (state.autoDoc === false) return
      if (runtime.autoOpen[sessionId] === true) return
      const scan = scanDocBlocks()
      if (scan === null || scan.found === null) return
      runtime.autoOpen[sessionId] = true
      openDocTab()
    }

    /** 独立的后台回执循环：聊天流真的变了才扫，别每 1.5s 白逛一遍整棵 DOM。 */
    function ReplyBridge() {
      const store = useStore()

      const sessionId = store.active
      React.useEffect(() => {
        if (sessionId === null) return undefined
        let dirty = true
        const markDirty = () => { dirty = true }
        /* 0.113：和文档扫描共用一个聊天流观察器（chatWatch），宿主换掉 [data-chat-flow] 时会自动重挂。 */
        const offChat = onChatMutation(markDirty)
        const tick = () => {
          ensureChatWatch()
          runtime.lastSid = sessionId
          /* 折叠不依赖脏标记：React 重渲染会把属性冲掉，干脆每拍都补一次。 */
          try {
            foldDocBlocks()
          } catch (error) {
            /* 忽略 */
          }
          if (dirty === true) {
            dirty = false
            try {
              maybeOpenDocTab(sessionId)
            } catch (error) {
              /* 下一轮再试 */
            }
          }
          /* 回执配对别跟脏标记绑死：聊天流的节点被换掉、或者锚点那一拍刚好没有变化，
             都会让批注「一直蓝着不收绿」。它自己会先判有没有待回复的批注，空跑很便宜。 */
          try {
            reconcileReplies(sessionId)
          } catch (error) {
            /* 下一轮再试 */
          }
        }
        tick()
        const timer = window.setInterval(tick, 1500)
        /* 折叠条本身可点：点它打开右侧文档页签（只装一次，用捕获阶段）。 */
        const onClick = (event) => {
          const target = event.target
          if (!(target instanceof Element)) return
          if (target.closest('pre[data-dsha-fold="1"]') === null) return
          event.preventDefault()
          /* 折叠条点开 = 打开插件自己的文档面板（不碰第三方侧栏）。 */
          commit({ docOpen: true })
        }
        document.addEventListener('click', onClick, true)
        /* 兜底：万一 MutationObserver 挂了，也每 8s 强制扫一次。 */
        const heartbeat = window.setInterval(markDirty, 8000)
        return () => {
          window.clearInterval(timer)
          window.clearInterval(heartbeat)
          document.removeEventListener('click', onClick, true)
          offChat()
        }
      }, [sessionId])
      return null
    }

    /* 富文本片段模型：block.runs = [{ text, bold?, italic?, strike?, code?, href?, color? }]
       block.text 永远是 runs 拼起来的纯文本 —— 锚点仍然按字符偏移算，不受格式影响。 */
    const RUN_KEYS = ['bold', 'italic', 'strike', 'code', 'href', 'color']

    function runsOf(block) {
      if (Array.isArray(block.runs) && block.runs.length > 0) {
        return block.runs.map(run => ({ ...run, text: typeof run.text === 'string' ? run.text : '' }))
      }
      return [{ text: typeof block.text === 'string' ? block.text : '' }]
    }

    function runsText(runs) {
      return runs.map(run => run.text).join('')
    }

    function styleAt(runs, position, key) {
      let cursor = 0
      for (const run of runs) {
        const end = cursor + run.text.length
        if (position >= cursor && position < end) return run[key] === true
        cursor = end
      }
      return false
    }

    /** 在 [from,to) 上开关一个行内样式，返回合并后的 runs。 */
    function toggleRunStyle(runs, from, to, key, on) {
      const out = []
      let cursor = 0
      for (const run of runs) {
        const start = cursor
        const end = cursor + run.text.length
        cursor = end
        if (end <= from || start >= to) {
          out.push(run)
          continue
        }
        const a = Math.max(start, from) - start
        const b = Math.min(end, to) - start
        if (a > 0) out.push({ ...run, text: run.text.slice(0, a) })
        const middle = { ...run, text: run.text.slice(a, b) }
        if (on) middle[key] = true
        else delete middle[key]
        out.push(middle)
        if (b < run.text.length) out.push({ ...run, text: run.text.slice(b) })
      }
      const merged = []
      for (const run of out) {
        if (run.text === '') continue
        const last = merged[merged.length - 1]
        const same = last !== undefined && RUN_KEYS.every(styleKey => last[styleKey] === run[styleKey])
        if (same) last.text += run.text
        else merged.push({ ...run })
      }
      return merged
    }

    /** 把「run 边界 + 批注区间边界」合成一份片段表，一次渲染出行内样式和批注底色。 */
    function composePieces(block, ranges) {
      const runs = runsOf(block)
      const plain = runsText(runs)
      const cuts = new Set([0, plain.length])
      let cursor = 0
      for (const run of runs) {
        cursor += run.text.length
        cuts.add(cursor)
      }
      for (const range of ranges) {
        cuts.add(Math.max(0, Math.min(plain.length, range.from)))
        cuts.add(Math.max(0, Math.min(plain.length, range.to)))
      }
      const points = [...cuts].sort((a, b) => a - b)
      const pieces = []
      for (let index = 0; index < points.length - 1; index += 1) {
        const from = points[index]
        const to = points[index + 1]
        if (to <= from) continue
        let style = { bold: false, italic: false, strike: false, code: false, href: null, color: null }
        let offset = 0
        for (const run of runs) {
          const start = offset
          offset += run.text.length
          if (from >= start && from < offset) {
            style = {
              bold: run.bold === true,
              italic: run.italic === true,
              strike: run.strike === true,
              code: run.code === true,
              href: typeof run.href === 'string' ? run.href : null,
              color: typeof run.color === 'string' ? run.color : null,
            }
            break
          }
        }
        const range = ranges.find(item => from >= item.from && from < item.to)
        pieces.push({
          key: String(index),
          text: plain.slice(from, to),
          style,
          mark: range === undefined ? undefined : range.id,
          status: range === undefined ? undefined : range.status,
        })
      }
      return pieces
    }

    /** 侧栏页签：没放大时就是文档本体，放大后让位给窗口里那份。 */
    function DocTabHost(props) {
      const store = useStore()
      if (store.docWide === true) {
        return h('div', { className: 'dsha-doc-wide-hint' },
          h('span', null, '文档已放大到窗口里'),
          h('button', {
            type: 'button',
            className: 'dsha-mini',
            onClick: () => commit({ docWide: false }),
          }, '回到侧栏'))
      }
      /* 把槽位自带的 sessionId 传下去：文档页签是常驻的，只用 store.active 会拿到
         「上次操作批注的那个会话」——于是切到别的会话还能看到不属于它的文档。 */
      /* better-sidebar 的页签 props 是 { ctx, store, scope, tab, … }，**会话 id 在 scope.sessionId 上**。
         直接传下去：文档页签是常驻的，只靠 store.active 会拿到「上次操作批注的会话」，
         于是切到别的会话还能看见不属于它的文档。 */
      /* 0.112.4：宿主的「右侧栏页签」槽位是 scope:'session'，会话 id 会**直接挂在 props 上**
         （probe：props 里有 useSessions/useSessionStatus 这些按会话注入的 hooks）。
         以前只看 props.scope，那是空的 → 面板退回 store.active（上次右键的会话）→ 切会话不跟随。 */
      const sidCandidates = [
        props === null || props === undefined ? '' : props.sessionId,
        props === null || props === undefined || props.scope === null || props.scope === undefined ? '' : props.scope.sessionId,
      ]
      let liveSid = ''
      for (const one of sidCandidates) {
        if (typeof one === 'string' && one !== '') { liveSid = one; break }
      }
      if (runtime.docTabProbe !== true) {
        runtime.docTabProbe = true
        let all = []
        try { all = Object.keys(props === null || props === undefined ? {} : props) } catch (error) { all = ['取不到'] }
        logLine('文档页签 props全键=' + all.join('|') + ' 取到sid=' + (liveSid === '' ? '无' : sessionTail(liveSid)))
      }
      const scope = { sessionId: liveSid }
      return h(DocBoundary, null, h(DocPanel, { embedded: true, scope }))
    }

    /**
     * 浮层宿主：决定「文档窗口」要不要挂在 shell.overlay 上。
     * 停靠模式（dockDocTab）开着时窗口不再渲染 —— 文档在右侧栏里看；
     * 但用户点「⇱ 窗口」把它拖出来后（docDetached），窗口又回来。
     */
    function DocOverlayHost() {
      const store = useStore()
      /* 停靠开着就绝不渲染窗口：曾经允许「拖出来」时两个实例并存，结果两个 DocPanel 抢同一份
         state.doc，面板每 300ms 在两份文档之间跳（2026-11-27 日志 984 行实锤）。 */
      if (store.dockDocTab === true) return null
      return h(DocBoundary, null, h(DocPanel, { wide: true }))
    }

    /**
     * 文档面板的错误边界：面板一旦渲染抛错，宿主会把整个浮层判成「没在渲染」，
     * 界面上什么都不出现（side-bar 页签那边则显示一句「这类内容还没有可用的查看方式」）。
     * 这里把异常**写进文件**再吞掉，至少能查：
     *   POST /annotate-log → ${DSH_HOME}/annotate-client-debug.log
     */
    /* 错误边界必须继承 React.Component；断言脚本里的假 React 没有它，就退化成一个空类，
       这样纯函数测试照样能加载（真实宿主里 Component 一定在）。 */
    const BoundaryBase = React !== null && React !== undefined && typeof React.Component === 'function'
      ? React.Component
      : class { constructor(props) { this.props = props } setState() {} render() { return null } }
    class DocBoundary extends BoundaryBase {
      constructor(props) {
        super(props)
        this.state = { error: '' }
      }

      static getDerivedStateFromError(error) {
        return { error: String(error !== null && error !== undefined && error.message !== undefined ? error.message : error) }
      }

      componentDidCatch(error, info) {
        const text = '文档面板渲染失败：'
          + String(error !== null && error !== undefined && error.message !== undefined ? error.message : error)
          + '｜栈：' + String(info !== null && info !== undefined && info.componentStack !== undefined ? info.componentStack : '').replace(/\s+/g, ' ').slice(0, 600)
        try { commit({ reanchorHint: text }) } catch (warn) { /* 状态写不进去就只写日志 */ }
        try { console.error('[annotate]', text) } catch (warn) { /* 忽略 */ }
        try {
          fetch('/annotate-log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ at: new Date().toISOString(), text }),
          }).catch(() => {})
        } catch (warn) { /* 忽略 */ }
      }

      render() {
        if (this.state.error !== '') return null
        return this.props.children
      }
    }

    /* ------------------------------------------------ 0.115 · 非 md 文件的两种视图（DocPanel 只做派发） */

    /** 批注状态汇总：同一处有多条时，sent > answered > queued。 */
    function marksStatus(list) {
      if (list.some(entry => entry.status === 'sent')) return 'sent'
      if (list.some(entry => entry.status === 'answered')) return 'answered'
      return 'queued'
    }

    /** 非 md 文件的选区额外信息：路径写文件名、位置写 text locator（行号）。md 文档返回 null。 */
    function fileTargetExtra(doc, startChar, endChar) {
      if (isFileDoc(doc) !== true) return null
      const text = typeof doc.fileText === 'string' ? doc.fileText : ''
      return {
        path: typeof doc.fileName === 'string' && doc.fileName !== '' ? doc.fileName : DOC_PATH,
        locator: { kind: 'text', blockIndex: 0, startChar, endChar, line: lineAtOffset(text, startChar) },
      }
    }

    /** 纯文本 / 代码：等宽 <pre>，就是第 0 段（复用文档里现有的划句批注）。 */
    function PlainFileView(props) {
      const text = typeof props.text === 'string' ? props.text : ''
      const marks = Array.isArray(props.marks) ? props.marks : []
      const ranges = []
      for (const entry of marks) {
        const quote = typeof entry.quote === 'string' ? entry.quote : ''
        if (quote === '') continue
        let from = typeof entry.startChar === 'number' ? entry.startChar : -1
        if (from < 0 || text.slice(from, from + quote.length) !== quote) {
          const first = text.indexOf(quote)
          from = first >= 0 && text.indexOf(quote, first + 1) < 0 ? first : -1
        }
        if (from >= 0) ranges.push({ from, to: from + quote.length, id: entry.id, status: entry.status })
      }
      ranges.sort((a, b) => a.from - b.from)
      const pieces = []
      let cursor = 0
      for (const range of ranges) {
        if (range.from < cursor) continue
        if (range.from > cursor) pieces.push(text.slice(cursor, range.from))
        pieces.push(h('span', { key: 'm' + String(pieces.length), className: 'dsha-doc-span', 'data-mark': range.id, 'data-status': range.status }, text.slice(range.from, range.to)))
        cursor = range.to
      }
      if (cursor < text.length) pieces.push(text.slice(cursor))
      return h('pre', { className: 'dsha-file-pre', 'data-block': '0', 'data-file-kind': props.kind }, pieces)
    }

    const TABLE_PAGE_ROWS = 500

    /**
     * 表格视图（csv）：表头吸附，单元格 `data-cell="R:C"`（R/C 从 0 起，R=0 是表头行）。
     * 点单元格 → 复用现有批注气泡，locator = { kind:'cell', sheet:'', row, col }，引文 `B3: 值`。
     * 有批注的单元格右上角一个数字角标，点角标开线程卡（data-mark，由 DocPanel 的点击处理）。
     */
    function TableView(props) {
      const doc = props.doc
      const sessionId = props.sessionId
      /* 0.116：工作簿由 WorkbookView 直接传当前那张表的 rows；csv 仍从 doc.model.rows 取。 */
      const rows = Array.isArray(props.rows)
        ? props.rows
        : (doc !== null && doc !== undefined && doc.model !== undefined && doc.model !== null && Array.isArray(doc.model.rows)
          ? doc.model.rows
          : [])
      /* 0.116：工作簿里的一张表由 WorkbookView 传 sheet / formulas 进来；csv 两者都没有（sheet=''）。 */
      const sheet = typeof props.sheet === 'string' ? props.sheet : ''
      const formulas = props.formulas !== null && props.formulas !== undefined && typeof props.formulas === 'object' ? props.formulas : {}
      const [limit, setLimit] = React.useState(TABLE_PAGE_ROWS)
      const [selected, setSelected] = React.useState('')
      /* 0.117：双击单元格就地改值，提交后写回磁盘（csv 直接重写；xlsx 换 sheet xml 重新打包）。 */
      const [editor, setEditor] = React.useState(null)
      /* 0.117.1：状态这类列单击就弹出候选值，点一个直接换掉并写回（不用打字）。 */
      const [picker, setPicker] = React.useState(null)
      const [notice, setNotice] = React.useState('')
      const [saving, setSaving] = React.useState('')
      const fileNameOfDoc = () => (doc !== null && doc !== undefined && typeof doc.fileName === 'string' ? doc.fileName : '')
      /* 列名像「状态」时给下拉，省得手打；否则自由输入。 */
      /** 状态值 → 色调（关键词优先；没见过的值按顺序取色，保证同值同色）。 */
      const toneOfStatus = (value) => {
        const text = String(value === undefined || value === null ? '' : value).trim()
        if (text === '') return ''
        if (/已完成|已入库|已下载|已替换|通过|完成|done|ok/iu.test(text)) return 'green'
        if (/进行中|在做|处理中|候选已找到|审核中|doing/iu.test(text)) return 'blue'
        if (/未开始|待办|待找|待核|待定|todo|pending/iu.test(text)) return 'gray'
        if (/需付费|付费|fail|失败|已取消|取消|error/iu.test(text)) return 'red'
        if (/自建|自做/iu.test(text)) return 'purple'
        if (/待核价格|待报价/iu.test(text)) return 'orange'
        const palette = ['blue', 'purple', 'green', 'orange', 'gray', 'red']
        let hash = 0
        for (const ch of text) hash = (hash + ch.codePointAt(0)) % 9973
        return palette[hash % palette.length]
      }
      const statusOptionsOf = (c) => {
        const head = Array.isArray(rows[0]) && rows[0][c] !== undefined ? String(rows[0][c]) : ''
        if (/状态|完成|进度|status/iu.test(head) !== true) return null
        const seen = new Set()
        for (const line of rows) {
          const one = Array.isArray(line) && line[c] !== undefined && line[c] !== null ? String(line[c]).trim() : ''
          if (one !== '') seen.add(one)
        }
        const options = [...seen]
        for (const extra of ['未开始', '进行中', '已完成', '已取消']) {
          if (options.includes(extra) !== true) options.push(extra)
        }
        return options.slice(0, 12)
      }
      /* 状态选项：预设（对齐 Notion Presets）+ 自己加的值 + 每个值的颜色 + 本地隐藏。 */
      const STATUS_PRESETS = [
        { name: '状态 Status', values: ['未开始', '进行中', '已完成', '已取消', '阻塞'] },
        { name: '优先级 Priority', values: ['高', '中', '低'] },
        { name: '是否 Yes / No', values: ['是', '否'] },
        { name: '审批 Approval', values: ['待审批', '已通过', '已驳回'] },
        { name: '健康度 Health', values: ['正常', '有风险', '阻塞'] },
        { name: '尺寸 Size', values: ['S', 'M', 'L', 'XL'] },
      ]
      const STATUS_TONES = ['red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'magenta']
      const TONE_LABEL = { red: '红', orange: '橙', yellow: '黄', green: '绿', teal: '青', blue: '蓝', purple: '紫', magenta: '品红', gray: '灰' }
      /** 这一列的状态选项存哪儿：文件 + 工作表 + 列号（只存本地，不写进文件）。 */
      const optsKeyOf = (c) => 'dsha-status-opts/v1:'
        + String(doc !== null && doc !== undefined && doc.fileName ? doc.fileName : '') + '#' + sheet + '#' + String(c)
      const readOpts = (c) => {
        const empty = { custom: [], colors: {}, hidden: [] }
        try {
          const raw = window.localStorage.getItem(optsKeyOf(c))
          if (raw === null) return empty
          const one = JSON.parse(raw)
          if (one === null || typeof one !== 'object') return empty
          return {
            custom: Array.isArray(one.custom) ? one.custom.filter(v => typeof v === 'string' && v !== '') : [],
            colors: one.colors !== null && typeof one.colors === 'object' ? one.colors : {},
            hidden: Array.isArray(one.hidden) ? one.hidden.filter(v => typeof v === 'string') : [],
          }
        } catch (error) {
          return empty
        }
      }
      const writeOpts = (c, one) => {
        try {
          const next = { custom: one.custom.slice(0, 24), colors: one.colors, hidden: one.hidden.slice(0, 48) }
          window.localStorage.setItem(optsKeyOf(c), JSON.stringify(next))
        } catch (error) { /* 存不下不影响写回 */ }
      }
      /** 单元格用色：本地指定优先，其次按关键词。 */
      const toneForCell = (c, value) => {
        const one = readOpts(c)
        const text = String(value === undefined || value === null ? '' : value).trim()
        if (text !== '' && typeof one.colors[text] === 'string' && one.colors[text] !== '') return one.colors[text]
        return toneOfStatus(text)
      }
      /** 这一列能选的值：文件里已有的 + 自己加的 − 本地隐藏的。 */
      const optionsOfColumn = (c) => {
        const base = statusOptionsOf(c)
        if (base === null) return []
        const one = readOpts(c)
        const all = []
        for (const value of [...base, ...one.custom]) {
          if (value === '' || one.hidden.includes(value)) continue
          if (all.includes(value) !== true) all.push(value)
        }
        return all.slice(0, 18)
      }
      const commitCell = (r, c, value) => {
        const fileName = fileNameOfDoc()
        if (fileName === '' || typeof sessionId !== 'string' || sessionId === '') return
        setSaving(String(r) + ':' + String(c))
        setNotice('')
        void (async () => {
          try {
            const response = await fetch('/annotate-file/set', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({
                sid: sessionId, path: fileName, sheet,
                row: r, col: c, value,
                mtime: doc !== null && doc !== undefined && typeof doc.mtime === 'number' ? doc.mtime : undefined,
              }),
            })
            const data = await response.json()
            if (data !== null && data.ok === true) {
              setNotice('已写回 ' + cellLabel(r, c) + '：' + String(value))
              setEditor(null)
              if (typeof props.onChanged === 'function') props.onChanged()
            } else {
              const why = data === null ? '' : String(data.reason === undefined ? '' : data.reason)
              setNotice(why === 'stale' ? '文件在别处被改过，先重新打开再改' : ('没写回：' + (why === '' ? '未知原因' : why)))
            }
          } catch (error) {
            setNotice('没写回：连不上宿主')
          } finally {
            setSaving('')
          }
        })()
      }
      const byCell = new Map()
      for (const entry of (Array.isArray(props.marks) ? props.marks : [])) {
        const loc = entry.locator
        if (loc === null || loc === undefined || loc.kind !== 'cell') continue
        if ((typeof loc.sheet === 'string' ? loc.sheet : '') !== sheet) continue
        const key = String(loc.row) + ':' + String(loc.col)
        const list = byCell.get(key)
        if (list === undefined) byCell.set(key, [entry])
        else list.push(entry)
      }
      if (rows.length === 0) return h('div', { className: 'dsha-file-tip' }, '这个表格是空的。')
      const width = rows.reduce((max, row) => Math.max(max, Array.isArray(row) ? row.length : 0), 0)
      const openCell = (event, r, c) => {
        const target = event.target
        if (target instanceof Element && target.closest('[data-mark]') !== null) return
        if (typeof sessionId !== 'string' || sessionId === '') return
        /* 引文只放单元格的值：发出去那行已经是「文件名 · A2 「值」」，
           再把 A2 写进引文会变成「A2 「A2: 值」」（2026-11-28 实测）。 */
        const quote = cellValue(rows, r, c) === '' ? cellQuote(rows, r, c) : cellValue(rows, r, c)
        const rect = event.currentTarget.getBoundingClientRect()
        setSelected(String(r) + ':' + String(c))
        runtime.target = {
          kind: 'doc',
          path: typeof doc.fileName === 'string' && doc.fileName !== '' ? doc.fileName : DOC_PATH,
          blockIndex: 0,
          startChar: 0,
          endChar: quote.length,
          quote,
          locator: { kind: 'cell', sheet, row: r, col: c },
        }
        runtime.targetAt = Date.now()
        const spot = {
          sessionId,
          x: Math.max(8, Math.min(rect.left, window.innerWidth - 380)),
          y: Math.max(54, Math.min(rect.bottom + 6, window.innerHeight - 260)),
        }
        /* 先收起旧气泡再开新的：气泡在挂载那一刻抓 runtime.target，不重挂就还是上一格。 */
        commit({ surface: null, docToolbar: null, docPending: null })
        window.setTimeout(() => commit({ surface: spot }), 0)
      }
      const cellOf = (tag, r, c) => {
        const line = rows[r]
        const value = Array.isArray(line) && line[c] !== undefined ? String(line[c]) : ''
        const key = String(r) + ':' + String(c)
        const here = byCell.get(key)
        const newest = here === undefined ? null : here.slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))[0]
        const formula = typeof formulas[cellLabel(r, c)] === 'string' ? formulas[cellLabel(r, c)] : ''
        const editing = editor !== null && editor.r === r && editor.c === c && formula === ''
        if (editing) {
          const options = statusOptionsOf(c)
          const stop = event => { event.stopPropagation() }
          return h(tag, {
            key: String(c),
            'data-cell': key,
            'data-editing': '1',
            onClick: stop,
            onContextMenu: stop,
          }, options === null
            ? h('input', {
              className: 'dsha-tv-edit',
              autoFocus: true,
              defaultValue: editor.value,
              onKeyDown: (event) => {
                if (event.key === 'Enter') { event.preventDefault(); commitCell(r, c, event.currentTarget.value) }
                if (event.key === 'Escape') { event.preventDefault(); setEditor(null) }
              },
              onBlur: event => commitCell(r, c, event.currentTarget.value),
            })
            : h('select', {
              className: 'dsha-tv-edit',
              autoFocus: true,
              defaultValue: editor.value,
              onChange: event => commitCell(r, c, event.currentTarget.value),
              onBlur: () => setEditor(null),
            }, options.map(one => h('option', { key: one, value: one }, one))))
        }
        const tone = statusOptionsOf(c) === null ? '' : toneForCell(c, value)
        const cellBody = tone === ''
          ? value
          : h('span', { className: 'dsha-chip', 'data-tone': tone }, value === '' ? '—' : value)
        return h(tag, {
          key: String(c),
          'data-cell': key,
          'data-pickable': statusOptionsOf(c) === null ? undefined : '1',
          'data-on': selected === key ? '1' : undefined,
          'data-status': here === undefined ? undefined : marksStatus(here),
          title: cellLabel(r, c) + (formula === '' ? '' : ' · ' + formula + '（显示的是缓存值）') + ' · 左键选中，右键写批注',
          /* 左键：状态列弹候选值（点一下换掉）；其它列只选中。右键开批注框，双击改值。 */
          onClick: (event) => {
            setSelected(String(r) + ':' + String(c))
            const quick = optionsOfColumn(c)
            if (quick === null || formula !== '') return
            const rect = event.currentTarget.getBoundingClientRect()
            setPicker({ r, c, value: value, options: quick, x: rect.left, y: rect.bottom + 4 })
          },
          onDoubleClick: () => {
            if (formula !== '') return
            setEditor({ r, c, value: value })
          },
          onContextMenu: event => {
            event.preventDefault()
            openCell(event, r, c)
          },
        },
          formula === '' ? null : h('span', { className: 'dsha-tv-fx', title: formula }, 'ƒ'),
          cellBody,
          statusOptionsOf(c) === null ? null : h('span', { className: 'dsha-chip-caret', 'aria-hidden': 'true' }, '▾'),
          newest === null
            ? null
            : h('span', {
              className: 'dsha-doc-span',
              'data-mark': newest.id,
              'data-status': marksStatus(here),
              title: String(here.length) + ' 条批注 · 点开看',
              style: { marginLeft: '6px', padding: '0 5px', fontSize: '10px', cursor: 'pointer' },
            }, String(here.length)))
      }
      const columns = []
      for (let c = 0; c < width; c += 1) columns.push(c)
      const shown = Math.min(rows.length, limit + 1)
      const body = []
      for (let r = 1; r < shown; r += 1) {
        body.push(h('tr', { key: String(r) },
          h('td', { className: 'dsha-tv-rn' }, String(r + 1)),
          columns.map(c => cellOf('td', r, c))))
      }
      const truncated = typeof props.truncated === 'boolean'
        ? props.truncated
        : (doc.caps !== null && doc.caps !== undefined && doc.caps.truncated === true)
      /* 候选值浮层：点一个就换值并写回；点别处/按 Esc 关掉。 */
      const pickerNode = picker === null ? null : h('div', {
        className: 'dsha-cell-pick',
        style: { left: String(Math.max(8, picker.x)) + 'px', top: String(picker.y) + 'px' },
        onClick: event => event.stopPropagation(),
      },
      picker.mode === 'color'
        ? [
          h('div', { key: 'ct', className: 'dsha-pick-head' }, String(picker.option || '') + ' 的颜色'),
          h('div', { key: 'grid', className: 'dsha-pick-grid' },
            ['', ...STATUS_TONES].map(tone => h('button', {
              key: tone === '' ? 'auto' : tone,
              type: 'button',
              className: 'dsha-pick-swatch',
              title: tone === '' ? '自动（按含义）' : TONE_LABEL[tone],
              'data-tone': tone,
              'data-on': (readOpts(picker.c).colors[picker.option] || '') === tone ? '1' : '0',
              onClick: () => {
                const one = readOpts(picker.c)
                const colors = { ...one.colors }
                if (tone === '') delete colors[picker.option]
                else colors[picker.option] = tone
                writeOpts(picker.c, { ...one, colors })
                setPicker({ ...picker, mode: 'list' })
              },
            }, tone === '' ? '自动' : ''))),
          h('div', { key: 'csep', className: 'dsha-pick-sep' }),
          h('button', {
            key: 'del',
            type: 'button',
            className: 'dsha-pick-more dsha-pick-danger',
            onClick: () => {
              const one = readOpts(picker.c)
              const hidden = one.hidden.includes(picker.option) ? one.hidden : [...one.hidden, picker.option]
              writeOpts(picker.c, { ...one, hidden })
              setPicker({ ...picker, mode: 'list' })
            },
          }, '🗑 从候选里删除'),
          h('button', {
            key: 'cback',
            type: 'button',
            className: 'dsha-pick-more',
            onClick: () => setPicker({ ...picker, mode: 'list' }),
          }, '‹ 返回'),
        ]
        : picker.mode === 'presets'
          ? [
            h('div', { key: 'pt', className: 'dsha-pick-head' }, '预设'),
            ...STATUS_PRESETS.map(preset => h('button', {
              key: preset.name,
              type: 'button',
              className: 'dsha-pick-item',
              onClick: () => {
                const one = readOpts(picker.c)
                const custom = [...one.custom]
                for (const value of preset.values) if (custom.includes(value) !== true) custom.push(value)
                writeOpts(picker.c, { ...one, custom })
                setPicker({ ...picker, mode: 'list', options: optionsOfColumn(picker.c) })
              },
            },
            h('span', { className: 'dsha-pick-preset' }, preset.name),
            h('span', { className: 'dsha-pick-dots' },
              preset.values.slice(0, 4).map(value => h('span', { key: value, className: 'dsha-dot', 'data-tone': toneOfStatus(value) }))))),
            h('button', {
              key: 'back',
              type: 'button',
              className: 'dsha-pick-more',
              onClick: () => setPicker({ ...picker, mode: 'list' }),
            }, '‹ 返回'),
          ]
          : [
            ...picker.options.map(one => h('div', {
              key: one,
              className: 'dsha-pick-row' + (one === picker.value ? ' dsha-pick-item-on' : ''),
            },
            h('button', {
              type: 'button',
              className: 'dsha-pick-item dsha-pick-grow',
              onClick: () => {
                const opts = readOpts(picker.c)
                if (opts.custom.includes(one) !== true) writeOpts(picker.c, { ...opts, custom: [...opts.custom, one] })
                commitCell(picker.r, picker.c, one)
                setPicker(null)
              },
            },
            h('span', { className: 'dsha-chip', 'data-tone': toneForCell(picker.c, one) }, one === '' ? '（空）' : one),
            one === picker.value ? h('span', { className: 'dsha-pick-tick' }, '✓') : null),
            h('button', {
              type: 'button',
              className: 'dsha-pick-more-btn',
              title: '改颜色 / 删除',
              onClick: () => setPicker({ ...picker, mode: 'color', option: one }),
            }, '…'))),
            picker.mode === 'add'
              ? h('input', {
                key: 'add',
                className: 'dsha-tv-edit',
                autoFocus: true,
                placeholder: '新选项，回车添加',
                onKeyDown: (event) => {
                  if (event.key === 'Escape') { event.preventDefault(); setPicker({ ...picker, mode: 'list' }) }
                  if (event.key !== 'Enter') return
                  event.preventDefault()
                  const one = String(event.currentTarget.value || '').trim()
                  if (one === '') return
                  const opts = readOpts(picker.c)
                  if (opts.custom.includes(one) !== true) writeOpts(picker.c, { ...opts, custom: [...opts.custom, one] })
                  commitCell(picker.r, picker.c, one)
                  setPicker(null)
                },
              })
              : null,
            h('div', { key: 'sep', className: 'dsha-pick-sep' }),
            h('button', {
              key: 'add-btn',
              type: 'button',
              className: 'dsha-pick-more',
              onClick: () => setPicker({ ...picker, mode: 'add' }),
            }, '＋ 新选项'),
            h('button', {
              key: 'preset-btn',
              type: 'button',
              className: 'dsha-pick-more',
              onClick: () => setPicker({ ...picker, mode: 'presets' }),
            }, '预设 ›'),
          ])

      return h('div', { className: 'dsha-tv-wrap' },
        h('table', { className: 'dsha-tv' },
          h('thead', null,
            h('tr', null,
              h('th', { className: 'dsha-tv-rn' }, '1'),
              columns.map(c => cellOf('th', 0, c)))),
          h('tbody', null, body)),
        h('div', { className: 'dsha-tv-foot' },
          String(rows.length) + ' 行 × ' + String(width) + ' 列'
          + (truncated ? '（超过 5000 行或 64 列，已截断）' : ''),
          shown < rows.length
            ? h('button', {
              type: 'button',
              className: 'dsha-mini',
              style: { marginLeft: '8px' },
              onClick: () => setLimit(value => value + TABLE_PAGE_ROWS),
            }, '再显示 ' + String(Math.min(TABLE_PAGE_ROWS, rows.length - shown)) + ' 行')
            : null),
        pickerNode,
        (saving === '' ? null : h('div', { className: 'dsha-tv-foot' }, '正在写回 ' + saving + '…')),
        (notice === '' ? null : h('div', { className: 'dsha-tv-foot' }, notice)))
    }

    /**
     * 0.116 · 工作簿视图（xlsx）：顶部工作表标签（多于 1 张才显示），切换只换 rows；
     * 单元格渲染与 openCell 全部复用 TableView，locator.sheet 写表名。
     * 每张表的批注数显示在标签上。
     */
    function WorkbookView(props) {
      const doc = props.doc
      const sheets = doc !== null && doc !== undefined && doc.model !== null && doc.model !== undefined && Array.isArray(doc.model.sheets)
        ? doc.model.sheets
        : []
      const [active, setActive] = React.useState(0)
      if (sheets.length === 0) return h('div', { className: 'dsha-file-tip' }, '这个工作簿里没有可读的工作表。')
      const index = Math.max(0, Math.min(active, sheets.length - 1))
      const current = sheets[index]
      const marks = Array.isArray(props.marks) ? props.marks : []
      const countOf = name => marks.filter(entry => entry.locator !== null && entry.locator !== undefined
        && entry.locator.kind === 'cell' && entry.locator.sheet === name).length
      return h('div', { className: 'dsha-wb' },
        sheets.length > 1
          ? h('div', { className: 'dsha-wb-tabs', role: 'tablist' },
            sheets.map((sheet, order) => {
              const count = countOf(sheet.name)
              return h('button', {
                key: String(order) + ':' + sheet.name,
                type: 'button',
                role: 'tab',
                className: order === index ? 'dsha-mini dsha-mini-on' : 'dsha-mini',
                'aria-selected': order === index ? 'true' : 'false',
                title: sheet.name + ' · ' + String(sheet.rows.length) + ' 行' + (count > 0 ? ' · ' + String(count) + ' 条批注' : ''),
                onClick: () => setActive(order),
              }, sheet.name, count > 0 ? h('span', { className: 'dsha-wb-count' }, String(count)) : null)
            }))
          : null,
        h(TableView, {
          /* key 带表名：切表时 TableView 的分页与选中状态重置，不把上一张表的选中格带过来。 */
          key: 'sheet:' + String(index) + ':' + current.name,
          doc,
          sessionId: props.sessionId,
          marks,
          sheet: current.name,
          formulas: current.formulas,
          truncated: current.truncated === true,
          rows: current.rows,
          onChanged: props.onChanged,
        }))
    }

    /** 非 md 文件的派发：表格 → TableView；工作簿 → WorkbookView；有正文 → 纯文本；其余 → 一句提示（不报错、不白屏）。 */
    function renderFileDoc(doc, sessionId, marks, onChanged) {
      if (doc.parseFailed === true) {
        return h('div', { className: 'dsha-file-tip' }, '「' + String(doc.fileName || doc.title || '') + '」这个表格解析不了（文件可能损坏，或是老的 .xls 格式）。')
      }
      if (doc.unsupported === true) {
        const label = { xlsx: 'Excel 表格', docx: 'Word 文档', pptx: '演示文稿', image: '图片' }[doc.fileKind] || '这种文件'
        return h('div', { className: 'dsha-file-tip' },
          '「' + String(doc.fileName || doc.title || '') + '」是' + label + '，暂不支持预览。')
      }
      if (doc.needsLoad === true && doc.model === undefined && doc.fileText === undefined) {
        return h('div', { className: 'dsha-file-tip' }, '正在读取「' + String(doc.fileName || '') + '」…')
      }
      if (doc.model !== null && doc.model !== undefined && doc.model.type === 'table') {
        return h(TableView, { doc, sessionId, marks, onChanged })
      }
      if (doc.model !== null && doc.model !== undefined && doc.model.type === 'workbook') {
        return h(WorkbookView, { key: 'wb:' + String(doc.key), doc, sessionId, marks, onChanged })
      }
      return h(PlainFileView, { text: doc.fileText, kind: doc.fileKind, marks })
    }

    function DocPanel(props) {
      const embedded = props !== null && props !== undefined && props.embedded === true
      const wide = props !== null && props !== undefined && props.wide === true
      const store = useStore()
      const [classes, setClasses] = React.useState([])
      const [probe, setProbe] = React.useState('')
      const [candidate, setCandidate] = React.useState('')
      const [navOpen, setNavOpen] = React.useState(false)
      const open = embedded || store.docOpen === true || (wide && store.docWide === true)

      /* 面板真的开着、并且显示的就是当前这份 → 记「看过」，顶栏提示点随之熄灭。 */
      React.useEffect(() => {
        if (open !== true) return
        const stamp = docStampOf(store.doc)
        if (stamp === '') return
        if (String(store.docSeen === undefined ? '' : store.docSeen) === stamp) return
        commit({ docSeen: stamp }, true)
      }, [open, store.doc, store.docSeen])

      /* 会话 id 优先级：页签给的 scope.sessionId（真实当前会话）→ 显式 props.sessionId → store.active。
         store.active 是「上次动过批注的会话」，拿它当当前会话会让这一页串到别的会话去。 */
      const scopeId = props !== null && props !== undefined && props.scope !== null && props.scope !== undefined
        && typeof props.scope.sessionId === 'string'
        ? props.scope.sessionId
        : ''
      /* store.docSid = 顶栏「文档」按钮报上来的**当前会话**（切会话就会更新），比页签自己的
         scope.sessionId 可靠：页签是常驻的，scope 停在注册那一刻（2026-11-27）。 */
      const liveSid = typeof store.docSid === 'string' ? store.docSid : ''
      React.useEffect(() => {
        const tail = sessionTail(liveSid !== '' ? liveSid : scopeId)
        const mine = store.docs !== null && store.docs !== undefined && typeof (liveSid !== '' ? liveSid : scopeId) === 'string'
          ? (store.docs[liveSid !== '' ? liveSid : scopeId] || {}) : {}
        logLine('文档面板挂载 kind=' + (embedded === true ? '页签' : (wide === true ? '窗口' : '其它'))
          + ' 来源=' + (scopeId !== '' ? '页签scope' : (liveSid !== '' ? 'docSid' : 'active'))
          + ' sid=' + tail + ' 我的库=' + String(Object.keys(mine).length) + ' 份'
          + ' 全库=' + String(store.docs === null || store.docs === undefined ? 0 : Object.keys(store.docs).length) + '个会话')
      }, [embedded, wide])
      const sessionId = scopeId !== ''
        ? scopeId
        : (liveSid !== ''
          ? liveSid
          : (props !== null && props !== undefined && typeof props.sessionId === 'string' && props.sessionId !== ''
            ? props.sessionId
            : store.active))
      /* 文档按会话隔离：有条目 sid 的只给它自己那个会话看；没有 sid 的老数据，
         第一次在某个会话里显示时就认领给那个会话（只认领一次，别处不再串）。 */
      /* 归属按「文件目录的会话尾巴」判，不只信 sid —— sid 被双实例时期写串过，
         于是别的会话的文档也能盖着「本会话」的章显示出来（用户 2026-11-27 报的现象）。 */
      const ownTail = 'file:' + sessionTail(sessionId) + '/'
      const docKeyRaw = store.doc !== null && store.doc !== undefined && typeof store.doc.key === 'string' ? store.doc.key : ''
      const docSession = store.doc !== null && store.doc !== undefined ? store.doc.sid : undefined
      /* 归属只有两种合法证据：
         ① 文件键 file:<tail>/… 的 tail === 本会话尾巴；
         ② 聊天键（不以 file: 开头）必须显式带本会话 sid。
         以前对「没有 sid 的老数据」放行，结果这种文档在每个会话里都会显示。 */
      /* 0.112：两条证据合成一个纯函数 docBelongsTo（sid 一致；文件键再要求目录尾巴一致）。 */
      const docKeyMine = docBelongsTo(store.doc, sessionId)
      void docKeyRaw
      void docSession
      const docStored = store.doc !== null && store.doc !== undefined && docKeyMine
        ? store.doc
        : null
      const editing = store.docEditing === true && (store.docPick === '' || store.docPick === undefined)
      const fontSize = typeof store.docFont === 'number' ? store.docFont : 15
      const pick = typeof store.docPick === 'string' ? store.docPick : ''
      /* 只读本会话的桶（schema 3）：别的会话的文档结构上就不在这里。 */
      const library = store.docs !== null && store.docs !== undefined && typeof sessionId === 'string'
        && store.docs[sessionId] !== undefined && store.docs[sessionId] !== null
        ? store.docs[sessionId]
        : EMPTY_LIB
      /* 见过的文档都留在库里：聊天流里滚出去、折叠掉的也算，切回来还能看。按会话分开列。 */
      const docs = React.useMemo(() => dedupeDocList(Object.entries(library)
        .map(([key, value]) => ({ key, title: value.title, text: value.text, at: value.at, sid: value.sid, trusted: value.trusted }))
        /* 只列本会话的：没有 sid 的老条目一律不列；不可信的（归属没被本会话聊天确认过）也不列。 */
        .filter(entry => entry.sid === sessionId && entry.trusted !== false)
        /* 同一条尾巴规则：file:<别的会话>/… 的老条目不再列到本会话里。 */
        .filter(entry => String(entry.key).indexOf('file:') !== 0
          || String(entry.key).indexOf('file:' + sessionTail(sessionId) + '/') === 0)
        .sort((a, b) => b.at - a.at)
        ), [library, sessionId])
      /* 0.115：本会话目录里的非 md 文件（txt / 代码 / csv / 不支持的类型），列在文档清单下面。
         只读清单、不进文档库：库与写穿规则只管 Markdown（第 2 节那十条不动）。 */
      const [extraFiles, setExtraFiles] = React.useState([])
      /* 0.116：表格文件的「导出」是个下拉（批注.csv / 改后.xlsx）；md 文档仍是一键复制。 */
      const [exportOpen, setExportOpen] = React.useState(false)
      React.useEffect(() => {
        if (!open || typeof sessionId !== 'string' || sessionId === '') return undefined
        let alive = true
        void (async () => {
          try {
            const listed = await fetch('/annotate-file/list?sid=' + encodeURIComponent(sessionId)).then(response => response.json())
            if (!alive) return
            const items = listed !== null && listed !== undefined && listed.ok === true && Array.isArray(listed.items) ? listed.items : []
            setExtraFiles(items.map(item => ({
              file: String(item.file === undefined ? '' : item.file),
              kind: String(item.kind === undefined ? '' : item.kind),
              supported: item.supported === true,
              mtime: Number(item.mtime) || 0,
            /* 0.118.1：`.bak` / `~$` / `.tmp` 不列（宿主也过滤了，这里双保险）。 */
            })).filter(item => item.file !== '' && /\.bak$|\.tmp$|^~\$/u.test(item.file) !== true))
          } catch (error) {
            if (alive) setExtraFiles([])
          }
        })()
        return () => { alive = false }
      }, [open, sessionId, navOpen])
      /* 0.115：localStorage 里只存了非 md 文件的「名字」（正文太大不存），面板打开时按名字重读一次。 */
      const needsLoadKey = store.doc !== null && store.doc !== undefined && isFileDoc(store.doc) && store.doc.needsLoad === true
        && store.doc.model === undefined && store.doc.fileText === undefined && store.doc.sid === sessionId
        ? String(store.doc.fileName || '')
        : ''
      React.useEffect(() => {
        if (!open || needsLoadKey === '') return
        void openSessionFile(sessionId, needsLoadKey)
      }, [open, needsLoadKey, sessionId])
      /* pick 为空 = 跟着聊天走（最新那份）；否则只读查看历史某一份。 */
      /* 兜底：state.doc 的 sid 过期（宿主重启/会话重建换过 id），但本会话文档库里明明存着它 ——
         直接拿库里的那份显示。虚拟列表把 dsh-doc 块卸掉之后，文档栏就是靠这条不空着。 */
      const docFallback = React.useMemo(() => {
        if (docStored !== null) return null
        const mine = Object.keys(library)
          .map(key => [key, library[key]])
          .filter(([, entry]) => entry !== null && entry !== undefined
            && entry.sid === sessionId && entry.trusted !== false
            && typeof entry.text === 'string' && entry.text !== '')
          .sort((a, b) => Number(b[1].at === undefined ? 0 : b[1].at) - Number(a[1].at === undefined ? 0 : a[1].at))
        if (mine.length === 0) return null
        const blocks = parseMarkdownDoc(mine[0][1].text)
        return {
          id: 'main',
          sid: sessionId,
          key: mine[0][0],
          blocks,
          baseCount: blocks.length,
          appends: [],
          source: mine[0][1].text,
          editedAt: 0,
        }
      }, [docStored, library, sessionId])
      const doc = docStored !== null ? docStored : docFallback
      /* 看历史版时用「选中那一刻的快照」，不再每拍去库里找（找不到就会弹回最新，就是那个闪）。 */
      /* 历史版快照也按会话隔离：A 会话里点开的历史版，切到 B 不能继续显示（快照带 sid，对不上就当没有）。 */
      const snapshot = store.docView === null || store.docView === undefined || store.docView.sid !== sessionId ? null : store.docView
      const viewing = snapshot !== null && typeof snapshot.text === 'string'
        ? snapshot
        : (pick === '' ? null : (docs.find(entry => entry.key === pick) || null))
      const viewText = viewing === null ? '' : viewing.text
      const viewBlocks = React.useMemo(
        () => (viewText === '' ? [] : parseMarkdownDoc(viewText)),
        [viewText],
      )
      const drawerOpen = store.docDrawer === true
      const [flash, setFlash] = React.useState('')
      const [openGroup, setOpenGroup] = React.useState('')
      /* 同一个标题的多份合并成一组，展开才看到历史版。 */
      const groups = React.useMemo(() => {
        const map = new Map()
        for (const entry of docs) {
          const name = String(entry.title === undefined || entry.title === '' ? '未命名文档' : entry.title)
          const group = map.get(name)
          if (group === undefined) map.set(name, { title: name, versions: [entry] })
          else group.versions.push(entry)
        }
        const list = [...map.values()]
        for (const group of list) group.versions.sort((a, b) => b.at - a.at)
        list.sort((a, b) => b.versions[0].at - a.versions[0].at)
        return list
      }, [docs])

      /* 选中的那份被新的聊天内容替换掉了就自动回到最新，别卡在空白上。 */
      React.useEffect(() => {
        if (!open) return
        if (pick === '' || docs.length === 0) return
        if (store.docView !== null && store.docView !== undefined) return
        if (docs.some(entry => entry.key === pick)) return
        commit({ docPick: '' }, true)
      }, [open, pick, docs])

      /* 两种窗口（放大 / 浮动）共用一套几何：都能拖标题栏移动、拖四面八向改大小。 */
      const fitBox = (box, base, minW, minH) => {
        if (box === null || box === undefined) return base
        const w = Math.max(minW, Math.min(Number.isFinite(box.w) ? box.w : base.w, window.innerWidth - 8))
        const h = Math.max(minH, Math.min(Number.isFinite(box.h) ? box.h : base.h, window.innerHeight - 8))
        const x = Number.isFinite(box.x) ? box.x : base.x
        const y = Number.isFinite(box.y) ? box.y : base.y
        return {
          x: Math.max(-60, Math.min(x, Math.max(0, window.innerWidth - w - 8))),
          y: Math.max(48, Math.min(y, Math.max(48, window.innerHeight - 80))),
          w,
          h,
        }
      }

      const wideBox = React.useMemo(() => fitBox(store.docWideBox, {
        x: Math.round((window.innerWidth - Math.min(1440, window.innerWidth * 0.96)) / 2),
        y: 72,
        w: Math.min(1440, Math.round(window.innerWidth * 0.96)),
        h: Math.round(window.innerHeight - 150),
      }, 420, 320), [store.docWideBox])

      const floatBox = React.useMemo(() => fitBox(store.docFloatBox, {
        x: Math.round(window.innerWidth - Math.min(700, window.innerWidth * 0.44) - 24),
        y: 72,
        w: Math.min(700, Math.round(window.innerWidth * 0.44)),
        h: Math.round(window.innerHeight * 0.72),
      }, 380, 280), [store.docFloatBox])

      const docBox = wide ? wideBox : (embedded ? null : floatBox)
      const saveBox = (next) => commit(wide ? { docWideBox: next } : { docFloatBox: next })

      const startBoxMove = (event) => {
        if (embedded || event.button !== 0) return
        const target = event.target
        if (target instanceof Element && target.closest('button') !== null) return
        event.preventDefault()
        event.stopPropagation()
        const start = { mx: event.clientX, my: event.clientY, box: docBox }
        const frame = rafGeom()
        setDragging(true)
        const move = (moving) => {
          if (moving.buttons === 0) { up(); return }
          frame.push(() => saveBox({
            ...start.box,
            x: Math.max(-60, Math.min(start.box.x + (moving.clientX - start.mx), Math.max(0, window.innerWidth - start.box.w - 8))),
            y: Math.max(48, Math.min(start.box.y + (moving.clientY - start.my), Math.max(48, window.innerHeight - 80))),
          }))
        }
        const up = () => {
          window.removeEventListener('pointermove', move)
          window.removeEventListener('pointerup', up)
          window.removeEventListener('pointercancel', up)
          frame.flush()
          setDragging(false)
          persist()
        }
        window.addEventListener('pointermove', move)
        window.addEventListener('pointerup', up)
        window.addEventListener('pointercancel', up)
      }

      /** mode: n / s / e / w / ne / nw / se / sw —— 四面八向都能拉。 */
      const startBoxResize = (event, mode) => {
        event.preventDefault()
        event.stopPropagation()
        const start = { mx: event.clientX, my: event.clientY, box: docBox }
        const frame = rafGeom()
        setDragging(true)
        const move = (moving) => {
          if (moving.buttons === 0) { up(); return }
          const dx = moving.clientX - start.mx
          const dy = moving.clientY - start.my
          let x = start.box.x
          let y = start.box.y
          let w = start.box.w
          let h = start.box.h
          if (mode.indexOf('e') >= 0) w = Math.max(380, start.box.w + dx)
          if (mode.indexOf('s') >= 0) h = Math.max(260, start.box.h + dy)
          if (mode.indexOf('w') >= 0) {
            w = Math.max(380, start.box.w - dx)
            x = start.box.x + (start.box.w - w)
          }
          if (mode.indexOf('n') >= 0) {
            h = Math.max(260, start.box.h - dy)
            y = Math.max(48, start.box.y + (start.box.h - h))
          }
          frame.push(() => saveBox({ x, y, w, h }))
        }
        const up = () => {
          window.removeEventListener('pointermove', move)
          window.removeEventListener('pointerup', up)
          window.removeEventListener('pointercancel', up)
          frame.flush()
          setDragging(false)
          persist()
        }
        window.addEventListener('pointermove', move)
        window.addEventListener('pointerup', up)
        window.addEventListener('pointercancel', up)
      }

      /* 抽屉宽度也能拖（左边一条热区），宽度存盘。 */
      const drawerW = typeof store.docDrawerW === 'number' ? store.docDrawerW : 340
      const startDrawerResize = (event) => {
        event.preventDefault()
        event.stopPropagation()
        const start = { mx: event.clientX, w: drawerW }
        const frame = rafGeom()
        setDragging(true)
        const move = (moving) => {
          if (moving.buttons === 0) { up(); return }
          const max = Math.min(760, Math.round(window.innerWidth * 0.7))
          const next = Math.max(260, Math.min(start.w + (start.mx - moving.clientX), max))
          frame.push(() => commit({ docDrawerW: next }))
        }
        const up = () => {
          window.removeEventListener('pointermove', move)
          window.removeEventListener('pointerup', up)
          window.removeEventListener('pointercancel', up)
          frame.flush()
          setDragging(false)
          persist()
        }
        window.addEventListener('pointermove', move)
        window.addEventListener('pointerup', up)
        window.addEventListener('pointercancel', up)
      }

      /* Esc：先关抽屉，再收放大。 */
      React.useEffect(() => {
        if (!open) return undefined
        const onKey = (event) => {
          if (event.key !== 'Escape') return
          if (state.docDrawer === true) {
            commit({ docDrawer: false })
            return
          }
          if (state.docOpen === true || state.docDetached === true) {
            commit({ docOpen: false, docDetached: false })
            return
          }
          if (wide && state.docWide === true) commit({ docWide: false })
        }
        document.addEventListener('keydown', onKey, true)
        return () => document.removeEventListener('keydown', onKey, true)
      }, [open, wide])

      /* 抽屉：点外面就关（点「批注 N」按钮让它自己开关）。 */
      React.useEffect(() => {
        if (state.docDrawer !== true) return undefined
        const onDown = (event) => {
          const target = event.target
          if (target instanceof Element) {
            if (target.closest('.dsha-drawer') !== null) return
            /* 开关按钮自己负责收放；放行它，否则会出现“先关再开”。 */
            if (target.closest('[data-dsha-drawer-toggle]') !== null) return
            const button = target.closest('button')
            if (button !== null && String(button.textContent || '').indexOf('批注 ') === 0) return
          }
          commit({ docDrawer: false })
        }
        const timer = window.setTimeout(() => document.addEventListener('pointerdown', onDown, true), 0)
        return () => {
          window.clearTimeout(timer)
          document.removeEventListener('pointerdown', onDown, true)
        }
      }, [state.docDrawer])

      /* 切到别的会话才清空「已采纳的聊天块」。
         以前这段写在渲染体里：sessionId 是由 props.scope / props.sessionId / store.active 三处拼出来的，
         两次渲染之间一变就会清空，于是聊天块每拍都能重新采纳 → 每拍写盘 + 重渲染 = 闪（2026-11-26）。 */
      /* 采纳记录已按会话分开存（adoptedSetOf），这里不再需要清空。 */
      React.useEffect(() => {
        if (!open) return undefined
        let alive = true
        /* 这个 effect 按 [open, sessionId] 重建：startedAt 就是「切进这个会话」的时刻。 */
        const startedAt = Date.now()
        /* 流式判定（7.3）：上一拍扫到的正文；变了就认为还在生成，接下来 1.5s 内按 250ms 扫。 */
        let lastFoundText = ''
        const load = () => {
          const scan = scanDocBlocks()
          if (!alive) return
          {
            const foundNow = typeof scan.found === 'string' ? scan.found : ''
            if (foundNow !== lastFoundText) {
              lastFoundText = foundNow
              if (foundNow !== '') scanState.streamingUntil = Date.now() + SCAN.STREAM_HOLD_MS
            }
          }
          /* 这三个值只在「空状态」那一屏才会被渲染。正文有了还每拍 setState，
             等于每拍整面板重渲染一次（生成期间正好每拍命中），纯浪费。 */
          const docNow = state.doc
          if (docNow === null || docNow === undefined
            || (Array.isArray(docNow.blocks) && docNow.blocks.length === 0)) {
            setClasses(previous => (previous.join('|') === scan.classes.join('|') ? previous : scan.classes))
            setProbe(previous => (previous === scan.probe ? previous : scan.probe))
            setCandidate(previous => (previous === scan.candidate ? previous : String(scan.candidate === undefined ? '' : scan.candidate)))
          }
          /* 0.113.2：第一次扫描时记下「本来就存在的聊天块」，它们算历史，不许被采纳成当前文档。 */
          try {
            if (runtime.chatBaseline[sessionId] === undefined) {
              const keys = new Set()
              for (const item of (Array.isArray(scan.list) ? scan.list : [])) {
                if (item !== null && item !== undefined && typeof item.key === 'string') keys.add(item.key)
              }
              if (typeof scan.foundKey === 'string' && scan.foundKey !== '') keys.add(scan.foundKey)
              runtime.chatBaseline[sessionId] = keys
            }
          } catch (error) { /* 忽略 */ }
          /* 扫描到的每一份都进文档库（增量合并，只有真变了才写盘）。 */
          const scanned = Array.isArray(scan.list) ? scan.list : []
          if (scanned.length > 0) {
            /* schema 3：只写本会话自己的桶。键撞了也只会撞到本会话自己的条目，
               不可能再把别的会话的文档「改名」到这里（0.111 之前全局键 + 覆盖 sid 就是这样串的）。 */
            const nextLibrary = { ...libOf(sessionId) }
            let dirty = false
            /* 只在本会话确实是当前会话、且切进来已满 900ms 时入库：切会话那一两拍 DOM 可能还是旧会话的。 */
            /* 只按「挂载后 900ms」判断：切会话的瞬间聊天区 DOM 可能还是上一个会话的，先别入库。
               以前还要求 runtime.lastSid === sessionId，而 lastSid 只有右键批注才更新，
               于是从不右键的会话永远不入库（2026-11-27）。 */
            const settled = Date.now() - startedAt >= 900
            for (const entry of scanned) {
              if (settled !== true) continue
              const prev = nextLibrary[entry.key]
              if (prev !== undefined && prev.text === entry.text && prev.title === entry.title) {
                /* 内容没变：只补「可信」标记。 */
                if (prev.trusted !== true) { nextLibrary[entry.key] = { ...prev, trusted: true }; dirty = true }
                continue
              }
              nextLibrary[entry.key] = {
                title: entry.title,
                text: entry.text,
                at: Date.now(),
                sid: sessionId,
                trusted: true,
              }
              dirty = true
            }
            if (dirty) libCommit(sessionId, nextLibrary)
          }
          /* 已经在看的这份如果还没入库（旧数据、块被折叠掉了），用存下来的原文补一条。 */
          const active = state.doc
          if (active !== null && typeof active.source === 'string' && active.source !== '') {
            const activeKey = typeof active.key === 'string' && active.key !== '' ? active.key : 'saved'
            const currentLibrary = libOf(sessionId)
            /* 只给「确实属于本会话」的文档补条目；别的会话的不碰（tick 会先把它放下）。 */
            if (docBelongsTo(active, sessionId) && currentLibrary[activeKey] === undefined) {
              const raw = [active.source]
                .concat((Array.isArray(active.appends) ? active.appends : []).map(part => part.src))
                .join('\n\n')
              const heading = /^#{1,6}\s*(.+)$/mu.exec(raw)
              const firstLine = raw.split('\n').filter(line => line.trim() !== '')[0] || '未命名文档'
              libCommit(sessionId, {
                ...currentLibrary,
                [activeKey]: {
                  title: (heading === null ? firstLine : heading[1]).replace(/[*`]/gu, '').trim().slice(0, 40),
                  text: raw,
                  at: Date.now(),
                  sid: sessionId,
                  /* 本会话聊天采纳 / 本地编辑 / 文件来的才算可信；其它来源先不显示在库列表里。 */
                  trusted: active.origin === 'chat' || active.local === true || String(activeKey).indexOf('file:') === 0,
                },
              }, undefined, true)
            }
          }
          /* 正在本地编辑时不要覆盖用户的手改；其余时候跟聊天里的最新一版对齐。 */
          if (scan.found === null || state.docEditing === true) return
          const current = state.doc
          /* 续写：只换末尾追加的那几段，正文和他已经批注过的段落一个字节都不动。 */
          if (scan.mode === 'append' && current !== null && Array.isArray(current.blocks)) {
            /* 续写要归属到它自己那份文档：别把 A 的续写贴到 B 身上（B 的在文档库里更新）。 */
            const currentKey = typeof current.key === 'string' ? current.key : ''
            if (currentKey !== '' && scan.foundKey !== '' && currentKey !== scan.foundKey) return
            const limit = Number.isFinite(current.baseCount)
              ? Math.max(0, Math.min(current.baseCount, current.blocks.length))
              : current.blocks.length
            const head = current.blocks.slice(0, limit)
            const appends = Array.isArray(current.appends) ? current.appends.slice() : []
            const last = appends[appends.length - 1]
            let changed = true
            if (last !== undefined && last.src === scan.found) {
              changed = false
            } else if (last !== undefined && last.src !== '' && scan.found.startsWith(last.src)) {
              /* 同一段正在流式长出来：原地换掉，别叠成两份。 */
              appends[appends.length - 1] = { src: scan.found }
            } else {
              appends.push({ src: scan.found })
            }
            if (!changed) return
            const blocks = head.concat(...appends.map(part => parseMarkdownDoc(part.src)))
            putDoc({
              ...current,
              key: typeof current.key === 'string' && current.key !== '' ? current.key : (scan.foundKey || 'saved'),
              sid: typeof current.sid === 'string' ? current.sid : sessionId,
              blocks,
              baseCount: limit,
              appends,
              editedAt: Date.now(),
            })
            return
          }
          /* 扫不到 dsh-doc 块（滚远了 / 被折叠了）就到此为止：以前这里会拿 null 解析出一份空文档，
             和「从文档库认领」互相覆盖，看起来就是文档框在闪。 */
          if (typeof scan.found !== 'string' || scan.found === '') return
          /* 本地改过就先不覆盖，等用户点「载入最新版」。 */
          if (current !== null && current.local === true) return
          if (current !== null && current.source === scan.found) {
            /* 内容相同就到此为止。以前这里会把 sid 改写成当前会话（“聊天里摆着同一份，认领过来”），
               那等于用“内容像”当归属证据 —— 别的会话的文档就这样被永久偷过来（2026-11-27 修）。
               归属只认两件事：文件键的目录尾巴、本会话聊天里扫到并在库里的 trusted 标记。 */
            return
          }
          /* 流式生成期间内容每拍都在变：等它连续两拍不变才动，否则面板会一直闪（2026-11-26 的现场）。 */
          const chatKey = scan.foundKey || 'saved'
          if (scan.found !== chatSeenText) {
            chatSeenText = scan.found
            chatSeenTicks = 0
            return
          }
          chatSeenTicks += 1
          const baseline = runtime.chatBaseline[sessionId]
          const historical = baseline !== undefined && typeof chatKey === 'string' && baseline.has(chatKey)
          const action = chatDocAction(scan.found, chatSeenText, chatSeenTicks, chatKey, adoptedSetOf(sessionId), current, state.docPick, historical)
          if (action === 'wait' || action === 'skip') return
          const heading = /^#{1,6}\s*(.+)$/mu.exec(scan.found)
          const plain = scan.found.split('\n').filter(line => line.trim() !== '')[0] || '未命名文档'
          const fullBlocks = parseMarkdownDoc(scan.found)
          docChatTouchedAt = Date.now()
          docSwitchCount += 1
          if (action === 'update') {
            /* 同一块定稿/变长：就地更新内容，保留 key 与标题，不新建文档。 */
            putDoc({ ...current, blocks: fullBlocks, baseCount: fullBlocks.length, source: scan.found, editedAt: Date.now(), origin: 'chat' })
            return
          }
          adoptedSetOf(sessionId).add(chatKey)
          runtime.docWhy = 'chat-adopt'
          putDoc({
            id: 'main',
            sid: sessionId,
            origin: 'chat',
            key: chatKey,
            /* title 必须给：落盘按它起文件名，缺了就只能拿正文首行猜，同一份内容会被写成好几个文件。 */
            title: (heading === null ? plain : heading[1]).replace(/[*`]/gu, '').trim().slice(0, 40),
            blocks: fullBlocks,
            baseCount: fullBlocks.length,
            appends: [],
            source: scan.found,
            editedAt: Date.now(),
          })
        }
        /* 聊天的 DOM 是虚拟列表：往上滚远了，dsh-doc 那个代码块就不在文档流里了，扫不到。
           这时别让文档栏变成「还没有文档」—— 本会话在文档库里存着的那份就是它，拿出来接着用。 */
        const adoptFromLibrary = () => {
          /* schema 3：只看本会话的桶。下面两道过滤保留作双保险（桶里本来就只有本会话的键）。 */
          const lib = libOf(sessionId)
          /* 只认「属于本会话」的条目：file:<本会话尾巴>/... 或聊天键（不以 file: 开头）。
             以前只按 entry.sid 过滤，而 sid 被双实例时期写串过，别的会话目录的文件也能混进来 →
             面板在几份文档之间轮流跳（2026-11-27 日志实锤）。 */
          const ownTail = 'file:' + sessionTail(sessionId) + '/'
          const mine = Object.keys(lib)
            .map(key => [key, lib[key]])
            .filter(([key, entry]) => entry !== null && entry !== undefined
              && entry.sid === sessionId && entry.trusted !== false && typeof entry.text === 'string' && entry.text !== '')
            .filter(([key]) => String(key).indexOf('file:') !== 0 || String(key).indexOf(ownTail) === 0)
            .sort((a, b) => Number(b[1].at === undefined ? 0 : b[1].at) - Number(a[1].at === undefined ? 0 : a[1].at))
          /* 正在翻历史版就完全不插手（「选中的那份没了就回最新」由另一个 effect 负责，
             这里再判一次会让刚点下的那份闪一下就没：两个地方都在改 docPick）。 */
          const pick = typeof state.docPick === 'string' ? state.docPick : ''
          if (pick !== '') return
          if (state.docEditing === true) return
          if (mine.length === 0) return
          /* 只补「真的空着」：以前用 sid 判 stale，sid 一对不上就每拍从库里挑「最新一份」，
             而库里的 at 会被刷新 → 几份轮流当最新 → 面板每 300ms 跳一次
             （2026-11-27 日志实锤：677 次切换来源都是 library）。 */
          const currentDoc = state.doc
          if (currentDoc !== null && currentDoc !== undefined) {
            if (currentDoc.sid === sessionId) return              /* 本会话已有文档：库不插手 */
            const currentKey = String(currentDoc.key === undefined ? '' : currentDoc.key)
            const mineKeys = new Set(mine.map(([k]) => k))
            if (mineKeys.has(currentKey)) return                  /* 当前这份就是本会话库里的：库不插手 */
          }
          const [key, entry] = mine[0]
          runtime.docWhy = 'library'
          const blocks = parseMarkdownDoc(entry.text)
          const libName = String(key).indexOf('file:') === 0 && String(key).indexOf('/', 5) > 0
            ? String(key).slice(String(key).indexOf('/', 5) + 1)
            : ''
          putDoc({
            id: 'main',
            sid: sessionId,
            key,
            fileName: libName,
            blocks,
            baseCount: blocks.length,
            appends: [],
            source: entry.text,
            editedAt: Date.now(),
            /* 从库采纳：shouldWriteDoc 的白名单不含它，绝不落盘。 */
            origin: 'library',
          })
        }
        const tick = () => {
          /* 0.112.9：**删掉这里原来的会话守卫**。它用 runtime.lastSid（只有用户右键批注过才会更新）
             和当前会话比，不相等就直接返回 —— 结果在这个会话里没右键过时，整个文档轮询一次都不跑，
             磁盘同步、库采纳、文件刷新全部停摆（2026-11-27 用户报「新写的文档永远不出现」的真凶）。
             单实例现在由 docBelongsTo + 按会话分桶保证，不需要这层守卫。 */
          runtime.docWhy = ''
          /* 首次加载本会话文档前写两行诊断（每个会话一次，不带正文）。 */
          sendDocDiag(sessionId)
          /* 磁盘上已经不存在的文档，不要把本地库里的残影继续显示出来。 */
          void purgeMissingDocs(sessionId)
          /* 工具直接写盘的新文档：并进库；不是首次同步的话顺手切过去。 */
          void syncDocsFromDisk(sessionId)
          /* 面板里这份如果属于别的会话（按文件目录判），先放下：本会话的文档要么从聊天进来，
             要么从文档库 / 磁盘恢复。否则就会出现「这个会话的文档在别的会话窗口里」。 */
          if (state.doc !== null && state.doc !== undefined) {
            /* 与渲染用同一个判据（docBelongsTo），不会出现「显示判 A、轮询判 B」。 */
            const mine = docBelongsTo(state.doc, sessionId)
            if (!mine) commit({ doc: null, docPick: '', docView: null })
          }
          load()
          adoptFromLibrary()
          /* 通用护栏（0.113.6）：当前文档是「文件键」时，正文必须和库里那条一致。
             不一致就按库里的重建 —— 修过库、换了文件、或者当初存错正文，都在这里对齐。
             只处理 file: 键：聊天键在流式生成时正文会持续变，不能按库覆盖。 */
          {
            const cur = state.doc
            const curKey = cur !== null && cur !== undefined && typeof cur.key === 'string' ? cur.key : ''
            if (curKey.indexOf('file:') === 0 && cur.local !== true) {
              const entry = libEntryOf(sessionId, curKey)
              if (entry !== undefined && entry !== null && typeof entry.text === 'string'
                && entry.text !== '' && entry.text !== cur.source) {
                const freshBlocks = parseMarkdownDoc(entry.text)
                runtime.docWhy = 'library-sync'
                putDoc({
                  ...cur,
                  blocks: freshBlocks,
                  baseCount: freshBlocks.length,
                  source: entry.text,
                  title: entry.title || cur.title,
                })
              }
            }
          }
          /* 聊天里扫不到、库里也没有 → 最后才试磁盘上的文件（方案 B′）。 */
          if (state.doc === null || state.doc === undefined) restoreDocFromFile(sessionId)
          else refreshDocFile(sessionId)
        }
        if (runtime.settleLogged[sessionId] !== true) {
          runtime.settleLogged[sessionId] = true
          const cur = state.doc
          const list = dedupeDocList(Object.entries(libOf(sessionId))
            .map(([key, value]) => ({ key, title: value.title, at: value.at, sid: value.sid, trusted: value.trusted }))
            .filter(entry => entry.sid === sessionId && entry.trusted !== false)
            .sort((a, b) => b.at - a.at))
          logLine('落定 [' + sessionTail(sessionId) + '] doc=' + (cur === null || cur === undefined ? '(空)' : String(cur.key || '') + ' (' + String(cur.title || '') + ')') + ' pick=' + String(state.docPick || '-') + ' 列表首=' + (list.length === 0 ? '-' : String(list[0].key || '')))
        }
        /* 0.113 · 事件驱动（设计书 7.3）：100ms 一拍只做一次廉价判断，真扫（tick）由 shouldScanNow 决定。
           以前固定 300ms 整套跑一遍（扫 DOM + 合库 + 对磁盘），空闲时也一样（基线约 3.3 次/秒）。 */
        const runTick = () => {
          const t0 = perfNow()
          try {
            tick()
          } finally {
            perfAdd('tick', perfNow() - t0)
          }
        }
        let lastScanAt = 0
        const beat = () => {
          if (!alive) return
          perf.cur.beat += 1
          perf.cur.sid = sessionId
          ensureChatWatch()
          const now = Date.now()
          /* 工具写盘的新文件靠 /annotate-doc/list 对账（坑 #6）：到 4 秒就算脏，保证 4 秒内出现。 */
          const diskAt = runtime.diskSyncAt[sessionId]
          const diskDue = diskAt === undefined || now - diskAt >= SCAN.DISK_MS
          const go = shouldScanNow({
            mode: scanState.mode,
            dirty: scanState.dirty === true || diskDue,
            now,
            lastScanAt,
            idleMs: SCAN.IDLE_MS,
            streamingUntil: scanState.streamingUntil,
            minGapMs: SCAN.MIN_GAP_MS,
          })
          if (go !== true) return
          scanState.dirty = false
          lastScanAt = now
          runTick()
        }
        /* 切会话 / 打开面板：effect 重建，立刻扫一次。 */
        perf.cur.sid = sessionId
        ensureChatWatch()
        scanState.dirty = false
        lastScanAt = Date.now()
        runTick()
        const timer = window.setInterval(beat, SCAN.BEAT_MS)
        const onFocus = () => markScanDirty('focus')
        window.addEventListener('focus', onFocus)
        return () => {
          alive = false
          window.clearInterval(timer)
          window.removeEventListener('focus', onFocus)
        }
        /* 依赖里必须有 sessionId：文档页签是常驻的（embedded = open 恒 true），
           少了它切会话后这个 effect 永远不重建，之后每拍都用旧会话 id 写 docLibrary / doc.sid。 */
      }, [open, sessionId])

      const bodyRef = React.useRef(null)
      const rootRef = React.useRef(null)
      /* 正文在流式生成时会每 300ms 长一点，整套重排会把滚动位置挤掉 —— 看起来就是「正文在抖」。
         注意：**不能每帧都纠正滚动位置**，否则用户往上翻永远滚不上去（会被一直拽回底部）。
         规则：只在正文长度真的变了时纠正一次；用用户最后一次的滚动位置为准；贴着底部才跟着底部走。 */
      const scrollKeep = React.useRef({ top: -1, stick: false })
      React.useEffect(() => {
        if (!open) return undefined
        const body = bodyRef.current
        if (body === null) return undefined
        const keep = scrollKeep.current
        keep.top = body.scrollTop
        keep.stick = body.scrollTop + body.clientHeight >= body.scrollHeight - 48
        const remember = () => {
          const live = bodyRef.current
          if (live === null) return
          keep.top = live.scrollTop
          keep.stick = live.scrollTop + live.clientHeight >= live.scrollHeight - 48
        }
        body.addEventListener('scroll', remember, { passive: true })
        return () => body.removeEventListener('scroll', remember)
      }, [open])
      /* 只在「段数」变化时纠正一次滚动位置；段内长字不动（那一份交给浏览器锚定）。
         注意：这里直接从 store 取块，不能用下面才定义的 blocks（会撞上 TDZ，整个面板会白屏报错）。 */
      const docSig = React.useMemo(() => {
        const current = store.doc
        const list = current === null || current === undefined || Array.isArray(current.blocks) !== true
          ? []
          : current.blocks
        return String(list.length)
      }, [store.doc])
      React.useLayoutEffect(() => {
        const body = bodyRef.current
        if (body === null) return
        const keep = scrollKeep.current
        if (keep.top < 0) {
          keep.top = body.scrollTop
          keep.stick = body.scrollTop + body.clientHeight >= body.scrollHeight - 48
          return
        }
        /* 非贴底 = 用户正在往回翻：一个字都不写。
           把旧像素值写回去正是「文字上下跳 / 被拽回底部」的来源，交还给浏览器自己的滚动锚定。 */
        if (keep.stick !== true) return
        const target = body.scrollHeight - body.clientHeight
        if (Math.abs(body.scrollTop - target) <= 2) return
        body.scrollTop = target
      }, [docSig])
      /* 没有 sid 的文档不再“认领给当前会话”——那正是串会话的来源（2026-11-27）。直接放下。 */
      React.useEffect(() => {
        if (!open || sessionId === null || sessionId === '') return
        const current = state.doc
        if (current === null || current === undefined) return
        if (typeof current.sid === 'string' && current.sid !== '') return
        commit({ doc: null }, true)
      }, [open, sessionId, store.doc])

      React.useEffect(() => {
        if (!open) return undefined
        const onContextMenu = (event) => {
          const body = bodyRef.current
          const target = event.target
          if (body === null || !(target instanceof Element) || !body.contains(target)) return
          /* 面板里的按钮 / 输入框 / 线程卡 / 抽屉 / 查找条上是「操作」，不是「文章」：右键留给它们自己。 */
          if (target.closest(MENU_SKIP_SELECTOR) !== null) return
          /* 右键点在已经标好的句子（蓝的/绿的）上：和左键一样开批注详情。
             用户是用右键建的批注，回头也会惯性右键点它 —— 别让他觉得「右键没反应」。
             只有当前没有活选区时才这么做：有选区说明他就是要新建一条。 */
          /* 「右键唤出批注框」关掉之后，文档里的右键一律不额外开东西：
             不开新建框、也不开批注详情（详情用左键点，照样能开）。 */
          const wideMode = state.wideRightClick !== false
          const marked = target.closest('[data-mark]')
          if (wideMode && marked !== null) {
            const markId = marked.getAttribute('data-mark')
            const liveSel = window.getSelection()
            const hasSelection = liveSel !== null && liveSel.isCollapsed !== true && liveSel.rangeCount > 0
            if (markId !== null && markId.indexOf('__') !== 0 && !hasSelection) {
              event.preventDefault()
              const markRect = marked.getBoundingClientRect()
              commit({
                docThread: {
                  entryId: markId,
                  x: Math.max(8, Math.min(markRect.left, window.innerWidth - 360)),
                  y: Math.max(48, Math.min(markRect.bottom + 8, window.innerHeight - 260)),
                },
              })
              return
            }
          }
          if (sessionId === null || sessionId === '') return
          /* 关掉宽模式就回到旧行为：只认「鼠标划中的那句话，且起终点在同一段里」。 */
          const live = window.getSelection()
          const liveRange = live !== null && live.rangeCount > 0 && live.isCollapsed !== true
            ? live.getRangeAt(0)
            : null
          let blockElement = null
          let picked = null
          let range = liveRange
          if (liveRange !== null) {
            const liveNode = liveRange.startContainer.nodeType === 1
              ? liveRange.startContainer
              : liveRange.startContainer.parentElement
            blockElement = liveNode === null ? null : liveNode.closest('[data-block]')
            if (blockElement !== null && !body.contains(blockElement)) blockElement = null
            if (blockElement !== null) picked = offsetsInBlock(blockElement, wideMode)
          }
          /* 宽模式兜底：右键常把选区点没了（跟在选区外一像素就塌）。这时用「刚划完那一刻」记下的选区
             —— 它和浮层上的工具条同源，工具条还在屏幕上就说明用户仍指着那句话。 */
          if (picked === null && wideMode) {
            const bar = state.docToolbar
            const fresh = bar !== null && bar !== undefined && typeof bar.quote === 'string'
              && Date.now() - (Number.isFinite(bar.at) ? bar.at : 0) < TARGET_TTL
            const element = fresh ? body.querySelector('[data-block="' + String(bar.blockIndex) + '"]') : null
            if (element !== null) {
              blockElement = element
              picked = { start: bar.startChar, end: bar.endChar, text: bar.quote }
              range = null
            }
          }
          /* 最后再试鼠标底下那一段：选区起点不在任何 [data-block] 里时（整段被选中）还救得回来。 */
          if (picked === null) {
            const under = target.closest('[data-block]')
            const underPicked = under === null ? null : offsetsInBlock(under, wideMode)
            if (underPicked !== null) {
              blockElement = under
              picked = underPicked
              range = liveRange
            }
          }
          if (picked === null || blockElement === null) return
          const index = Number(blockElement.getAttribute('data-block'))
          const blockIndex = Number.isFinite(index) ? index : 0
          /* 核对「现在」这一段的正文：**直接拿屏幕上的这一段**，不要再去 state.doc / 文档库里按会话查 ——
             文档 sid 过期时（宿主重启换过 id、或面板在用文档库兜底显示），那边查出来是空的，
             于是 locateQuote 失败、右键就什么都不弹。用 DOM 里的原文，永远和用户看到的一致。 */
          const onScreen = blockPlainText(blockElement)
          const stored = liveDocBlocks(sessionId, state.docPick)[blockIndex]
          const blockText = onScreen !== '' ? onScreen : (stored === undefined ? '' : stored.text)
          const located = locateQuote(blockText, picked.start, picked.text)
          if (located === null) return
          event.preventDefault()
          runtime.target = {
            kind: 'doc',
            path: DOC_PATH,
            blockIndex,
            startChar: located.start,
            endChar: located.end,
            quote: picked.text,
            /* 0.115：txt / 代码文件写文件名 + 行号（md 文档这里是 null，什么都不加）。 */
            ...(fileTargetExtra(state.doc, located.start, located.end) || {}),
          }
          runtime.targetAt = Date.now()
          const spot = spotForMouse(event)
          commit({
            surface: { sessionId, x: spot.x, y: spot.y },
            docPending: { blockIndex, startChar: located.start, endChar: located.end },
            debug: '文档里捕获第 ' + String(blockIndex) + ' 块（' + (wideMode ? '宽' : '窄') + '）',
          })
        }
        document.addEventListener('contextmenu', onContextMenu, true)
        return () => document.removeEventListener('contextmenu', onContextMenu, true)
      }, [open, sessionId])

      React.useEffect(() => {
        if (!open) return undefined
        const onUp = () => {
          window.setTimeout(() => {
            const body = bodyRef.current
            if (body === null) return
            const selection = window.getSelection()
            if (selection === null || selection.isCollapsed === true || selection.rangeCount === 0) {
              if (state.docToolbar !== null) commit({ docToolbar: null })
              return
            }
            const range = selection.getRangeAt(0)
            const anchor = range.startContainer.nodeType === 1
              ? range.startContainer
              : range.startContainer.parentElement
            const blockElement = anchor === null ? null : anchor.closest('[data-block]')
            if (blockElement === null || !body.contains(blockElement)) {
              if (state.docToolbar !== null) commit({ docToolbar: null })
              return
            }
            const picked = offsetsInBlock(blockElement)
            if (picked === null) {
              if (state.docToolbar !== null) commit({ docToolbar: null })
              return
            }
            const rect = range.getBoundingClientRect()
            const index = Number(blockElement.getAttribute('data-block'))
            commit({
              docToolbar: {
                blockIndex: Number.isFinite(index) ? index : 0,
                startChar: picked.start,
                endChar: picked.end,
                quote: picked.text,
                x: rect.left,
                y: rect.top,
                /* 时间戳：右键把选区点没了时，用它判断这个选区还算不算「刚划的」 */
                at: Date.now(),
              },
              /* 重新划词就把上一张线程卡收起来 */
              docThread: null,
            })
          }, 0)
        }
        document.addEventListener('mouseup', onUp, true)
        return () => document.removeEventListener('mouseup', onUp, true)
      }, [open])

      /* 线程卡：点卡片外面就关（点另一条批注除外，那是要换一张卡）。 */
      React.useEffect(() => {
        if (state.docThread === null || state.docThread === undefined) return undefined
        const onDown = (event) => {
          const target = event.target
          if (target instanceof Element) {
            if (target.closest('.dsha-thread') !== null) return
            if (target.closest('[data-mark]') !== null) return
          }
          commit({ docThread: null })
        }
        const timer = window.setTimeout(() => {
          document.addEventListener('pointerdown', onDown, true)
        }, 0)
        return () => {
          window.clearTimeout(timer)
          document.removeEventListener('pointerdown', onDown, true)
        }
      }, [state.docThread])

      /** 给选中区间开关一个行内样式（粗/斜/删/行内码）。 */
      const applyInline = (key) => {
        const bar = state.docToolbar
        if (bar === null || bar === undefined || doc === null) return
        const block = doc.blocks[bar.blockIndex]
        if (block === undefined) return
        const runs = runsOf(block)
        const covered = styleAt(runs, bar.startChar, key) && styleAt(runs, Math.max(bar.startChar, bar.endChar - 1), key)
        const next = toggleRunStyle(runs, bar.startChar, bar.endChar, key, covered !== true)
        const blocks = doc.blocks.map((item, position) => (
          position === bar.blockIndex ? { ...item, runs: next, text: runsText(next) } : item
        ))
        putDoc({ ...doc, blocks, editedAt: Date.now(), local: true })
      }

      /** 改某一段的块级样式（正文档 H1/H2/H3）——这就是「文字大小」的正确粒度。 */
      const applyBlockKind = (kind) => {
        const bar = state.docToolbar
        if (bar === null || bar === undefined || doc === null) return
        const blocks = doc.blocks.map((item, position) => (
          position === bar.blockIndex ? { ...item, kind } : item
        ))
        putDoc({ ...doc, blocks, editedAt: Date.now(), local: true })
      }

      const currentKind = (() => {
        const bar = state.docToolbar
        if (bar === null || bar === undefined || doc === null) return ''
        const block = doc.blocks[bar.blockIndex]
        return block === undefined ? '' : block.kind
      })()

      const openFromToolbar = (kind) => {        const bar = state.docToolbar
        if (bar === null || sessionId === null) return
        runtime.target = {
          kind: 'doc',
          path: DOC_PATH,
          blockIndex: bar.blockIndex,
          startChar: bar.startChar,
          endChar: bar.endChar,
          quote: bar.quote,
          ...(fileTargetExtra(state.doc, bar.startChar, bar.endChar) || {}),
        }
        runtime.targetAt = Date.now()
        try {
          const selection = window.getSelection()
          if (selection !== null) selection.removeAllRanges()
        } catch (error) {
          /* 忽略 */
        }
        commit({
          surface: { sessionId, x: Math.max(8, Math.min(bar.x, window.innerWidth - 380)), y: Math.max(48, bar.y - 8), kind },
          docPending: { blockIndex: bar.blockIndex, startChar: bar.startChar, endChar: bar.endChar },
          docToolbar: null,
        })
      }

      /**
       * 表情条：点一下就是「用这句话表个态」，不弹输入框、不用再点发送。
       *
       * 走的是同一套批注通道（addAnnotation + deliver），所以回答会落在这句话旁边的批注里，
       * 和写了一段话的批注一模一样 —— 不再多造一条只有表情的平行通道。
       */
      const reactTo = (reaction) => {
        const bar = state.docToolbar
        if (bar === null || bar === undefined || sessionId === null || sessionId === '') return
        const added = addAnnotation(sessionId, {
          target: 'doc',
          path: DOC_PATH,
          blockIndex: bar.blockIndex,
          startChar: bar.startChar,
          endChar: bar.endChar,
          quote: bar.quote,
          note: reaction.emoji + ' ' + reaction.meaning,
          ...(fileTargetExtra(state.doc, bar.startChar, bar.endChar) || {}),
        })
        try {
          const selection = window.getSelection()
          if (selection !== null) selection.removeAllRanges()
        } catch (error) {
          /* 清不掉选区也不挡发送 */
        }
        commit({ docToolbar: null })
        const item = added === null || added === undefined ? null : added.item
        if (item !== null) {
          window.setTimeout(() => { deliver([item], sessionId) }, 140)
        }
      }

      /* 文档内查找：命中位置按「块序号 + 字符区间」算，渲染时当成一种特殊高亮。
         注意：这个 useMemo 必须放在下面那句 `if (!open) return null` 之前，否则 hook 数量随开关变化会崩。 */
      const findOpen = store.docFindOpen === true
      const findText = typeof store.docFind === 'string' ? store.docFind : ''
      const findAt = typeof store.docFindAt === 'number' ? store.docFindAt : 0
      const findHits = React.useMemo(() => {
        const query = findText.trim().toLowerCase()
        if (!findOpen || query === '') return []
        const source = viewing === null ? (store.doc === null ? [] : store.doc.blocks) : viewBlocks
        const out = []
        source.forEach((block, index) => {
          const text = String(block === null || block === undefined || block.text === undefined ? '' : block.text)
          const lower = text.toLowerCase()
          let from = lower.indexOf(query)
          while (from >= 0) {
            out.push({ blockIndex: index, from, to: from + query.length })
            from = lower.indexOf(query, from + query.length)
          }
        })
        return out
      }, [findOpen, findText, viewing === null ? '' : viewing.key, viewBlocks, store.doc])

      const blocks = doc === null ? [] : doc.blocks
      /* 正在看的那份文档的标识：历史版只显示属于它的批注，最新那份只显示它的（以及没有标识的旧数据）。 */
      const activeDocKey = viewing !== null
        ? viewing.key
        : (doc !== null && typeof doc.key === 'string' ? doc.key : '')
      /* 当前文档里能找到这句原文吗（用于「批注记在旧文档键上」的兜底）。 */
      /* 这句原文在当前文档里出现几次：0 / 1 / 多次。短于 8 字的一律当 0（避免「一句话」这种误挂）。 */
      const quoteHits = (quote) => {
        if (typeof quote !== 'string' || quote.length < 8) return 0
        let hits = 0
        for (const block of blocks) {
          if (typeof block.text !== 'string') continue
          let at = block.text.indexOf(quote)
          while (at >= 0) { hits += 1; at = block.text.indexOf(quote, at + 1) }
        }
        return hits
      }
      const marks = sessionId === null
        ? []
        : itemsOf(sessionId).filter((entry) => {
          if (entry.target !== 'doc' || entry.status === 'resolved') return false
          if (typeof entry.docKey === 'string' && entry.docKey !== '') {
            if (entry.docKey === activeDocKey) return true
            /* 文档从「聊天代码块」换成「磁盘文件」后键会变，旧批注的 docKey 对不上，
               于是整批从面板里消失。只要这句原文还在这份文档里，就当它是这份的。 */
            if (viewing !== null) return false
            /* 兜底只在「键族变了」时认（聊天块 ↔ 磁盘文件），并且要求引文够长且只出现一次。
               以前只比文字：另一份文档的「一句话」批注会挂到任何含这三个字的文档上。 */
            const entryIsFile = String(entry.docKey).indexOf('file:') === 0
            const activeIsFile = String(activeDocKey).indexOf('file:') === 0
            if (entryIsFile === activeIsFile) return false
            return quoteHits(entry.quote) === 1
          }
          return viewing === null
        })

      const marksSorted = marks.slice().sort((a, b) => (
        Number(a.blockIndex === undefined ? 0 : a.blockIndex) - Number(b.blockIndex === undefined ? 0 : b.blockIndex)
      ))

      const scrollToHit = (hit) => {
        const body = bodyRef.current
        if (body === null || hit === undefined || hit === null) return
        const element = body.querySelector('[data-block="' + String(hit.blockIndex) + '"]')
        if (element !== null) element.scrollIntoView({ block: 'center' })
      }

      /* 段落增删会移动后续段落的序号，批注的 blockIndex 必须跟着挪，否则全部错位。 */
      const shiftDocMarks = (fromIndex, delta, dropIndex) => {
        if (sessionId === null) return
        const key = doc !== null && typeof doc.key === 'string' ? doc.key : ''
        let changed = false
        const next = itemsOf(sessionId).map((entry) => {
          if (entry.target !== 'doc') return entry
          if (typeof entry.docKey === 'string' && entry.docKey !== '' && entry.docKey !== key) return entry
          if (typeof entry.blockIndex !== 'number') return entry
          if (dropIndex !== undefined && entry.blockIndex === dropIndex) {
            changed = true
            return { ...entry, status: 'resolved', resolvedAt: Date.now() }
          }
          if (entry.blockIndex > fromIndex) {
            changed = true
            return { ...entry, blockIndex: Math.max(0, entry.blockIndex + delta) }
          }
          return entry
        })
        if (changed) putItems(sessionId, next)
      }

      const insertBlockAfter = (index) => {
        if (doc === null) return
        const current = doc.blocks[index]
        const kind = current !== undefined && current.kind === 'li' ? 'li' : 'p'
        const fresh = { kind, text: '新的一段', runs: [{ text: '新的一段' }] }
        const blocks2 = doc.blocks.slice(0, index + 1).concat([fresh], doc.blocks.slice(index + 1))
        putDoc({ ...doc, blocks: blocks2, editedAt: Date.now(), local: true })
        shiftDocMarks(index, 1)
      }

      const dropBlock = (index) => {
        if (doc === null || doc.blocks.length <= 1) return
        putDoc({
          ...doc,
          blocks: doc.blocks.filter((item, position) => position !== index),
          editedAt: Date.now(),
          local: true,
        })
        shiftDocMarks(index, -1, index)
      }

      /** 从总览点一条：滚到那一句，再在它旁边开线程卡。 */
      const openThreadFor = (entry) => {
        const body = bodyRef.current
        const index = Number(entry.blockIndex === undefined ? 0 : entry.blockIndex)
        const target = body === null ? null : body.querySelector('[data-block="' + String(index) + '"]')
        if (target !== null) target.scrollIntoView({ block: 'center' })
        const rect = target === null ? null : target.getBoundingClientRect()
        commit({
          docDrawer: false,
          docThread: {
            entryId: entry.id,
            x: rect === null
              ? Math.max(8, window.innerWidth - 400)
              : Math.max(8, Math.min(rect.left, window.innerWidth - 360)),
            y: rect === null
              ? 120
              : Math.max(48, Math.min(rect.top + 16, window.innerHeight - 260)),
          },
        })
      }

      /** 段落右上角的批注标记：有几条、什么状态；点它打开对应线程。 */
      const kidsOf = (block, index, children) => {
        const inBlock = placedMarks.filter(entry => entry.blockIndex === index)
        if (inBlock.length === 0) return children
        const status = inBlock.some(entry => entry.status === 'sent')
          ? 'sent'
          : (inBlock.some(entry => entry.status === 'answered') ? 'answered' : 'queued')
        const newest = inBlock.slice().sort((a, b) => (
          String(b.createdAt).localeCompare(String(a.createdAt))
        ))[0]
        /* 这一段里有「原文被改掉、定位不到」的批注：角标标橙，和卡片上的橙红一致。
           正文里已经没有可上色的文字（引文不在），所以只能标在段落上。 */
        const lostCount = inBlock.filter(entry => entry.target === 'doc'
          && quoteInDocBlocks(docBlocksNow(), entry.quote) !== true).length
        return [
          ...children,
          h('span', {
            key: 'mark',
            className: 'dsha-block-mark',
            'data-status': status,
            'data-lost': lostCount > 0 ? '1' : undefined,
            title: String(inBlock.length) + ' 条批注'
              + (lostCount > 0 ? '（' + String(lostCount) + ' 条原文已改，定位失效）' : '')
              + ' · 点开看',
            onClick: (event) => {
              event.stopPropagation()
              const rect = event.currentTarget.getBoundingClientRect()
              commit({
                docThread: {
                  entryId: newest.id,
                  x: Math.max(8, Math.min(rect.left - 300, window.innerWidth - 360)),
                  y: Math.max(48, Math.min(rect.bottom + 8, window.innerHeight - 260)),
                },
              })
            },
          }, String(inBlock.length)),
        ]
      }

      /* 段号错位（整篇重导、消息删掉再重发）时，原句可能被切到了**别的段**：
         先在全文里找唯一命中，找到了就把高亮画到那一段去 —— 这样删消息重发也不会让高亮消失。 */
      const relocated = React.useMemo(() => {
        const out = new Map()
        /* 看历史版时不搬：那时显示的不是 blocks 这份，搬过去只会搬错。 */
        if (viewing !== null) return out
        const texts = blocks.map(block => (typeof block.text === 'string' ? block.text : ''))
        if (texts.length === 0 || !Array.isArray(marks)) return out
        marks.forEach((entry) => {
          const quote = typeof entry.quote === 'string' ? entry.quote : ''
          if (quote === '') return
          const from = typeof entry.startChar === 'number' ? entry.startChar : 0
          const to = typeof entry.endChar === 'number' ? entry.endChar : 0
          const own = texts[entry.blockIndex]
          /* 自己那段里偏移就对得上，不用搬。 */
          if (typeof own === 'string' && own.slice(from, to) === quote) return
          if (typeof own === 'string' && own.indexOf(quote) >= 0) return
          /* 原段里能宽松认出（改了几个字）也不搬：段落已知，别去全局找更像的句子。 */
          if (typeof own === 'string' && fuzzyQuoteInBlock(own, quote, true) !== null) return
          let hitBlock = -1
          let hitAt = -1
          let hits = 0
          texts.forEach((text, order) => {
            let at = text.indexOf(quote)
            while (at >= 0) {
              hits += 1
              hitBlock = order
              hitAt = at
              at = text.indexOf(quote, at + 1)
            }
          })
          if (hits === 1) {
            out.set(entry.id, { blockIndex: hitBlock, from: hitAt, to: hitAt + quote.length })
            return
          }
          /* 逐字找不到（原文被改过）：跨段比模糊相似度，唯一最佳且够像才搬。 */
          if (hits > 1) return
          let bestBlock = -1
          let bestSpan = null
          let bestRatio = 0
          let tie = false
          /* 短句（只划了几个字）也能搬，但要求：覆盖率 ≥80% 且全库只有一段命得中。 */
          const shortQuote = quote.trim().length < 8
          let matchedBlocks = 0
          texts.forEach((text, order) => {
            const span = fuzzyQuoteInBlock(text, quote)
            if (span === null) return
            matchedBlocks += 1
            const ratio = span.length / quote.trim().length
            if (ratio > bestRatio) {
              bestRatio = ratio
              bestSpan = span
              bestBlock = order
              tie = false
            } else if (ratio === bestRatio) {
              tie = true
            }
          })
          if (bestSpan === null || tie) return
          if (shortQuote === true && (bestRatio < 0.8 || matchedBlocks !== 1)) return
          out.set(entry.id, { blockIndex: bestBlock, from: bestSpan.from, to: bestSpan.to })
        })
        return out
      }, [marks, blocks, viewing])

      /* 搬过的位置**写回存储**：以前只在内存里搬，刷新一次又回到错位状态，
         用户看到的现象就是「隔天回来高亮全没了」。这里有三个护栏：
         ① 只有真的搬动了才写；② 同一批只写一次（签名比对）；③ 400ms 防抖。 */
      const relocatedSavedRef = React.useRef('')
      React.useEffect(() => {
        if (sessionId === null || relocated.size === 0) return undefined
        const signature = [...relocated.keys()].sort().join(',') + '|' + String(blocks.length)
        if (relocatedSavedRef.current === signature) return undefined
        const timer = window.setTimeout(() => {
          relocatedSavedRef.current = signature
          try {
            const current = itemsOf(sessionId)
            let changed = false
            const next = current.map((entry) => {
              const moved = relocated.get(entry.id)
              if (moved === undefined) return entry
              if (entry.target !== 'doc') return entry
              if (entry.blockIndex === moved.blockIndex && entry.startChar === moved.from && entry.endChar === moved.to) return entry
              changed = true
              /* 只补空值，绝不把别的文档的批注改写成当前文档 —— 改写了就永久污染，重启也带着。 */
              return { ...entry, blockIndex: moved.blockIndex, startChar: moved.from, endChar: moved.to, docKey: (typeof entry.docKey === 'string' && entry.docKey !== '') ? entry.docKey : activeDocKey }
            })
            if (changed) putItems(sessionId, next)
          } catch (error) {
            /* 写回失败不影响显示，下一轮再试 */
          }
        }, 400)
        return () => window.clearTimeout(timer)
      }, [relocated, blocks, sessionId, activeDocKey])

      /* 搬过的批注用一个「修正了位置」的列表：高亮、段尾标记、点击都要用同一份，
         否则会出现「绿点画在旧段上、句子点不进批注卡」这种自相矛盾的状态。 */
      const placedMarks = React.useMemo(() => {
        if (relocated.size === 0) return marks
        return marks.map((entry) => {
          const moved = relocated.get(entry.id)
          if (moved === undefined) return entry
          return { ...entry, blockIndex: moved.blockIndex, startChar: moved.from, endChar: moved.to }
        })
      }, [marks, relocated])

      /* ⚠ 早退必须在这个组件的**所有** hook 之后。
         以前它放在上面（relocated / useRef / useEffect / placedMarks 之前），
         面板一打开 hook 数量就比上一次多，React 抛 #310
         （Rendered more hooks than during the previous render），
         整个组件被宿主当成「渲染失败」吞掉 —— 界面上就是点了「文档」什么都不出现，
         槽位里 annotate-doc 显示 active:false（2026-11-26 实机定位到）。 */
      if (!open) return null

      /* 单块兜底：某一块（新语法/旧存档）渲染抛错时只显示一行提示，
         不让整块面板被 slot 边界替换成空白（0.72 就是这么整片白掉的）。 */
      const renderBlockSafe = (block, index, plain) => {
        try {
          return renderBlock(block, index, plain)
        } catch (error) {
          const message = String(error === null || error === undefined ? '' : (error.message === undefined ? error : error.message))
          return h('div', {
            key: 'b' + String(index),
            className: 'dsha-doc-p dsha-fig-bad',
            'data-block': String(index),
            title: message,
          }, '这一段渲染失败（' + String(block === null || block === undefined ? '?' : block.kind) + '）：' + message.slice(0, 80))
        }
      }

      const renderBlock = (block, index, plain) => {
        const readOnly = plain === true
        /* 图卡没有可批注的文字，直接画；编辑模式下也一样（不能把 SVG 当正文改）。 */
        if (block.kind === 'svg') return renderSvgFigure(block, index)
        /* 水平线是空元素：React 不允许它带 children（error #137），所以单独早返回。 */
        if (block.kind === 'hr') {
          return h('hr', { key: 'b' + String(index), className: 'dsha-doc-hr', 'data-block': String(index) })
        }
        /* 表格：按行列画，单元格里的粗体/内联码照旧解析。表格块暂不参与批注。 */
        if (block.kind === 'table') {
          const rows = tableRowsOf(block)
          if (rows.length === 0) return h('div', { key: 'b' + String(index), className: 'dsha-doc-p' }, String(block.text === undefined ? '' : block.text))
          const head = rows[0]
          const body = rows.slice(1)
          const cellOf = (text, key) => h('td', { key },
            parseInlineRuns(String(text)).map((run, order) => h('span', {
              key: String(order),
              style: {
                fontWeight: run.bold ? 700 : undefined,
                fontFamily: run.code ? 'ui-monospace,Consolas,monospace' : undefined,
                background: run.code ? 'rgba(127,127,127,.18)' : undefined,
                borderRadius: run.code ? '3px' : undefined,
                padding: run.code ? '1px 3px' : undefined,
              },
            }, run.text)))
          const headCell = (text, key) => h('th', { key },
            parseInlineRuns(String(text)).map((run, order) => h('span', {
              key: String(order),
              style: {
                fontWeight: 700,
                fontFamily: run.code ? 'ui-monospace,Consolas,monospace' : undefined,
                background: run.code ? 'rgba(127,127,127,.18)' : undefined,
                padding: run.code ? '1px 3px' : undefined,
              },
            }, run.text)))
          return h('div', { key: 'b' + String(index), className: 'dsha-doc-table-wrap' },
            h('table', { className: 'dsha-doc-table' },
              h('thead', null, h('tr', null, head.map((cell, order) => headCell(cell, String(order))))),
              h('tbody', null, body.map((row, rowIndex) => h('tr', { key: String(rowIndex) },
                head.map((ignored, order) => cellOf(row[order] === undefined ? '' : row[order], String(order))))))))
        }
        /* 高亮前先核对原句：整篇重导、编辑改字之后旧的偏移会挂到别的句子上。
           对不上就在这一段里反查，唯一命中才纠正；多处命中或找不到就不画区间（段右角标记还在）。 */
        const ranges = (readOnly || editing) ? [] : placedMarks
          .filter(entry => entry.blockIndex === index)
          .map((entry) => {
            const quote = typeof entry.quote === 'string' ? entry.quote : ''
            let from = typeof entry.startChar === 'number' ? entry.startChar : 0
            let to = typeof entry.endChar === 'number' ? entry.endChar : 0
            let shifted = false
            if (quote !== '' && block.text.slice(from, to) !== quote) {
              const at = block.text.indexOf(quote)
              if (at >= 0 && block.text.indexOf(quote, at + 1) < 0) {
                from = at
                to = at + quote.length
                shifted = true
              } else {
                /* 逐字对不上：用「最长公共子串」当锚点，把区间落在被改的那句上
                   （以前用模糊匹配的原始跨度，常常长一倍，整段都被涂橙——2026-11-26 用户反馈）。 */
                const anchored = anchorSpanFor(block.text, quote)
                if (anchored !== null) {
                  from = anchored.from
                  to = anchored.to
                  shifted = true
                } else {
                  const moved = relocated.get(entry.id)
                  if (moved === undefined || moved.blockIndex !== index) return null
                  const widths = Math.max(quote.trim().length, 1)
                  return {
                    id: entry.id,
                    from: moved.from,
                    to: Math.min(block.text.length, moved.from + widths),
                    status: entry.status,
                    shifted: true,
                  }
                }
              }
            }
            return { id: entry.id, from, to, status: entry.status, shifted }
          })
          .filter(item => item !== null)
        const pending = store.docPending
        if (!readOnly && pending !== null && pending !== undefined && pending.blockIndex === index) {
          ranges.push({
            id: '__pending__',
            from: pending.startChar,
            to: pending.endChar,
            status: 'pending',
          })
        }
        /* 查找命中：当成第三种高亮叠上去（搜索框打开时）。 */
        if (!editing && findHits.length > 0) {
          findHits.forEach((hit, order) => {
            if (hit.blockIndex !== index) return
            ranges.push({
              id: '__find' + String(order),
              from: hit.from,
              to: hit.to,
              status: order === findAt ? 'find-on' : 'find',
            })
          })
        }
        const pieces = composePieces(block, ranges)
        /* 「这段文字被改过」按**区间表**判定，不再依赖 piece.shifted 透传：
           只要某条批注在这个块里的 from/to 与它记录的偏移不一致（或它落进了模糊匹配分支），
           就算改过 —— 这是最后一道保险，前面几层任何一层丢了标记都能兜住。 */
        const shiftedIds = new Set()
        for (const range of ranges) {
          if (range.shifted === true) {
            shiftedIds.add(range.id)
            continue
          }
          const owner = placedMarks.find(entry => entry.id === range.id)
          if (owner === undefined) continue
          const quote = typeof owner.quote === 'string' ? owner.quote : ''
          const storedFrom = typeof owner.startChar === 'number' ? owner.startChar : 0
          const storedTo = typeof owner.endChar === 'number' ? owner.endChar : 0
          if (quote !== '' && (range.from !== storedFrom || range.to !== storedTo)) shiftedIds.add(range.id)
        }
        const children = pieces.map(piece => {
          const style = {
            fontWeight: piece.style.bold ? 700 : undefined,
            fontStyle: piece.style.italic ? 'italic' : undefined,
            textDecoration: [piece.style.strike ? 'line-through' : '', piece.style.href === null ? '' : 'underline']
              .filter(part => part !== '').join(' ') || undefined,
            color: piece.style.color === null ? undefined : piece.style.color,
            fontFamily: piece.style.code ? 'ui-monospace,Consolas,monospace' : undefined,
            background: piece.style.code ? 'rgba(127,127,127,.18)' : undefined,
            borderRadius: piece.style.code ? '3px' : undefined,
            padding: piece.style.code ? '1px 2px' : undefined,
          }
          const content = piece.style.href === null
            ? piece.text
            : h('a', {
              href: piece.style.href,
              target: '_blank',
              rel: 'noreferrer',
              style: { color: '#8aa0ff', textDecoration: 'underline' },
              onClick: event => event.preventDefault(),
            }, piece.text)
          const shifted = piece.shifted === true || (piece.mark !== undefined && shiftedIds.has(piece.mark))
          if (piece.mark === undefined) return h('span', { key: piece.key, style }, content)
          /* 位置是「认回来的」→ 橙色底用**内联样式**直接压过去：
             CSS 里靠 [data-shifted] 覆盖 [data-status] 一旦顺序或特异性不对就失效（0.93 实测还是绿）。 */
          /* 橙色用 0.95 那一档：用户实测「刚才那个颜色刚好」，0.96 调深了反而过了。 */
          const marked = shifted === true
            ? {
              ...style,
              background: 'rgba(255,170,90,.34)',
              boxShadow: 'inset 0 -2px 0 rgba(255,140,50,.95)',
              borderRadius: '3px',
            }
            : style
          return h('span', {
            key: piece.key,
            className: 'dsha-doc-span',
            'data-status': piece.status,
            'data-shifted': shifted === true ? '1' : undefined,
            'data-mark': piece.mark,
            style: marked,
          }, content)
        })
        const tag = block.kind === 'h1' ? 'h1'
          : block.kind === 'h2' ? 'h2'
            : block.kind === 'h3' ? 'h3'
              : block.kind === 'h4' ? 'h4'
                : block.kind === 'h5' ? 'h5'
                  : block.kind === 'h6' ? 'h6'
                    : block.kind === 'li' ? 'li'
                        : block.kind === 'quote' ? 'blockquote'
                          : block.kind === 'code' ? 'pre' : 'p'
        if (editing && !readOnly) {
          return h(React.Fragment, { key: 'b' + String(index) },
            h(tag, {
              'data-block': String(index),
              className: 'dsha-doc-' + block.kind + ' dsha-doc-editable',
              contentEditable: true,
              suppressContentEditableWarning: true,
              onBlur: (event) => {
                /* 从 DOM 解析回 runs：粗体、行内码、链接在编辑后仍然保留。 */
                const parsed = runsFromDom(event.currentTarget)
                if (parsed.text.trim() === '' || parsed.text === block.text || doc === null) return
                putDoc({
                  ...doc,
                  blocks: doc.blocks.map((item, position) => (
                    position === index
                      ? { ...item, text: parsed.text, runs: parsed.runs }
                      : item
                  )),
                  editedAt: Date.now(),
                  local: true,
                })
              },
            }, children),
            h('div', { className: 'dsha-blk-tools' },
              h('button', {
                type: 'button',
                title: '在这一段后面插一段',
                onClick: () => insertBlockAfter(index),
              }, '＋ 插一段'),
              h('button', {
                type: 'button',
                title: '删掉这一段（连带这一段的批注）',
                onClick: () => dropBlock(index),
              }, '删掉这段')))
        }
        /* 列表的编号 / 方框 / 层级都用 data-* + CSS 伪元素画：
           塞进正文（以前任务项的 ✓ 就是这么干的）会让 DOM 文本比 block.text 多一个字，
           划句偏移就整体错一格。 */
        const liAttrs = {}
        if (block.kind === 'li') {
          if (typeof block.num === 'number') liAttrs['data-num'] = String(block.num)
          if (block.task === 'open' || block.task === 'done') liAttrs['data-task'] = block.task
          if (typeof block.depth === 'number' && block.depth > 0) liAttrs['data-depth'] = String(block.depth)
        }
        if (block.kind === 'code' && typeof block.lang === 'string' && block.lang !== '') liAttrs['data-lang'] = block.lang
        /* 段落级橙色标记已撤：用户实测「整段发橙」观感不好，失效只靠右上角角标表达。 */
        const staleAttrs = {}
        if (readOnly) {
          return h(tag, { key: 'v' + String(index), className: 'dsha-doc-' + block.kind, ...liAttrs, ...staleAttrs }, children)
        }
        return h(tag, { key: 'b' + String(index), 'data-block': String(index), className: 'dsha-doc-' + block.kind, ...liAttrs, ...staleAttrs }, kidsOf(block, index, children))
      }

      return h('div', {
        className: embedded ? 'dsha-doc dsha-doc-embedded' : (wide ? 'dsha-doc dsha-doc-wide' : 'dsha-doc'),
        role: 'dialog',        'aria-label': '对话文档',
        ref: rootRef,
        style: docBox === null
          ? { '--dsha-doc-size': String(fontSize) + 'px' }
          : {
            '--dsha-doc-size': String(fontSize) + 'px',
            left: String(docBox.x) + 'px',
            top: String(docBox.y) + 'px',
            width: String(docBox.w) + 'px',
            height: String(docBox.h) + 'px',
          },
      },
        embedded
          ? null
          : h('div', {
            className: 'dsha-doc-head',
            onPointerDown: startBoxMove,
          },
            /* 关闭放左边：右边是窗口自己的最小化/关闭，也会抢走点击 */
            h('button', {
              type: 'button',
              className: 'dsha-mini dsha-mini-on',
              title: '关掉这个面板（Esc）',
              /* 以前只关一把锁：浮层是用 docOpen 打开的，点「收起」却去关 docWide，所以点了没反应。
                 现在三把都关（含"从侧栏拖出来"的临时标记）。 */
              onClick: () => commit({ docOpen: false, docWide: false, docDetached: false }),
            }, wide ? '‹ 收起' : '关闭'),
            h('span', { className: 'dsha-title' }, '对话文档'),
            h('span', { className: 'dsha-hint' }, marks.length > 0 ? String(marks.length) + ' 条批注' : '暂无批注'),
            /* 反向出口：窗口开着但停靠关着时，给一颗「⇥ 停靠」，不用去设置页里翻。 */
            (wide && store.dockDocTab !== true)
              ? h('button', {
                  type: 'button',
                  className: 'dsha-mini dsha-mini-on',
                  title: '把文档放回右侧栏（等价于在设置里打开「文档停靠在右侧栏」；没装 dsh-better-sidebar 时会还回到窗口）',
                  onClick: () => {
                    try { writePluginConfig({ dockDocTab: true }) } catch (error) { /* 宿主没接就只改本地 */ }
                    commit({ dockDocTab: true, docOpen: false, docWide: false, docDetached: false })
                  },
                }, '⇥ 停靠')
              : null,
            h('div', { className: 'dsha-spacer' }),
            wide ? h('span', { className: 'dsha-hint' }, '拖标题栏移动 · 拖边角改大小') : null,
          ),
        h('div', {
          className: 'dsha-doc-bar',
        },
          h('div', { className: 'dsha-doc-bar-inner' },
          embedded
            ? h('button', {
                type: 'button',
                className: 'dsha-mini dsha-mini-on',
                title: '把文档拖出来：变成可以拖动、拉边的独立窗口（不影响停靠设置）',
                /* 「拖出来」= 关掉停靠设置 + 开独立窗口：保证只有一份在跑。 */
                onClick: () => {
                  try { writePluginConfig({ dockDocTab: false }) } catch (error) { /* 宿主没接就只改本地 */ }
                  commit({ dockDocTab: false, docOpen: true, docDetached: false })
                },
              }, '⇱ 窗口')
            : null,
          h('div', { className: 'dsha-nav' },
            h('button', {
              type: 'button',
              className: navOpen ? 'dsha-mini dsha-mini-on' : 'dsha-mini',
              title: '这个对话里的所有文档',
              onClick: () => setNavOpen(value => !value),
            },
              /* 文件名并进按钮内部：整条（份数 + 文件名 + ▾）都可点，打开同一个下拉。 */
              h('span', { className: 'dsha-doc-count' }, String(docs.length + extraFiles.length) + ' 份'),
              (doc === null || doc === undefined ? '' : fileNameOfKey(doc.key)) === ''
                ? null
                : h('span', { className: 'dsha-doc-file' }, fileNameOfKey(doc.key)),
              h('span', { className: 'dsha-doc-caret' }, '▾')),
            /* 左侧那个「✎ 批注」按钮在聊天标题栏，常被别的层盖住点不动；
               这里再给一个入口，位置在文档栏，肯定点得到。 */
            h('button', {
              type: 'button',
              className: 'dsha-mini',
              title: '开/关这份文档的批注列表（只算文档上的批注）',
              /* 抽屉从 top:40 铺到底，会盖住文档栏这一行，所以按钮自己抬到抽屉之上。 */
              style: { position: 'relative', zIndex: 96 },
              /* 标记：抽屉的「点外面就关」要放行这个按钮，否则先关再开 = 怎么都关不掉。 */
              'data-dsha-drawer-toggle': '1',
              onClick: () => commit({ docDrawer: state.docDrawer === true ? false : true }),
            }, '✎ 批注 ' + String(marks.length)),
            navOpen
              ? h('div', { className: 'dsha-nav-menu' },
                groups.map((group) => {
                  const newest = group.versions[0]
                  const latestKey = docs.length === 0 ? '' : docs[0].key
                  const active = (pick === '' && newest.key === latestKey)
                    || group.versions.some(entry => entry.key === pick)
                  const expanded = openGroup === group.title && group.versions.length > 1
                  return h('div', { key: group.title, className: 'dsha-nav-group' },
                    h('div', {
                      className: 'dsha-nav-item',
                      'data-on': active ? '1' : '0',
                      onClick: () => {
                        /* 0.115：正看着 txt/csv 时点「最新」那份 md，要把文件视图放下，由库兜底显示最新 md。 */
                        const leaveFile = isFileDoc(state.doc) ? { doc: null } : {}
                        commit(newest.key === latestKey
                          ? { docPick: '', docView: null, ...leaveFile }
                          : { docPick: newest.key, docView: { key: newest.key, text: newest.text, title: group.title, sid: sessionId } }, true)
                        setNavOpen(false)
                      },
                    },
                      group.versions.length > 1
                        ? h('span', {
                          className: 'dsha-nav-caret',
                          title: '展开历史版本',
                          onClick: (event) => {
                            event.stopPropagation()
                            setOpenGroup(expanded ? '' : group.title)
                          },
                        }, expanded ? '▾' : '▸')
                        : null,
                      h('span', { className: 'dsha-nav-ico' }, typeIconOf(group.title)),
                      h('span', null, group.title),
                      group.versions.length > 1
                        ? h('span', { style: { flex: 'none', marginLeft: 'auto', color: 'var(--dsw-alias-label-secondary)' } },
                          String(group.versions.length) + ' 版')
                        : null,
                      newest.key === latestKey
                        ? h('span', { style: { flex: 'none', marginLeft: '6px', color: '#8aa0ff' } }, '最新')
                        : null),
                    expanded
                      ? group.versions.map((entry, number) => h('div', {
                        key: entry.key,
                        className: 'dsha-nav-item',
                        'data-version': '1',
                        'data-on': pick === entry.key ? '1' : '0',
                        onClick: () => {
                          /* 选历史版时把正文一起快照下来：轮询重导、库条目被替换都不会把它弹走。
                             以前只记 key，下一拍库里对不上就自动回最新，表现是「闪一下又跳回来」。 */
                          commit({
                            docPick: entry.key,
                            docView: { key: entry.key, text: entry.text, title: group.title, sid: sessionId },
                          }, true)
                          setNavOpen(false)
                        },
                      },
                        h('span', null, '第 ' + String(group.versions.length - number) + ' 版 · ' + whenText(entry.at)),
                        number === 0
                          ? h('span', { style: { flex: 'none', color: '#8aa0ff' } }, '最新')
                          : null))
                      : null)
                }),
                /* 0.115：本会话目录里的其它文件（txt / 代码 / csv；xlsx 等列出来但提示暂不支持预览）。 */
                extraFiles.length === 0
                  ? null
                  : h('div', { key: 'sep-files', className: 'dsha-nav-sep' }),
                extraFiles.map(item => h('div', {
                  key: 'f:' + item.file,
                  className: 'dsha-nav-item',
                  'data-on': doc !== null && doc !== undefined && doc.key === 'file:' + sessionTail(sessionId) + '/' + item.file ? '1' : '0',
                  title: item.supported ? '打开 ' + item.file : item.file + '（暂不支持预览）',
                  onClick: () => {
                    void openSessionFile(sessionId, item.file)
                    setNavOpen(false)
                  },
                },
                  h('span', { className: 'dsha-nav-ico' }, typeIconOf(item.file)),
                  h('span', null, item.file),
                  item.supported
                    ? null
                    : h('span', { style: { flex: 'none', marginLeft: 'auto', color: 'var(--dsw-alias-label-secondary)' } }, '不支持预览'))),
                /* ---- 分割线：上面是文档列表，下面是设置项（0.105 按用户要求分开） ---- */
                h('div', { key: 'sep-list', className: 'dsha-nav-sep' }),
                h('div', {
                  key: 'auto-doc',
                  className: 'dsha-nav-item',
                  title: '这个会话第一次出现文档时，自动把「文档」页签推出来',
                  onClick: () => {
                    const next = store.autoDoc === false
                    commit({ autoDoc: next, autoDocLocal: true }, true)
                    writePluginConfig({ autoOpenDoc: next })
                  },
                },
                  h('span', null, '文档出现时自动打开'),
                  h('span', { style: { marginLeft: 'auto', color: '#8aa0ff' } },
                    store.autoDoc === false ? '关' : '开')),
                h('div', {
                  key: 'doc-dir',
                  className: 'dsha-nav-item',
                  title: '文档落在哪里：默认是 ${DSH_HOME}/annotate-docs/<会话尾8位>/；点这里用资源管理器打开',
                  onClick: () => {
                    try {
                      void fetch('/annotate-doc/open', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({}),
                      }).catch(() => {})
                    } catch (error) { /* 打不开就算了 */ }
                    setNavOpen(false)
                  },
                },
                  h('span', null, '文档目录'),
                  h('span', { style: { marginLeft: 'auto', color: 'var(--dsw-alias-label-secondary)' } }, '默认 ▸')),
                h('div', {
                  key: 'open-editor',
                  className: 'dsha-nav-item',
                  title: '用右侧的编辑器（better-sidebar）打开这份文档，直接改字；改完面板会自动跟上',
                  onClick: () => {
                    void (async () => {
                      try {
                        const one = await fetch('/annotate-doc/latest?sid=' + encodeURIComponent(sessionId)).then(response => response.json())
                        if (one === null || one.ok !== true || typeof one.path !== 'string' || one.path === '') return
                        openInSidebar(one.path)
                      } catch (error) { /* 打不开就算了 */ }
                    })()
                    setNavOpen(false)
                  },
                }, '在编辑器里打开'),
                /* ---- 分割线：设置项 与 整理（会删东西的三项合成一行小按钮） ---- */
                h('div', { key: 'sep-tidy', className: 'dsha-nav-sep' }),
                h('div', {
                  key: 'tidy-row',
                  className: 'dsha-nav-item',
                  style: { cursor: 'default' },
                  title: '三种整理：只清显示（不动磁盘）/ 删本会话文件 / 删已删会话的文件',
                },
                  h('span', null, '整理'),
                  h('div', { className: 'dsha-nav-chips' },
                    h('button', {
                      type: 'button',
                      className: 'dsha-mini',
                      title: '只清空本会话的文档显示（磁盘文件留着，之后能读回来）',
                      onClick: (event) => {
                        event.stopPropagation()
                        /* 清空本会话自己的桶；别的会话的桶不受影响。 */
                        docFileTried.delete(sessionId)
                        libCommit(sessionId, {}, { doc: null, docPick: '', docView: null }, true)
                        restoreDocFromFile(sessionId)
                        setNavOpen(false)
                      },
                    }, '只清显示'),
                    h('button', {
                      type: 'button',
                      className: 'dsha-mini',
                      /* 0.121.1：以前这里直接删盘（不可恢复）。现在要用户再确认一次，
                         而且发送确认串——旧版宿主会忽略它继续删，所以**必须先重启**再用。 */
                      title: '把这个会话在磁盘上的文档文件挪进回收目录（可在 _trash 找回），并清空显示',
                      onClick: (event) => {
                        event.stopPropagation()
                        const sure = window.confirm('把本会话的文档文件挪进回收目录？\n\n会清空右侧面板列表，文件可在 annotate-docs\\_trash 里找回。')
                        if (sure !== true) return
                        /* 0.121.1：只清面板显示，**不动磁盘文件**（有 confirm 也先别删，等宿主升级）。 */
                        /* 清空本会话自己的桶；别的会话的桶不受影响。 */
                        docFileTried.delete(sessionId)
                        libCommit(sessionId, {}, { doc: null, docPick: '', docView: null }, true)
                        setNavOpen(false)
                      },
                    }, '删本会话'),
                    h('button', {
                      type: 'button',
                      className: 'dsha-mini',
                      title: '扫一遍文档目录：DSH 里已经不存在的会话，把它们整个文件夹删掉（不可恢复）',
                      onClick: (event) => {
                        event.stopPropagation()
                        void (async () => {
                          try {
                            const listed = await fetch('/annotate-doc/sessions').then(response => response.json())
                            if (listed === null || listed.ok !== true || Array.isArray(listed.sessions) !== true) return
                            /* 0.121.1：**不再自动删任何目录**。以前这里把「DSH 里已不存在的会话」的文档目录
                               整个删掉（不可恢复），一次误操作就没了整目录（2026-11-28 事故）。
                               现在只统计并提示，删不删由用户去文件管理器决定。 */
                            const orphans = listed.sessions.filter(item => item.present === false)
                            window.alert('有 ' + String(orphans.length) + ' 个会话的文档目录已经找不到对应会话：\n\n'
                              + orphans.slice(0, 10).map(item => String(item.folder)).join('\n')
                              + '\n\n插件不再自动删除它们。要清理请自己到 annotate-docs 目录里处理。')
                          } catch (error) { /* 扫不了就算了 */ }
                        })()
                        setNavOpen(false)
                      },
                    }, '删已删会话'))),
                h('div', { className: 'dsha-nav-foot' },
                  'v' + PLUGIN_VERSION + ' · ' + String(blocks.length) + ' 段 · 字号 ' + String(fontSize)
                  + (debugTraceOn() !== true || docSwitchCount === 0 ? '' : ' · 切 ' + String(docSwitchCount))))
              : null),
          /* 字号放在左边：右边缘是侧栏的拖拽热区，点了会被吞掉。 */
          h('button', {
            type: 'button',
            className: 'dsha-mini',
            title: '字小一点',
            onClick: () => commit({ docFont: Math.max(12, fontSize - 1), docFontLocal: true }, true),
          }, 'A-'),
          h('button', {
            type: 'button',
            className: 'dsha-mini',
            title: '字大一点',
            onClick: () => commit({ docFont: Math.min(21, fontSize + 1), docFontLocal: true }, true),
          }, 'A+'),
          h('button', {
            type: 'button',
            className: 'dsha-mini',
            title: '铺满窗口读，Esc 收起',
            onClick: () => commit({ docWide: !wide }),
          }, wide ? '收起' : '放大'),
          marksSorted.length > 0
            ? h('button', {
              type: 'button',
              className: drawerOpen ? 'dsha-mini dsha-mini-on' : 'dsha-mini',
              title: '按正文顺序列出全部批注',
              onClick: () => commit({ docDrawer: !drawerOpen }),
            }, '批注 ' + String(marksSorted.length))
            : null,
          h('button', {
            type: 'button',
            className: findOpen ? 'dsha-mini dsha-mini-on' : 'dsha-mini',
            title: '在文档里查找（Enter 下一个，Shift+Enter 上一个）',
            onClick: () => commit({ docFindOpen: !findOpen, docFindAt: 0 }),
          }, '查找'),
          (viewing === null && isFileDoc(doc) && doc.model !== null && doc.model !== undefined
            && (doc.model.type === 'table' || doc.model.type === 'workbook'))
            ? (() => {
              const cellCount = itemsOf(sessionId).filter(entry => isCellAnnotationOf(entry, doc.key)).length
              return h('div', { className: 'dsha-export-wrap' },
                h('button', {
                  type: 'button',
                  className: exportOpen ? 'dsha-mini dsha-mini-on' : 'dsha-mini',
                  title: '导出这份表格上的批注',
                  onClick: () => setExportOpen(value => !value),
                }, '导出 ▾'),
                exportOpen
                  ? h('div', { className: 'dsha-export-menu', role: 'menu' },
                    h('button', {
                      type: 'button',
                      className: 'dsha-mini',
                      disabled: cellCount === 0,
                      title: cellCount === 0 ? '这份表格上还没有单元格批注' : '列：文件 / 工作表 / 单元格 / 值 / 批注 / 状态 / 回复（UTF-8 带 BOM，Excel 可直接打开）',
                      onClick: () => {
                        const ok = downloadText(cellExportName(doc.fileName), cellAnnotationsToCsv(itemsOf(sessionId), doc), 'text/csv')
                        setFlash(ok ? '已导出 ' + String(cellCount) + ' 条' : '导出失败')
                        window.setTimeout(() => setFlash(''), 1600)
                        setExportOpen(false)
                      },
                    }, '批注.csv（' + String(cellCount) + ' 条）'),
                    h('button', {
                      type: 'button',
                      className: 'dsha-mini',
                      disabled: true,
                      title: '把已解决的批注写回单元格、另存一份 xlsx：下一版再做',
                    }, '原名 · 改后.xlsx（下一版）'))
                  : null)
            })()
            : h('button', {
            type: 'button',
            className: 'dsha-mini',
            title: '复制整篇（含文末批注）为 Markdown',
            onClick: () => {
              const text = docToMarkdown(viewing === null ? blocks : viewBlocks, marksSorted)
              try {
                void navigator.clipboard.writeText(text)
                setFlash('已复制')
              } catch (error) {
                setFlash('复制失败')
              }
              window.setTimeout(() => setFlash(''), 1600)
            },
          }, '导出'),
          flash === '' ? null : h('span', { className: 'dsha-flash' }, flash),
          viewing === null ? null : h('span', { className: 'dsha-hint' }, '只读 · 不是最新那份'),
          viewing === null
            ? h('button', {
              type: 'button',
              className: editing ? 'dsha-mini dsha-mini-on' : 'dsha-mini',
              onClick: () => commit({ docEditing: !editing }),
            }, editing ? '完成' : '编辑')
            : h('button', {
              type: 'button',
              className: 'dsha-mini',
              onClick: () => commit({ docPick: '', docView: null }, true),
            }, '回到最新'),
          viewing === null && editing
            ? h('span', { className: 'dsha-hint' }, '点进段落改字，失焦即保存')
            : null,
          viewing === null && doc !== null && doc.local === true
            ? h('button', {
              type: 'button',
              className: 'dsha-mini',
              title: '用助手最新一版覆盖你本地的改动',
              onClick: () => putDoc({ ...doc, local: false }),
            }, '载入新版')
            : null,
          viewing === null
            ? h('button', {
              type: 'button',
              className: 'dsha-mini',
              title: '把已定结论合成一份新文档（会替换正文）',
              onClick: () => {
                sendChatText([
                  '请按已定批注更新文档：用 dsh-doc 围栏发一版整篇新文档。',
                  '已经定下来的批注要落进正文，还没定的保持原样。',
                ].join(''))
              },
            }, '重生成')
            : null,
          /* 放大放在左边：栏的右段是侧栏拖拽热区，点不到 */
          h('div', { className: 'dsha-spacer' }),
          )),
        findOpen
          ? h('div', { className: 'dsha-find' },
            h('input', {
              type: 'text',
              value: findText,
              placeholder: '在文档里查找…',
              autoFocus: true,
              onChange: event => commit({ docFind: event.target.value, docFindAt: 0 }),
              onKeyDown: (event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  if (findHits.length === 0) return
                  const next = (findAt + (event.shiftKey === true ? -1 : 1) + findHits.length) % findHits.length
                  commit({ docFindAt: next })
                  scrollToHit(findHits[next])
                } else if (event.key === 'Escape') {
                  commit({ docFind: '', docFindAt: 0 })
                }
              },
            }),
            h('span', { className: 'dsha-hint' },
              findHits.length === 0
                ? (findText === '' ? '' : '没找到')
                : String(findAt + 1) + ' / ' + String(findHits.length)),
            h('button', {
              type: 'button',
              className: 'dsha-mini',
              disabled: findHits.length === 0,
              onClick: () => {
                if (findHits.length === 0) return
                const next = (findAt - 1 + findHits.length) % findHits.length
                commit({ docFindAt: next })
                scrollToHit(findHits[next])
              },
            }, '‹'),
            h('button', {
              type: 'button',
              className: 'dsha-mini',
              disabled: findHits.length === 0,
              onClick: () => {
                if (findHits.length === 0) return
                const next = (findAt + 1) % findHits.length
                commit({ docFindAt: next })
                scrollToHit(findHits[next])
              },
            }, '›'),
            h('button', {
              type: 'button',
              className: 'dsha-mini dsha-close',
              title: '关掉查找',
              onClick: () => commit({ docFind: '', docFindAt: 0 }),
            }, '×'))
          : null,
        h('div', {
          className: 'dsha-doc-body',
          ref: bodyRef,
          onClick: (event) => {
            const target = event.target
            if (!(target instanceof Element)) return
            const span = target.closest('[data-mark]')
            if (span === null) return
            const id = span.getAttribute('data-mark')
            if (id === null || id === '__pending__') return
            const rect = span.getBoundingClientRect()
            commit({
              docThread: {
                entryId: id,
                x: Math.max(8, Math.min(rect.left, window.innerWidth - 360)),
                y: Math.max(48, Math.min(rect.bottom + 8, window.innerHeight - 260)),
              },
            })
          },
        },
          h('div', { className: 'dsha-doc-inner' },
            /* 0.115：打开文件失败（越界 409 / 找不到 / 太大）时的一句提示。 */
            typeof store.docNotice === 'string' && store.docNotice !== ''
              ? h('div', { className: 'dsha-file-notice', role: 'status' },
                h('span', null, store.docNotice),
                h('button', { type: 'button', className: 'dsha-mini', onClick: () => commit({ docNotice: '' }) }, '×'))
              : null,
            /* 0.115 派发：blocks 有内容 → Markdown（下面原有的循环，一行没动）；
               非 md 文件 → 表格 TableView / 纯文本 <pre> / 不支持预览的提示。 */
            (viewing === null && isFileDoc(doc))
              ? renderFileDoc(doc, sessionId, marks, () => {
        /* 写完一个格子就重读这份文件，让面板显示磁盘上的真值（不靠前端猜）。 */
        const name = doc !== null && doc !== undefined && typeof doc.fileName === 'string' ? doc.fileName : ''
        if (name !== '') void openSessionFile(sessionId, name)
      })
              : (viewing === null ? blocks : viewBlocks).length === 0
              ? h('div', { className: 'dsha-empty' },
                viewing === null ? '还没有文档。' : '这份文档是空的。',
                h('br'),
                '让助手用 ```dsh-doc 围栏输出一份文档，这里就会显示它。',
                h('br'),
                '整篇重发用 dsh-doc，接着往下写用 dsh-doc+。',
                classes.length === 0
                  ? null
                  : h('div', { className: 'dsha-debug', style: { marginTop: '10px', maxWidth: '100%' } },
                    '扫到 ' + String(classes.length) + ' 个代码块：' + probe),
                /* 常见坑：助手把哨兵写进围栏语言位（```dsh-doc），DSH 把语言吞掉，插件认不出来。
                   这时给一个明确的按钮，让人自己点一下导入 —— 不猜，只提示。 */
                candidate === ''
                  ? null
                  : h('div', { style: { marginTop: '12px' } },
                    h('button', {
                      type: 'button',
                      className: 'dsha-btn dsha-btn-primary',
                      onClick: () => {
                        const blocks = parseMarkdownDoc(candidate)
                        putDoc({
                          id: 'main',
                          sid: sessionId,
                          key: 'manual' + String(Date.now()),
                          blocks,
                          baseCount: blocks.length,
                          appends: [],
                          source: candidate,
                          editedAt: Date.now(),
                        })
                      },
                    }, '把聊天里那个像文档的代码块导入为文档')))
              : (viewing === null ? blocks : viewBlocks).map((block, index) => renderBlockSafe(block, index, false)))),
        docBox === null
          ? null
          : ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].map(name => h('div', {
            key: 'grip-' + name,
            className: 'dsha-doc-grip dsha-doc-grip-' + name,
            onPointerDown: event => startBoxResize(event, name),
          })),
        drawerOpen
          ? h('div', { className: 'dsha-drawer', style: { width: String(drawerW) + 'px' } },
            h('div', { className: 'dsha-drawer-grip', onPointerDown: startDrawerResize }),
            h('div', { className: 'dsha-drawer-head' },
              /* 「收起」放左边：右边贴着 DSH 自己的最小化/关闭，放右边点不到（和文档标题栏一个道理） */
              h('button', {
                type: 'button',
                className: 'dsha-mini',
                onClick: () => commit({ docDrawer: false }),
              }, '收起 ›'),
              h('span', null, '批注 ' + String(marksSorted.length)),
              h('div', { className: 'dsha-spacer' })),
            h('div', { className: 'dsha-drawer-list' },
              marksSorted.length === 0
                ? h('div', { className: 'dsha-empty' }, '这份文档还没有批注。')
                : marksSorted.map(entry => h('div', {
                  key: entry.id,
                  className: 'dsha-drawer-row',
                  onClick: () => openThreadFor(entry),
                },
                  h('div', { className: 'dsha-drawer-quote' }, String(entry.quote === undefined ? '' : entry.quote)),
                  h('div', { style: { display: 'flex', alignItems: 'center', gap: '6px' } },
                    h('span', { className: 'dsha-dot', 'data-status': entry.status }),
                    h('div', { className: 'dsha-drawer-say' },
                      typeof entry.reply === 'string' && entry.reply !== '' ? entry.reply : String(entry.note === undefined ? '' : entry.note)))))))
          : null,
        state.docToolbar === null || state.docToolbar === undefined
          ? null
          : h(EmojiBar, {
            left: Math.max(8, Math.min(state.docToolbar.x, window.innerWidth - 320)),
            top: Math.max(8, state.docToolbar.y - 84),
            onPick: reactTo,
          }),
        state.docToolbar === null || state.docToolbar === undefined
          ? null
          : h('div', {
            className: 'dsha-toolbar',
            style: {
              left: String(Math.max(8, Math.min(state.docToolbar.x, window.innerWidth - 240))) + 'px',
              top: String(Math.max(8, state.docToolbar.y - 46)) + 'px',
            },
          },
            h('button', { type: 'button', className: 'dsha-tb dsha-tb-primary', onClick: () => openFromToolbar('edit') }, '批注'),
            /* 看历史版时只给批注和复制：改样式会写到最新那份身上。 */
            viewing === null ? h('span', { className: 'dsha-tb-sep' }) : null,
            viewing === null
              ? h('div', { className: 'dsha-tb-group' },
                [['bold', 'B'], ['italic', 'I'], ['strike', 'S'], ['code', '<>']].map(([key, label]) => h('button', {
                  key,
                  type: 'button',
                  className: 'dsha-tb dsha-tb-small',
                  title: { bold: '粗体', italic: '斜体', strike: '删除线', code: '行内代码' }[key],
                  onClick: () => applyInline(key),
                }, label)))
              : null,
            viewing === null ? h('span', { className: 'dsha-tb-sep' }) : null,
            viewing === null
              ? h('div', { className: 'dsha-tb-group' },
                [['p', '正文'], ['h1', 'H1'], ['h2', 'H2'], ['h3', 'H3']].map(([kind, label]) => h('button', {
                  key: kind,
                  type: 'button',
                  className: 'dsha-tb dsha-tb-small',
                  'data-on': currentKind === kind ? '1' : '0',
                  onClick: () => applyBlockKind(kind),
                }, label)))
              : null,
            h('span', { className: 'dsha-tb-sep' }),
            h('button', {
              type: 'button',
              className: 'dsha-tb',
              title: '复制选中的文字',
              onClick: () => {
                const bar = state.docToolbar
                if (bar !== null && bar !== undefined) {
                  try {
                    void navigator.clipboard.writeText(bar.quote)
                  } catch (error) {
                    /* 剪贴板不可用就静默 */
                  }
                }
                commit({ docToolbar: null })
              },
            }, '复制')),
        state.docThread === null || state.docThread === undefined
          ? null
          : h(ThreadCard, {
            sessionId,
            entryId: state.docThread.entryId,
            onClose: () => commit({ docThread: null }),
            style: { left: String(state.docThread.x) + 'px', top: String(state.docThread.y) + 'px' },
          }),
      )
    }

    /* ---------------------------------------------------------------- 设置页 */

    /** 设置页的一行：左边标题 + 一句解释，右边控件。 */
    function SettingsRow(props) {
      return h('div', { className: 'dsha-set-row' },
        h('div', { className: 'dsha-set-main' },
          h('div', { className: 'dsha-set-label' }, props.label),
          h('div', { className: 'dsha-set-desc' }, props.desc)),
        h('div', { className: 'dsha-set-ctl' }, props.children))
    }

    /**
     * `plugins.row.config` 的表单：键 `dsh-annotate#annotate`。
     *
     * 只改草稿，点保存时把三个字段一次 mutate 进去；返回 false 说明被别处改过/越界，
     * 页面会重新读取，不假装保存成功。
     */
    function AnnotateSettings(props) {
      const form = props.form === undefined || props.form === null ? null : props.form
      const snapshot = form === null ? null : form.state
      const [draft, setDraft] = React.useState(null)
      const [busy, setBusy] = React.useState(false)
      const [note, setNote] = React.useState('')
      const [newEmoji, setNewEmoji] = React.useState('')
      const [newMeaning, setNewMeaning] = React.useState('')
      /* 只跟 revision 变：保存成功后宿主会推一份新快照，草稿要跟上。 */
      const revisionKey = snapshot === null ? 'none' : String(snapshot.status) + ':' + String(snapshot.revision)
      React.useEffect(() => {
        if (snapshot === null || snapshot.status !== 'ready') return
        const value = snapshot.value
        if (value === null || typeof value !== 'object') return
        const font = clampFont(value.defaultFont)
        const window = clampReplyWindow(value.keepReplyWindow)
        setDraft({
          autoOpenDoc: value.autoOpenDoc !== false,
          defaultFont: String(font === null ? 15 : font),
          keepReplyWindow: String(window === null ? 4 : window),
          docDir: typeof value.docDir === 'string' ? value.docDir : '',
          reactions: typeof value.reactions === 'string' ? value.reactions : '',
          /* 宿主还没重载时这个字段可能不存在（旧 Config）：界面上按默认「开」显示，别显示成关。 */
          wideRightClick: value.wideRightClick !== false,
          dockDocTab: value.dockDocTab === true,
        })
      }, [revisionKey])

      if (props.view === 'summary') return '文档自动打开、文档停靠右侧栏、默认字号、回复锚点队列长度、右键唤出范围、划句表情。'
      if (form === null) {
        return h('div', { className: 'dsha-set-note' }, '没有拿到配置表单：请从「插件」页打开这个插件的这一行再进「配置」。')
      }
      if (snapshot !== null && snapshot.status === 'unavailable') {
        return h('div', { className: 'dsha-set-note' }, '宿主没有提供这个插件的配置（客户端精简版？）。')
      }
      if (draft === null) {
        return h('div', { className: 'dsha-set-note' }, '正在读取配置…')
      }

      const disabled = busy || snapshot === null || snapshot.writable === false || snapshot.revision === undefined
      const edit = (key, value) => setDraft({ ...draft, [key]: value })
      /* 改表情 / 改含义 / 拨开关都是同一个动作：整张表重算，压回 `表情=含义` 文本。 */
      const setReactionRow = (index, patch) => {
        const rows = reactionRows(draft.reactions)
        const next = rows.map((row, at) => (at === index ? { ...row, ...patch } : row))
        edit('reactions', reactionText(next.filter(row => String(row.emoji).trim() !== '' && String(row.meaning).trim() !== '')))
      }
      const addReaction = () => {
        const key = newEmoji.trim()
        const say = newMeaning.trim()
        if (key === '' || say === '') {
          setNote('自定义表情要同时填表情和含义。')
          return
        }
        edit('reactions', mergeReactionText(draft.reactions, key, say))
        setNewEmoji('')
        setNewMeaning('')
        setNote('')
      }
      const save = async () => {
        if (disabled) return
        setBusy(true)
        setNote('正在保存…')
        try {
          /* 数字框里存的是原始文本：保存这一刻才钳到合法区间。 */
          const font = clampFont(Number(draft.defaultFont))
          const window = clampReplyWindow(Number(draft.keepReplyWindow))
          const ok = await form.mutate([
            { op: 'set', path: ['autoOpenDoc'], value: draft.autoOpenDoc },
            { op: 'set', path: ['docDir'], value: String(draft.docDir === undefined ? '' : draft.docDir).trim() },
            { op: 'set', path: ['defaultFont'], value: font === null ? 15 : font },
            { op: 'set', path: ['keepReplyWindow'], value: window === null ? 4 : window },
            { op: 'set', path: ['wideRightClick'], value: draft.wideRightClick !== false },
            { op: 'set', path: ['dockDocTab'], value: draft.dockDocTab === true },
            { op: 'set', path: ['reactions'], value: draft.reactions },
          ], snapshot.revision)
          setNote(ok ? '已保存，下一次操作起生效。' : '保存被拒绝：配置已在别处改过，已重新读取。')
        } catch (error) {
          setNote('保存失败：' + (error !== null && error !== undefined && error.message !== undefined ? error.message : String(error)))
        }
        setBusy(false)
      }

      return h('div', { className: 'dsha-settings' },
        h(SettingsRow, {
          label: '文档出现时自动打开',
          desc: '这个会话第一次出现文档时，自动把右侧的「文档」页签推出来；关掉后只在点「文档」时才打开。',
        },
          h('input', {
            type: 'checkbox',
            className: 'dsha-set-switch',
            checked: draft.autoOpenDoc,
            disabled,
            onChange: event => edit('autoOpenDoc', event.target.checked),
          })),
        h(SettingsRow, {
          label: '文档存放目录',
          desc: '留空＝${DSH_HOME}/annotate-docs（一会话一个文件夹）。填了就以这里为根；改完只影响之后落盘的文档，已经写好的文件不会搬家。',
        },
          h('input', {
            type: 'text',
            className: 'dsha-set-input',
            style: { width: '260px' },
            placeholder: '留空使用默认目录',
            value: draft.docDir,
            disabled,
            onChange: event => edit('docDir', event.target.value),
          })),
        h(SettingsRow, {
          label: '默认字号',
          desc: '文档默认用多大字号（12–21）。文档栏里用 A-/A+ 手动调过之后，以本地那次为准。',
        },
          h('input', {
            type: 'number',
            className: 'dsha-set-input',
            min: 12,
            max: 21,
            step: 1,
            value: draft.defaultFont,
            disabled,
            onChange: event => edit('defaultFont', event.target.value),
          })),
        h(SettingsRow, {
          label: '回复锚点队列长度',
          desc: '同时有多批批注在等回复时，记住最近几条消息的末尾用来配对（1–4）。一般不用改。',
        },
          h('input', {
            type: 'number',
            className: 'dsha-set-input',
            min: 1,
            max: 4,
            step: 1,
            value: draft.keepReplyWindow,
            disabled,
            onChange: event => edit('keepReplyWindow', event.target.value),
          })),
        h(SettingsRow, {
          label: '右键唤出批注框',
          desc: '开着：在文档正文里右键就能开批注框（用刚划的那句；鼠标还在文章里、选区被右键点没了也认）。关掉：必须先用鼠标划中一句话再右键，且起终点要在同一段里。',
        },
          h('input', {
            type: 'checkbox',
            className: 'dsha-set-switch',
            checked: draft.wideRightClick !== false,
            disabled,
            title: '关掉后右键只在「划中的那句话」上开框，其余位置把系统菜单还给你',
            onChange: event => edit('wideRightClick', event.target.checked),
          })),
        h('div', { className: 'dsha-set-row' },
          h('div', { className: 'dsha-set-main' },
            h('div', { className: 'dsha-set-label' }, '文档停靠在右侧栏'),
              h('div', { className: 'dsha-set-desc' }, '开：文档开成 dsh-better-sidebar 右侧栏里的「文档」页签（要装那个插件）。关：文档开成插件自己的窗口，可拖动、八向拉伸。页签用不了时自动回落到窗口，不会点了没反应。'),
            ),
            h('input', {
              type: 'checkbox',
              className: 'dsha-set-switch',
              checked: draft.dockDocTab === true,
              disabled,
              title: '需要 dsh-better-sidebar；不装也能用，会自动用插件自己的窗口',
              onChange: event => edit('dockDocTab', event.target.checked),
            })),
          h('div', { className: 'dsha-set-row' },
            h('div', { className: 'dsha-set-main' },
            h('div', { className: 'dsha-set-label' }, '划句表情'),
            h('div', { className: 'dsha-set-desc' }, '文档和聊天里选中文字后浮出的一排。每一行三件：表情、这个表情代表什么意思、开关（开着才出现在表情条上）。点某种表情会把它的含义连同你选中的句子一起发给我。'),
            h('div', { className: 'dsha-set-reacts' },
              reactionRows(draft.reactions).map((row, index) => h('div', { className: 'dsha-set-react', key: String(index) },
                h('input', {
                  className: 'dsha-set-input dsha-set-emoji',
                  defaultValue: row.emoji,
                  disabled,
                  title: '表情本身，可以直接改',
                  onBlur: event => setReactionRow(index, { emoji: event.target.value.trim().slice(0, 8) }),
                  onKeyDown: (event) => { if (event.key === 'Enter') event.target.blur() },
                }),
                h('input', {
                  className: 'dsha-set-meaning',
                  defaultValue: row.meaning,
                  disabled,
                  title: '这个表情代表的意思，会原样发给我',
                  onBlur: event => setReactionRow(index, { meaning: event.target.value.trim().slice(0, 60) }),
                  onKeyDown: (event) => { if (event.key === 'Enter') event.target.blur() },
                }),
                h('input', {
                  type: 'checkbox',
                  className: 'dsha-set-switch',
                  checked: row.on !== false,
                  disabled,
                  title: row.on === false ? '关着：不显示在表情条上' : '开着：显示在表情条上',
                  onChange: event => setReactionRow(index, { on: event.target.checked }),
                }))),
              h('div', { className: 'dsha-set-react' },
                h('input', {
                  className: 'dsha-set-input dsha-set-emoji',
                  value: newEmoji,
                  placeholder: '表情',
                  disabled,
                  onChange: event => setNewEmoji(event.target.value),
                }),
                h('input', {
                  className: 'dsha-set-meaning',
                  value: newMeaning,
                  placeholder: '含义，比如「就这么做」',
                  disabled,
                  onChange: event => setNewMeaning(event.target.value),
                  onKeyDown: (event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      addReaction()
                    }
                  },
                }),
                h('button', {
                  type: 'button',
                  className: 'dsha-mini',
                  disabled,
                  title: '加一个自己的表情',
                  onClick: addReaction,
                }, '+ 加'))))),
        h(SettingsRow, {
          label: '版本',
          desc: '当前加载的插件版本（只读），和 package.json 一致。',
        },
          h('input', {
            className: 'dsha-set-input dsha-set-ver',
            value: PLUGIN_VERSION,
            disabled: true,
            readOnly: true,
          })),
        h('div', { className: 'dsha-set-actions' },
          h('button', {
            type: 'button',
            className: 'dsha-btn dsha-btn-primary',
            disabled,
            onClick: () => { void save() },
          }, busy ? '保存中…' : '保存'),
          h('span', { className: 'dsha-set-note' }, note !== '' ? note : '改完点保存；写进 profile，重启也在。')))
    }

    /* -------------------------------------------------------------------- 插件 */

    return {
      name: PLUGIN_NAME,
      inject: ['slots', 'locale', 'uiConversation'],
      /** 只读测试出口：给离线脚本验证拼装逻辑用，运行时没人调它。 */
      __test: {
        buildPayload, planBatches, addAnnotation, clipQuote, normalizePath,
        migrateItem, readState, resolveTarget, decideKind, parseReactions, demoteChatTrust, freshDiskDocs, healDiskKeys, dedupeDocList, textBytes, needsTextRefresh,
        parseReactionRows, reactionRows, reactionText, mergeReactionText,
        locateQuote, bestCommonSpan, subsequenceStats, expandToSentence, fuzzyQuoteInBlock, clipToBlockEnd, menuSkipSelector: MENU_SKIP_SELECTOR,
        sanitizeSvg, svgSizeOf, svgLabelOf, safeFileName, parseMarkdownDoc, docToMarkdown,
        shouldTakeFile, shouldAdopt, chatDocAction, annotationsToMarkdown, annotationsToCsv, typeIconOf, quoteInDocBlocks, docStampOf, anchorSpanFor, planWriteBack, asBlockquote, shouldReloadFile, shouldWriteDoc, tableRowsOf, splitTableRow, isTableDivider,
        encodeWav, resizeBox,
        shouldScanNow, perfLine, perfBlank, spliceLegacy, rafGeom, scanTuning: SCAN,
        migrateDocLibrary, sanitizeDocs, keyFitsSession, fileKeyTail, docBelongsTo, trimBucket, trimDocs, docDiagLines, sidBrief,
        /* 0.115 · P1 */
        sanitizeRef, sanitizeLocator, colLetters, cellLabel, cellQuote, cellValue, lineAtOffset, renderOneLine,
        fileKindOfName, isFileDoc, fileDocOf, fileOpenNotice, docForStorage, fileDocBlocks, docFingerprint, fileTargetExtra,
        /* 0.116 · P2 */
        cellAnnotationsToCsv, cellExportName, isCellAnnotationOf,
        /* 0.120.1：把表格视图也暴露出来，测试里直接渲染一次，防止再出现「辅助函数定义晚于渲染路径」的白屏。 */
        TableView, WorkbookView,
        libOf: (sid) => libOf(sid),
        stateOf: () => state,
      },
      apply(ctx) {
        runtime.ctx = ctx

        ctx.effect(() => installStyles(), 'annotate: styles')
        /* 0.113 · 窗口缩放期间挂 data-dsha-resizing（7.4）。 */
        ctx.effect(() => installResizeMarker(), 'annotate: 缩放标记')
        /* 0.113 · 性能账（7.2）：每 10 秒一行写进 /annotate-log；附只读调试口与扫描模式开关（7.3 A/B）。 */
        ctx.effect(() => {
          const timer = window.setInterval(perfFlush, 10000)
          window.__dshaPerf = () => {
            const cur = perf.cur
            return {
              mode: scanMode(),
              current: JSON.parse(JSON.stringify(cur)),
              last: perf.last === null ? null : JSON.parse(JSON.stringify(perf.last)),
              lastLine: perf.last === null ? '' : perfLine(perf.last, scanMode(), sessionTail(perf.last.sid)),
            }
          }
          window.__dshaScanMode = (mode) => {
            if (mode === 'poll' || mode === 'event') {
              scanState.mode = mode
              markScanDirty('mode')
            }
            return scanState.mode
          }
          return () => {
            window.clearInterval(timer)
            try { delete window.__dshaPerf } catch (error) { window.__dshaPerf = undefined }
            try { delete window.__dshaScanMode } catch (error) { window.__dshaScanMode = undefined }
            if (chatWatch.observer !== null) {
              try { chatWatch.observer.disconnect() } catch (error) { /* 忽略 */ }
              chatWatch.observer = null
              chatWatch.el = null
            }
          }
        }, 'annotate: 性能账')

        try {
          ctx.effect(() => ctx.uiConversation.interactions.register({
            id: 'annotate',
            onInteraction(request) {
              if (request.trigger !== 'contextmenu') return
              const text = request.readText()
              if (text === null || text.trim() === '') return
              request.preventDefault()
              clearTarget()
              if (state.active !== request.sessionId) commit({ active: request.sessionId })
              request.open()
            },
          }), 'annotate: 右键手势')
        } catch (error) {
          console.error('[annotate] 手势注册失败，右键批注不可用', error)
        }

        ctx.slots.inject('conversation.chat.text-interaction', () => ctx.slots.register({
          name: 'conversation.chat.text-interaction',
          key: 'annotate',
        }, AnnotateSurface))

        ctx.slots.inject('conversation.session.header.utilities', () => ctx.slots.register({
          name: 'conversation.session.header.utilities',
          id: 'annotate',
          order: 80,
        }, AnnotateButton))

        ctx.slots.inject('conversation.session.header.utilities', () => ctx.slots.register({
          name: 'conversation.session.header.utilities',
          id: 'annotate-doc-button',
          order: 79,
        }, DocButton))
        ctx.slots.inject('conversation.session.header.utilities', () => ctx.slots.register({
          name: 'conversation.session.header.utilities',
          id: 'annotate-doc-hide-toggle',
          order: 78,
        }, DocBlockToggle))


        ctx.slots.inject('shell.overlay', () => ctx.slots.register({
          name: 'shell.overlay',
          id: 'annotate-panel',
          order: 80,
        }, AnnotatePanel))

        ctx.effect(() => installEditorHooks(), 'annotate: 侧栏编辑器右键')

        ctx.slots.inject('shell.overlay', () => ctx.slots.register({
          name: 'shell.overlay',
          id: 'annotate-float',
          order: 81,
        }, FileSurfaceHost))

        ctx.slots.inject('shell.overlay', () => ctx.slots.register({
          name: 'shell.overlay',
          id: 'annotate-marks',
          order: 79,
        }, HighlightLayer))

        ctx.slots.inject('shell.overlay', () => ctx.slots.register({
          name: 'shell.overlay',
          id: 'annotate-doc',
          order: 82,
        }, DocOverlayHost))

        ctx.slots.inject('shell.overlay', () => ctx.slots.register({
          name: 'shell.overlay',
          id: 'annotate-reply-bridge',
          order: 78,
        }, ReplyBridge))

        /* 设置页：插件 → 本行 → 配置（键是 <包名>#<行 id>）。 */
        ctx.slots.inject('plugins.row.config', () => ctx.slots.register({
          name: 'plugins.row.config',
          key: PLUGIN_NAME + '#annotate',
          order: 30,
        }, AnnotateSettings))

        /* 把宿主配置同步进本地状态：autoOpenDoc / defaultFont / keepReplyWindow。 */
        ctx.inject(['configForms'], (scope) => {
          try {
            const form = scope.configForms.get('annotate')
            runtime.settingsForm = form
            const sync = () => { applyPluginConfig(form.getSnapshot()) }
            scope.effect(() => form.subscribe(sync), 'annotate: 配置同步')
            scope.effect(() => () => {
              if (runtime.settingsForm === form) runtime.settingsForm = null
            }, 'annotate: 配置句柄')
            sync()
          } catch (error) {
            console.warn('[annotate] 读不到插件配置，设置页的改动不会同步到本地', error)
          }
        })

        /* 0.121：在 better-sidebar 的文件右键菜单里加一条「用批注面板打开」。
           做法是把那个文件复制进本会话的文档目录（POST /annotate-doc/import），
           然后让面板切过去 —— 这样工作区里的 md / 表格也能用插件的渲染与批注。 */
        ctx.inject(['betterSidebar'], (sidebarCtx) => {
          const sidebar = sidebarCtx.betterSidebar
          if (sidebar === null || sidebar === undefined || typeof sidebar.registerFileAction !== 'function') return
          const OPENABLE = /\.(md|markdown|txt|csv|xlsx|docx|pptx|js|mjs|ts|tsx|json|log|py)$/iu
          sidebarCtx.effect(() => sidebar.registerFileAction({
            id: 'dsh-annotate:open-in-panel',
            label: () => '用批注面板打开',
            order: 40,
            when: row => row !== null && row !== undefined && row.isDir !== true
              && typeof row.path === 'string' && OPENABLE.test(row.path),
            run: async (args) => {
              const file = String(args === null || args === undefined || args.path === undefined ? '' : args.path)
              const sid = String(args === null || args === undefined || args.sessionId === undefined ? '' : args.sessionId)
              if (file === '' || sid === '') return
              const response = await fetch('/annotate-doc/import', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ sid, path: file }),
              })
              const data = await response.json()
              if (data === null || data.ok !== true || typeof data.file !== 'string') {
                const why = data === null ? '' : String(data.reason === undefined ? '' : data.reason)
                if (typeof args.fail === 'function') args.fail('导入失败：' + (why === '' ? '未知原因' : why))
                return
              }
              await openSessionFile(sid, data.file)
              openDocTab()
            },
          }), 'annotate: 文件菜单入口')
        })

        /* 客户端命令 /doctab：不经过模型，只打开插件自己的文档面板。 */
        ctx.inject(['commandUi'], (scope) => {
          scope.effect(() => scope.commandUi.register({
            name: 'doctab',
            label: () => '打开文档面板',
            description: () => '打开插件的文档面板（拖动标题栏移动、四边拉伸；不发给模型）',
            available: () => true,
            ui: {
              kind: 'action',
              run: () => { openDocTab() },
            },
          }), 'annotate: /doctab')
        })

        /* 文档停靠（可选）：只有 dockDocTab 打开时才往 dsh-better-sidebar 注册页签。
           - 走 ctx.inject：服务不在就永不触发，服务重启/升级后会自动重新注册（修过「注册只试一次」的坑）；
           - 每秒对一次状态：设置页一改，页签立刻出现/消失，不用重启；
           - 关掉就注销，文档仍由插件自己的窗口承载（openDocTab 的回落分支）。 */
        ctx.inject(['betterSidebar'], (sidebarCtx) => {
          const sidebar = sidebarCtx.betterSidebar
          if (sidebar === null || sidebar === undefined || typeof sidebar.registerTab !== 'function') return
          const sync = () => {
            /* 只按 dockDocTab 决定要不要页签；detached 不再参与（它现在等价于「关掉停靠」）。 */
            const want = state.dockDocTab === true
            if (want === runtime.dockOn) return
            if (runtime.dockDispose !== null) {
              try { runtime.dockDispose() } catch (error) { /* 已经注销过 */ }
              runtime.dockDispose = null
            }
            if (want) {
              /* 切到停靠模式：自建窗口先收起来，别两处同时显示同一份文档。 */
              commit({ docOpen: false, docWide: false, docDetached: false })
              try {
                runtime.dockDispose = sidebar.registerTab({
                  id: 'dsh-annotate:doc',
                  title: () => '文档',
                  description: () => '对话文档：在文档里划句批注',
                  order: 40,
                  single: true,
                  component: (slotProps) => h(DocBoundary, null, h(DocTabHost, slotProps)),
                })
              } catch (error) {
                console.warn('[annotate] 注册文档页签失败，文档仍在插件自己的窗口里', error)
                runtime.dockOn = false
                return
              }
            }
            runtime.dockOn = want
            /* 页签刚挂上/摘下：让文档面板下一拍就扫（7.3）。 */
            markScanDirty('dock')
          }
          sync()
          const timer = window.setInterval(sync, 1000)
          sidebarCtx.effect(() => () => {
            window.clearInterval(timer)
            if (runtime.dockDispose !== null) {
              try { runtime.dockDispose() } catch (error) { /* 忽略 */ }
              runtime.dockDispose = null
            }
            runtime.dockOn = null
          }, 'annotate: 文档页签跟随开关')
        })
      },
    }
  },
})