# Supabase backend

## Runtime and delivery

| Item | Current production setup |
| --- | --- |
| API | `https://api.codetekt.org` |
| Host | [Hetzner production](../hetzner-production/README.md) |
| Stack | Caddy, API gateway, PostgreSQL, Auth, REST, Realtime, Storage, Imgproxy, Meta, Studio, Supavisor, Edge Functions, templates server |
| Configuration | Compose configuration and private environment files on the production host |
| Delivery | Reviewed repository change, release workflow, then production health and endpoint verification |

- Caddy exposes the public routes; internal containers communicate on the Compose network.
- Auth owns identities in `auth.users`; application access is governed by RLS on all public tables.
- Configuration values and function secrets live only in the production secret configuration. Never copy their values into a migration, function source, or documentation.

## CI/CD and local verification

- Pull requests to `main` run migration-history checks, unit tests, a disposable local Supabase stack, pgTAP when present, and Edge Function E2E tests. They receive no Production secrets.
- A successful push to `main` is the only production-backend deployment path. It transfers a secret-free, SHA-256-checked bundle of migrations and Edge Functions through a restricted deployment account.
- Before deployment, the server checks WAL archive health, a recent full backup, and the baselined migration history. It then applies only pending migrations, refreshes functions, and checks Auth plus an expected unauthorised function response.
- Applied database migrations are corrected with a new migration, never an automatic rollback. A failed function refresh restores its prior function directory.
- For local work, use the Supabase CLI, Docker, and Deno. Start an isolated stack with `supabase start`; use only local test credentials and stop it with `supabase stop`.

## Database

All tables below are in `public` and have RLS enabled.

| Domain | Tables |
| --- | --- |
| Accounts and configuration | `profiles`, `review_templates`, `tutorial_content`, `challenge_configs`, `case_categories` |
| Cases and metadata | `cases`, `case_titles`, `case_keywords`, `case_factchecks`, `open_graph_data`, `cases_metadata_disputes` |
| Reviews | `review_answers_in_progress`, `review_answers_submitted`, `review_aggregations` |
| Comments and moderation | `case_comments`, `case_comment_likes`, `case_comment_reports`, `case_comment_moderations` |
| Wedium | `wedium_users`, `wedium_posts`, `wedium_reviews`, `wedium_review_aggregations` |

Views:

- `cases_without_open_disputes`
- `review_aggregations_without_open_disputes`
- `review_answers_in_progress_without_open_disputes`

The three views filter entities with unresolved metadata disputes; use their base tables only when that distinction is intentional.

## Edge Functions

| Function | Purpose | Caller / authorization |
| --- | --- | --- |
| `sign-up` | Validates registration input, creates the account and profile flow | Public registration endpoint; input validation is mandatory |
| `deactivate-account` | Deactivates the requesting account | User Bearer JWT, verified in the function |
| `get-review-template` | Returns the authorized review template, draft, and context | User Bearer JWT, verified in the function |
| `set-review-answers-in-progress` | Saves a private review draft | User Bearer JWT, verified in the function |
| `set-review-answers-submitted` | Publishes submitted review data and clears the draft | User Bearer JWT, verified in the function |
| `set-review-aggregation` | Recalculates case review aggregates | Database webhook with private `x-db-secret` |
| `set-open-graph-data` | Fetches and stores Open Graph metadata | Database webhook with private `x-db-secret` |
| `send-email` | Delivers application-triggered transactional notifications | Database webhook with private `x-db-secret` |
| `wedium` | Serves the separate Wedium Community Checks API | Server-to-server `X-API-Key`; see [Wedium](../wedium/README.md) |
| `set-wedium-review-aggregation` | Recalculates Wedium aggregates asynchronously | Database webhook with private `x-db-secret` |

`verify_jwt = false` on selected functions delegates verification to the function code or to the private webhook secret; it does not make the protected business action public.

## Schema and function changes

1. Add an ordered migration under `supabase/migrations/`; do not modify an applied migration.
2. Review SQL, RLS policies, generated types, affected Edge Functions, and tests together.
3. Validate locally and in the intended non-production environment before release.
4. Release through the approved path and independently verify the production schema/function and public behavior.

## References

- [Supabase self-hosting](https://supabase.com/docs/guides/self-hosting)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase database migrations](https://supabase.com/docs/guides/deployment/database-migrations)
