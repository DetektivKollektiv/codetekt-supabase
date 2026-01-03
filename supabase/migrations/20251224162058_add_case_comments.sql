-- Migration: add_case_comments
-- Created: 2025-12-24

-- ============================================================================
-- TABLE: case_comments
-- ============================================================================
CREATE TABLE case_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Content
  content text NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 5000),
  
  -- Edit tracking
  edited_at timestamptz,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_case_comments_case_id ON case_comments(case_id);
CREATE INDEX idx_case_comments_author_id ON case_comments(author_id);
CREATE INDEX idx_case_comments_created_at ON case_comments(created_at DESC);

-- Trigger for edit tracking
CREATE OR REPLACE FUNCTION track_comment_edit()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF OLD.content IS DISTINCT FROM NEW.content THEN
    NEW.edited_at := now();
  END IF;
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER track_comment_edit_trigger
  BEFORE UPDATE ON case_comments
  FOR EACH ROW
  EXECUTE FUNCTION track_comment_edit();

-- ============================================================================
-- TABLE: case_comment_moderations
-- ============================================================================
CREATE TABLE case_comment_moderations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES case_comments(id) ON DELETE CASCADE,
  
  -- Moderation (existence = hidden)
  reason text NOT NULL CHECK (char_length(reason) >= 10 AND char_length(reason) <= 500),
  
  -- Admin tracking (nullable - admin kann gelöscht werden)
  moderated_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  moderated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Only one moderation per comment
  UNIQUE(comment_id)
);

-- Indexes
CREATE INDEX idx_case_comment_moderations_comment_id ON case_comment_moderations(comment_id);
CREATE INDEX idx_case_comment_moderations_moderated_by ON case_comment_moderations(moderated_by);

-- RLS Policies
ALTER TABLE case_comment_moderations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view moderations"
  ON case_comment_moderations FOR SELECT
  USING (true);

-- Split ALL into separate policies to avoid redundant SELECT policy
CREATE POLICY "Admins can insert moderations"
  ON case_comment_moderations FOR INSERT
  WITH CHECK ((SELECT is_admin FROM profiles WHERE id = (SELECT auth.uid())));

CREATE POLICY "Admins can update moderations"
  ON case_comment_moderations FOR UPDATE
  USING ((SELECT is_admin FROM profiles WHERE id = (SELECT auth.uid())))
  WITH CHECK ((SELECT is_admin FROM profiles WHERE id = (SELECT auth.uid())));

CREATE POLICY "Admins can delete moderations"
  ON case_comment_moderations FOR DELETE
  USING ((SELECT is_admin FROM profiles WHERE id = (SELECT auth.uid())));

-- ============================================================================
-- RLS Policies for case_comments (AFTER moderations table exists)
-- ============================================================================
ALTER TABLE case_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments"
  ON case_comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON case_comments FOR INSERT
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
    AND author_id = (SELECT auth.uid())
  );

CREATE POLICY "Authors can edit own non-moderated comments"
  ON case_comments FOR UPDATE
  USING (
    author_id = (SELECT auth.uid())
    AND NOT EXISTS (
      SELECT 1 FROM case_comment_moderations
      WHERE comment_id = case_comments.id
    )
  )
  WITH CHECK (
    author_id = (SELECT auth.uid())
    AND NOT EXISTS (
      SELECT 1 FROM case_comment_moderations
      WHERE comment_id = case_comments.id
    )
  );

CREATE POLICY "Authors can delete own non-moderated comments"
  ON case_comments FOR DELETE
  USING (
    author_id = (SELECT auth.uid())
    AND NOT EXISTS (
      SELECT 1 FROM case_comment_moderations
      WHERE comment_id = case_comments.id
    )
  );

-- ============================================================================
-- TABLE: case_comment_likes
-- ============================================================================
CREATE TABLE case_comment_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES case_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  
  -- One like per user per comment
  UNIQUE(comment_id, user_id)
);

-- Indexes
CREATE INDEX idx_case_comment_likes_comment_id ON case_comment_likes(comment_id);
CREATE INDEX idx_case_comment_likes_user_id ON case_comment_likes(user_id);

-- RLS Policies
ALTER TABLE case_comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view likes"
  ON case_comment_likes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can add likes"
  ON case_comment_likes FOR INSERT
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
    AND user_id = (SELECT auth.uid())
  );

CREATE POLICY "Users can remove own likes"
  ON case_comment_likes FOR DELETE
  USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- TABLE: case_comment_reports
-- ============================================================================
CREATE TABLE case_comment_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES case_comments(id) ON DELETE CASCADE,
  reported_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (char_length(reason) >= 10 AND char_length(reason) <= 500),
  
  created_at timestamptz NOT NULL DEFAULT now(),
  
  -- One report per user per comment
  UNIQUE(comment_id, reported_by)
);

-- Indexes
CREATE INDEX idx_case_comment_reports_comment_id ON case_comment_reports(comment_id);
CREATE INDEX idx_case_comment_reports_reported_by ON case_comment_reports(reported_by);

-- RLS Policies
ALTER TABLE case_comment_reports ENABLE ROW LEVEL SECURITY;

-- Merged SELECT policy to avoid multiple permissive policies
CREATE POLICY "View reports policy"
  ON case_comment_reports FOR SELECT
  USING (
    (SELECT is_admin FROM profiles WHERE id = (SELECT auth.uid()))
    OR reported_by = (SELECT auth.uid())
  );

CREATE POLICY "Authenticated users can report comments"
  ON case_comment_reports FOR INSERT
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
    AND reported_by = (SELECT auth.uid())
  );