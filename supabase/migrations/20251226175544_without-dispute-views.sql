-- Create views that exclude cases and review answers with open disputes
-- Open dispute = resolution IS NULL in review_disputes table

-- View 1: Cases without open disputes
-- Selects all cases that don't have any unresolved disputes
CREATE OR REPLACE VIEW cases_without_open_disputes AS
SELECT *
FROM cases
WHERE NOT EXISTS (
  SELECT 1
  FROM review_disputes
  WHERE review_disputes.case_id = cases.id
    AND review_disputes.resolution IS NULL
);

-- View 2: Review answers in progress without open disputes
-- Selects all in-progress reviews where the associated case has no open disputes
CREATE OR REPLACE VIEW review_answers_in_progress_without_open_disputes AS
SELECT *
FROM review_answers_in_progress
WHERE NOT EXISTS (
  SELECT 1
  FROM review_disputes
  WHERE review_disputes.case_id = review_answers_in_progress.case_id
    AND review_disputes.resolution IS NULL
);

-- Enable RLS on views
ALTER VIEW cases_without_open_disputes SET (security_invoker = on);
ALTER VIEW review_answers_in_progress_without_open_disputes SET (security_invoker = on);
