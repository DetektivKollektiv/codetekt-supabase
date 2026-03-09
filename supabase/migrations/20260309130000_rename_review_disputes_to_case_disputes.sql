-- ============================================
-- MIGRATION: Rename review_disputes → cases_metadata_disputes
--
-- Rationale: "review_disputes" is misleading — it disputes case-level
-- metadata, not a review. "cases_metadata_disputes" is accurate and
-- consistent with case_titles, case_keywords, case_categories naming.
--
-- Changes:
--   - Table: review_disputes → cases_metadata_disputes
--   - Column: field_id → metadata_field
--   - Data: existing field values normalised to new names
--   - CHECK constraint added for valid metadata_field values
--   - Indexes, policies and helper function updated accordingly
-- ============================================

-- Rename table
ALTER TABLE public.review_disputes RENAME TO cases_metadata_disputes;

-- Rename column
ALTER TABLE public.cases_metadata_disputes RENAME COLUMN field_id TO metadata_field;

-- ============================================
-- DATA MIGRATION: normalise existing field values
-- ============================================

UPDATE public.cases_metadata_disputes SET metadata_field = 'keywords'  WHERE metadata_field = 'keyword_type';
UPDATE public.cases_metadata_disputes SET metadata_field = 'category'  WHERE metadata_field = 'content_type';

-- ============================================
-- CHECK CONSTRAINT: enforce valid metadata_field values
-- ============================================

ALTER TABLE public.cases_metadata_disputes
  ADD CONSTRAINT cases_metadata_disputes_metadata_field_check
  CHECK (metadata_field IN ('title', 'keywords', 'category'));

-- ============================================
-- RENAME INDEXES
-- ============================================

ALTER INDEX review_disputes_pkey              RENAME TO cases_metadata_disputes_pkey;
ALTER INDEX idx_review_disputes_one_open       RENAME TO idx_cases_metadata_disputes_one_open;
ALTER INDEX idx_review_disputes_pending        RENAME TO idx_cases_metadata_disputes_pending;
ALTER INDEX review_disputes_case_id_idx        RENAME TO cases_metadata_disputes_case_id_idx;
ALTER INDEX review_disputes_disputed_by_idx    RENAME TO cases_metadata_disputes_disputed_by_idx;
ALTER INDEX review_disputes_resolved_by_idx    RENAME TO cases_metadata_disputes_resolved_by_idx;

-- ============================================
-- RENAME RLS POLICIES
-- ============================================

ALTER POLICY "Authenticated users can view all disputes."
  ON public.cases_metadata_disputes
  RENAME TO "Authenticated users can view all case disputes.";

ALTER POLICY "Authenticated users can create disputes."
  ON public.cases_metadata_disputes
  RENAME TO "Authenticated users can create case disputes.";

ALTER POLICY "Only service role can update disputes."
  ON public.cases_metadata_disputes
  RENAME TO "Only service role can update case disputes.";

-- ============================================
-- UPDATE HELPER FUNCTION
-- Drop and recreate: PostgreSQL forbids renaming input parameters via
-- CREATE OR REPLACE, so we must drop first.
-- ============================================

DROP FUNCTION IF EXISTS public.has_admin_resolution(uuid, text);

CREATE FUNCTION public.has_admin_resolution(
  p_case_id        uuid,
  p_metadata_field text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.cases_metadata_disputes
    WHERE case_id        = p_case_id
      AND metadata_field = p_metadata_field
      AND resolved_at   IS NOT NULL
  );
$$;
