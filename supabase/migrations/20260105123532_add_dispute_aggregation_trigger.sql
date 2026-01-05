-- Migration: Add automatic review aggregation trigger for dispute changes
--
-- This migration creates a database trigger that automatically calls the
-- set-review-aggregation edge function whenever disputes are inserted, updated, or deleted.
-- This ensures that review aggregations are recalculated when dispute resolutions change.

-- Trigger function to call review aggregation edge function on dispute changes
CREATE OR REPLACE FUNCTION public.trigger_review_aggregation_on_dispute()
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
    RAISE LOG 'Review aggregation triggered by dispute change for case_id: %, request_id: %', target_case_id, request_id;

  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't fail the transaction
      RAISE LOG 'Failed to trigger review aggregation for dispute on case_id: %. Error: %', target_case_id, SQLERRM;
  END;

  -- Return appropriate row
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Create triggers for INSERT, UPDATE, and DELETE operations on review_disputes
CREATE TRIGGER trigger_review_aggregation_on_dispute_insert
  AFTER INSERT ON public.review_disputes
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_review_aggregation_on_dispute();

CREATE TRIGGER trigger_review_aggregation_on_dispute_update
  AFTER UPDATE ON public.review_disputes
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_review_aggregation_on_dispute();

CREATE TRIGGER trigger_review_aggregation_on_dispute_delete
  AFTER DELETE ON public.review_disputes
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_review_aggregation_on_dispute();
