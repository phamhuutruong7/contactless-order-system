#!/usr/bin/env bash
# health-check.sh — Wait for the target stack's API /health endpoint to be ready.
#
# Usage:     bash scripts/health-check.sh <blue|green>
#
# Returns 0 on success, 1 on timeout.

set -euo pipefail

COLOR="${1:-}"
MAX_RETRIES=30
RETRY_INTERVAL=5

if [[ -z "$COLOR" ]]; then
  echo "Usage: $0 <blue|green>" >&2
  exit 1
fi

if [[ "$COLOR" == "blue" ]]; then
  API_PORT=5000
elif [[ "$COLOR" == "green" ]]; then
  API_PORT=5010
else
  echo "Invalid color '$COLOR'. Must be 'blue' or 'green'." >&2
  exit 1
fi

echo "→ Waiting for $COLOR stack (port $API_PORT)..."

for i in $(seq 1 "$MAX_RETRIES"); do
  if curl -sf --max-time 3 "http://localhost:${API_PORT}/health" > /dev/null 2>&1; then
    echo "✓ $COLOR stack is healthy (attempt $i)."
    exit 0
  fi
  echo "  Attempt $i/$MAX_RETRIES — not ready yet, retrying in ${RETRY_INTERVAL}s..."
  sleep "$RETRY_INTERVAL"
done

echo "✗ Health check timed out for $COLOR stack after $((MAX_RETRIES * RETRY_INTERVAL))s." >&2
exit 1
