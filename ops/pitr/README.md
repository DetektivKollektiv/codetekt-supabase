# PostgreSQL PITR with WAL-G

This adds continuous PostgreSQL WAL archiving and daily full base backups to
the private Hetzner Object Storage bucket `codetekt-prod-pitr` in FSN1.

## Recovery objectives

- RPO: at most 5 minutes (`archive_timeout = 300`)
- RTO target: at most 2 hours; this is only proven after a restore drill
- retention target: 30 days
- scope: the complete PostgreSQL cluster, including `auth.users` after import

The initial rollout uses 7-day `GOVERNANCE` retention. Change to 30-day
`COMPLIANCE` only after a successful restore drill.

WAL-G does not back up the file-based Supabase Storage directory, Compose and
Caddy configuration, `.env` files, or the `db-config` volume that contains the
pgsodium key. Those assets need a separate encrypted off-host backup. Codetekt
currently has no Supabase Storage objects to migrate from the Cloud project.

## Secret material

Never commit or paste these values into chat:

- Hetzner S3 access key ID
- Hetzner S3 secret access key
- a separate random 32-byte WAL-G encryption key

Generate the encryption key with `openssl rand -base64 32` and store it in the
password manager before configuring the server. Losing it makes the backups
unrecoverable.

On the server, create the ignored `.env.walg` file through masked prompts:

```sh
cd /home/gorm/services/codetekt-supabase
sh ops/pitr/configure-walg-env.sh
```

## Safe rollout

Build and validate WAL-G without changing the running database:

```sh
cd /home/gorm/services/codetekt-supabase
docker build \
  --tag codetekt/supabase-postgres-walg:17.6.1.136-v3.0.9 \
  ops/pitr
docker run --rm --entrypoint /usr/local/bin/wal-g \
  codetekt/supabase-postgres-walg:17.6.1.136-v3.0.9 --version
sh ops/pitr/test-object-storage.sh
```

Only after both checks succeed, enable the override and recreate the database
container. This causes a short database interruption but preserves PGDATA:

```sh
cp ops/pitr/docker-compose.walg.yml docker-compose.walg.yml
sh run.sh config add walg
docker compose config --quiet
docker compose up -d --wait --no-deps db
```

Verify continuous archiving, force one WAL switch, and create the first full
backup:

```sh
docker compose exec -T db psql -U supabase_admin -d postgres \
  -v ON_ERROR_STOP=1 -c "select pg_switch_wal();"
sleep 10
sh ops/pitr/verify-pitr.sh
sh ops/pitr/backup-full.sh
sh ops/pitr/verify-pitr.sh
```

The full-backup process runs as the container's `postgres` operating-system
user but connects to PostgreSQL as the existing `supabase_admin` database role.
That role is required for PostgreSQL's physical backup start/stop functions;
the less-privileged `postgres` database role cannot call them in this stack.

Install the daily full-backup timer only after the first backup succeeds:

```sh
sh ops/pitr/install-systemd-timer.sh
```

The timer runs daily at 02:15 UTC with a random delay of at most 15 minutes and
uses `Persistent=true` to catch up a missed run. The service runs the health
check after every successful backup. Trigger and inspect the first timer-backed
run explicitly:

```sh
sudo systemctl start codetekt-postgres-backup.service
sudo systemctl status codetekt-postgres-backup.service --no-pager
sudo systemctl list-timers codetekt-postgres-backup.timer --no-pager
sudo journalctl -u codetekt-postgres-backup.service -n 100 --no-pager
```

The standalone check fails unless the newest archived WAL is at most 15 minutes
old and the newest full backup is at most 36 hours old:

```sh
sh ops/pitr/verify-pitr.sh
```

On a quiet pre-production database, force a WAL switch before the check and
allow the archive command a few seconds to upload the completed segment.

## Retention promotion

After a separate restore drill has succeeded, change these two lines in the
server-only `.env.walg`:

```dotenv
S3_RETENTION_PERIOD=2592000
S3_RETENTION_MODE=COMPLIANCE
```

Then recreate only `db` so the postmaster and archive commands receive the new
environment. Do not enable automatic WAL-G deletion until the 30-day restore
window and locked-object behavior have been verified.

Retention starts when each object is uploaded; it is not activated after the
retention period has passed. Hetzner does not allow `COMPLIANCE` retention to be
shortened or removed before its deadline.

## Restore

A physical PITR restore replaces the complete PostgreSQL data directory,
including cluster roles and password hashes. A restore test must use isolated
volumes and a separate container and must never mount or replace the live
Production PGDATA directory. Follow [RESTORE.md](./RESTORE.md).

The first drill can run on the existing Hetzner server. It proves that WAL-G can
download, decrypt, replay, and start the database backup. It does not prove
recovery from complete loss of the Hetzner host, so the server configuration,
secrets, WAL-G encryption key, and pgSodium key must remain recoverable from an
independent location.

## Supabase Cloud cutover

Moving the current Supabase Cloud project to Hetzner is separate from PITR.
Follow Supabase's self-hosting migration process and export roles, schema, and
data separately. The data export includes `auth.users`. After the final import,
verify the schema and row counts, baseline the exact reviewed migration set,
and create another full WAL-G backup before enabling automatic deployments.

## References

- [PostgreSQL 17: Continuous archiving and PITR](https://www.postgresql.org/docs/17/continuous-archiving.html)
- [WAL-G 3.0.9 PostgreSQL commands](https://github.com/wal-g/wal-g/blob/v3.0.9/docs/PostgreSQL.md)
- [Supabase: Restore a Platform project to Self-Hosted](https://supabase.com/docs/guides/self-hosting/restore-from-platform)
- [Hetzner Object Storage retention](https://docs.hetzner.com/storage/object-storage/howto-protect-objects/protect-object-lock-retention/)
