-- ============================================
-- MIGRATION: Soft-deactivate accounts (anonymized)
-- ============================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_deactivated boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deactivated_at timestamptz;

CREATE OR REPLACE FUNCTION public.is_active_profile()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND is_deactivated = false
  );
$$;

ALTER POLICY "Users can update own profile"
  ON public.profiles
  USING ((SELECT auth.uid()) = id AND public.is_active_profile())
  WITH CHECK ((SELECT auth.uid()) = id AND public.is_active_profile());

ALTER POLICY "Authenticated users can create cases."
  ON public.cases
  WITH CHECK (submitted_by = (SELECT auth.uid()) AND public.is_active_profile());

ALTER POLICY "Users can update their own cases."
  ON public.cases
  USING (submitted_by = (SELECT auth.uid()) AND public.is_active_profile());

ALTER POLICY "Users can delete their own cases."
  ON public.cases
  USING (submitted_by = (SELECT auth.uid()) AND public.is_active_profile());

ALTER POLICY "Users can manage their own in-progress reviews."
  ON public.review_answers_in_progress
  USING (reviewed_by = (SELECT auth.uid()) AND public.is_active_profile())
  WITH CHECK (reviewed_by = (SELECT auth.uid()) AND public.is_active_profile());

ALTER POLICY "Authenticated users can create case disputes."
  ON public.cases_metadata_disputes
  WITH CHECK (disputed_by = (SELECT auth.uid()) AND public.is_active_profile());

ALTER POLICY "Authenticated users can create comments"
  ON public.case_comments
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
    AND author_id = (SELECT auth.uid())
    AND public.is_active_profile()
  );

ALTER POLICY "Authors can edit own non-moderated comments"
  ON public.case_comments
  USING (
    author_id = (SELECT auth.uid())
    AND public.is_active_profile()
    AND NOT EXISTS (
      SELECT 1 FROM public.case_comment_moderations
      WHERE comment_id = public.case_comments.id
    )
  )
  WITH CHECK (
    author_id = (SELECT auth.uid())
    AND public.is_active_profile()
    AND NOT EXISTS (
      SELECT 1 FROM public.case_comment_moderations
      WHERE comment_id = public.case_comments.id
    )
  );

ALTER POLICY "Authors can delete own non-moderated comments"
  ON public.case_comments
  USING (
    author_id = (SELECT auth.uid())
    AND public.is_active_profile()
    AND NOT EXISTS (
      SELECT 1 FROM public.case_comment_moderations
      WHERE comment_id = public.case_comments.id
    )
  );

ALTER POLICY "Authenticated users can add votes"
  ON public.case_comment_likes
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
    AND user_id = (SELECT auth.uid())
    AND public.is_active_profile()
  );

ALTER POLICY "Users can update own votes"
  ON public.case_comment_likes
  USING (user_id = (SELECT auth.uid()) AND public.is_active_profile())
  WITH CHECK (user_id = (SELECT auth.uid()) AND public.is_active_profile());

ALTER POLICY "Users can remove own votes"
  ON public.case_comment_likes
  USING (user_id = (SELECT auth.uid()) AND public.is_active_profile());

ALTER POLICY "Authenticated users can report comments"
  ON public.case_comment_reports
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
    AND reported_by = (SELECT auth.uid())
    AND public.is_active_profile()
  );

ALTER POLICY "Authenticated users can create case titles."
  ON public.case_titles
  WITH CHECK (created_by = (SELECT auth.uid()) AND public.is_active_profile());

ALTER POLICY "Authenticated users can create case categories."
  ON public.case_categories
  WITH CHECK (created_by = (SELECT auth.uid()) AND public.is_active_profile());

ALTER POLICY "Authenticated users can create case keywords."
  ON public.case_keywords
  WITH CHECK (created_by = (SELECT auth.uid()) AND public.is_active_profile());

ALTER POLICY "Users can update their own case keywords."
  ON public.case_keywords
  USING (created_by = (SELECT auth.uid()) AND public.is_active_profile())
  WITH CHECK (created_by = (SELECT auth.uid()) AND public.is_active_profile());

ALTER POLICY "Users can delete their own case keywords."
  ON public.case_keywords
  USING (created_by = (SELECT auth.uid()) AND public.is_active_profile());

ALTER POLICY "Only authenticated users can create review templates."
  ON public.review_templates
  WITH CHECK (created_by = (SELECT auth.uid()) AND public.is_active_profile());