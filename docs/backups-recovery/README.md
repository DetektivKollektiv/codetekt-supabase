# Backups and recovery

Two independent recovery layers protect different failures. Neither replaces the other.

| Layer | What it protects | Current operation | Important limit |
| --- | --- | --- | --- |
| WAL-G PostgreSQL archive | Database point-in-time recovery | WAL archive every 5 minutes; daily full backup around 02:15 UTC with up to 15 minutes of jitter | Database contents only |
| Hetzner Cloud Backups | Server disk recovery | Enabled; seven rolling disk-image slots | Not database-consistent while the server is writing |

## WAL-G PostgreSQL recovery

- Archives are stored in the `codetekt-prod-pitr` Object Storage bucket in the Hetzner **Codetekt Backups** project (FSN1).
- Archives are encrypted before upload with the WAL-G encryption key. The key and recovery credentials are private operational material and must be recoverable outside this repository.
- Current object-retention configuration: seven days in `GOVERNANCE` mode. Confirm retention and access before changing a recovery plan.
- Health monitoring checks the WAL archive freshness and the age of the latest full backup.

### Proven scope

An isolated restore on the Production host has validated backup decryption, WAL replay, PostgreSQL startup, schema restoration, `auth.users`, and public-table data. The test used a separate container and volumes; it did not alter the live database.

### Not proven by that test

It is not a complete host-loss recovery. The following must remain independently recoverable:

- Compose and Caddy configuration
- private environment files and all recovery credentials
- Storage objects and other persistent files
- pgSodium key material and database configuration outside restored PostgreSQL data
- a clean server, network, DNS, and application reconstruction

## Hetzner Cloud Backups

- Hetzner automatically creates rolling server-disk images; the Console retains seven backup slots.
- Use this layer for host/disk failure or accidental host-level loss.
- For a database-consistent disk image, stop or quiesce writes before creating/restoring an image. Otherwise restore the host first and recover PostgreSQL with WAL-G as required.

## Recovery runbook

1. Declare the incident, stop application writes, and preserve the failed host for evidence where possible.
2. Select the recovery layer: WAL-G for database time recovery; Cloud Backup for host disk recovery; both for a host-loss incident.
3. Restore PostgreSQL into an isolated container first. Validate startup, target timestamp, schema, `auth.users`, and representative public-table data before any cutover.
4. Restore host configuration, Storage files, pgSodium material, and secrets from their independent protected locations.
5. Rebuild/recover the production stack, verify health and application flows, then carefully restore traffic and document the recovery point.

## References

- [PostgreSQL continuous archiving and PITR](https://www.postgresql.org/docs/current/continuous-archiving.html)
- [WAL-G PostgreSQL documentation](https://github.com/wal-g/wal-g/blob/master/docs/PostgreSQL.md)
- [Hetzner Cloud Backups](https://docs.hetzner.com/cloud/servers/backups-snapshots/overview/)
- [Hetzner Object Lock retention](https://docs.hetzner.com/storage/object-storage/howto-protect-objects/protect-object-lock-retention/)
