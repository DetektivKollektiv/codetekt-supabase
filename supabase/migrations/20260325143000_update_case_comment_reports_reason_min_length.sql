-- Migration: update_case_comment_reports_reason_min_length
-- Created: 2026-03-25

ALTER TABLE public.case_comment_reports
  DROP CONSTRAINT IF EXISTS case_comment_reports_reason_check;

ALTER TABLE public.case_comment_reports
  ADD CONSTRAINT case_comment_reports_reason_check
  CHECK (char_length(reason) >= 4 AND char_length(reason) <= 500);
