#!/usr/bin/env bash
# switch-stack.sh — Point Nginx to the target blue/green stack.
#
# Usage:     sudo bash scripts/switch-stack.sh <blue|green>
# Requires:  nginx installed on host, sudoers entry for nginx reload (see vm-setup.sh)
#
# What it does:
#   1. Copies the target upstream template to /etc/nginx/conf.d/upstream.conf
#   2. Tests nginx config
#   3. Reloads nginx (zero-downtime)
#   4. Writes current active color to /opt/active-stack

set -euo pipefail

TARGET="${1:-}"

if [[ -z "$TARGET" ]]; then
  echo "Usage: $0 <blue|green>" >&2
  exit 1
fi

if [[ "$TARGET" != "blue" && "$TARGET" != "green" ]]; then
  echo "Invalid target '$TARGET'. Must be 'blue' or 'green'." >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UPSTREAM_TEMPLATE="${SCRIPT_DIR}/../nginx/upstream.conf.${TARGET}"
NGINX_UPSTREAM="/etc/nginx/conf.d/upstream.conf"
STATE_FILE="/opt/active-stack"

if [[ ! -f "$UPSTREAM_TEMPLATE" ]]; then
  echo "Upstream template not found: $UPSTREAM_TEMPLATE" >&2
  exit 1
fi

echo "→ Writing upstream config for '$TARGET'..."
cp "$UPSTREAM_TEMPLATE" "$NGINX_UPSTREAM"

echo "→ Testing nginx config..."
nginx -t

echo "→ Reloading nginx..."
nginx -s reload

echo "$TARGET" > "$STATE_FILE"
echo "✓ Switched to '$TARGET' stack."
