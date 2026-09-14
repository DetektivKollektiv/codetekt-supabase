# Wedium Community Checks API

The human guide and the machine-readable contract live together here:

- [OpenAPI 3.1 contract](WEDIUM_OPENAPI.json)
- Function: `wedium`; asynchronous worker: `set-wedium-review-aggregation`

## Boundary and deployment

- This is a separate server-to-server API, protected by `X-API-Key`. It is not a browser-facing Supabase session API.
- The function and its aggregation worker are present in the self-hosted production function runtime. Configure each consumer with its intended environment URL; never put the API key in a client or repository.
- The OpenAPI server template retains the hosted Supabase URL shape for contract tooling. Production routing is operated with the self-hosted backend; use the current environment base URL in client configuration.

## Contract summary

| Operation | Route | Result |
| --- | --- | --- |
| Read aggregates | `POST /review-aggregations` | Existing aggregates and `missing_post_hashes`; 1–100 posts |
| Create/replace review | `PUT /users/{user_hash}/reviews/{post_hash}` | One complete current review per user/post |
| Read/delete review | `GET` / `DELETE` same route | Current review or idempotent deletion |
| Read/delete user | `GET` / `DELETE /users/{user_hash}` | Pseudonymous user metadata or user plus reviews deletion |

- `user_hash` and `post_hash` are lowercase 64-character hashes.
- A review contains all 15 questions, each scored from `0` to `3`.
- The data model is `wedium_users` → `wedium_reviews` ← `wedium_posts`; published results are in `wedium_review_aggregations`.
- Every review mutation queues recalculation. An aggregate is publishable from two reviews onwards and is therefore intentionally asynchronous.
- The contract defines the status and validation behavior. Check it before changing a consumer, API implementation, question catalogue, or aggregation logic.

## Change boundary

1. Change API source, tests, guide, and OpenAPI contract together.
2. Keep the key server-side and rotate it as an application credential when access changes; request an additional key from Gorm or Christoph.
3. Validate a full request/response flow in the target environment before releasing a consumer.
