// ============================================================
// Remote Browser Bridge — server
// - Serves viewer UI (stream + input) on PORT (0.0.0.0)
// - Relay websocket for Codespace tunnel (/relay-ws?t=TOKEN)
// - Local HTTP CONNECT proxy that pipes through the relay
// - Chrome headless manager + CDP control
// - Token-protected automation API for the agent
// ============================================================
const http = require('node:http');
const net = require('node:net');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const { WebSocket, WebSocketServer } = require(path.join(__dirname, 'vendor', 'ws'));
const { extract, DEST: CHROME_DIR } = require('./extract.cjs');

// ---------- config ----------
const PORT = parseInt(process.env.PORT || '8080', 10);
const CDP_PORT = 9222;
const PROXY_PORT = 9230;
const VIEW_W = 1280, VIEW_H = 800;
const TOKEN_FILE = path.join(__dirname, 'token.txt');
const SHOTS_DIR = '/tmp/shots';
fs.mkdirSync(SHOTS_DIR, { recursive: true });
const BRANCH = 'arena-01a0d6d9-nyayasetu';
const BOOTSTRAP_CMD = `curl -fsSL "https://raw.githubusercontent.com/Arunlr/Nyayasetu/${BRANCH}/tools/remote-browser/bootstrap.sh" | bash`;

// ---------- token (fixed, committed to the repo) ----------
let TOKEN;
if (fs.existsSync(TOKEN_FILE)) TOKEN = fs.readFileSync(TOKEN_FILE, 'utf8').trim();
else { TOKEN = crypto.randomBytes(16).toString('hex'); fs.writeFileSync(TOKEN_FILE, TOKEN); }

const SANDBOX_ID = process.env.E2B_SANDBOX_ID || 'unknown';
const PUBLIC_URL = `https://${PORT}-${SANDBOX_ID}.e2b.app`;

// ---------- state ----------
const state = {
  phase: 'boot',            // boot | waiting-relay | ready
  chromeUp: false,
  relays: new Set(),
  pageUrl: '',
  pageTitle: '',
  viewers: new Set(),
  lastAiActivity: 0,
};

function log(...a) { console.log(new Date().toISOString().slice(11, 23), ...a); }

// ============================================================
// Relay tunnel
// ============================================================
// wire format relay<->server:
//   JSON text: {t:'hello'|'open'|'open-result'|'ping'|'pong', id?, host?, port?, ok?, error?}
//   binary: [u32 id BE][u8 flag]  flag: 0 data, 1 eof, 2 destroy

function header(id, flag) { const h = Buffer.alloc(5); h.writeUInt32BE(id, 0); h[4] = flag; return h; }

class RelayConn {
  constructor(ws) {
    this.ws = ws;
    this.streams = new Map(); // id -> RelayStream
    this.nextId = 1;
    this.alive = true;
    state.relays.add(this);
    ws.on('message', (data, isBinary) => {
      if (!isBinary) {
        let m; try { m = JSON.parse(data.toString()); } catch { return; }
        this.onControl(m);
      } else {
        const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
        if (buf.length < 5) return;
        const id = buf.readUInt32BE(0), flag = buf[4], payload = buf.subarray(5);
        const s = this.streams.get(id);
        if (s) s.onRemote(flag, payload);
      }
    });
    ws.on('close', () => this.destroy());
    ws.on('error', () => this.destroy());
    ws.on('pong', () => { this.alive = true; });
    this.pingTimer = setInterval(() => {
      if (!this.alive) return this.destroy();
      this.alive = false;
      try { this.ws.ping(); } catch {}
    }, 15000);
    this.send({ t: 'hello', v: 1 });
    log('[relay] connected:', ws._socket ? ws._socket.remoteAddress : '?');
    onRelayChange();
  }
  send(obj) { try { this.ws.send(JSON.stringify(obj)); } catch {} }
  onControl(m) {
    if (m.t === 'ping') return this.send({ t: 'pong' });
    if (m.t === 'pong') { this.alive = true; return; }
  }
  openStream(host, port) {
    const id = this.nextId++;
    const s = new RelayStream(this, id, host, port);
    this.streams.set(id, s);
    this.send({ t: 'open', id, host, port: String(port) });
    return s;
  }
  streamData(id, chunk) { this.ws.send(Buffer.concat([header(id, 0), chunk]), { binary: true }); }
  streamEof(id) { this.sendBinaryFlag(id, 1); }
  streamDestroy(id) { this.sendBinaryFlag(id, 2); this.streams.delete(id); }
  sendBinaryFlag(id, flag) {
    const h = header(id, flag);
    try { this.ws.send(h, { binary: true }); } catch {}
  }
  destroy() {
    if (!this.streams) return;
    clearInterval(this.pingTimer);
    for (const s of this.streams.values()) s.destroyLocal();
    this.streams.clear();
    this.streams = null;
    state.relays.delete(this);
    try { this.ws.terminate(); } catch {}
    log('[relay] disconnected');
    onRelayChange();
  }
}

class RelayStream {
  constructor(relay, id, host, port) {
    this.relay = relay; this.id = id; this.host = host; this.port = port;
    this.confirmed = false;
    this.remoteEnded = false;
    this.destroyed = false;
    this.onData = null; this.onEnd = null; this.onError = null; this.onOpen = null;
    setTimeout(() => {
      if (!this.confirmed && !this.destroyed) this.fail('open timeout');
    }, 15000);
  }
  confirmedOpen() {
    if (this.confirmed) return;
    this.confirmed = true;
    this.onOpen && this.onOpen();
  }
  fail(err) {
    if (this.destroyed) return;
    this.destroyed = true;
    this.relay.streamDestroy(this.id);
    this.onError && this.onError(new Error(err));
  }
  write(chunk) { if (!this.destroyed) this.relay.streamData(this.id, chunk); }
  end() { if (!this.destroyed) this.relay.streamEof(this.id); }
  destroyLocal() {
    this.destroyed = true;
    this.onError && this.onError(new Error('relay gone'));
  }
  onRemote(flag, payload) {
    if (flag === 0) {
      this.confirmedOpen();
      this.onData && this.onData(payload);
    } else if (flag === 1) {
      this.remoteEnded = true;
      this.onEnd && this.onEnd();
    } else if (flag === 2) {
      this.destroyed = true;
      this.onError && this.onError(new Error('remote closed'));
    }
  }
  handleOpenResult(ok, error) {
    if (ok) this.confirmedOpen();
    else this.fail(error || 'open failed');
  }
}

// route open-result confirmations coming from the relay client
const origOnControl = RelayConn.prototype.onControl;
RelayConn.prototype.onControl = function (m) {
  if (m.t === 'open-result') {
    const s = this.streams.get(m.id);
    if (s) s.handleOpenResult(m.ok, m.error);
    return;
  }
  return origOnControl.call(this, m);
};

function pickRelay() {
  // prefer the most recently connected relay (Set preserves insertion order)
  let best = null;
  for (const r of state.relays) if (r.ws.readyState === 1) best = r;
  return best;
}

function onRelayChange() { updatePhase(); }

function updatePhase() {
  state.phase = state.chromeUp ? 'ready' : 'waiting-relay';
  broadcastView({ t: 'status', phase: state.phase, relays: state.relays.size, chrome: state.chromeUp, url: state.pageUrl, title: state.pageTitle });
}

// ============================================================
// Local HTTP proxy (chrome -> tunnel)
// ============================================================
const proxy = net.createServer((sock) => {
  sock.setTimeout(120000, () => { try { sock.destroy(); } catch {} });
  let buf = Buffer.alloc(0);
  const onChunk = (chunk) => {
    buf = Buffer.concat([buf, chunk]);
    const idx = buf.indexOf('\r\n\r\n');
    if (idx === -1) {
      if (buf.length > 16384) sock.destroy();
      return;
    }
    sock.removeListener('data', onChunk);
    const head = buf.subarray(0, idx).toString('latin1');
    const rest = buf.subarray(idx + 4);
    const lines = head.split('\r\n');
    const [method, target] = lines[0].split(' ');
    if (method === 'CONNECT') {
      const [host, port] = target.split(':');
      handleConnect(sock, host, parseInt(port || '443', 10), rest, true);
    } else if (/^https?:\/\//.test(target)) {
      const u = new URL(target);
      const port = u.protocol === 'https:' ? 443 : (u.port ? parseInt(u.port, 10) : 80);
      handleConnect(sock, u.hostname, port, buf, false);
    } else {
      sock.write('HTTP/1.1 400 Bad Request\r\nContent-Length: 0\r\n\r\n');
      sock.destroy();
    }
  };
  sock.on('data', onChunk);
  sock.on('error', () => {});
});

function handleConnect(sock, host, port, initial, isConnect) {
  const relay = pickRelay();
  if (!relay) {
    const body = 'Tunnel not connected yet';
    sock.write('HTTP/1.1 502 Bad Gateway\r\nContent-Length: ' + body.length + '\r\nConnection: close\r\n\r\n' + body);
    sock.end();
    return;
  }
  const stream = relay.openStream(host, port);
  let wrote200 = false;
  const write200 = () => {
    if (wrote200 || !isConnect) return;
    wrote200 = true;
    try { sock.write('HTTP/1.1 200 Connection Established\r\n\r\n'); } catch {}
  };
  stream.onOpen = () => {
    write200();
    if (initial && initial.length) { try { stream.write(initial); } catch {} }
  };
  stream.onData = (d) => { write200(); try { sock.write(d); } catch {} };
  stream.onEnd = () => { try { sock.end(); } catch {} };
  stream.onError = () => {
    if (!wrote200 && isConnect) { try { sock.write('HTTP/1.1 502 Bad Gateway\r\nContent-Length: 0\r\nConnection: close\r\n\r\n'); } catch {} }
    try { sock.destroy(); } catch {}
  };
  sock.on('data', (d) => stream.write(d));
  sock.on('end', () => stream.end());
  sock.on('error', () => stream.destroyLocal());
  sock.on('close', () => stream.destroyLocal());
}

proxy.listen(PROXY_PORT, '127.0.0.1', () => log('[proxy] listening on', PROXY_PORT));

// ============================================================
// Chrome manager
// ============================================================
let chromeProc = null;
function startChrome() {
  extract();
  const env = {
    ...process.env,
    FONTCONFIG_PATH: '/tmp/fonts',
    LD_LIBRARY_PATH: path.join(CHROME_DIR, 'lib'),
    HOME: '/tmp/chrome-home',
  };
  fs.mkdirSync('/tmp/chrome-home', { recursive: true });
  const args = [
    '--no-sandbox', '--no-zygote', '--in-process-gpu',
    '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
    '--disable-gpu-sandbox',
    '--ignore-certificate-errors', '--allow-insecure-localhost',
    `--remote-debugging-port=${CDP_PORT}`,
    '--user-data-dir=/tmp/chrome-profile-main',
    `--window-size=${VIEW_W},${VIEW_H}`,
    '--proxy-server=http://127.0.0.1:' + PROXY_PORT,
    '--proxy-bypass-list=<-loopback>',
    '--lang=en-US', '--no-first-run', '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows',
    '--mute-audio',
    'about:blank',
  ];
  chromeProc = spawn(path.join(CHROME_DIR, 'chrome-headless-shell'), args, { env, stdio: ['ignore', 'pipe', 'pipe'] });
  chromeProc.stderr.on('data', (d) => {
    const s = d.toString();
    if (s.includes('DevTools listening')) {
      state.chromeUp = true;
      log('[chrome] devtools ready (pid', chromeProc.pid + ')');
      connectCDP();
      updatePhase();
    }
  });
  chromeProc.stderr.on('data', (d) => { for (const l of d.toString().split('\n')) if (/FATAL|error while loading/i.test(l)) log('[chrome]', l.trim()); });
  chromeProc.on('exit', (code) => {
    state.chromeUp = false;
    for (const ps of sessions.values()) ps.destroy();
    sessions.clear(); activeSession = null;
    cdp = null;
    log('[chrome] exited', code, '— restarting in 3s');
    updatePhase();
    setTimeout(startChrome, 3000);
  });
}

// ============================================================
// CDP
// ============================================================
let cdp = null;
const sessions = new Map();
let activeSession = null;
let msgSeq = 1;
const pendingCalls = new Map();

function cdpSend(method, params = {}, sessionId) {
  return new Promise((resolve, reject) => {
    const id = msgSeq++;
    pendingCalls.set(id, { resolve, reject });
    const msg = { id, method, params };
    if (sessionId) msg.sessionId = sessionId;
    cdp.send(JSON.stringify(msg));
    setTimeout(() => {
      if (pendingCalls.has(id)) {
        pendingCalls.delete(id);
        reject(new Error('CDP timeout: ' + method));
      }
    }, 30000);
  });
}

async function connectCDP() {
  if (cdp && cdp.readyState === 1) return;
  for (let i = 0; i < 20; i++) {
    try {
      const ver = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`)).json();
      const ws = new WebSocket(ver.webSocketDebuggerUrl);
      await new Promise((res, rej) => { ws.on('open', res); ws.on('error', rej); });
      if (cdp && cdp.readyState === 1) { ws.close(); return; }
      cdp = ws;
      ws.on('message', (data) => onCdpMessage(Buffer.isBuffer(data) ? data.toString() : data.toString()));
      ws.on('close', () => { log('[cdp] browser connection closed'); cdp = null; setTimeout(connectCDP, 2000); });
      log('[cdp] connected:', ver.Browser);
      await cdpSend('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: false, flatten: true });
      return;
    } catch (e) {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  log('[cdp] FAILED to connect');
}

function onCdpMessage(str) {
  let m; try { m = JSON.parse(str); } catch { return; }
  if (m.id && pendingCalls.has(m.id)) {
    const p = pendingCalls.get(m.id); pendingCalls.delete(m.id);
    if (m.error) p.reject(new Error(m.error.message || 'cdp error'));
    else p.resolve(m.result);
    return;
  }
  if (m.method === 'Target.attachedToTarget') {
    const { sessionId, targetInfo } = m.params;
    if (targetInfo.type === 'page') {
      log('[cdp] attached page:', targetInfo.url);
      const ps = new PageSession(sessionId, targetInfo);
      sessions.set(sessionId, ps);
      setActive(ps);
      ps.init();
    }
  } else if (m.method === 'Target.detachedFromTarget') {
    const ps = sessions.get(m.params.sessionId);
    if (ps) {
      ps.destroy(); sessions.delete(m.params.sessionId);
      if (activeSession === ps) activeSession = [...sessions.values()].pop() || null;
      if (activeSession) setActive(activeSession);
    }
  } else {
    const ps = m.sessionId ? sessions.get(m.sessionId) : null;
    if (ps) ps.onEvent(m);
  }
}

function setActive(ps) {
  if (activeSession && activeSession !== ps) activeSession.stopScreencast();
  activeSession = ps;
  ps.startScreencast();
}

const TYPING_HELPER = `
window.__aiInsert = function(text) {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') {
    if (el.readOnly || el.disabled) return false;
    const s = el.selectionStart == null ? el.value.length : el.selectionStart;
    const e = el.selectionEnd == null ? el.value.length : el.selectionEnd;
    el.setRangeText(text, s, e, 'end');
    el.dispatchEvent(new Event('input', {bubbles: true}));
    return true;
  }
  if (el.isContentEditable) {
    document.execCommand('insertText', false, text);
    return true;
  }
  return false;
};
window.__aiBackspace = function() {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') {
    const s = el.selectionStart == null ? el.value.length : el.selectionStart;
    const e = el.selectionEnd == null ? el.value.length : el.selectionEnd;
    if (s === e && s > 0) el.setRangeText('', s - 1, e, 'end');
    else el.setRangeText('', s, e, 'end');
    el.dispatchEvent(new Event('input', {bubbles: true}));
    return true;
  }
  if (el.isContentEditable) return document.execCommand('delete');
  return false;
};
window.__aiFieldInfo = function() {
  const el = document.activeElement;
  if (!el) return null;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return {tag, type: el.type, value: el.type==='password' ? '•'.repeat(el.value.length) : el.value};
  if (el.isContentEditable) return {tag: 'CONTENTEDITABLE', value: el.textContent.slice(0,200)};
  return {tag};
};
`;

class PageSession {
  constructor(sessionId, targetInfo) {
    this.sessionId = sessionId;
    this.url = targetInfo.url;
    this.title = '';
    this.screencasting = false;
    this.lastFrameAt = 0;
    this.lastFrame = null;
  }
  async init() {
    try {
      await this.send('Page.enable');
      await this.send('Runtime.enable');
      await this.send('Emulation.setDeviceMetricsOverride', { width: VIEW_W, height: VIEW_H, deviceScaleFactor: 1, mobile: false });
      await this.send('Page.addScriptToEvaluateOnNewDocument', { source: TYPING_HELPER });
      await this.send('Runtime.evaluate', { expression: TYPING_HELPER });
      await this.send('Emulation.setFocusEmulationEnabled', { enabled: true });
      this.refreshUrl();
    } catch (e) { log('[page] init error', e.message); }
  }
  send(method, params) { return cdpSend(method, params, this.sessionId); }
  async refreshUrl() {
    try {
      const r = await this.send('Runtime.evaluate', { expression: 'location.href + "||" + document.title', returnByValue: true });
      const [u, t] = (r.result.value || '||').split('||');
      this.url = u; this.title = t || '';
      if (this === activeSession) { state.pageUrl = u; state.pageTitle = this.title; updatePhase(); }
    } catch {}
  }
  async startScreencast() {
    if (this.screencasting) return;
    this.screencasting = true;
    try {
      await this.send('Page.startScreencast', { format: 'jpeg', quality: 55, maxWidth: VIEW_W, maxHeight: VIEW_H, everyNthFrame: 1 });
      log('[page] screencast started');
    } catch (e) { log('[page] screencast error', e.message); this.screencasting = false; }
  }
  async stopScreencast() {
    if (!this.screencasting) return;
    this.screencasting = false;
    try { await this.send('Page.stopScreencast'); } catch {}
  }
  async onEvent(m) {
    if (m.method === 'Page.screencastFrame') {
      const { data, metadata } = m.params;
      this.lastFrame = Buffer.from(data, 'base64');
      this.lastFrameAt = Date.now();
      try { await this.send('Page.screencastFrameAck', { sessionId: m.params.sessionId }); } catch {}
      if (this === activeSession) broadcastViewBuffer(this.lastFrame);
    } else if (m.method === 'Page.frameNavigated') {
      if (m.params.frame.parentId === undefined) { this.url = m.params.frame.url; this.refreshUrl(); }
    } else if (m.method === 'Page.loadEventFired') {
      try { await this.send('Runtime.evaluate', { expression: TYPING_HELPER }); } catch {}
      this.refreshUrl();
    }
  }
  destroy() { this.stopScreencast(); }
}

// ============================================================
// input handling (from viewers + api)
// ============================================================
const KEYMAP = {
  enter: { code: 'Enter', vk: 13 }, backspace: { code: 'Backspace', vk: 8 }, tab: { code: 'Tab', vk: 9 },
  escape: { code: 'Escape', vk: 27 }, delete: { code: 'Delete', vk: 46 }, space: { code: 'Space', vk: 32, key: ' ' },
  arrowup: { code: 'ArrowUp', vk: 38 }, arrowdown: { code: 'ArrowDown', vk: 40 },
  arrowleft: { code: 'ArrowLeft', vk: 37 }, arrowright: { code: 'ArrowRight', vk: 39 },
  home: { code: 'Home', vk: 36 }, end: { code: 'End', vk: 35 }, pageup: { code: 'PageUp', vk: 33 }, pagedown: { code: 'PageDown', vk: 34 },
};
const SYM = {
  '.': ['Period', 190], ',': ['Comma', 188], '/': ['Slash', 191], ';': ['Semicolon', 186], "'": ['Quote', 222],
  '[': ['BracketLeft', 219], ']': ['BracketRight', 221], '\\': ['Backslash', 220], '-': ['Minus', 189],
  '=': ['Equal', 187], '`': ['Backquote', 192], '!': ['Digit1', 49], '@': ['Digit2', 50], '#': ['Digit3', 51],
  '$': ['Digit4', 52], '%': ['Digit5', 53], '^': ['Digit6', 54], '&': ['Digit7', 55], '*': ['Digit8', 56],
  '(': ['Digit9', 57], ')': ['Digit0', 48], '_': ['Minus', 189], '+': ['Equal', 187], '{': ['BracketLeft', 219],
  '}': ['BracketRight', 221], ':': ['Semicolon', 186], '"': ['Quote', 222], '<': ['Comma', 188], '>': ['Period', 190],
  '?': ['Slash', 191], '|': ['Backslash', 220], '~': ['Backquote', 192],
};

async function handleInput(evt, fromAi = false) {
  if (fromAi) state.lastAiActivity = Date.now();
  const ps = activeSession;
  if (!ps) return { error: 'no page' };
  const S = ps.sessionId;
  try {
    if (evt.kind === 'mouse') {
      const p = {
        type: evt.type === 'pressed' ? 'mousePressed' : evt.type === 'released' ? 'mouseReleased' : evt.type === 'wheel' ? 'mouseWheel' : 'mouseMoved',
        x: clamp(evt.x, 0, VIEW_W), y: clamp(evt.y, 0, VIEW_H),
        button: evt.button || 'left', buttons: evt.buttons || 0, modifiers: evt.modifiers || 0, clickCount: evt.clickCount || 1,
      };
      if (evt.type === 'wheel') { p.deltaX = evt.deltaX || 0; p.deltaY = evt.deltaY || 0; }
      await cdpSend('Input.dispatchMouseEvent', p, S);
      if (evt.type === 'pressed' || evt.type === 'released') await ps.refreshUrl();
      return { ok: true };
    }
    if (evt.kind === 'key') {
      const k = evt.key;
      const lower = k.toLowerCase();
      const special = KEYMAP[lower];
      const sym = SYM[k];
      let code, vk, key = k, text;
      if (special) { code = special.code; vk = special.vk; key = special.key || (k.length === 1 ? k : k.charAt(0).toUpperCase() + k.slice(1)); }
      else if (sym) { code = sym[0]; vk = sym[1]; }
      else if (/^[a-zA-Z]$/.test(k)) { code = 'Key' + k.toUpperCase(); vk = k.toUpperCase().charCodeAt(0); }
      else if (/^[0-9]$/.test(k)) { code = 'Digit' + k; vk = k.charCodeAt(0); }
      else { code = evt.code; vk = evt.vk || (k.length === 1 ? k.charCodeAt(0) : 0); }
      const printable = k.length === 1 && !(evt.modifiers & 2) && !(evt.modifiers & 1) && !(evt.modifiers & 4);
      if (printable) text = k;
      const p = {
        type: evt.type === 'down' ? 'keyDown' : 'keyUp',
        key, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk,
        modifiers: evt.modifiers || 0, autoRepeat: !!evt.autoRepeat,
      };
      if (evt.type === 'down' && printable) p.text = text;
      await cdpSend('Input.dispatchKeyEvent', p, S);
      return { ok: true };
    }
    if (evt.kind === 'text') {
      await cdpSend('Runtime.evaluate', { expression: `window.__aiInsert && __aiInsert(${JSON.stringify(evt.text)})`, returnByValue: true }, S);
      return { ok: true };
    }
    if (evt.kind === 'navigate') {
      await cdpSend('Page.navigate', { url: evt.url }, S);
      return { ok: true };
    }
    if (evt.kind === 'reload') {
      await cdpSend('Page.reload', { ignoreCache: !!evt.ignoreCache }, S);
      return { ok: true };
    }
  } catch (e) { return { error: e.message }; }
  return { error: 'unknown kind' };
}
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

// ============================================================
// viewer broadcast
// ============================================================
function broadcastView(obj) {
  const s = JSON.stringify(obj);
  for (const v of state.viewers) { if (v.readyState === 1) v.send(s); }
}
function broadcastViewBuffer(buf) {
  for (const v of state.viewers) {
    if (v.readyState !== 1) continue;
    if (v.bufferedAmount > 4 * 1024 * 1024) continue;
    v.send(buf);
  }
}

// ============================================================
// HTTP server
// ============================================================
const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  const t = u.searchParams.get('t');
  const authed = t === TOKEN || (req.headers.authorization || '') === 'Bearer ' + TOKEN;

  if (req.method === 'GET' && (u.pathname === '/' || u.pathname === '/index.html')) {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(uiHtml());
    return;
  }
  if (req.method === 'GET' && u.pathname === '/frame.jpg') {
    const f = activeSession && activeSession.lastFrame;
    if (!f) { res.writeHead(503); res.end('no frame'); return; }
    res.writeHead(200, { 'content-type': 'image/jpeg', 'cache-control': 'no-store' });
    res.end(f);
    return;
  }
  if (req.method === 'GET' && u.pathname === '/relay.mjs') {
    if (!authed) { res.writeHead(403); res.end('bad token'); return; }
    res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8' });
    res.end(relayScript());
    return;
  }
  if (req.method === 'GET' && u.pathname === '/api/status') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({
      phase: state.phase, chrome: state.chromeUp, relays: state.relays.size,
      url: state.pageUrl, title: state.pageTitle, viewers: state.viewers.size,
      publicUrl: PUBLIC_URL, aiActive: Date.now() - state.lastAiActivity < 5000,
      relayCmd: BOOTSTRAP_CMD,
      directCmd: `curl -fsSL "${PUBLIC_URL}/relay.mjs?t=${TOKEN}" -o /tmp/r.mjs && node /tmp/r.mjs`,
    }));
    return;
  }
  if (u.pathname.startsWith('/api/')) {
    if (!authed) { res.writeHead(403); res.end('{"error":"bad token"}'); return; }
    handleApi(req, res, u).catch(e => { try { res.writeHead(500); res.end(JSON.stringify({ error: e.message })); } catch {} });
    return;
  }
  res.writeHead(404); res.end('not found');
});

async function handleApi(req, res, u) {
  const body = await readBody(req);
  const p = body ? JSON.parse(body) : {};
  const ps = activeSession;

  if (u.pathname === '/api/eval' && ps) {
    const r = await ps.send('Runtime.evaluate', { expression: p.expression, returnByValue: true, awaitPromise: !!p.awaitPromise });
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(r));
    return;
  }
  if (u.pathname === '/api/input' && ps) {
    const r = await handleInput(p, true);
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(r));
    return;
  }
  if (u.pathname === '/api/navigate') {
    const r = await handleInput({ kind: 'navigate', url: p.url }, true);
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(r));
    return;
  }
  if (u.pathname === '/api/reload') {
    const r = await handleInput({ kind: 'reload', ignoreCache: p.ignoreCache }, true);
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(r));
    return;
  }
  if (u.pathname === '/api/shot') {
    if (!ps) { res.writeHead(503); res.end('{"error":"no page"}'); return; }
    const r = await ps.send('Page.captureScreenshot', { format: 'png' });
    const name = 'shot-' + Date.now() + '.png';
    fs.writeFileSync(path.join(SHOTS_DIR, name), Buffer.from(r.data, 'base64'));
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, file: 'shots/' + name }));
    return;
  }
  if (u.pathname === '/api/dom' && ps) {
    const expr = `(() => {
      const sel = ${JSON.stringify(p.selector || '*')};
      const els = [...document.querySelectorAll(sel)].slice(0, ${parseInt(p.limit || '40', 10)});
      return JSON.stringify(els.map(el => {
        const r = el.getBoundingClientRect();
        return { tag: el.tagName, id: el.id, cls: (el.className && el.className.toString ? el.className.toString() : '').slice(0,80),
                 text: (el.textContent || '').trim().slice(0, 60), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
                 visible: r.width > 0 && r.height > 0 };
      }));
    })()`;
    const r = await ps.send('Runtime.evaluate', { expression: expr, returnByValue: true });
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ elements: JSON.parse(r.result.value || '[]') }));
    return;
  }
  if (u.pathname === '/api/axtree' && ps) {
    const r = await ps.send('Accessibility.getFullAXTree');
    const nodes = (r.nodes || []).map(n => ({
      role: n.role ? n.role.value : '', name: n.name ? n.name.value : '',
      x: n.bounds ? n.bounds.x : undefined, y: n.bounds ? n.bounds.y : undefined,
      w: n.bounds ? n.bounds.width : undefined, h: n.bounds ? n.bounds.height : undefined,
    })).filter(n => n.name || ['button', 'link', 'textbox', 'menuitem', 'tab'].includes(n.role));
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ nodes: nodes.slice(0, parseInt(p.limit || '150', 10)) }));
    return;
  }
  if (u.pathname === '/api/sessions') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ count: sessions.size, active: !!activeSession, urls: [...sessions.values()].map(s => s.url) }));
    return;
  }
  res.writeHead(404); res.end('{"error":"unknown api"}');
}

function readBody(req) {
  return new Promise((resolve) => {
    let b = '';
    req.on('data', c => { b += c; if (b.length > 5e6) req.destroy(); });
    req.on('end', () => resolve(b));
    req.on('error', () => resolve(null));
  });
}

// ---------- websocket upgrade ----------
const wss = new WebSocketServer({ noServer: true });
server.on('upgrade', (req, sock, head) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname === '/view-ws') {
    wss.handleUpgrade(req, sock, head, (ws) => {
      state.viewers.add(ws);
      log('[view] viewer connected (' + state.viewers.size + ')');
      ws.on('close', () => { state.viewers.delete(ws); log('[view] viewer left'); });
      ws.on('message', (data, isBin) => {
        if (isBin) return;
        let m; try { m = JSON.parse(data.toString()); } catch { return; }
        if (m.t === 'i') handleInput(m.e, false);
        else if (m.t === 'hello') {
          ws.send(JSON.stringify({ t: 'status', phase: state.phase, relays: state.relays.size, chrome: state.chromeUp, url: state.pageUrl, title: state.pageTitle }));
          if (activeSession && activeSession.lastFrame && Date.now() - activeSession.lastFrameAt < 3000) ws.send(activeSession.lastFrame);
        }
      });
    });
    return;
  }
  if (u.pathname === '/relay-ws') {
    if (u.searchParams.get('t') !== TOKEN) { sock.destroy(); return; }
    wss.handleUpgrade(req, sock, head, (ws) => new RelayConn(ws));
    return;
  }
  sock.destroy();
});

// ============================================================
// UI + relay script
// ============================================================
function uiHtml() { return fs.readFileSync(path.join(__dirname, 'ui.html'), 'utf8'); }
function relayScript() {
  let s = fs.readFileSync(path.join(__dirname, 'relay.mjs'), 'utf8');
  return s.replace('__BASE_URL__', PUBLIC_URL).replace('__TOKEN__', TOKEN);
}

// ============================================================
// boot
// ============================================================
server.listen(PORT, '0.0.0.0', () => {
  log('==========================================');
  log(' Remote Browser Bridge');
  log(' local    : http://127.0.0.1:' + PORT);
  log(' public   : ' + PUBLIC_URL);
  log(' relay cmd (one-time bootstrap): ' + BOOTSTRAP_CMD);
  log('==========================================');
  updatePhase();
  startChrome();
});

process.on('SIGTERM', () => { try { chromeProc && chromeProc.kill(); } catch {} process.exit(0); });
process.on('uncaughtException', (e) => log('[uncaught]', e.message));
process.on('unhandledRejection', (e) => log('[unhandled]', e && e.message || e));
