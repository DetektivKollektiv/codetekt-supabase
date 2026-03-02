# Calling an Edge Function Securely from SQL

Pattern for triggering a Supabase Edge Function from a SQL function or database trigger, authenticated via a shared secret stored in Supabase Vault.

---

## Overview

```
SQL function / DB trigger
  → net.http_post(url, headers: { X-Db-Secret: <from vault> })
    → Edge Function
      → timingSafeEqual(env secret, incoming header)
        → 200 OK  or  401 Unauthorized
```

The secret lives in two places that must stay in sync:
- **Supabase Vault** — read by the SQL side at call time
- **Edge function `.env`** — loaded into `Deno.env` at runtime

---

## Step 1 — Create the Edge Function

Use the CLI to scaffold the function:

```bash
supabase functions new my-function
```

Edit `supabase/functions/my-function/index.ts`:

```typescript
import "@supabase/functions-js/edge-runtime.d.ts"
import { timingSafeEqual } from "jsr:@std/crypto/timing-safe-equal"

const enc = new TextEncoder()

Deno.serve(async (req) => {
  // --- Auth check ---
  const expected = Deno.env.get("DB_WEBHOOK_SECRET") ?? ""
  const incoming = req.headers.get("x-db-secret") ?? ""

  const expectedBytes = enc.encode(expected)
  const incomingBytes = enc.encode(incoming)

  // timingSafeEqual throws if lengths differ, so pre-check first.
  // This also prevents length-based timing leaks.
  const match =
    expectedBytes.length === incomingBytes.length &&
    timingSafeEqual(expectedBytes, incomingBytes)

  if (!match) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    )
  }
  // --- Your logic here ---

  return new Response(
    JSON.stringify({ message: "hello world" }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  )
})
```

Why `timingSafeEqual`?  
A regular `===` string comparison short-circuits on the first mismatched character, leaking information about how much of the secret an attacker guessed correctly. `timingSafeEqual` always takes the same amount of time regardless of where the mismatch is.

---

## Step 2 — Disable JWT verification in config.toml

The function is called by the database, not by a user with a JWT. Add a block to `supabase/config.toml`:

```toml
[functions.my-function]
enabled = true
verify_jwt = false          # DB calls have no JWT — we use X-Db-Secret instead
entrypoint = "./functions/my-function/index.ts"
```

---

## Step 3 — Store the secret

### 3a. Edge runtime (.env)

Add to `supabase/functions/.env` (this file is loaded automatically by `supabase start`):

```
DB_WEBHOOK_SECRET=your-strong-random-secret-here
```

> Generate a good secret: `openssl rand -hex 32`

### 3b. Supabase Vault (SQL side)

Run once — either in a seed file or directly:

```sql
SELECT vault.create_secret('your-strong-random-secret-here', 'db_webhook_secret');
```

To update an existing secret:

```sql
UPDATE vault.secrets
SET secret = 'new-secret-value'
WHERE name = 'db_webhook_secret';
```

> The two values (`.env` and vault) **must be identical**. If they drift, all calls will return 401.

---

## Step 4 — Create the SQL function

```sql
CREATE OR REPLACE FUNCTION public.call_my_function()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  request_id    bigint;
  webhook_secret text;
BEGIN
  -- Read secret from vault at call time (never hard-coded in SQL)
  SELECT decrypted_secret
  INTO   webhook_secret
  FROM   vault.decrypted_secrets
  WHERE  name = 'db_webhook_secret';

  -- Fire async HTTP POST via pg_net
  SELECT net.http_post(
    url     := get_project_url() || '/functions/v1/my-function',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Db-Secret',  webhook_secret
    ),
    body    := '{}'::jsonb          -- pass a payload here if needed
  ) INTO request_id;

  RAISE LOG 'my-function called, request_id: %', request_id;

  RETURN request_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.call_my_function() TO authenticated;
```

`net.http_post` is **fire-and-forget** (async). The function returns immediately with a `request_id` — it does not wait for the HTTP response.

---

## Step 5 — Check the response

pg_net stores responses asynchronously in `net._http_response`. Poll it after a moment:

```sql
-- Call the function
SELECT public.call_my_function();  -- returns e.g. 42

-- Read the response (after a second or two)
SELECT id, status_code, content, error_msg
FROM   net._http_response
WHERE  id = 42;
```

Expected result when everything works:

| id | status_code | content | error_msg |
|----|-------------|---------|-----------|
| 42 | 200 | `{"message":"hello world"}` | null |

---

## Step 6 — Use in a trigger (optional)

Same pattern, fire-and-forget inside an `AFTER INSERT` trigger:

```sql
CREATE OR REPLACE FUNCTION public.trigger_my_function()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  request_id    bigint;
  webhook_secret text;
BEGIN
  SELECT decrypted_secret INTO webhook_secret
  FROM vault.decrypted_secrets WHERE name = 'db_webhook_secret';

  BEGIN
    SELECT net.http_post(
      url     := get_project_url() || '/functions/v1/my-function',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'X-Db-Secret',  webhook_secret
      ),
      body    := jsonb_build_object('id', NEW.id)
    ) INTO request_id;

    RAISE LOG 'my-function triggered for id: %, request_id: %', NEW.id, request_id;
  EXCEPTION
    WHEN OTHERS THEN
      -- Never fail the original transaction due to a webhook error
      RAISE LOG 'my-function trigger failed for id: %. Error: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_my_function_on_insert
  AFTER INSERT ON public.my_table
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_my_function();
```

The `EXCEPTION` block is important: a failed HTTP call must never roll back the database transaction that triggered it.

---

## Security properties

| Property | How it's achieved |
|---|---|
| Secret never in migration files | Read from `vault.decrypted_secrets` at call time |
| Secret never in edge function code | Loaded from `Deno.env` at runtime |
| Timing-attack resistant comparison | `timingSafeEqual` from `@std/crypto` |
| Length leak prevented | Pre-check `length === length` before calling `timingSafeEqual` |
| Trigger errors don't corrupt data | `EXCEPTION` block swallows HTTP errors |

---

## Production checklist

- [ ] Generate secret with `openssl rand -hex 32`
- [ ] Store in Vault via Supabase Dashboard or migration seed
- [ ] Set `DB_WEBHOOK_SECRET` as a Supabase secret: `supabase secrets set DB_WEBHOOK_SECRET=...`
- [ ] Deploy function: `supabase functions deploy my-function`
- [ ] Run `supabase db push` for any new migrations
- [ ] Test with `curl` (wrong secret → 401, correct secret → 200)
- [ ] Verify from SQL via `net._http_response`
