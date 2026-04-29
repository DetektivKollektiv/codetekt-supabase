-- Secure the review aggregation edge function webhook with X-Db-Secret.
-- Existing triggers remain in place; only the trigger functions are updated.

CREATE OR REPLACE FUNCTION public.trigger_review_aggregation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  target_case_id uuid;
  request_id bigint;
  webhook_secret text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_case_id := OLD.case_id;
  ELSE
    target_case_id := NEW.case_id;
  END IF;

  SELECT decrypted_secret
    INTO webhook_secret
    FROM vault.decrypted_secrets
   WHERE name = 'db_webhook_secret';

  BEGIN
    SELECT net.http_post(
      url := get_project_url() || '/functions/v1/set-review-aggregation',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'X-Db-Secret', webhook_secret
      ),
      body := jsonb_build_object('case_id', target_case_id),
      timeout_milliseconds := 5000
    ) INTO request_id;

    RAISE LOG 'Review aggregation triggered for case_id: %, request_id: %', target_case_id, request_id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE LOG 'Failed to trigger review aggregation for case_id: %. Error: %', target_case_id, SQLERRM;
  END;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_review_aggregation_on_dispute()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  target_case_id uuid;
  request_id bigint;
  webhook_secret text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_case_id := OLD.case_id;
  ELSE
    target_case_id := NEW.case_id;
  END IF;

  SELECT decrypted_secret
    INTO webhook_secret
    FROM vault.decrypted_secrets
   WHERE name = 'db_webhook_secret';

  BEGIN
    SELECT net.http_post(
      url := get_project_url() || '/functions/v1/set-review-aggregation',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'X-Db-Secret', webhook_secret
      ),
      body := jsonb_build_object('case_id', target_case_id),
      timeout_milliseconds := 5000
    ) INTO request_id;

    RAISE LOG 'Review aggregation triggered by dispute change for case_id: %, request_id: %', target_case_id, request_id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE LOG 'Failed to trigger review aggregation for dispute on case_id: %. Error: %', target_case_id, SQLERRM;
  END;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;
