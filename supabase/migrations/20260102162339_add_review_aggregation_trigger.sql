-- Migration: Add automatic review aggregation trigger
--
-- This migration creates a database trigger that automatically calls the
-- set-review-aggregation edge function whenever reviews are inserted, updated, or deleted.
--
-- PRODUCTION SETUP:
-- After deploying this migration to production, run the following SQL command
-- in the SQL Editor to set the project URL:
--
-- SELECT vault.create_secret('https://your-project-ref.supabase.co', 'project_url');
--
-- Replace 'your-project-ref' with your actual Supabase project reference.

-- Enable pg_net extension for async HTTP requests in extensions schema
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Helper function to retrieve project URL from vault
CREATE OR REPLACE FUNCTION public.get_project_url()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  secret_value text;
BEGIN
  SELECT decrypted_secret INTO secret_value
  FROM vault.decrypted_secrets
  WHERE name = 'project_url';
  RETURN secret_value;
END;
$$;

-- Trigger function to call review aggregation edge function
CREATE OR REPLACE FUNCTION public.trigger_review_aggregation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  target_case_id uuid;
  request_id bigint;
BEGIN
  -- Determine case_id from appropriate row
  IF TG_OP = 'DELETE' THEN
    target_case_id := OLD.case_id;
  ELSE
    target_case_id := NEW.case_id;
  END IF;

  -- Call edge function asynchronously (no auth required - verify_jwt = false)
  BEGIN
    SELECT net.http_post(
      url := get_project_url() || '/functions/v1/set-review-aggregation',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := jsonb_build_object('case_id', target_case_id),
      timeout_milliseconds := 5000
    ) INTO request_id;

    -- Log successful request
    RAISE LOG 'Review aggregation triggered for case_id: %, request_id: %', target_case_id, request_id;

  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't fail the transaction
      RAISE LOG 'Failed to trigger review aggregation for case_id: %. Error: %', target_case_id, SQLERRM;
  END;

  -- Return appropriate row
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Create triggers for INSERT, UPDATE, and DELETE operations
CREATE TRIGGER trigger_review_aggregation_on_insert
  AFTER INSERT ON public.review_answers_submitted
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_review_aggregation();

CREATE TRIGGER trigger_review_aggregation_on_update
  AFTER UPDATE ON public.review_answers_submitted
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_review_aggregation();

CREATE TRIGGER trigger_review_aggregation_on_delete
  AFTER DELETE ON public.review_answers_submitted
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_review_aggregation();
