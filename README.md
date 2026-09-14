# Codetekt backend operations

Compact operating documentation for the self-hosted Codetekt backend. It reflects the production setup verified on 2026-09-14.

| Area | Provider / project | Entry point | Details |
| --- | --- | --- | --- |
| Production host | Hetzner Cloud / `Codetekt` | Personal SSH access | [Host and runtime](docs/hetzner-production/README.md) |
| Supabase backend | Production host | `https://api.codetekt.org` | [Services, data, functions](docs/supabase-backend/README.md) |
| Recovery | Hetzner Cloud + Object Storage / `Codetekt Backups` | Operations only | [Backups and recovery](docs/backups-recovery/README.md) |
| Public status | Scaleway / `Codetekt` / `Status` | Personal SSH access | [Uptime Kuma and checks](docs/scaleway-status/README.md) |
| Transactional email | Scaleway / `Codetekt` / `Mail` | Scaleway console | [Delivery and credentials](docs/scaleway-mail/README.md) |
| Wedium API | Supabase function runtime | API-key protected | [Guide and OpenAPI](docs/wedium/README.md) |

## Access rule

- Use individual provider accounts and individual SSH keys. Do not share accounts or private keys.
- Request an additional provider membership, server account, SSH key, or application credential from Gorm or Christoph.
- Keep secrets, passwords, private keys, SMTP/API credentials, database connection strings, and monitoring Push URLs out of Git, issues, and screenshots.
- Make application changes through the reviewed release path. Treat direct production changes as operations work and record the reason and outcome.

## Scope

- This repository contains backend configuration, migrations, and Edge Functions.
- The frontend is hosted on the Hetzner production host but is maintained in its own repository.
- This documentation describes operations; it does not authorize deployments, credential creation, provider changes, or database migrations.
