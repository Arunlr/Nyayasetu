#!/usr/bin/env node
// ============================================================
// Spline Bridge — SELF-HEALING relay runner (runs in Codespace)
// - Reads endpoint (url + token) from bridge.json in this git checkout
// - Connects out to the sandbox and tunnels the browser's traffic
// - If the sandbox is replaced (new URL), re-pulls this branch and
//   reconnects automatically. Run once; leave it running.
//   node relay-runner.mjs
// ============================================================
import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.dirname(HERE);
const BRANCH = 'arena/01a0d6d9-nyayasetu';

if (typeof WebSocket === 'undefined') {
  console.error('This Node version lacks the built-in WebSocket client. Use Node 22+ (Codespaces default).');
  process.exit(1);
}

function loadConfig() {
  try {
    const j = JSON.parse(fs.readFileSync(path.join(HERE, 'bridge.json'), 'utf8'));
    if (j && j.url && j.token) return j;
  } catch {}
  return null;
}

function refreshConfig() {
  try {
    execSync(`git -C "${REPO}" fetch origin ${BRANCH} --quiet && git -C "${REPO}" reset --hard FETCH_HEAD --quiet`, { stdio: 'pipe', timeout: 30 });
    return loadConfig();
  } catch { return null; }
}

const streams = new Map(); // id -> socket
let ws = null, backoff = 1000, failures = 0, currentUrl = '';

function frame(id, flag, data) {
  const h = Buffer.alloc(5);
  h.writeUInt32BE(id, 0);
  h[4] = flag;
  return data && data.length ? Buffer.concat([h, data]) : h;
}
function send(obj) { try { ws.send(JSON.stringify(obj)); } catch {} }

function connect(cfg) {
  const url = cfg.url.replace(/^http/, 'ws') + '/relay-ws?t=' + cfg.token;
  currentUrl = cfg.url;
  console.log('[relay] connecting to', cfg.url);
  ws = new WebSocket(url);
  ws.binaryType = 'arraybuffer';

  ws.onopen = () => {
    backoff = 1000; failures = 0;
    console.log('[relay] ✅ connected — tunnel is UP. Keep this running.');
    console.log('[relay] The remote browser in the sandbox now has internet through this machine.');
  };

  ws.onmessage = (ev) => {
    const data = ev.data;
    if (typeof data === 'string') {
      let m;
      try { m = JSON.parse(data); } catch { return; }
      if (m.t === 'open') {
        const { id, host, port } = m;
        const sock = net.connect({ host, port: parseInt(port, 10) });
        streams.set(id, sock);
        sock.on('connect', () => send({ t: 'open-result', id, ok: true }));
        sock.on('error', (err) => {
          console.log('[relay] ✗', host + ':' + port, err.code || err.message);
          send({ t: 'open-result', id, ok: false, error: err.code || err.message });
          streams.delete(id);
        });
        sock.on('data', (d) => { try { ws.send(frame(id, 0, d)); } catch {} });
        sock.on('close', () => { streams.delete(id); try { ws.send(frame(id, 1)); } catch {} });
      } else if (m.t === 'ping') {
        send({ t: 'pong' });
      }
    } else {
      let buf;
      if (data instanceof ArrayBuffer) buf = Buffer.from(data);
      else if (data && data.buffer instanceof ArrayBuffer) buf = Buffer.from(data.buffer, data.byteOffset || 0, data.byteLength);
      else if (Buffer.isBuffer(data)) buf = data;
      else return;
      if (buf.length < 5) return;
      const id = buf.readUInt32BE(0), flag = buf[4], payload = buf.subarray(5);
      const sock = streams.get(id);
      if (!sock) return;
      try {
        if (flag === 0) sock.write(payload);
        else if (flag === 1) sock.end();
        else if (flag === 2) { sock.destroy(); streams.delete(id); }
      } catch {}
    }
  };

  ws.onclose = () => {
    for (const s of streams.values()) s.destroy();
    streams.clear();
    failures++;
    if (failures >= 4) {
      console.log('[relay] tunnel lost — checking for a new sandbox endpoint…');
      const cfg = refreshConfig();
      if (cfg && cfg.url !== currentUrl) {
        console.log('[relay] 🔄 new endpoint detected:', cfg.url);
        failures = 0; backoff = 1000;
        setTimeout(() => connect(cfg), 2000);
        return;
      }
      console.log('[relay] no new endpoint yet — retrying in', Math.round(backoff / 1000) + 's');
    } else {
      console.log('[relay] disconnected — retrying in', Math.round(backoff / 1000) + 's');
    }
    setTimeout(() => {
      const cfg = (failures % 4 === 0) ? (refreshConfig() || loadConfig()) : loadConfig();
      if (cfg) connect(cfg); else process.exit(1);
    }, backoff);
    backoff = Math.min(backoff * 1.6, 15000);
  };
  ws.onerror = () => { /* onclose follows */ };
}

setInterval(() => {
  if (ws && ws.readyState === 1) console.log('[relay] ⏱  alive · active streams:', streams.size);
}, 60000);

process.on('SIGINT', () => { console.log('\n[relay] bye'); process.exit(0); });

let cfg = loadConfig() || refreshConfig();
if (!cfg) { console.error('Could not read bridge.json — is this a checkout of the repo?'); process.exit(1); }
connect(cfg);
