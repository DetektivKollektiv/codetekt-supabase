-- ============================================
-- MIGRATION: SQL function to notify all users via email when a new case is submitted
-- Designed to be used as a trigger function on public.cases (AFTER INSERT)
-- Calls the send-email edge function asynchronously via pg_net
-- ============================================

CREATE OR REPLACE FUNCTION public.notify_new_case_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  request_id bigint;
BEGIN
  BEGIN
    SELECT net.http_post(
      url := get_project_url() || '/functions/v1/send-email',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := jsonb_build_object(
        'type',       'new_case',
        'caseNumber', NEW.case_number,
        'caseId',     NEW.id
        -- 'to' is intentionally omitted: edge function fetches all user emails
      ),
      timeout_milliseconds := 10000
    ) INTO request_id;

    RAISE LOG 'New case email notification triggered for case_id: %, case_number: %, request_id: %',
      NEW.id, NEW.case_number, request_id;

  EXCEPTION
    WHEN OTHERS THEN
      -- Log but never fail the INSERT
      RAISE LOG 'Failed to trigger new case email for case_id: %. Error: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;
