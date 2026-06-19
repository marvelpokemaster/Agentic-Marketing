#!/usr/bin/env bash
# Run the app using the project virtualenv (.crawlvenv preferred).
# Usage: ./scripts/run.sh main.py --ui

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -x "$ROOT/.crawlvenv/bin/python" ]]; then
  VENV="$ROOT/.crawlvenv"
elif [[ -x "$ROOT/.crawlvemv/bin/python" ]]; then
  VENV="$ROOT/.crawlvemv"
  echo "[run.sh] Using .crawlvemv (typo folder — consider renaming to .crawlvenv)" >&2
else
  echo "No virtualenv found. Create one:" >&2
  echo "  python3 -m venv .crawlvenv && .crawlvenv/bin/pip install -r requirements.txt" >&2
  exit 1
fi

export VIRTUAL_ENV="$VENV"
export PATH="$VENV/bin:$PATH"
# Ensure venv site-packages are used even if python symlink is misconfigured
export PYTHONPATH="$VENV/lib/python3.14/site-packages${PYTHONPATH:+:$PYTHONPATH}"

# Examples:
#   ./scripts/run.sh main.py --ui
#   ./scripts/run.sh main.py --leads "ABC Bakers selling sourdough to cafes" --scrapers sample
#   ./scripts/run.sh main.py --ad "Handcrafted sourdough bread" --tone Premium

exec "$VENV/bin/python" "$@"
