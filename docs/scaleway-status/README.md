# Scaleway status

## Location and access

| Item | Current value |
| --- | --- |
| Organisation | `Codetekt` |
| Project | `Status` |
| Public dashboard | `https://status.codetekt.org` |
| Services | Caddy and Uptime Kuma |

1. In Scaleway Console, open **Codetekt** and select the **Status** project to manage the instance, security group, flexible IP, volume, and SSH keys.
2. Add a personal public SSH key through the project access path. Ask Gorm or Christoph for server access; do not share keys or the dashboard account.
3. Connect with the personal server account granted to you. Use the protected Uptime Kuma dashboard for monitor administration; its login is separate from SSH access.

## Monitoring model

- Production sends 16 outbound Push checks to Uptime Kuma: 13 container checks, plus backup, WAL archive, and disk checks.
- Container checks run every minute. WAL and disk checks run every five minutes; backup freshness runs every 15 minutes.
- Caddy terminates public HTTPS and proxies the dashboard to Uptime Kuma, which is otherwise bound locally.
- Push URLs/tokens are private runtime configuration. They are never placed in Git or documentation.

## Blind spot and response

- The Status host independently receives Production's outbound checks, so it can report a Production outage.
- If the Status host, its network route, or Uptime Kuma itself fails, it cannot alert about its own failure. Treat an unavailable `status.codetekt.org` as an incident and inspect the Status host directly.
- Before changing checks, record the monitor purpose and verify a successful Push after deployment. Do not delete a monitor until its replacement has reported.

## References

- [Scaleway Instances documentation](https://www.scaleway.com/en/docs/instances/)
- [Uptime Kuma documentation](https://github.com/louislam/uptime-kuma/wiki)
