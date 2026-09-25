#!/usr/bin/env node
// ============================================================
// Remote Browser Bridge — network relay
// Runs on a machine with unrestricted internet (e.g. GitHub Codespace).
// Connects OUT to the sandbox and tunnels the browser's traffic.
//   node relay.mjs
// (URL + token are embedded below when served.)
// ============================================================
import net from 'node:net';

const BASE_URL = '__BASE_URL__';
const TOKEN = '__TOKEN__';

if (typeof WebSocket === 'undefined') {
  console.error('This Node version lacks the built-in WebSocket client.');
  console.error('Fix: run  npm i ws  in this folder, or upgrade to Node 22+ (Codespaces default).');
  process.exit(1);
}

const streams = new Map(); // id -> socket
let ws = null, backoff = 1000;
let opened = 0;
setInterval(() => {
  if (ws && ws.readyState === 1) console.log(`[relay] ⏱  conns opened: ${opened} · active: ${streams.size}`);
}, 30000);

function frame(id, flag, data) {
  const h = Buffer.alloc(5);
  h.writeUInt32BE(id, 0);
  h[4] = flag;
  return data && data.length ? Buffer.concat([h, data]) : h;
}

function connect() {
  const url = BASE_URL.replace(/^http/, 'ws') + '/relay-ws?t=' + TOKEN;
  console.log('[relay] connecting to', BASE_URL);
  ws = new WebSocket(url);
  ws.binaryType = 'arraybuffer';

  ws.onopen = () => {
    backoff = 1000;
    console.log('[relay] ✅ connected — tunnel is UP. Keep this running.');
    console.log('[relay] The remote browser in the sandbox now has internet through this machine.');
  };

  ws.onmessage = (ev) => {
    let data = ev.data;
    if (typeof data === 'string') {
      let m;
      try { m = JSON.parse(data); } catch { return; }
      if (m.t === 'open') {
        const { id, host, port } = m;
        opened++;
        const sock = net.connect({ host, port: parseInt(port, 10) });
        streams.set(id, sock);
        sock.on('connect', () => send({ t: 'open-result', id, ok: true }));
        sock.on('error', (err) => {
          console.log('[relay] ✗', host + ':' + port, err.code || err.message);
          send({ t: 'open-result', id, ok: false, error: err.code || err.message });
          streams.delete(id);
        });
        sock.on('data', (d) => {
          try { ws.send(frame(id, 0, d)); } catch {}
        });
        sock.on('close', () => {
          streams.delete(id);
          try { ws.send(frame(id, 1)); } catch {}
        });
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
    console.log('[relay] disconnected — retrying in', Math.round(backoff / 1000) + 's');
    for (const s of streams.values()) s.destroy();
    streams.clear();
    setTimeout(connect, backoff);
    backoff = Math.min(backoff * 1.6, 15000);
  };
  ws.onerror = () => { /* onclose follows */ };
}

function send(obj) { try { ws.send(JSON.stringify(obj)); } catch {} }

process.on('SIGINT', () => { console.log('\n[relay] bye'); process.exit(0); });
connect();
