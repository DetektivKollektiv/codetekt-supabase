-- Seed file: Setup Supabase Vault secrets for local development
--
-- This file runs first (0_ prefix) to ensure vault secrets are available
-- before other seeds that might need them.

-- Store project URL for local development
-- For production, use: SELECT vault.create_secret('https://your-project-ref.supabase.co', 'project_url');
SELECT vault.create_secret('http://api.supabase.internal:8000', 'project_url');
