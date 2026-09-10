#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)
IMAGE=codetekt/supabase-postgres-walg:17.6.1.136-v3.0.9

cd "$PROJECT_DIR"

if [ ! -f .env.walg ]; then
  echo "ERROR: .env.walg is missing; run ops/pitr/configure-walg-env.sh first." >&2
  exit 1
fi

echo "Checking access to the empty WAL-G prefix (no database changes)..."
docker run --rm \
  --entrypoint /usr/local/bin/wal-g \
  --env-file .env.walg \
  "$IMAGE" \
  backup-list --detail --json
