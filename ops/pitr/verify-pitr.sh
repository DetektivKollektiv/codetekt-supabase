#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)

cd "$PROJECT_DIR"

docker compose exec -T db psql \
  --username postgres \
  --dbname postgres \
  --no-psqlrc \
  --set ON_ERROR_STOP=1 \
  --command "
select name, setting
from pg_settings
where name in ('archive_mode', 'archive_command', 'archive_timeout')
order by name;

select archived_count, failed_count, last_archived_wal,
       last_archived_time, last_failed_wal, last_failed_time
from pg_stat_archiver;
"

docker compose exec -T --user postgres db \
  /usr/local/bin/wal-g backup-list --detail --pretty
