-- ============================================
-- MIGRATION: SQL function to notify the case creator via email when a review
-- aggregation is created (i.e. enough reviews have been submitted).
-- Designed to be used as a trigger function on public.review_aggregations (AFTER INSERT)
-- Calls the send-email edge function asynchronously via pg_net
-- ============================================

CREATE OR REPLACE FUNCTION public.notify_aggregation_email()
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
        'type',       'review_aggregated',
        'caseNumber', v_case_number,
        'caseId',     NEW.case_id
        -- 'to' is intentionally omitted: edge function looks up the case owner's email
      ),
      timeout_milliseconds := 10000
    ) INTO request_id;

    RAISE LOG 'Aggregation email notification triggered for case_id: %, case_number: %, request_id: %',
      NEW.case_id, v_case_number, request_id;

  EXCEPTION
    WHEN OTHERS THEN
      -- Log but never fail the INSERT
      RAISE LOG 'Failed to trigger aggregation email for case_id: %. Error: %', NEW.case_id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- ============================================
-- TRIGGER: Fire after every new aggregation insert
-- (UPDATE is intentionally excluded — recalculations should not re-notify)
-- ============================================

CREATE OR REPLACE TRIGGER notify_aggregation_email_trigger
  AFTER INSERT ON public.review_aggregations
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_aggregation_email();
