-- ============================================
-- MIGRATION: DB trigger that fires on every INSERT into review_answers_submitted,
-- counts how many submitted reviews the case now has, and forwards both the
-- count and the case info to the send-email edge function.
--
-- The edge function (send-email) owns the threshold logic via config.ts
-- (REVIEW_MILESTONE_COUNT). No DB changes are needed when the threshold changes —
-- just update config.ts and redeploy the function.
-- ============================================

CREATE OR REPLACE FUNCTION public.notify_review_milestone_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_case_number  integer;
  v_review_count integer;
  request_id     bigint;
  webhook_secret text;
BEGIN
  -- Count how many submitted reviews now exist for this case (including the new one)
  SELECT COUNT(*)
    INTO v_review_count
    FROM public.review_answers_submitted
   WHERE case_id = NEW.case_id;

  -- Fetch the human-readable case number
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
        'type',        'review_milestone',
        'caseNumber',  v_case_number,
        'caseId',      NEW.case_id,
        'reviewCount', v_review_count
        -- 'to' is intentionally omitted: edge function looks up the case owner's email
      ),
      timeout_milliseconds := 10000
    ) INTO request_id;

    RAISE LOG 'Review milestone email notification triggered for case_id: %, case_number: %, review_count: %, request_id: %',
      NEW.case_id, v_case_number, v_review_count, request_id;

  EXCEPTION
    WHEN OTHERS THEN
      -- Log but never fail the INSERT
      RAISE LOG 'Failed to trigger review milestone email for case_id: %. Error: %', NEW.case_id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- ============================================
-- TRIGGER: Fire after every submitted review insert
-- ============================================

CREATE OR REPLACE TRIGGER notify_review_milestone_email_trigger
  AFTER INSERT ON public.review_answers_submitted
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_review_milestone_email();
