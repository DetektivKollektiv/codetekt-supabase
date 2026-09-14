# Hetzner production

## Location and access

| Item | Current value |
| --- | --- |
| Cloud project | `Codetekt` |
| Server | `codetekt-supabase-prod-01` |
| Public applications | `https://production.codetekt.org`, `https://api.codetekt.org` |
| Backup project | `Codetekt Backups` |

1. In Hetzner Cloud Console, select **Codetekt** to inspect the server, firewall, IPs, activity, and server backups.
2. Connect with a personal SSH key and personal server account. Request access from Gorm or Christoph; do not reuse another person's key.
3. The separate **Codetekt Backups** project contains the Object Storage used for PostgreSQL recovery archives.

## Runtime

- Caddy is the public reverse-proxy boundary. Keep database, pooler, Studio, and internal service ports off the public network.
- The host runs the self-hosted Supabase stack and the Codetekt frontend as containers. The backend service inventory is in [Supabase backend](../supabase-backend/README.md).
- A Hetzner Cloud Firewall is attached to the server. Review firewall changes with the application owner before opening a port.
- Server-disk backups are enabled. Their recovery scope and limits are documented in [Backups and recovery](../backups-recovery/README.md).

## Change boundary

- Application code, database migrations, and Edge Functions change through the repository release process.
- Host configuration, Caddy configuration, container secrets, and persistent volumes are production operations. Back them up independently before changing them.
- After a release, verify the relevant public endpoint, container health, and logs; a successful build alone is not deployment evidence.

## References

- [Hetzner Cloud documentation](https://docs.hetzner.com/cloud/)
- [Hetzner Cloud server backups](https://docs.hetzner.com/cloud/servers/backups-snapshots/overview/)
- [Hetzner Cloud firewalls](https://docs.hetzner.com/cloud/firewalls/overview/)
