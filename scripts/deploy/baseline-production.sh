#!/bin/bash
# One-time registration of migrations that were applied manually before CI/CD.
set -Eeuo pipefail
export PATH=/usr/sbin:/usr/bin:/sbin:/bin
umask 077

if [[ $EUID != 0 || $# != 2 || $2 != baseline-existing-production ]]; then
  echo 'Usage: sudo baseline-production.sh <reviewed-backend-checkout> baseline-existing-production' >&2
  exit 64
fi
checkout=$(realpath -- "$1")
migrations="$checkout/supabase/migrations"
[[ -d $migrations ]] || { echo 'Migration directory not found.' >&2; exit 66; }
mapfile -t files < <(find "$migrations" -maxdepth 1 -type f -name '*.sql' -printf '%f\n' | sort)
(( ${#files[@]} > 0 )) || { echo 'No migration files found.' >&2; exit 66; }

exists=$(docker exec -u postgres -e PGUSER=supabase_admin supabase-db \
  psql -d postgres -X -A -t -v ON_ERROR_STOP=1 -c \
  "select (to_regclass('supabase_migrations.schema_migrations') is not null)::int")
[[ $exists == 0 ]] || { echo 'Migration history already exists; refusing to replace it.' >&2; exit 65; }

{
  printf 'begin;\n'
  printf 'create schema if not exists supabase_migrations;\n'
  printf 'create table supabase_migrations.schema_migrations (version text primary key, statements text[], name text);\n'
  for filename in "${files[@]}"; do
    if [[ ! $filename =~ ^([0-9]{14})_([A-Za-z0-9_-]+)\.sql$ ]]; then
      echo "Invalid migration filename: $filename" >&2
      exit 66
    fi
    printf "insert into supabase_migrations.schema_migrations(version, statements, name) values ('%s', array[]::text[], '%s');\n" \
      "${BASH_REMATCH[1]}" "${BASH_REMATCH[2]}"
  done
  printf 'commit;\n'
} | docker exec -i -u postgres -e PGUSER=supabase_admin supabase-db \
  psql -d postgres -X -v ON_ERROR_STOP=1
echo "Baselined ${#files[@]} existing migrations. No migration SQL was executed."
