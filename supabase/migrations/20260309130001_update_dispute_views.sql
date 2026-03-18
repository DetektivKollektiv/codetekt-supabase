-- ============================================
-- MIGRATION: Update dispute views to reference cases_metadata_disputes
--
-- The three dispute-filtered views previously referenced the table
-- "review_disputes". After the rename to "cases_metadata_disputes" they are
-- recreated here to use the correct table name.
-- ============================================

-- View 1: Cases without open disputes
CREATE OR REPLACE VIEW cases_without_open_disputes AS
SELECT *
FROM cases
WHERE NOT EXISTS (
  SELECT 1
  FROM cases_metadata_disputes
  WHERE cases_metadata_disputes.case_id = cases.id
    AND cases_metadata_disputes.resolution IS NULL
);

ALTER VIEW cases_without_open_disputes SET (security_invoker = on);

-- View 2: Review answers in progress without open disputes
CREATE OR REPLACE VIEW review_answers_in_progress_without_open_disputes AS
SELECT *
FROM review_answers_in_progress
WHERE NOT EXISTS (
  SELECT 1
  FROM cases_metadata_disputes
  WHERE cases_metadata_disputes.case_id = review_answers_in_progress.case_id
    AND cases_metadata_disputes.resolution IS NULL
);

ALTER VIEW review_answers_in_progress_without_open_disputes SET (security_invoker = on);

-- View 3: Review aggregations without open disputes
CREATE OR REPLACE VIEW review_aggregations_without_open_disputes AS
SELECT *
FROM review_aggregations
WHERE NOT EXISTS (
  SELECT 1
  FROM cases_metadata_disputes
  WHERE cases_metadata_disputes.case_id = review_aggregations.case_id
    AND cases_metadata_disputes.resolution IS NULL
);

ALTER VIEW review_aggregations_without_open_disputes SET (security_invoker = on);
