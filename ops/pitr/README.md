# PostgreSQL PITR with WAL-G

This adds continuous PostgreSQL WAL archiving and daily full base backups to
the private Hetzner Object Storage bucket `codetekt-prod-pitr` in FSN1.

## Recovery objectives

- RPO: at most 5 minutes (`archive_timeout = 300`)
- RTO: at most 2 hours
- retention target: 30 days
- scope: PostgreSQL database only

The initial rollout uses 7-day `GOVERNANCE` retention. Change to 30-day
`COMPLIANCE` only after a successful restore drill.

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

## Restore warning

A physical PITR restore replaces the complete PostgreSQL data directory,
including cluster roles and password hashes. The restore runbook therefore has
to preserve and reapply the current self-hosted Supabase role credentials after
recovery. Restore tests must run on an isolated temporary server, never against
the production PGDATA directory.
