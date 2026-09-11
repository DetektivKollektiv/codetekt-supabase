# Codetekt Supabase

Backend for Codetekt, review system for cases, drafts, published reviews, aggregations, disputes, comments, and notification emails.

The separate Wedium Community Checks contract is documented in [WEDIUM_API.md](./WEDIUM_API.md) and [WEDIUM_OPENAPI.json](./WEDIUM_OPENAPI.json).
Production CI/CD, migration safety and the one-time server setup are documented in [docs/production-cicd.md](./docs/production-cicd.md).

## Local setup

1. Install the Supabase CLI, Docker, and Deno 2.
2. Start the local stack with `supabase start`.
3. Use the local publishable and secret credentials from the CLI output. The edge runtime injects its keys automatically; standalone E2E tests expect `SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY`.
4. If you run the webhook, email, or Wedium functions locally, also set `DB_WEBHOOK_SECRET`, `WEDIUM_API_KEY`, and the Scaleway TEM and notification email variables listed below.
5. Stop the stack with `supabase stop`.

## Environment variables

- `SUPABASE_URL`: Local or remote Supabase API URL used by the edge functions.
- `SUPABASE_PUBLISHABLE_KEYS`: Named publishable-key map injected into hosted and local edge functions; the functions use its `default` entry for user-authenticated requests.
- `SUPABASE_SECRET_KEYS`: Named secret-key map injected into hosted and local edge functions; the functions use its `default` entry for privileged requests that bypass RLS.
- `SUPABASE_PUBLISHABLE_KEY`: Single publishable key used by the standalone E2E test.
- `SUPABASE_SECRET_KEY`: Single secret key used by the standalone E2E test.
- `DB_WEBHOOK_SECRET`: Shared secret that database triggers send to webhook-backed edge functions.
- `WEDIUM_API_KEY`: Server-to-server key required in the Wedium API's `X-API-Key` header.
- `SCALEWAY_TEM_PROJECT_ID`: Scaleway Project ID used by `send-email`.
- `SCALEWAY_TEM_SECRET_KEY`: Secret key with permission to send email through the Scaleway TEM API.
- `SCALEWAY_TEM_FROM_EMAIL`: Verified sender address used by `send-email`.
- `SITE_URL`: Public site URL used in email links.
- `NEW_CASE_NOTIFICATION_EMAIL`: Recipient for new case notifications.
- `DISPUTE_NOTIFICATION_EMAIL`: Recipient for dispute notifications.
- `COMMENT_REPORT_NOTIFICATION_EMAIL`: Recipient for comment report notifications.

## Daily workflow

- Generate fresh TypeScript database types after schema changes with `supabase gen types typescript --local > supabase/functions/_shared/types/database.types.ts`.
- Reset the local database and seed data with `supabase db reset` when you need a clean state.
- Edge functions hot-reload when you change files under `supabase/functions/*`.

## Data model

### Core tables

- `profiles`: User accounts, usernames, admin flags, notification preferences, and account state.
- `review_templates`: Versioned review questionnaires stored as JSON.
- `cases`: Submitted items to review, linked to the latest template version.
- `review_answers_in_progress`: Private draft review answers for a single user and case.
- `review_answers_submitted`: Final published review answers visible to authenticated users.
- `review_aggregations`: Calculated consensus results for cases with enough submitted reviews.
- `cases_metadata_disputes`: Admin-managed disputes about case metadata fields.
- `case_comments`: User comments attached to cases.
- `case_comment_moderations`: Admin moderation records that hide comments.
- `case_comment_likes`: User votes on comments, now stored as up/down votes.
- `case_comment_reports`: User reports for problematic comments.
- `case_titles`: One title row per case.
- `case_categories`: One category row per case.
- `case_keywords`: One keyword-set row per user per case.
- `case_factchecks`: One fact-check row per case.
- `open_graph_data`: Fetched Open Graph metadata for URL cases.
- `tutorial_content`: JSON tutorial content shown to users.
- `wedium_users`, `wedium_posts`, `wedium_reviews`: Separate pseudonymized Wedium identities and current reviews.
- `wedium_review_aggregations`: Revision-protected Wedium community results.

### Views

- `cases_without_open_disputes`: Cases filtered to exclude any case with an open metadata dispute.
- `review_answers_in_progress_without_open_disputes`: Draft reviews filtered to exclude cases with open metadata disputes.
- `review_aggregations_without_open_disputes`: Aggregations filtered to exclude cases with open metadata disputes.

## Edge functions

- `sign-up`: Creates a new user account, profile, and session.
- `get-review-template`: Returns the review template for a case with dispute and draft state applied.
- `set-review-answers-in-progress`: Saves draft review answers for the current user.
- `set-review-answers-submitted`: Publishes a draft review and updates its tracking state.
- `set-review-aggregation`: Recomputes and stores the aggregated result for a case.
- `set-open-graph-data`: Fetches and stores Open Graph metadata for a case URL.
- `send-email`: Sends transactional emails for database-triggered events.
- `deactivate-account`: Soft-deactivates the current user account.
- `wedium`: Routes the separate Wedium Community Checks API.
- `set-wedium-review-aggregation`: Recomputes Wedium aggregates after review changes.
