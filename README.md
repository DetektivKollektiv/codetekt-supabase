# Codetekt Supabase

Backend for Codetekt, review system for cases, drafts, published reviews, aggregations, disputes, comments, and notification emails.

## Local setup

1. Install the Supabase CLI, Docker, and Deno 2.
2. Start the local stack with `supabase start`.
3. Use the local API credentials from the CLI output for `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
4. If you run the webhook or email functions locally, also set `DB_WEBHOOK_SECRET` plus the Mailgun and notification email variables listed below.
5. Stop the stack with `supabase stop`.

## Environment variables

- `SUPABASE_URL`: Local or remote Supabase API URL used by the edge functions.
- `SUPABASE_ANON_KEY`: Public client key used for authenticated requests.
- `SUPABASE_SERVICE_ROLE_KEY`: Admin key used by edge functions that must bypass RLS.
- `DB_WEBHOOK_SECRET`: Shared secret that database triggers send to webhook-backed edge functions.
- `MAILGUN_API_KEY`: Mailgun API key used by `send-email`.
- `MAILGUN_DOMAIN`: Mailgun domain used by `send-email`.
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
