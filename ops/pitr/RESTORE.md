# PostgreSQL PITR restore runbook

This runbook covers the PostgreSQL cluster stored by WAL-G. It does not restore
Docker Compose configuration, secrets, Caddy, the `db-config` volume, or files
from Supabase Storage.

Run the first drill on the existing Hetzner host with isolated Docker volumes.
The live `supabase-db` container and its PGDATA directory remain mounted and
running throughout the drill.

## Preconditions

- The exact image named below exists on the host.
- `.env.walg`, its encryption key, and the Object Storage credentials are
  available without printing them.
- The `supabase_db-config` volume is healthy. The drill copies it because the
  pgSodium key is outside PGDATA.
- `sh ops/pitr/verify-pitr.sh` succeeds after a deliberately forced WAL switch.
- The temporary container and volumes named below do not already exist.

Record the UTC start time, selected backup name, Git commit, operator, and the
verification results in the operational log. Never store secret values there.

## 1. Define isolated restore resources

```sh
cd /home/gorm/services/codetekt-supabase

PITR_IMAGE=codetekt/supabase-postgres-walg:17.6.1.136-v3.0.9
PITR_CONTAINER=codetekt-postgres-restore-test
PITR_DATA_VOLUME=codetekt-pitr-restore-data
PITR_CONFIG_VOLUME=codetekt-pitr-restore-config

test -f .env
test -f .env.walg
! docker container inspect "$PITR_CONTAINER" >/dev/null 2>&1
! docker volume inspect "$PITR_DATA_VOLUME" >/dev/null 2>&1
! docker volume inspect "$PITR_CONFIG_VOLUME" >/dev/null 2>&1
```

If one of the last three checks fails, stop and inspect that existing resource.
Do not remove an unknown volume.

## 2. Create the restore volumes

```sh
docker volume create "$PITR_DATA_VOLUME"
docker volume create "$PITR_CONFIG_VOLUME"

docker run --rm \
  --volume supabase_db-config:/source:ro \
  --volume "$PITR_CONFIG_VOLUME:/target" \
  --entrypoint sh \
  "$PITR_IMAGE" \
  -ec 'cp -a /source/. /target/ && chown -R postgres:postgres /target'
```

The source configuration volume is mounted read-only. The restored database
receives a separate writable copy.

## 3. Download and prepare the latest backup

```sh
docker run --rm \
  --env-file .env.walg \
  --volume "$PITR_DATA_VOLUME:/restore" \
  --entrypoint sh \
  "$PITR_IMAGE" \
  -ec '
    test -z "$(find /restore -mindepth 1 -print -quit)"
    wal-g backup-fetch /restore LATEST
    touch /restore/recovery.signal
    {
      printf "%s\n" \
        "restore_command = '\''/usr/local/bin/wal-g wal-fetch %f %p'\''" \
        "recovery_target_timeline = '\''latest'\''" \
        "recovery_target_action = '\''promote'\''"
    } >> /restore/postgresql.auto.conf
    chown -R postgres:postgres /restore
  '
```

For a point-in-time drill, add a UTC `recovery_target_time` to
`postgresql.auto.conf` before starting the container. The target must be after
the selected base backup and within the continuous archived WAL sequence.

## 4. Start the isolated PostgreSQL container

No host port is published. The container can reach Object Storage to fetch WAL,
but no application service can accidentally connect to it through the normal
Supabase network.

```sh
docker run --detach \
  --name "$PITR_CONTAINER" \
  --restart no \
  --env-file .env \
  --env-file .env.walg \
  --volume "$PITR_DATA_VOLUME:/var/lib/postgresql/data" \
  --volume "$PITR_CONFIG_VOLUME:/etc/postgresql-custom" \
  "$PITR_IMAGE" \
  postgres \
  -c config_file=/etc/postgresql/postgresql.conf \
  -c archive_mode=off \
  -c listen_addresses=

docker logs --follow "$PITR_CONTAINER"
```

Stop following the logs after PostgreSQL reports that it is ready to accept
connections. Any fatal recovery, decryption, missing-WAL, or pgSodium error
makes the drill unsuccessful. `archive_mode=off` prevents the isolated test
cluster from writing new WAL files into the Production archive.

## 5. Verify the restored cluster

```sh
docker exec --user postgres --env PGUSER=supabase_admin \
  "$PITR_CONTAINER" \
  pg_isready --dbname postgres

docker exec --user postgres --env PGUSER=supabase_admin \
  "$PITR_CONTAINER" \
  psql --dbname postgres --no-psqlrc --set ON_ERROR_STOP=1 --command "
    select version();
    select pg_is_in_recovery();
    select count(*) as auth_user_count from auth.users;
    select count(*) as public_table_count
      from pg_catalog.pg_tables where schemaname = 'public';
    select extname, extversion from pg_extension order by extname;
  "
```

Compare `auth.users`, key application-table row counts, schema objects, and a
known pre-backup record with the values recorded from the source database. A
successful PostgreSQL start alone is not sufficient evidence of recovery.

## 6. Remove only the isolated resources

After recording the successful or failed result:

```sh
docker rm --force "$PITR_CONTAINER"
docker volume rm "$PITR_DATA_VOLUME" "$PITR_CONFIG_VOLUME"
unset PITR_IMAGE PITR_CONTAINER PITR_DATA_VOLUME PITR_CONFIG_VOLUME
```

These commands intentionally name only the resources created by this runbook.
Never use the live `supabase-db` container, `supabase_db-config` volume, or the
Production PGDATA path as a cleanup target.

## Real incident

For an actual recovery, first stop application writes and preserve the damaged
PGDATA directory for investigation. Restore into a new empty directory or
volume, verify it in isolation, then connect the Supabase services to the
verified database. The `.env` role passwords must match the restored cluster;
if credentials were rotated after the selected restore point, reapply the
current values before exposing the services.

Complete host-loss recovery additionally requires the pinned Compose files,
Caddy configuration, `.env` values, WAL-G encryption key, Object Storage read
credentials, and a protected copy of the `db-config`/pgSodium key. Keep these
outside the Hetzner server and outside Git.
