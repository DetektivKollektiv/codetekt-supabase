#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)
LOCK_FILE=/tmp/codetekt-postgres-full-backup.lock

cd "$PROJECT_DIR"

exec flock --nonblock "$LOCK_FILE" \
  docker compose exec -T --user postgres --env PGUSER=supabase_admin db \
  /usr/local/bin/wal-g backup-push /var/lib/postgresql/data
