-- ============================================
-- MIGRATION: Extend cases_metadata_disputes metadata_field with factcheck
-- ============================================

ALTER TABLE public.cases_metadata_disputes
  DROP CONSTRAINT IF EXISTS cases_metadata_disputes_metadata_field_check;

ALTER TABLE public.cases_metadata_disputes
  ADD CONSTRAINT cases_metadata_disputes_metadata_field_check
  CHECK (metadata_field IN ('title', 'keywords', 'category', 'factcheck'));
