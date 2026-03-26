-- ============================================
-- MIGRATION: Rename case_factchecks.details -> value
-- ============================================

ALTER TABLE public.case_factchecks
  RENAME COLUMN details TO value;

ALTER TABLE public.case_factchecks
  RENAME CONSTRAINT case_factchecks_details_length_check TO case_factchecks_value_length_check;
