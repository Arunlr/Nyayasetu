#!/usr/bin/env bash
# ============================================================
# Spline Bridge — ONE-TIME bootstrap for the Codespace.
# Paste this single line in the Codespace terminal:
#
#   curl -fsSL "https://raw.githubusercontent.com/Arunlr/Nyayasetu/arena-01a0d6d9-nyayasetu/tools/remote-browser/bootstrap.sh" | bash
#
# It clones/updates the bridge and starts the self-healing relay.
# If the sandbox is ever replaced, the relay follows the new
# endpoint automatically — no need to run anything again.
# ============================================================
set -e
BRANCH="arena-01a0d6d9-nyayasetu"
DIR="$HOME/.spline-bridge"

echo "[bootstrap] setting up the Spline bridge…"
if [ -d "$DIR/.git" ]; then
  echo "[bootstrap] updating existing checkout…"
  git -C "$DIR" fetch origin "$BRANCH" --quiet || true
  git -C "$DIR" reset --hard FETCH_HEAD --quiet || true
else
  echo "[bootstrap] cloning bridge repo…"
  git clone --depth 5 -b "$BRANCH" https://github.com/Arunlr/Nyayasetu.git "$DIR" --quiet
fi

echo "[bootstrap] starting relay (keep this terminal open)…"
exec node "$DIR/tools/remote-browser/relay-runner.mjs"
