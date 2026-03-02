-- ============================================
-- MIGRATION: SQL function to notify all admins via email when a dispute is created
-- Designed to be used as a trigger function on public.review_disputes (AFTER INSERT)
-- Calls the send-email edge function asynchronously via pg_net
-- ============================================

CREATE OR REPLACE FUNCTION public.notify_dispute_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_case_number  integer;
  request_id     bigint;
  webhook_secret text;
BEGIN
  -- Fetch the human-readable case number from the cases table
  SELECT case_number
    INTO v_case_number
    FROM public.cases
   WHERE id = NEW.case_id;

  -- Read shared secret from vault (never hard-coded in SQL)
  SELECT decrypted_secret
    INTO webhook_secret
    FROM vault.decrypted_secrets
   WHERE name = 'db_webhook_secret';

  BEGIN
    SELECT net.http_post(
      url := get_project_url() || '/functions/v1/send-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'X-Db-Secret',  webhook_secret
      ),
      body := jsonb_build_object(
        'type',          'dispute',
        'caseNumber',    v_case_number,
        'caseId',        NEW.case_id,
        'disputedField', NEW.field_id
        -- 'to' is intentionally omitted: edge function fetches all admin emails
      ),
      timeout_milliseconds := 10000
    ) INTO request_id;

    RAISE LOG 'Dispute email notification triggered for case_id: %, field_id: %, request_id: %',
      NEW.case_id, NEW.field_id, request_id;

  EXCEPTION
    WHEN OTHERS THEN
      -- Log but never fail the INSERT
      RAISE LOG 'Failed to trigger dispute email for case_id: %. Error: %', NEW.case_id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- ============================================
-- TRIGGER: Fire after every new dispute insert
-- ============================================

CREATE OR REPLACE TRIGGER notify_dispute_email_trigger
  AFTER INSERT ON public.review_disputes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_dispute_email();
