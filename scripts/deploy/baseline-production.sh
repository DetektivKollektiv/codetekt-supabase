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
  printf 'create schema if not exists supabase_migrations authorization postgres;\n'
  printf 'alter schema supabase_migrations owner to postgres;\n'
  printf 'create table supabase_migrations.schema_migrations (version text primary key, statements text[], name text);\n'
  printf 'alter table supabase_migrations.schema_migrations owner to postgres;\n'
  printf 'create table if not exists supabase_migrations.seed_files (path text primary key, hash text not null);\n'
  printf 'alter table supabase_migrations.seed_files owner to postgres;\n'
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

ownership_ok=$(docker exec -u postgres -e PGUSER=supabase_admin supabase-db \
  psql -d postgres -X -q -A -t -v ON_ERROR_STOP=1 -c \
  "select (
     (select pg_get_userbyid(nspowner) from pg_namespace where nspname = 'supabase_migrations') = 'postgres'
     and (select pg_get_userbyid(relowner) from pg_class where oid = 'supabase_migrations.schema_migrations'::regclass) = 'postgres'
     and (select pg_get_userbyid(relowner) from pg_class where oid = 'supabase_migrations.seed_files'::regclass) = 'postgres'
     and has_schema_privilege('postgres', 'supabase_migrations', 'USAGE')
     and has_schema_privilege('postgres', 'supabase_migrations', 'CREATE')
     and has_table_privilege('postgres', 'supabase_migrations.schema_migrations', 'INSERT')
   )::int")
[[ $ownership_ok == 1 ]] || {
  echo 'Migration history ownership verification failed.' >&2
  exit 69
}
echo "Baselined ${#files[@]} existing migrations. No migration SQL was executed."
