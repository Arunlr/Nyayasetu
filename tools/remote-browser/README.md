# Remote Browser Bridge (Spline over Codespace relay)

Lets the agent operate a real browser (Chrome headless-shell + SwiftShader WebGL) inside the
sandbox even though the sandbox's egress is allow-listed (github/npm only). All browser traffic
is tunneled through a relay the USER runs in a GitHub Codespace; the user views/controls the
browser through the live preview.

## Files
- `server.cjs` — HTTP server (PORT, default 8080), viewer UI + /view-ws, relay /relay-ws?t=TOKEN,
  local CONNECT proxy (127.0.0.1:9230) piped through the relay websocket, Chrome manager, CDP
  control, /api/* automation endpoints (token-protected).
- `ui.html` — viewer page (canvas stream + input capture + waiting screen w/ relay command).
- `relay.mjs` — zero-dep script for the Codespace (URL/token substituted when served).
- `extract.cjs` — restores Chrome from persist/*.br, or auto-downloads from npm if missing.
- `cli.py` — agent CLI: status|nav|click|dblclick|move|wheel|key|type|press|eval|dom|axtree|shot|reload|frame

## Boot
    mkdir -p /home/user/browser/app && cp tools/remote-browser/* /home/user/browser/app/  # first time only
    cp /home/user/browser/app/../app/vendor missing? -> vendor ws: cd tmp && npm pack ws && extract to app/vendor/ws
    cd /home/user/browser && PORT=8080 node app/server.cjs   # run as background process
    # persist/*.br (67MB, kept OUT of git) auto-downloads from npm on first boot:
    #   npm pack @sparticuz/chromium@149.0.0  -> package/bin/*.br -> /home/user/browser/persist/

## User relay one-liner (shown on the waiting screen of the preview)
    curl -fsSL "https://8080-<SANDBOX_ID>.e2b.app/relay.mjs?t=<TOKEN>" -o /tmp/r.mjs && node /tmp/r.mjs

## Notes
- Viewport locked at 1280×800; screen coords == CSS px.
- Chrome env: FONTCONFIG_PATH=/tmp/fonts, LD_LIBRARY_PATH=/tmp/chrome149/lib (NSS libs),
  --ignore-certificate-errors (no root store), --proxy-server=http://127.0.0.1:9230.
- Native keyDown text insertion works (needs fonts present). Paste uses __aiInsert helper.
- Newst relay connection wins. Relay auto-reconnects (≤15s backoff) if the sandbox restarts.
