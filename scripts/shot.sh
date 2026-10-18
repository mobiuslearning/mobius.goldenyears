#!/usr/bin/env bash
# 视口截图（精确宽高，CDP 实现，不受 macOS Chrome 最小窗口宽影响）
# 用法: ./scripts/shot.sh <url> <out.png> [width=1440] [height=1000] [wait_ms=3500]
# 整页截图请用: node scripts/fullshot.mjs <url> <out.png> [width] [height]
set -euo pipefail
URL="${1:?usage: shot.sh <url> <out.png> [width] [height] [wait_ms]}"
OUT="${2:?usage: shot.sh <url> <out.png> [width] [height] [wait_ms]}"
W="${3:-1440}"
H="${4:-1000}"
WAIT="${5:-3500}"
mkdir -p "$(dirname "$OUT")"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
node "$SCRIPT_DIR/viewshot.mjs" "$URL" "$OUT" "$W" "$H" "$WAIT"
