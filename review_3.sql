-- Review 3: Dritter Reviewer ergänzt 1 Keyword (submitted)
INSERT INTO public.reviews (
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