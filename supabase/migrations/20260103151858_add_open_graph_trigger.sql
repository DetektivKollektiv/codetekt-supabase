-- ============================================
-- Migration: Add automatic Open Graph data fetching trigger
-- ============================================
--
-- This migration creates a database trigger that automatically calls the
-- set-open-graph-data edge function when URL cases are created.
--
-- Uses the existing pg_net extension and vault.decrypted_secrets for project URL

-- Trigger function to call OG scraping edge function
CREATE OR REPLACE FUNCTION public.trigger_open_graph_fetch()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  request_id bigint;
BEGIN
  -- Only trigger for URL cases
  IF NEW.content_type = 'url' THEN
    BEGIN
      SELECT net.http_post(
        url := get_project_url() || '/functions/v1/set-open-graph-data',
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := jsonb_build_object('case_id', NEW.id),
        timeout_milliseconds := 10000  -- 10 seconds for external URL fetch
      ) INTO request_id;

      -- Log successful request
      RAISE LOG 'Open Graph fetch triggered for case_id: %, request_id: %', NEW.id, request_id;

    EXCEPTION
      WHEN OTHERS THEN
        -- Log error but don't fail the transaction
        RAISE LOG 'Failed to trigger Open Graph fetch for case_id: %. Error: %', NEW.id, SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for INSERT operations only
CREATE TRIGGER trigger_open_graph_fetch_on_insert
  AFTER INSERT ON public.cases
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_open_graph_fetch();
