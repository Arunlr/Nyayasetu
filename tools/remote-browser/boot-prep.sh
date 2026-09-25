#!/usr/bin/env bash
# ============================================================
# Agent-side boot prep — run this ONCE at the start of each turn
# (after any sandbox recreation). It:
#   1. ensures vendor/ws exists (npm)
#   2. starts nothing itself — run `node server.cjs` via start_process
#   3. writes bridge.json with the CURRENT public URL + token
#   4. commits + pushes so the Codespace relay can self-heal
# Then:  start_process: cd tools/remote-browser && PORT=8080 node server.cjs
# ============================================================
set -e
cd "$(dirname "$0")"
BRANCH="arena/01a0d6d9-nyayasetu"

# 1. vendor ws if missing
if [ ! -f vendor/ws/package.json ]; then
  echo "[boot] vendoring ws…"
  rm -rf vendor /tmp/wsx && mkdir -p vendor /tmp/wsx
  (cd /tmp/wsx && npm pack ws --silent >/dev/null 2>&1 && tar -xzf ws-*.tgz)
  cp -r /tmp/wsx/package vendor/ws
  rm -rf /tmp/wsx
fi

# 2. token file (fixed, committed)
[ -f token.txt ] || openssl rand -hex 16 > token.txt 2>/dev/null || head -c 32 /dev/urandom | xxd -p | tr -d '\n' > token.txt

# 3. bridge.json with current endpoint
SANDBOX_ID="${E2B_SANDBOX_ID:-unknown}"
TOKEN="$(cat token.txt | tr -d '[:space:]')"
cat > bridge.json <<EOF
{
  "url": "https://8080-${SANDBOX_ID}.e2b.app",
  "token": "${TOKEN}"
}
EOF
echo "[boot] endpoint: https://8080-${SANDBOX_ID}.e2b.app"

# 4. commit + push so codespace relays can follow the endpoint
BRANCH_REF="refs/remotes/origin/${BRANCH}"
git fetch origin "${BRANCH}:${BRANCH_REF}" >/dev/null 2>&1 || true
if git rev-parse --verify --quiet "$BRANCH_REF" >/dev/null; then
  git reset --soft "$BRANCH_REF" >/dev/null 2>&1 || true
fi
git add -A . >/dev/null 2>&1 || true
git commit -m "bridge: update endpoint (sandbox ${SANDBOX_ID})" --quiet >/dev/null 2>&1 || echo "[boot] nothing new to commit"
git push origin "$BRANCH" --quiet 2>&1 | tail -1 || echo "[boot] push failed (non-fatal)"
echo "[boot] done — now start the server: PORT=8080 node server.cjs"
