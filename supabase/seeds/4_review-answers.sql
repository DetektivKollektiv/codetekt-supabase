-- ============================================
-- SEED: Test Reviews for Case 1
-- Updated for split tables architecture
-- Voraussetzung: Case 11111111-1111-4111-8111-111111111111 existiert
-- Voraussetzung: User accounts existieren
-- ============================================

-- ============================================
-- SUBMITTED REVIEWS (Public, read-only for users)
-- ============================================

-- Review 1: Gorm's complete review (submitted)
INSERT INTO public."review_answers_submitted" (
  id,
  case_id,
  reviewed_by,
  data,
  created_at,
  submitted_at,
  updated_at
) VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-4111-8111-111111111111',
  (SELECT id FROM auth.users WHERE email = 'gorm-labenz@hotmail.com'),
  '{
    "keyword_type": ["Ukraine", "Russland", "Krieg", "Putin", "Zelensky"],
    "content_type": ["nachrichtenartikel"],
    "grammar": 3,
    "structure": 3,
    "headline": 2,
    "objectivity": 2,
    "perspectives": 3,
    "external_sources": 3,
    "claims_match_sources": 3,
    "public_media_match": 3,
    "author_credentials": 2,
    "images_quality": 3,
    "additional_rating": 3,
    "additional_comment": "Die Überschrift ist etwas reißerisch formuliert, könnte neutraler sein."
  }'::jsonb,
  now() - interval '2 days',
  now() - interval '2 days',
  now() - interval '2 days'
);

-- Review 2: Anna Schmidt's complete review (submitted)
INSERT INTO public."review_answers_submitted" (
  id,
  case_id,
  reviewed_by,
  data,
  created_at,
  submitted_at,
  updated_at
) VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '11111111-1111-4111-8111-111111111111',
  (SELECT id FROM auth.users WHERE email = 'anna.schmidt@example.com'),
  '{
    "keyword_type": ["NATO", "Sanktionen", "Diplomatie"],
    "grammar": 3,
    "structure": 3,
    "headline": 3,
    "objectivity": 3,
    "perspectives": 2,
    "external_sources": 3,
    "claims_match_sources": 3,
    "public_media_match": 3,
    "author_credentials": 3,
    "images_quality": 3,
    "additional_rating": 1
  }'::jsonb,
  now() - interval '1 day',
  now() - interval '1 day',
  now() - interval '1 day'
);

-- Review 3: Max Mueller's complete review (submitted)
INSERT INTO public."review_answers_submitted" (
  id,
  case_id,
  reviewed_by,
  data,
  created_at,
  submitted_at,
  updated_at
) VALUES (
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '11111111-1111-4111-8111-111111111111',
  (SELECT id FROM auth.users WHERE email = 'max.mueller@example.com'),
  '{
    "keyword_type": ["Waffenlieferungen"],
    "grammar": 3,
    "structure": 3,
    "headline": 2,
    "objectivity": 2,
    "perspectives": 2,
    "external_sources": 2,
    "claims_match_sources": 3,
    "public_media_match": 3,
    "author_credentials": 3,
    "images_quality": 3,
    "additional_rating": 1,
    "additional_comment": "Der Artikel stellt nur eine Seite des Konflikts dar. Russische Perspektive fehlt komplett."
  }'::jsonb,
  now() - interval '12 hours',
  now() - interval '12 hours',
  now() - interval '12 hours'
);

-- ============================================
-- IN-PROGRESS REVIEWS (Private drafts)
-- ============================================

-- Example 1: Lisa Weber's new draft (never published yet)
INSERT INTO public."review_answers_in_progress" (
  id,
  case_id,
  reviewed_by,
  data,
  submitted_review_answers_id,
  has_unpublished_changes,
  created_at,
  updated_at
) VALUES (
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  '11111111-1111-4111-8111-111111111111',
  (SELECT id FROM auth.users WHERE email = 'lisa.weber@example.com'),
  '{
    "keyword_type": ["Friedensverhandlungen"],
    "grammar": 2,
    "structure": 3,
    "headline": 2
  }'::jsonb,
  NULL,
  true,
  now() - interval '3 hours',
  now() - interval '1 hour'
);

-- Example 2: Gorm editing his submitted review (linked to published version)
INSERT INTO public."review_answers_in_progress" (
  id,
  case_id,
  reviewed_by,
  data,
  submitted_review_answers_id,
  has_unpublished_changes,
  created_at,
  updated_at
) VALUES (
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  '11111111-1111-4111-8111-111111111111',
  (SELECT id FROM auth.users WHERE email = 'gorm-labenz@hotmail.com'),
  '{
    "keyword_type": ["Ukraine", "Russland", "Krieg", "Putin", "Zelensky", "Butscha"],
    "content_type": ["nachrichtenartikel"],
    "grammar": 3,
    "structure": 3,
    "headline": 3,
    "objectivity": 2,
    "perspectives": 3,
    "external_sources": 3,
    "claims_match_sources": 3,
    "public_media_match": 3,
    "author_credentials": 2,
    "images_quality": 3,
    "additional_rating": 3,
    "additional_comment": "Die Überschrift könnte neutraler formuliert sein. Nach nochmaliger Prüfung ist sie jedoch noch akzeptabel."
  }'::jsonb,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  true,
  now() - interval '1 hour',
  now() - interval '30 minutes'
);
