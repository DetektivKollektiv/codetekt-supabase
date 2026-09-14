# Scaleway mail

## Location

| Item | Current value |
| --- | --- |
| Organisation | `Codetekt` |
| Project | `Mail` |
| Product | Scaleway Transactional Email |
| Sending domain | `notify.codetekt.org` |
| SMTP endpoint | `smtp.tem.scaleway.com:587` with STARTTLS |

In Scaleway Console, select **Codetekt** then **Mail**. Open **Transactional Email** to inspect the sending domain, DNS-verification state, delivery activity, and application credentials.

## Two separate delivery credentials

| Delivery path | Permission and use | Production configuration |
| --- | --- | --- |
| Auth email | SMTP send permission for confirmations, password recovery, and other GoTrue messages | Private `GOTRUE_SMTP_*` settings on the Supabase Auth service |
| Application email | Transactional Email API send permission for the application notification function | Private function environment configuration for `send-email` |

- Create distinct Scaleway IAM applications/keys for the two paths. Grant only the Transactional Email sending scope required by that path.
- SMTP uses the Mail project identifier as username and the application secret as password. The API delivery path uses its own application key; do not interchange credentials.
- Store values only in the private production configuration. A credential name may appear in configuration documentation; its value must not.

## Domain, rotation, and verification

1. In **Transactional Email → Domains**, keep the domain verified. Publish the provider's current SPF, DKIM, and DMARC records in DNS; do not guess or hand-copy an old record.
2. When rotating a credential, create the replacement, update only its target service, restart/redeploy that service, and send a real test message.
3. Verify delivery, sender domain, TLS/SMTP or API authentication, and links in the received message before disabling the prior key.
4. Record the key owner, purpose, creation date, and rotation result in the private operations record, not in Git.

Request an additional provider membership or application credential from Gorm or Christoph.

## References

- [Scaleway Transactional Email documentation](https://www.scaleway.com/en/docs/transactional-email/)
- [Scaleway IAM documentation](https://www.scaleway.com/en/docs/iam/)
