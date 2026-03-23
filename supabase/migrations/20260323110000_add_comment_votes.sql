-- Migration: add_comment_votes
-- Created: 2026-03-23

-- Extend comment likes to support up/down voting
ALTER TABLE case_comment_likes
  ADD COLUMN vote_type text NOT NULL DEFAULT 'up'
  CHECK (vote_type IN ('up', 'down'));

-- Replace old indexes with vote-aware indexes
DROP INDEX IF EXISTS idx_case_comment_likes_comment_id;
CREATE INDEX idx_case_comment_likes_comment_id_vote_type ON case_comment_likes(comment_id, vote_type);

DROP POLICY IF EXISTS "Everyone can view likes" ON case_comment_likes;
CREATE POLICY "Everyone can view votes"
  ON case_comment_likes FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can add likes" ON case_comment_likes;
CREATE POLICY "Authenticated users can add votes"
  ON case_comment_likes FOR INSERT
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
    AND user_id = (SELECT auth.uid())
  );

CREATE POLICY "Users can update own votes"
  ON case_comment_likes FOR UPDATE
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can remove own likes" ON case_comment_likes;
CREATE POLICY "Users can remove own votes"
  ON case_comment_likes FOR DELETE
  USING (user_id = (SELECT auth.uid()));