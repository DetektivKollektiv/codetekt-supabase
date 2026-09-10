#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)
MAX_ARCHIVE_AGE_MINUTES=${MAX_ARCHIVE_AGE_MINUTES:-15}
MAX_BACKUP_AGE_HOURS=${MAX_BACKUP_AGE_HOURS:-36}

case "$MAX_ARCHIVE_AGE_MINUTES" in
  ''|*[!0-9]*)
    echo "ERROR: MAX_ARCHIVE_AGE_MINUTES must be a positive integer." >&2
    exit 64
    ;;
esac
case "$MAX_BACKUP_AGE_HOURS" in
  ''|*[!0-9]*)
    echo "ERROR: MAX_BACKUP_AGE_HOURS must be a positive integer." >&2
    exit 64
    ;;
esac

if [ "$MAX_ARCHIVE_AGE_MINUTES" -eq 0 ] || [ "$MAX_BACKUP_AGE_HOURS" -eq 0 ]; then
  echo "ERROR: PITR age limits must be greater than zero." >&2
  exit 64
fi

cd "$PROJECT_DIR"

archive_ok=$(docker compose exec -T --user postgres --env PGUSER=supabase_admin db psql \
  --dbname postgres \
  --no-psqlrc \
  --tuples-only \
  --no-align \
  --set ON_ERROR_STOP=1 \
  --command "select (
    current_setting('archive_mode') = 'on'
    and current_setting('archive_command') <> ''
    and archived_count > 0
    and (last_failed_time is null or last_archived_time > last_failed_time)
    and last_archived_time > now() - make_interval(mins => $MAX_ARCHIVE_AGE_MINUTES)
  )::int from pg_stat_archiver" | tr -d '[:space:]')

if [ "$archive_ok" != "1" ]; then
  echo "ERROR: WAL archiving is disabled, stale, or has an unresolved failure." >&2
  docker compose exec -T --user postgres --env PGUSER=supabase_admin db psql \
    --dbname postgres \
    --no-psqlrc \
    --set ON_ERROR_STOP=1 \
    --command "select archived_count, failed_count, last_archived_wal,
      last_archived_time, last_failed_wal, last_failed_time
      from pg_stat_archiver"
  exit 1
fi

backup_json=$(docker compose exec -T --user postgres db \
  /usr/local/bin/wal-g backup-list --json)

printf '%s\n' "$backup_json" | python3 -c '
import datetime
import json
import sys

max_age = datetime.timedelta(hours=int(sys.argv[1]))
backups = json.load(sys.stdin)
if not backups:
    raise SystemExit("ERROR: no WAL-G full backup found")

latest = max(
    backups,
    key=lambda item: datetime.datetime.fromisoformat(item["time"].replace("Z", "+00:00")),
)
created = datetime.datetime.fromisoformat(latest["time"].replace("Z", "+00:00"))
age = datetime.datetime.now(datetime.timezone.utc) - created
if age > max_age:
    raise SystemExit(f"ERROR: latest WAL-G full backup is too old: {age}")

name = latest.get("backup_name") or latest.get("name") or "unknown"
print(f"latest_full_backup={name} created={created.isoformat()} age={age}")
' "$MAX_BACKUP_AGE_HOURS"

echo "PITR check passed: WAL archive is current and the latest full backup is within the configured limit."
