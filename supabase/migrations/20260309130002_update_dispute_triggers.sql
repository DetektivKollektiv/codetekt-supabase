-- ============================================
-- MIGRATION: Update dispute triggers after rename to cases_metadata_disputes
--
-- After the table rename (review_disputes → cases_metadata_disputes) the trigger
-- functions and trigger names are updated for consistency:
--
--   1. notify_dispute_email() updated: NEW.field_id → NEW.metadata_field
--   2. All four triggers renamed to match the new table name
-- ============================================

-- ============================================
-- UPDATE TRIGGER FUNCTION: notify_dispute_email
-- Only change: NEW.field_id → NEW.metadata_field
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
        'disputedField', NEW.metadata_field
        -- 'to' is intentionally omitted: edge function fetches all admin emails
      ),
      timeout_milliseconds := 10000
    ) INTO request_id;

    RAISE LOG 'Dispute email notification triggered for case_id: %, metadata_field: %, request_id: %',
      NEW.case_id, NEW.metadata_field, request_id;

  EXCEPTION
    WHEN OTHERS THEN
      -- Log but never fail the INSERT
      RAISE LOG 'Failed to trigger dispute email for case_id: %. Error: %', NEW.case_id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- ============================================
-- RENAME TRIGGERS
-- Triggers are automatically attached to the renamed table; renaming them
-- here keeps the naming consistent with "case_disputes".
-- ============================================

ALTER TRIGGER trigger_review_aggregation_on_dispute_insert
  ON public.cases_metadata_disputes
  RENAME TO trigger_aggregation_on_cases_metadata_dispute_insert;

ALTER TRIGGER trigger_review_aggregation_on_dispute_update
  ON public.cases_metadata_disputes
  RENAME TO trigger_aggregation_on_cases_metadata_dispute_update;

ALTER TRIGGER trigger_review_aggregation_on_dispute_delete
  ON public.cases_metadata_disputes
  RENAME TO trigger_aggregation_on_cases_metadata_dispute_delete;

ALTER TRIGGER notify_dispute_email_trigger
  ON public.cases_metadata_disputes
  RENAME TO notify_cases_metadata_dispute_email_trigger;
