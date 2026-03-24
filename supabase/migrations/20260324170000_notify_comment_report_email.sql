-- ============================================
-- MIGRATION: SQL function to trigger comment-report notification email when a comment is reported
-- Designed to be used as a trigger function on public.case_comment_reports (AFTER INSERT)
-- Calls the send-email edge function asynchronously via pg_net
-- Recipient is resolved by the edge function via COMMENT_REPORT_NOTIFICATION_EMAIL
-- ============================================

CREATE OR REPLACE FUNCTION public.notify_comment_report_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_case_id       uuid;
  v_case_number   integer;
  request_id      bigint;
  webhook_secret  text;
BEGIN
  -- Resolve case context via the reported comment
  SELECT cc.case_id, c.case_number
    INTO v_case_id, v_case_number
    FROM public.case_comments cc
    JOIN public.cases c ON c.id = cc.case_id
   WHERE cc.id = NEW.comment_id;

  IF v_case_id IS NULL OR v_case_number IS NULL THEN
    RAISE LOG 'Comment report email skipped: could not resolve case context for comment_id: %', NEW.comment_id;
    RETURN NEW;
  END IF;

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
        'type',         'comment_report',
        'caseNumber',   v_case_number,
        'caseId',       v_case_id,
        'commentId',    NEW.comment_id,
        'reportReason', NEW.reason
      ),
      timeout_milliseconds := 10000
    ) INTO request_id;

    RAISE LOG 'Comment report email notification triggered for comment_id: %, case_id: %, request_id: %',
      NEW.comment_id, v_case_id, request_id;

  EXCEPTION
    WHEN OTHERS THEN
      -- Log but never fail the INSERT
      RAISE LOG 'Failed to trigger comment report email for comment_id: %. Error: %', NEW.comment_id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- ============================================
-- TRIGGER: Fire after every new comment report insert
-- ============================================

CREATE OR REPLACE TRIGGER notify_comment_report_email_trigger
  AFTER INSERT ON public.case_comment_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_comment_report_email();
