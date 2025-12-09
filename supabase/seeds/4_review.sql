-- ============================================
-- SEED: Test Reviews for Case 1
-- Voraussetzung: Case 11111111-1111-1111-1111-111111111111 existiert
-- Voraussetzung: 3 verschiedene User existieren
-- ============================================

-- Review 1: Erster Reviewer setzt content_type + 5 Keywords (submitted)
INSERT INTO public."review_answers" (
  id,
  case_id,
  reviewed_by,
  status,
  data,
  created_at,
  submitted_at
) VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  (SELECT id FROM auth.users WHERE email = 'gorm-labenz@hotmail.com'),
  'submitted',
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
    "additional_rating": "minor_issue",
    "additional_comment": "Die Überschrift ist etwas reißerisch formuliert, könnte neutraler sein."
  }'::jsonb,
  now() - interval '2 days',
  now() - interval '2 days'
);

-- Review 2: Zweiter Reviewer ergänzt 3 Keywords (submitted)
INSERT INTO public."review_answers" (
  id,
  case_id,
  reviewed_by,
  status,
  data,
  created_at,
  submitted_at
) VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '11111111-1111-1111-1111-111111111111',
  (SELECT id FROM auth.users WHERE email = 'anna.schmidt@example.com'),
  'submitted',
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
    "additional_rating": "nothing"
  }'::jsonb,
  now() - interval '1 day',
  now() - interval '1 day'
);

-- Review 3: Dritter Reviewer ergänzt 1 Keyword (submitted)
INSERT INTO public."review_answers" (
  id,
  case_id,
  reviewed_by,
  status,
  data,
  created_at,
  submitted_at
) VALUES (
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '11111111-1111-1111-1111-111111111111',
  (SELECT id FROM auth.users WHERE email = 'max.mueller@example.com'),
  'submitted',
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
    "additional_rating": "major_issue",
    "additional_comment": "Der Artikel stellt nur eine Seite des Konflikts dar. Russische Perspektive fehlt komplett."
  }'::jsonb,
  now() - interval '12 hours',
  now() - interval '12 hours'
);

