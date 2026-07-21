#!/usr/bin/env bash
set -euo pipefail
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"
if [[ -f .env ]]; then
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%$'\r'}"
    [[ -z "$line" || "$line" == \#* ]] && continue
    [[ "$line" == export\ * ]] && line="${line#export }"
    key="${line%%=*}"
    value="${line#*=}"
    [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ && "$line" == *=* ]] || continue
    [[ -n "${!key+x}" ]] && continue
    if [[ "$value" == \"*\" && "$value" == *\" ]]; then value="${value:1:${#value}-2}"; fi
    if [[ "$value" == \'*\' && "$value" == *\' ]]; then value="${value:1:${#value}-2}"; fi
    export "$key=$value"
  done < .env
fi
BACKEND_PORT="${BACKEND_PORT:-3091}"
FRONTEND_PORT="${FRONTEND_PORT:-3090}"
export ALLOWED_ORIGINS="${ALLOWED_ORIGINS:-http://127.0.0.1:$FRONTEND_PORT}"
export REACT_APP_API_BASE="${REACT_APP_API_BASE:-http://127.0.0.1:$BACKEND_PORT/api}"
for directory in backend/node_modules frontend/node_modules; do
  [[ -d "$directory" ]] || { echo "Missing $directory; install dependencies explicitly first." >&2; exit 1; }
done
for port in "$BACKEND_PORT" "$FRONTEND_PORT"; do
  if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then echo "Port $port is already in use; refusing to stop another process." >&2; exit 1; fi
done
(cd backend && npm start) & BACKEND_PID=$!
(cd frontend && BROWSER=none HOST="${FRONTEND_HOST:-127.0.0.1}" PORT="$FRONTEND_PORT" npm start) & FRONTEND_PID=$!
cleanup() { kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true; wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true; }
trap cleanup EXIT INT TERM
echo "Drone API: http://127.0.0.1:$BACKEND_PORT; UI: http://127.0.0.1:$FRONTEND_PORT"
wait "$BACKEND_PID" "$FRONTEND_PID"
