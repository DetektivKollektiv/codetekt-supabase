-- ============================================
-- SEED: In-Progress Reviews
-- Only: public.review_answers_in_progress
-- Scale: 0 (gut) .. 3 (schlecht), (4=nicht bewertbar)
-- Note: title, keywords, category are stored in case_titles/case_keywords/case_categories
-- Reviewer: Gorm (1. Review) + Anna (2. Review)
-- ============================================

INSERT INTO public."review_answers_in_progress"
(id, case_id, reviewed_by, data, submitted_review_answers_id, has_unpublished_changes, created_at, updated_at)
VALUES

-- =========================================================
-- URL CASES (10) -> 20 reviews
-- =========================================================

-- 1) Case: MDR (1111...)
(
  '8a7c1c7e-7b85-4b98-9e2a-1f98b4a9a1c1',
  '11111111-1111-4111-8111-111111111111',
  (SELECT id FROM auth.users WHERE email = 'gorm-labenz@hotmail.com'),
  '{
    "content_accuracy": 0,
    "content_language": 2,
    "content_objective_no_hate_no_panic": 0,
    "content_headline_matches_article": 1,
    "content_additional_points": 1,
    "content_additional_points_details": "Zusätzliche inhaltliche Auffälligkeiten wurden dokumentiert.",

    "media_objectivity": 3,
    "media_no_ai_or_staging_doubts": 3,
    "media_visualizations_not_distorted": 3,
    "media_additional_points": 3,
    "media_additional_points_details": "Mehrere visuelle Auffälligkeiten beeinträchtigen die Vertrauenswürdigkeit.",

    "medium_independent_no_conflicts": 1,
    "medium_authenticity": 1,
    "medium_no_aggressive_ads_or_trackers": 1,
    "medium_impressum": 1,
    "medium_additional_points": 1,
    "medium_additional_points_details": "Es bestehen zusätzliche Zweifel an Transparenz und Unabhängigkeit.",

    "source_article_author_expertise": 1,
    "source_claims_supported": 1,
    "source_listed_and_verifiable": 1,
    "source_additional_points": 1,
    "source_additional_points_details": "Die Quellenlage weist weitere Unklarheiten auf.",

    "quotes_identifiable_people": 3,
    "quotes_experts_reputation": 3,
    "quotes_match_originals": 3,
    "quotes_additional_points": 3,
    "quotes_additional_points_details": "Mehrere Zitate wirken verkürzt oder nicht eindeutig belegbar."
  }'::jsonb,
  '8a7c1c7e-7b85-4b98-9e2a-1f98b4a9a1c1',
  false,
  now() - interval '6 days',
  now() - interval '6 days'
),
(
  'f1d6e9c5-3d90-4e8d-bc70-6b8b5a2d8c91',
  '11111111-1111-4111-8111-111111111111',
  (SELECT id FROM auth.users WHERE email = 'anna.schmidt@example.com'),
  '{
    "content_accuracy": 1,
    "content_language": 3,
    "content_objective_no_hate_no_panic": 1,
    "content_headline_matches_article": 2,
    "content_additional_points": 2,
    "content_additional_points_details": "Es fehlen zusätzliche Kontextinformationen im Inhalt.",

    "media_objectivity": 3,
    "media_no_ai_or_staging_doubts": 3,
    "media_visualizations_not_distorted": 3,
    "media_additional_points": 3,
    "media_additional_points_details": "Die verwendeten Medien verstärken den Eindruck von Unzuverlässigkeit.",

    "medium_independent_no_conflicts": 2,
    "medium_authenticity": 2,
    "medium_no_aggressive_ads_or_trackers": 2,
    "medium_impressum": 2,
    "medium_additional_points": 2,
    "medium_additional_points_details": "Es gibt weitere Hinweise auf eingeschränkte Glaubwürdigkeit des Mediums.",

    "source_article_author_expertise": 2,
    "source_claims_supported": 2,
    "source_listed_and_verifiable": 2,
    "source_additional_points": 2,
    "source_additional_points_details": "Die Quellen sind nur teilweise transparent und überprüfbar.",

    "quotes_identifiable_people": 3,
    "quotes_experts_reputation": 3,
    "quotes_match_originals": 3,
    "quotes_additional_points": 3,
    "quotes_additional_points_details": "Zitate sind teilweise unpräzise oder ohne klaren Ursprung angegeben."
  }'::jsonb,
  'f1d6e9c5-3d90-4e8d-bc70-6b8b5a2d8c91',
  false,
  now() - interval '5 days',
  now() - interval '5 days'
)
;