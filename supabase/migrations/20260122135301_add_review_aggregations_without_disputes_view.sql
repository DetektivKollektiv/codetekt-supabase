-- Create view for review aggregations without open disputes
-- Open dispute = resolution IS NULL in review_disputes table

-- View: Review aggregations without open disputes
-- Selects all review aggregations where the associated case has no open disputes
CREATE OR REPLACE VIEW review_aggregations_without_open_disputes AS
SELECT *
FROM review_aggregations
WHERE NOT EXISTS (
  SELECT 1
  FROM review_disputes
  WHERE review_disputes.case_id = review_aggregations.case_id
    AND review_disputes.resolution IS NULL
);

-- Enable RLS on view
ALTER VIEW review_aggregations_without_open_disputes SET (security_invoker = on);
