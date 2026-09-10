# Host monitoring

Read-only checks on `codetekt-prod` send independent HTTPS heartbeats to Uptime
Kuma at `status.codetekt.org`. Existing HTTP monitors are configured separately.
SMTP is not configured yet; monitor state is visible in the protected dashboard.

| Check | Schedule | Kuma push deadline | Failure condition |
| --- | --- | --- | --- |
| containers | 60 seconds | 180 seconds | Missing/stopped container or health other than healthy |
| wal | 5 minutes | 10 minutes | Disabled archiving, archive timeout outside 1–300 seconds, no archived WAL, unresolved failure, or ready WAL older than 15 minutes |
| disk | 5 minutes | 10 minutes | Storage or inode utilization at least 85% on root, Docker root or container bind/volume filesystems |
| backup | 15 minutes | 30 minutes | Inactive backup timer, failed last service run, unavailable backup catalog, or latest completed full backup older than 36 hours |

An idle database without pending WAL does not fail solely because its last
archive timestamp is old. Archive status is read from PostgreSQL; the check does
not force WAL switches or prove remote WAL contents/restorability. Regular
isolated restore tests remain necessary. The backup service itself is unchanged.
Container health has the limits of its existing healthcheck; it does not prove
application workflows, Storage transfers or Realtime message delivery.

## Installation

Requires Python 3 standard library, Docker CLI access for `gorm`, GNU df and
systemd. The expected container inventory is in `monitor.py`. No inbound ports,
database roles, public endpoints or additional packages are required.

Create one Push monitor per key, with the deadline above and zero retries:
`backup`, `wal`, `disk`, and each container name in `CONTAINERS`.
Store the corresponding URLs in a private JSON object, without query parameters:

```json
{
  "backup": "https://status.codetekt.org/api/push/REPLACE_WITH_MONITOR_TOKEN"
}
```

The example is abbreviated: installation requires all 16 distinct entries.
Keep this file outside the repository with mode 0600. Push URLs are credentials.
Do not log, commit or publish them. They grant the ability to set monitor status.

```sh
sudo sh ops/monitoring/install.sh /private/path/monitoring.json
```

The installer writes root-owned code to `/opt/codetekt-monitoring`, installs
`/etc/codetekt-monitoring.json` readable only by `gorm` and root, validates the
units, enables four timers and immediately runs each check. systemd prevents
overlapping runs of the same service. Checks and outbound requests have timeouts.
Each failure is sent as DOWN; if a script or network connection fails entirely,
Kuma detects the missing heartbeat. Failed checks also exit nonzero for systemd.

## Verification and maintenance

```sh
python3 -m unittest discover -s ops/monitoring -p 'test_*.py'
python3 ops/monitoring/monitor.py wal --check-only
systemctl list-timers 'codetekt-monitoring-*'
journalctl -u 'codetekt-monitoring@*' --since today
```

Use a separate temporary Push monitor to verify DOWN, recovery and missed
heartbeats without stopping production containers. End-to-end email delivery
must be tested after SMTP is configured. Check the first scheduled backup cycle
after installation; a manual successful push does not verify scheduling.

When adding/removing containers, update both the inventory and private URL map.
To stop monitoring without changing application services:

```sh
sudo systemctl disable --now codetekt-monitoring-containers.timer codetekt-monitoring-wal.timer codetekt-monitoring-disk.timer codetekt-monitoring-backup.timer
```

Pause the associated monitors in Kuma during intentional monitoring maintenance.
Re-running the installer updates only this monitoring installation. It does not
modify the application, the existing backup timer or the Kuma server.
