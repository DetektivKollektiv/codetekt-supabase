#!/bin/bash
set -Eeuo pipefail
export PATH=/usr/sbin:/usr/bin:/sbin:/bin
umask 077

if [[ $# != 1 || ! $1 =~ ^deploy\ ([a-f0-9]{40})\ ([1-9][0-9]{0,9})\ ([a-f0-9]{64})$ ]]; then
  echo 'Only deploy <40-char commit SHA> <run number> <archive SHA-256> is allowed.' >&2
  exit 64
fi
revision=${BASH_REMATCH[1]}
run_number=${BASH_REMATCH[2]}
expected_digest=${BASH_REMATCH[3]}
[[ $EUID == 0 ]] || { echo 'Run through the restricted sudo entry point.' >&2; exit 77; }

state_dir=/var/lib/codetekt-backend-deploy
service_dir=/home/gorm/services/codetekt-supabase
archive=$(mktemp "$state_dir/release.XXXXXX.tgz")
release=$(mktemp -d "$state_dir/release.XXXXXX")
functions_parent="$service_dir/volumes"
live_functions="$functions_parent/functions"
next_functions="$functions_parent/functions.next"
previous_functions="$functions_parent/functions.previous"
functions_swapped=0

cleanup() {
  rm -rf -- "$archive" "$release" "$next_functions"
}
rollback() {
  trap - ERR HUP INT TERM
  echo 'Backend deployment failed. Applied database migrations are not rolled back.' >&2
  if (( functions_swapped )); then
    rm -rf -- "$live_functions"
    mv -- "$previous_functions" "$live_functions"
    if ! (cd "$service_dir" && sh run.sh recreate functions); then
      echo 'EDGE FUNCTION ROLLBACK FAILED: manual intervention required.' >&2
    fi
  fi
  cleanup
  exit 1
}
trap cleanup EXIT

exec 9>"$state_dir/deploy.lock"
flock -w 300 9
if [[ -f $state_dir/run-number ]] && (( run_number < $(<"$state_dir/run-number") )); then
  echo 'Refusing to deploy an older workflow run over a newer release.' >&2
  exit 65
fi

cat > "$archive"
actual_digest=$(sha256sum "$archive" | cut -d' ' -f1)
[[ $actual_digest == "$expected_digest" ]] || { echo 'Deployment bundle checksum mismatch.' >&2; exit 66; }
while IFS= read -r member; do
  case "$member" in
    ./|./bin|./bin/*|./supabase|./supabase/*) ;;
    *) echo "Unexpected deployment bundle path: $member" >&2; exit 66 ;;
  esac
done < <(tar -tzf "$archive")
tar -xzf "$archive" --no-same-owner --no-same-permissions -C "$release"
if find "$release" -type l -print -quit | grep -q .; then
  echo 'Deployment bundle must not contain symbolic links.' >&2
  exit 66
fi
if find "$release" -type f -name '.env*' -print -quit | grep -q .; then
  echo 'Deployment bundle must not contain environment files.' >&2
  exit 66
fi
[[ -x $release/bin/supabase && -f $release/supabase/config.toml ]] || {
  echo 'Incomplete deployment bundle.' >&2
  exit 66
}
[[ $($release/bin/supabase --version 2>/dev/null | head -n 1) == '2.115.0' ]] || {
  echo 'Unexpected Supabase CLI version in deployment bundle.' >&2
  exit 66
}

# A recent full backup and current WAL archiving are hard preconditions.
archive_ok=$(docker exec -u postgres -e PGUSER=supabase_admin supabase-db \
  psql -d postgres -X -A -t -v ON_ERROR_STOP=1 -c \
  "select (current_setting('archive_mode') = 'on'
    and archived_count > 0
    and (last_failed_time is null or last_archived_time > last_failed_time)
    and last_archived_time > now() - interval '15 minutes')::int
   from pg_stat_archiver")
[[ $archive_ok == 1 ]] || { echo 'WAL archiving is not healthy or current.' >&2; exit 69; }
backup_json=$(docker exec -u postgres supabase-db wal-g backup-list --json)
python3 -c '
import datetime, json, sys
backups = json.loads(sys.argv[1])
if not backups:
    raise SystemExit("No WAL-G full backup found")
latest = max(datetime.datetime.fromisoformat(item["time"].replace("Z", "+00:00")) for item in backups)
age = datetime.datetime.now(datetime.timezone.utc) - latest
if age > datetime.timedelta(hours=36):
    raise SystemExit(f"Latest WAL-G full backup is too old: {age}")
' "$backup_json"

history_exists=$(docker exec -u postgres -e PGUSER=supabase_admin supabase-db \
  psql -d postgres -X -A -t -v ON_ERROR_STOP=1 -c \
  "select (to_regclass('supabase_migrations.schema_migrations') is not null)::int")
[[ $history_exists == 1 ]] || {
  echo 'Production migration history is not baselined. Follow docs/production-cicd.md.' >&2
  exit 67
}
while IFS= read -r applied_version; do
  [[ $applied_version =~ ^[0-9]{14}$ ]] || {
    echo "Invalid migration version recorded in Production: $applied_version" >&2
    exit 68
  }
  shopt -s nullglob
  matching_migrations=("$release/supabase/migrations/${applied_version}_"*.sql)
  shopt -u nullglob
  (( ${#matching_migrations[@]} == 1 )) || {
    echo "Applied Production migration is missing from the bundle: $applied_version" >&2
    exit 68
  }
done < <(docker exec -u postgres -e PGUSER=supabase_admin supabase-db \
  psql -d postgres -X -A -t -v ON_ERROR_STOP=1 -c \
  'select version from supabase_migrations.schema_migrations order by version')

trap rollback ERR HUP INT TERM
db_ip=$(docker inspect supabase-db --format '{{range .NetworkSettings.Networks}}{{println .IPAddress}}{{end}}' \
  | head -n 1)
db_password=$(docker inspect supabase-db --format '{{range .Config.Env}}{{println .}}{{end}}' \
  | sed -n 's/^PGPASSWORD=//p')
[[ $db_ip =~ ^[0-9.]+$ && -n $db_password ]] || {
  echo 'Could not resolve internal database connection settings.' >&2
  false
}
PGPASSWORD="$db_password" "$release/bin/supabase" migration up \
  --db-url "postgresql://supabase_admin@${db_ip}:5432/postgres?sslmode=disable" \
  --workdir "$release" --include-all --yes
unset db_password
migration_count=$(find "$release/supabase/migrations" -maxdepth 1 -type f -name '*.sql' \
  | wc -l | tr -d '[:space:]')
applied_count=$(docker exec -u postgres -e PGUSER=supabase_admin supabase-db \
  psql -d postgres -X -A -t -v ON_ERROR_STOP=1 -c \
  'select count(*) from supabase_migrations.schema_migrations')
[[ $applied_count == "$migration_count" ]] || {
  echo "Migration verification failed: bundle=$migration_count Production=$applied_count" >&2
  false
}

# Preserve the self-hosting router functions, then replace application functions.
rm -rf -- "$next_functions" "$previous_functions"
install -d -m 755 "$next_functions"
for preserved in main hello; do
  if [[ -d $live_functions/$preserved ]]; then
    cp -a -- "$live_functions/$preserved" "$next_functions/"
  fi
done
cp -a -- "$release/supabase/functions/." "$next_functions/"
owner=$(stat -c '%u:%g' "$live_functions")
chown -R "$owner" "$next_functions"
mv -- "$live_functions" "$previous_functions"
functions_swapped=1
mv -- "$next_functions" "$live_functions"
(cd "$service_dir" && sh run.sh recreate functions)

auth_status=$(curl --silent --show-error --output /dev/null --write-out '%{http_code}' \
  --max-time 15 --retry 4 --retry-delay 3 --retry-all-errors \
  https://api.codetekt.org/auth/v1/health)
[[ $auth_status == 401 ]] || {
  echo "Auth health check returned HTTP $auth_status instead of 401." >&2
  false
}
function_status=$(curl --silent --show-error --output /dev/null --write-out '%{http_code}' \
  --max-time 15 --retry 4 --retry-delay 3 --retry-all-errors \
  --header 'Content-Type: application/json' --data '{}' \
  https://api.codetekt.org/functions/v1/get-review-template)
[[ $function_status == 401 ]] || {
  echo "Edge Function smoke check returned HTTP $function_status instead of 401." >&2
  false
}

trap - ERR HUP INT TERM
functions_swapped=0
printf '%s\n' "$revision" > "$state_dir/revision"
printf '%s\n' "$run_number" > "$state_dir/run-number"
echo "Backend deployed: $revision"
