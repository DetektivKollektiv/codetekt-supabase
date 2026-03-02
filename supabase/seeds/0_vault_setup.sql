-- Seed file: Setup Supabase Vault secrets for local development
--
-- This file runs first (0_ prefix) to ensure vault secrets are available
-- before other seeds that might need them.

-- Store project URL for local development
-- For production, use: SELECT vault.create_secret('https://your-project-ref.supabase.co', 'project_url');
SELECT vault.create_secret('http://api.supabase.internal:8000', 'project_url');

-- Shared secret used to authenticate DB → Edge Function calls (pg_net → send-email)
-- For production, generate with: openssl rand -hex 32
-- Then: supabase secrets set DB_WEBHOOK_SECRET=<value>
-- And update this vault entry to the same value.
SELECT vault.create_secret('super-secret-db-webhook-key-123', 'db_webhook_secret');
