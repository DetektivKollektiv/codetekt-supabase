-- Secure the open graph edge function webhook with X-Db-Secret.
-- Existing trigger remains in place; only the trigger function is updated.

CREATE OR REPLACE FUNCTION public.trigger_open_graph_fetch()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  request_id bigint;
  webhook_secret text;
BEGIN
  IF NEW.content_type = 'url' THEN
    SELECT decrypted_secret
      INTO webhook_secret
      FROM vault.decrypted_secrets
     WHERE name = 'db_webhook_secret';

    BEGIN
      SELECT net.http_post(
        url := get_project_url() || '/functions/v1/set-open-graph-data',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'X-Db-Secret', webhook_secret
        ),
        body := jsonb_build_object('case_id', NEW.id),
        timeout_milliseconds := 10000
      ) INTO request_id;

      RAISE LOG 'Open Graph fetch triggered for case_id: %, request_id: %', NEW.id, request_id;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE LOG 'Failed to trigger Open Graph fetch for case_id: %. Error: %', NEW.id, SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;
