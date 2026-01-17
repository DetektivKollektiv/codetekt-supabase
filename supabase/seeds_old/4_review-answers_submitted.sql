-- ============================================
-- SEED: Additional Submitted Reviews (2 per case)
-- Only: public.review_answers_submitted
-- Scale: 0 (gut) .. 3 (schlecht)
-- Sonderfall: "content_type" nur im jeweils 1. Review pro Case
-- Reviewer: Gorm (1. Review) + Anna (2. Review)
-- ============================================

INSERT INTO public."review_answers_submitted"
(id, case_id, reviewed_by, data, created_at, submitted_at, updated_at)
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
    "keyword_type": ["Ukraine", "Russland", "Tschechien", "Botschafter", "Propaganda"],
    "content_type": ["nachrichtenartikel"],
    "grammar": 1,
    "structure": 1,
    "headline": 1,
    "objectivity": 1,
    "perspectives": 1,
    "external_sources": 1,
    "claims_match_sources": 1,
    "public_media_match": 1,
    "author_credentials": 1,
    "images_quality": 1,
    "additional_rating": 1,
    "additional_comment": "Wirkt insgesamt sauber, aber Überschrift etwas zugespitzt."
  }'::jsonb,
  now() - interval '6 days',
  now() - interval '6 days',
  now() - interval '6 days'
),
(
  'f1d6e9c5-3d90-4e8d-bc70-6b8b5a2d8c91',
  '11111111-1111-4111-8111-111111111111',
  (SELECT id FROM auth.users WHERE email = 'anna.schmidt@example.com'),
  '{
    "keyword_type": ["Ukraine", "Diplomatie", "Desinformation"],
    "grammar": 1,
    "structure": 1,
    "headline": 1,
    "objectivity": 1,
    "perspectives": 1,
    "external_sources": 1,
    "claims_match_sources": 1,
    "public_media_match": 1,
    "author_credentials": 1,
    "images_quality": 1,
    "additional_rating": 1,
    "additional_comment": "Plausibel, Quellenlage wirkt stimmig."
  }'::jsonb,
  now() - interval '5 days',
  now() - interval '5 days',
  now() - interval '5 days'
),

-- 2) Case: Reuters (0de6a28d...)
(
  '2d23ce0b-3b8c-4d37-8bb7-7b4c0d3f2e11',
  '0de6a28d-db36-4c73-9131-e8ccbce69557',
  (SELECT id FROM auth.users WHERE email = 'gorm-labenz@hotmail.com'),
  '{
    "keyword_type": ["Europa", "Wetter", "Schnee", "Eis", "Verkehr"],
    "content_type": ["nachrichtenartikel"],
    "grammar": 0,
    "structure": 1,
    "headline": 1,
    "objectivity": 0,
    "perspectives": 1,
    "external_sources": 1,
    "claims_match_sources": 0,
    "public_media_match": 0,
    "author_credentials": 0,
    "images_quality": 1,
    "additional_rating": 0,
    "additional_comment": "Neutraler Ton, wirkt wie klassische Agenturmeldung."
  }'::jsonb,
  now() - interval '21 days',
  now() - interval '21 days',
  now() - interval '21 days'
),
(
  'b53cf8ef-9fb1-4d02-a1b3-8b8f5c03f9f3',
  '0de6a28d-db36-4c73-9131-e8ccbce69557',
  (SELECT id FROM auth.users WHERE email = 'anna.schmidt@example.com'),
  '{
    "keyword_type": ["Kältewelle", "Unfälle", "Warnungen"],
    "grammar": 0,
    "structure": 1,
    "headline": 1,
    "objectivity": 0,
    "perspectives": 1,
    "external_sources": 1,
    "claims_match_sources": 0,
    "public_media_match": 0,
    "author_credentials": 0,
    "images_quality": 1,
    "additional_rating": 0,
    "additional_comment": "Keine großen roten Flaggen, gut einzuordnen."
  }'::jsonb,
  now() - interval '20 days',
  now() - interval '20 days',
  now() - interval '20 days'
),

-- 3) Case: Reuters (f2974bce...)
(
  'f3a1b9a0-6b8a-4c2e-9fe7-1e4b8c1cc9a1',
  'f2974bce-eeca-41d0-99d2-8c73ed966dcf',
  (SELECT id FROM auth.users WHERE email = 'gorm-labenz@hotmail.com'),
  '{
    "keyword_type": ["Niederlande", "Bahn", "Schnee", "Eis", "Ausfälle"],
    "content_type": ["nachrichtenartikel"],
    "grammar": 0,
    "structure": 1,
    "headline": 1,
    "objectivity": 0,
    "perspectives": 1,
    "external_sources": 1,
    "claims_match_sources": 0,
    "public_media_match": 0,
    "author_credentials": 0,
    "images_quality": 1,
    "additional_rating": 0,
    "additional_comment": "Klingt glaubwürdig, typische Lage-/Serviceinfo."
  }'::jsonb,
  now() - interval '19 days',
  now() - interval '19 days',
  now() - interval '19 days'
),
(
  '4a44a6d4-cf7f-4b2f-a22a-2a9a2b58c12f',
  'f2974bce-eeca-41d0-99d2-8c73ed966dcf',
  (SELECT id FROM auth.users WHERE email = 'anna.schmidt@example.com'),
  '{
    "keyword_type": ["Zugverkehr", "Störungen", "Winter"],
    "grammar": 0,
    "structure": 1,
    "headline": 1,
    "objectivity": 0,
    "perspectives": 1,
    "external_sources": 1,
    "claims_match_sources": 0,
    "public_media_match": 0,
    "author_credentials": 0,
    "images_quality": 1,
    "additional_rating": 0,
    "additional_comment": "Unauffällig, keine übertriebenen Behauptungen."
  }'::jsonb,
  now() - interval '18 days',
  now() - interval '18 days',
  now() - interval '18 days'
),

-- 4) Case: Reuters (9c2b5f2f...)
(
  'c6f0e1f8-bbd8-4df6-8a9f-bfd5d42cba7c',
  '9c2b5f2f-7701-4d79-ac44-458dba098775',
  (SELECT id FROM auth.users WHERE email = 'gorm-labenz@hotmail.com'),
  '{
    "keyword_type": ["Bulgarien", "Euro", "Eurozone", "Währung", "EU"],
    "content_type": ["nachrichtenartikel"],
    "grammar": 0,
    "structure": 0,
    "headline": 1,
    "objectivity": 0,
    "perspectives": 1,
    "external_sources": 1,
    "claims_match_sources": 0,
    "public_media_match": 0,
    "author_credentials": 0,
    "images_quality": 1,
    "additional_rating": 0,
    "additional_comment": "Faktenlastig, gut prüfbar (Datum/Entscheidungen)."
  }'::jsonb,
  now() - interval '17 days',
  now() - interval '17 days',
  now() - interval '17 days'
),
(
  '6a2a2d8c-93f6-4d38-a6f5-6d1c1b58bff1',
  '9c2b5f2f-7701-4d79-ac44-458dba098775',
  (SELECT id FROM auth.users WHERE email = 'anna.schmidt@example.com'),
  '{
    "keyword_type": ["Euro-Einführung", "Leva", "Konvergenz"],
    "grammar": 0,
    "structure": 0,
    "headline": 1,
    "objectivity": 0,
    "perspectives": 1,
    "external_sources": 1,
    "claims_match_sources": 0,
    "public_media_match": 0,
    "author_credentials": 0,
    "images_quality": 1,
    "additional_rating": 0,
    "additional_comment": "Wirkt konsistent mit anderen Meldungen zur Eurozone."
  }'::jsonb,
  now() - interval '16 days',
  now() - interval '16 days',
  now() - interval '16 days'
),

-- 5) Case: Reuters (d3c3f904...)
(
  'f7df2cc4-1d87-46ac-a1f4-b0e3d1c3bb11',
  'd3c3f904-470b-4fdc-b978-df66ac90043a',
  (SELECT id FROM auth.users WHERE email = 'gorm-labenz@hotmail.com'),
  '{
    "keyword_type": ["Grönland", "Dänemark", "EU", "USA", "Souveränität"],
    "content_type": ["nachrichtenartikel"],
    "grammar": 0,
    "structure": 1,
    "headline": 1,
    "objectivity": 1,
    "perspectives": 1,
    "external_sources": 1,
    "claims_match_sources": 0,
    "public_media_match": 0,
    "author_credentials": 0,
    "images_quality": 2,
    "additional_rating": 1,
    "additional_comment": "Politisch heikel, aber insgesamt sauber formuliert."
  }'::jsonb,
  now() - interval '15 days',
  now() - interval '15 days',
  now() - interval '15 days'
),
(
  '2e0f5d9c-63b6-4e65-9b1e-ea0e4d6b9a44',
  'd3c3f904-470b-4fdc-b978-df66ac90043a',
  (SELECT id FROM auth.users WHERE email = 'anna.schmidt@example.com'),
  '{
    "keyword_type": ["Grönland", "Geopolitik", "NATO"],
    "grammar": 0,
    "structure": 1,
    "headline": 1,
    "objectivity": 1,
    "perspectives": 1,
    "external_sources": 1,
    "claims_match_sources": 0,
    "public_media_match": 0,
    "author_credentials": 0,
    "images_quality": 2,
    "additional_rating": 1,
    "additional_comment": "Kontext ist komplex – aber keine offensichtlichen Fakes."
  }'::jsonb,
  now() - interval '14 days',
  now() - interval '14 days',
  now() - interval '14 days'
),

-- 6) Case: Guardian (6b6f0f45...)
(
  'a2b7f51f-0c2b-49f1-9b25-7f1f8f5e8c19',
  '6b6f0f45-ef48-4f50-931f-46ad0cd3c3b5',
  (SELECT id FROM auth.users WHERE email = 'gorm-labenz@hotmail.com'),
  '{
    "keyword_type": ["UK", "Frankreich", "Ukraine", "Truppen", "Waffenstillstand"],
    "content_type": ["Meinung"],
    "grammar": 1,
    "structure": 1,
    "headline": 2,
    "objectivity": 2,
    "perspectives": 1,
    "external_sources": 2,
    "claims_match_sources": 1,
    "public_media_match": 1,
    "author_credentials": 1,
    "images_quality": 2,
    "additional_rating": 2,
    "additional_comment": "Mehr Kommentar als Bericht – trotzdem nachvollziehbar."
  }'::jsonb,
  now() - interval '13 days',
  now() - interval '13 days',
  now() - interval '13 days'
),
(
  'bf7c7c79-6db4-4b46-9f8d-2a786a0f43fe',
  '6b6f0f45-ef48-4f50-931f-46ad0cd3c3b5',
  (SELECT id FROM auth.users WHERE email = 'anna.schmidt@example.com'),
  '{
    "keyword_type": ["Security guarantees", "Ceasefire", "Europe"],
    "grammar": 1,
    "structure": 1,
    "headline": 2,
    "objectivity": 2,
    "perspectives": 1,
    "external_sources": 2,
    "claims_match_sources": 1,
    "public_media_match": 1,
    "author_credentials": 1,
    "images_quality": 2,
    "additional_rating": 2,
    "additional_comment": "Ton ist zugespitzt; Fakten bitte gegenchecken."
  }'::jsonb,
  now() - interval '12 days',
  now() - interval '12 days',
  now() - interval '12 days'
),

-- 7) Case: AP (c8c0f221...)
(
  '0c5f6e33-7b2d-44aa-9f90-7b2e9a4c1b11',
  'c8c0f221-5c91-4c2f-820b-66b7d84bb7d2',
  (SELECT id FROM auth.users WHERE email = 'gorm-labenz@hotmail.com'),
  '{
    "keyword_type": ["USA", "Europa", "Diplomatie", "Konflikt", "Sanktionen"],
    "content_type": ["nachrichtenartikel"],
    "grammar": 0,
    "structure": 1,
    "headline": 1,
    "objectivity": 1,
    "perspectives": 1,
    "external_sources": 1,
    "claims_match_sources": 0,
    "public_media_match": 0,
    "author_credentials": 0,
    "images_quality": 1,
    "additional_rating": 1,
    "additional_comment": "Wirkt wie Standard-Newswire, wenig Interpretationen."
  }'::jsonb,
  now() - interval '11 days',
  now() - interval '11 days',
  now() - interval '11 days'
),
(
  '8d7a9b8a-9a7c-4db7-a7a9-8c1a7d9c8b11',
  'c8c0f221-5c91-4c2f-820b-66b7d84bb7d2',
  (SELECT id FROM auth.users WHERE email = 'anna.schmidt@example.com'),
  '{
    "keyword_type": ["US-EU relations", "Statements", "Officials"],
    "grammar": 0,
    "structure": 1,
    "headline": 1,
    "objectivity": 1,
    "perspectives": 1,
    "external_sources": 1,
    "claims_match_sources": 0,
    "public_media_match": 0,
    "author_credentials": 0,
    "images_quality": 1,
    "additional_rating": 1,
    "additional_comment": "Unauffällig; würde noch nach Originalzitaten schauen."
  }'::jsonb,
  now() - interval '10 days',
  now() - interval '10 days',
  now() - interval '10 days'
),

-- 8) Case: Al Jazeera (3a7c2a67...)
(
  '9a2d0c8f-5b63-4681-9d1b-5f1c3a8d4e21',
  '3a7c2a67-0f41-4c17-a5f8-2e6b4ad0a9d7',
  (SELECT id FROM auth.users WHERE email = 'gorm-labenz@hotmail.com'),
  '{
    "keyword_type": ["Grönland", "USA", "Dänemark", "Militär", "Drohung"],
    "content_type": ["nachrichtenartikel"],
    "grammar": 1,
    "structure": 1,
    "headline": 2,
    "objectivity": 1,
    "perspectives": 1,
    "external_sources": 2,
    "claims_match_sources": 1,
    "public_media_match": 1,
    "author_credentials": 1,
    "images_quality": 2,
    "additional_rating": 1,
    "additional_comment": "Headline etwas dramatisch, Inhalt aber prüfbar."
  }'::jsonb,
  now() - interval '9 days',
  now() - interval '9 days',
  now() - interval '9 days'
),
(
  'cc7b1aa2-4d8e-4b79-9c32-2f8a0b3e4d21',
  '3a7c2a67-0f41-4c17-a5f8-2e6b4ad0a9d7',
  (SELECT id FROM auth.users WHERE email = 'anna.schmidt@example.com'),
  '{
    "keyword_type": ["Greenland", "Denmark", "Military option"],
    "grammar": 1,
    "structure": 1,
    "headline": 2,
    "objectivity": 1,
    "perspectives": 1,
    "external_sources": 2,
    "claims_match_sources": 1,
    "public_media_match": 1,
    "author_credentials": 1,
    "images_quality": 2,
    "additional_rating": 1,
    "additional_comment": "Gute Stichwortbasis für Cross-Checks mit anderen Medien."
  }'::jsonb,
  now() - interval '8 days',
  now() - interval '8 days',
  now() - interval '8 days'
),

-- 9) Case: Euronews (9f4b66d3...)
(
  '2b48a6df-9d3a-4c2f-9c91-9e7c4b2a1c10',
  '9f4b66d3-70f3-4d8c-9d35-3f3b64e3c46b',
  (SELECT id FROM auth.users WHERE email = 'gorm-labenz@hotmail.com'),
  '{
    "keyword_type": ["Kälte", "Europa", "Schnee", "Tote", "Chaos"],
    "content_type": ["nachrichtenartikel"],
    "grammar": 1,
    "structure": 1,
    "headline": 2,
    "objectivity": 1,
    "perspectives": 1,
    "external_sources": 1,
    "claims_match_sources": 1,
    "public_media_match": 1,
    "author_credentials": 1,
    "images_quality": 1,
    "additional_rating": 1,
    "additional_comment": "Etwas boulevardig, aber grundsätzlich plausibel."
  }'::jsonb,
  now() - interval '7 days',
  now() - interval '7 days',
  now() - interval '7 days'
),
(
  'f2a2a2a1-8b31-4a73-9f88-9a35a2b1c3d4',
  '9f4b66d3-70f3-4d8c-9d35-3f3b64e3c46b',
  (SELECT id FROM auth.users WHERE email = 'anna.schmidt@example.com'),
  '{
    "keyword_type": ["weather disruption", "travel", "ice"],
    "grammar": 1,
    "structure": 1,
    "headline": 2,
    "objectivity": 1,
    "perspectives": 1,
    "external_sources": 1,
    "claims_match_sources": 1,
    "public_media_match": 1,
    "author_credentials": 1,
    "images_quality": 1,
    "additional_rating": 1,
    "additional_comment": "Würde Zahlen (Tote/Orte) gegen Agenturmeldungen prüfen."
  }'::jsonb,
  now() - interval '6 days',
  now() - interval '6 days',
  now() - interval '6 days'
),

-- 10) Case: Süddeutsche (0a3c6f1a...)
(
  '7d1d9d6d-5c3c-4a23-9b8a-0e1c2d3f4a55',
  '0a3c6f1a-9360-4a27-8bf2-58b5b4f4983f',
  (SELECT id FROM auth.users WHERE email = 'gorm-labenz@hotmail.com'),
  '{
    "keyword_type": ["Ukraine", "Sicherheitsgarantien", "Europa", "Macron", "Merz"],
    "content_type": ["nachrichtenartikel"],
    "grammar": 0,
    "structure": 1,
    "headline": 1,
    "objectivity": 1,
    "perspectives": 1,
    "external_sources": 1,
    "claims_match_sources": 0,
    "public_media_match": 0,
    "author_credentials": 1,
    "images_quality": 2,
    "additional_rating": 1,
    "additional_comment": "Inhalt wirkt seriös, aber klarer Trennstrich Bericht/Analyse wäre gut."
  }'::jsonb,
  now() - interval '5 days',
  now() - interval '5 days',
  now() - interval '5 days'
),
(
  '4f4a2a19-0d11-49b8-9a01-1c2b3a4d5e66',
  '0a3c6f1a-9360-4a27-8bf2-58b5b4f4983f',
  (SELECT id FROM auth.users WHERE email = 'anna.schmidt@example.com'),
  '{
    "keyword_type": ["Europe security", "Ukraine aid", "negotiations"],
    "grammar": 0,
    "structure": 1,
    "headline": 1,
    "objectivity": 1,
    "perspectives": 1,
    "external_sources": 1,
    "claims_match_sources": 0,
    "public_media_match": 0,
    "author_credentials": 1,
    "images_quality": 2,
    "additional_rating": 1,
    "additional_comment": "Gute Basis, würde aber noch Primärquellen/Statements verlinken."
  }'::jsonb,
  now() - interval '4 days',
  now() - interval '4 days',
  now() - interval '4 days'
)

;

-- =========================================================
-- TEXT CASES (10) -> 20 reviews
-- =========================================================

INSERT INTO public."review_answers_submitted"
(id, case_id, reviewed_by, data, created_at, submitted_at, updated_at)
VALUES

-- 1) Case: 2222 (Klima-Text)
(
  '1b0c2a12-7b2b-4a2a-9b2b-8c2a1b0c2a12',
  '22222222-2222-4222-8222-222222222222',
  (SELECT id FROM auth.users WHERE email = 'gorm-labenz@hotmail.com'),
  '{
    "keyword_type": ["Klimapolitik", "CO2", "Emissionen", "Gesetze", "Energiewende"],
    "content_type": ["nachrichtenartikel"],
    "grammar": 1,
    "structure": 1,
    "headline": 2,
    "objectivity": 1,
    "perspectives": 1,
    "external_sources": 2,
    "claims_match_sources": 2,
    "public_media_match": 1,
    "author_credentials": 2,
    "images_quality": 3,
    "additional_rating": 2,
    "additional_comment": "Ohne Quellenangaben schwer überprüfbar – klingt eher wie Zusammenfassung."
  }'::jsonb,
  now() - interval '9 days',
  now() - interval '9 days',
  now() - interval '9 days'
),
(
  '2a12b0c2-7b2b-4a2a-9b2b-8c2a1b0c2a13',
  '22222222-2222-4222-8222-222222222222',
  (SELECT id FROM auth.users WHERE email = 'anna.schmidt@example.com'),
  '{
    "keyword_type": ["Klimawandel", "Politik", "Maßnahmen"],
    "grammar": 1,
    "structure": 1,
    "headline": 2,
    "objectivity": 1,
    "perspectives": 1,
    "external_sources": 2,
    "claims_match_sources": 2,
    "public_media_match": 1,
    "author_credentials": 2,
    "images_quality": 3,
    "additional_rating": 2,
    "additional_comment": "Inhalt okay, aber als Faktcheck-Fall fehlen Links/Belege."
  }'::jsonb,
  now() - interval '8 days',
  now() - interval '8 days',
  now() - interval '8 days'
),

-- 2) WhatsApp Bargeld-Verbot (c3a9...)
(
  '3c0d9e1f-1a2b-4c3d-9e1f-0a1b2c3d4e51',
  'c3a9ef3c-3c4a-4ff2-b5a3-f7d31a8bb2b0',
  (SELECT id FROM auth.users WHERE email = 'gorm-labenz@hotmail.com'),
  '{
    "keyword_type": ["Bargeld", "EU", "Verbot", "Kettenbrief", "Panikmache"],
    "content_type": ["Werbung"],
    "grammar": 2,
    "structure": 2,
    "headline": 3,
    "objectivity": 3,
    "perspectives": 3,
    "external_sources": 3,
    "claims_match_sources": 3,
    "public_media_match": 3,
    "author_credentials": 3,
    "images_quality": 3,
    "additional_rating": 3,
    "additional_comment": "Klassische Panik-Weiterleitung ohne Quelle – sehr unseriös."
  }'::jsonb,
  now() - interval '14 days',
  now() - interval '14 days',
  now() - interval '14 days'
),
(
  '4e51c0d9-1a2b-4c3d-9e1f-0a1b2c3d4e52',
  'c3a9ef3c-3c4a-4ff2-b5a3-f7d31a8bb2b0',
  (SELECT id FROM auth.users WHERE email = 'anna.schmidt@example.com'),
  '{
    "keyword_type": ["cash ban", "EU law", "hoax"],
    "grammar": 2,
    "structure": 2,
    "headline": 3,
    "objectivity": 3,
    "perspectives": 3,
    "external_sources": 3,
    "claims_match_sources": 3,
    "public_media_match": 3,
    "author_credentials": 3,
    "images_quality": 3,
    "additional_rating": 3,
    "additional_comment": "Sieht nach typischem Fake/Scam aus, keine Nachweise."
  }'::jsonb,
  now() - interval '13 days',
  now() - interval '13 days',
  now() - interval '13 days'
),

-- 3) WHO Screenshot (8d1a...)
(
  '5a9b7c6d-2e3f-4a5b-9c6d-1e2f3a4b5c61',
  '8d1a4a35-8b7c-44c1-8f1a-1a4d1e8d3b5e',
  (SELECT id FROM auth.users WHERE email = 'gorm-labenz@hotmail.com'),
  '{
    "keyword_type": ["WHO", "Lockdown", "Geheimplan", "Screenshot", "Telegram"],
    "content_type": ["bild"],
    "grammar": 2,
    "structure": 2,
    "headline": 3,
    "objectivity": 3,
    "perspectives": 3,
    "external_sources": 3,
    "claims_match_sources": 3,
    "public_media_match": 3,
    "author_credentials": 3,
    "images_quality": 2,
    "additional_rating": 3,
    "additional_comment": "Nur Screenshot ohne Kontext – sehr anfällig für Fälschung."
  }'::jsonb,
  now() - interval '23 days',
  now() - interval '23 days',
  now() - interval '23 days'
),
(
  '6c61a9b7-2e3f-4a5b-9c6d-1e2f3a4b5c62',
  '8d1a4a35-8b7c-44c1-8f1a-1a4d1e8d3b5e',
  (SELECT id FROM auth.users WHERE email = 'anna.schmidt@example.com'),
  '{
    "keyword_type": ["WHO document", "fake screenshot", "lockdown rumor"],
    "grammar": 2,
    "structure": 2,
    "headline": 3,
    "objectivity": 3,
    "perspectives": 3,
    "external_sources": 3,
    "claims_match_sources": 3,
    "public_media_match": 3,
    "author_credentials": 3,
    "images_quality": 2,
    "additional_rating": 3,
    "additional_comment": "Ohne Link/Metadaten praktisch nicht verifizierbar."
  }'::jsonb,
  now() - interval '22 days',
  now() - interval '22 days',
  now() - interval '22 days'
),

-- 4) Windräder CO2 (2b0c...)
(
  '7d8e9f01-1111-4a2b-8c3d-4e5f6a7b8c71',
  '2b0c9d51-4a1f-4c2e-9a4f-5e2b1e7c0a9f',
  (SELECT id FROM auth.users WHERE email = 'gorm-labenz@hotmail.com'),
  '{
    "keyword_type": ["Windräder", "CO2", "Kohlekraft", "Grafik", "Studie"],
    "content_type": ["Meinung"],
    "grammar": 2,
    "structure": 2,
    "headline": 2,
    "objectivity": 3,
    "perspectives": 3,
    "external_sources": 3,
    "claims_match_sources": 3,
    "public_media_match": 2,
    "author_credentials": 3,
    "images_quality": 2,
    "additional_rating": 3,
    "additional_comment": "Behauptung extrem – ohne belastbare Quelle nicht glaubwürdig."
  }'::jsonb,
  now() - interval '17 days',
  now() - interval '17 days',
  now() - interval '17 days'
),
(
  '8c71d8e9-1111-4a2b-8c3d-4e5f6a7b8c72',
  '2b0c9d51-4a1f-4c2e-9a4f-5e2b1e7c0a9f',
  (SELECT id FROM auth.users WHERE email = 'anna.schmidt@example.com'),
  '{
    "keyword_type": ["wind turbines", "emissions", "misinfo"],
    "grammar": 2,
    "structure": 2,
    "headline": 2,
    "objectivity": 3,
    "perspectives": 3,
    "external_sources": 3,
    "claims_match_sources": 3,
    "public_media_match": 2,
    "author_credentials": 3,
    "images_quality": 2,
    "additional_rating": 3,
    "additional_comment": "Typische Viral-These, Belege fehlen."
  }'::jsonb,
  now() - interval '16 days',
  now() - interval '16 days',
  now() - interval '16 days'
),

-- 5) Wahlsoftware-Thread (bd1f...)
(
  '9a0b1c2d-3e4f-4a5b-9c6d-7e8f9a0b1c81',
  'bd1f0b74-1c77-4e1b-9a1f-0b7c1a1d2e3f',
  (SELECT id FROM auth.users WHERE email = 'gorm-labenz@hotmail.com'),
  '{
    "keyword_type": ["Wahl", "Manipulation", "Software", "Beweise", "Thread"],
    "content_type": ["nachrichtenartikel"],
    "grammar": 2,
    "structure": 3,
    "headline": 3,
    "objectivity": 3,
    "perspectives": 3,
    "external_sources": 3,
    "claims_match_sources": 3,
    "public_media_match": 3,
    "author_credentials": 3,
    "images_quality": 3,
    "additional_rating": 3,
    "additional_comment": "Viele Behauptungen, keine überprüfbaren Quellen – wirkt wie Desinfo."
  }'::jsonb,
  now() - interval '12 days',
  now() - interval '12 days',
  now() - interval '12 days'
),
(
  '0b1c2d3e-4f50-4a5b-9c6d-7e8f9a0b1c82',
  'bd1f0b74-1c77-4e1b-9a1f-0b7c1a1d2e3f',
  (SELECT id FROM auth.users WHERE email = 'anna.schmidt@example.com'),
  '{
    "keyword_type": ["election fraud", "software", "conspiracy"],
    "grammar": 2,
    "structure": 3,
    "headline": 3,
    "objectivity": 3,
    "perspectives": 3,
    "external_sources": 3,
    "claims_match_sources": 3,
    "public_media_match": 3,
    "author_credentials": 3,
    "images_quality": 3,
    "additional_rating": 3,
    "additional_comment": "Klingt nach Verschwörungsnarrativ, nicht nach Recherche."
  }'::jsonb,
  now() - interval '11 days',
  now() - interval '11 days',
  now() - interval '11 days'
),

-- 6) Impfpflicht-Chainmail (7c0b...)
(
  '1c2d3e4f-5061-4a2b-8c3d-4e5f6a7b8c91',
  '7c0b1d2e-3f4a-5b6c-7d8e-9f0a1b2c3d4e',
  (SELECT id FROM auth.users WHERE email = 'gorm-labenz@hotmail.com'),
  '{
    "keyword_type": ["Impfpflicht", "Regierung", "Artikel 12", "Kettenbrief", "Gesetz"],
    "content_type": ["Werbung"],
    "grammar": 2,
    "structure": 2,
    "headline": 3,
    "objectivity": 3,
    "perspectives": 3,
    "external_sources": 3,
    "claims_match_sources": 3,
    "public_media_match": 3,
    "author_credentials": 3,
    "images_quality": 3,
    "additional_rating": 3,
    "additional_comment": "Reine Behauptung mit falschem Rechtsbezug – sehr fragwürdig."
  }'::jsonb,
  now() - interval '10 days',
  now() - interval '10 days',
  now() - interval '10 days'
),
(
  '2d3e4f50-6171-4a2b-8c3d-4e5f6a7b8c92',
  '7c0b1d2e-3f4a-5b6c-7d8e-9f0a1b2c3d4e',
  (SELECT id FROM auth.users WHERE email = 'anna.schmidt@example.com'),
  '{
    "keyword_type": ["mandatory vaccination", "fake law", "chain message"],
    "grammar": 2,
    "structure": 2,
    "headline": 3,
    "objectivity": 3,
    "perspectives": 3,
    "external_sources": 3,
    "claims_match_sources": 3,
    "public_media_match": 3,
    "author_credentials": 3,
    "images_quality": 3,
    "additional_rating": 3,
    "additional_comment": "Ohne genaue Gesetzesstelle/Link nicht ernst zu nehmen."
  }'::jsonb,
  now() - interval '9 days',
  now() - interval '9 days',
  now() - interval '9 days'
),

-- 7) Heizungsverbot-Post (9a8b...)
(
  '3e4f5061-7181-4a2b-8c3d-4e5f6a7b8ca1',
  '9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d',
  (SELECT id FROM auth.users WHERE email = 'gorm-labenz@hotmail.com'),
  '{
    "keyword_type": ["Heizung", "Verbot", "Deutschland", "Gesetz", "Facebook"],
    "content_type": ["nachrichtenartikel"],
    "grammar": 2,
    "structure": 2,
    "headline": 3,
    "objectivity": 3,
    "perspectives": 2,
    "external_sources": 3,
    "claims_match_sources": 3,
    "public_media_match": 2,
    "author_credentials": 3,
    "images_quality": 3,
    "additional_rating": 3,
    "additional_comment": "Wirkt wie verkürzte/verdrehte Behauptung ohne Nachweis."
  }'::jsonb,
  now() - interval '8 days',
  now() - interval '8 days',
  now() - interval '8 days'
),
(
  '4f506171-8191-4a2b-8c3d-4e5f6a7b8ca2',
  '9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d',
  (SELECT id FROM auth.users WHERE email = 'anna.schmidt@example.com'),
  '{
    "keyword_type": ["heating ban", "Germany", "misleading claim"],
    "grammar": 2,
    "structure": 2,
    "headline": 3,
    "objectivity": 3,
    "perspectives": 2,
    "external_sources": 3,
    "claims_match_sources": 3,
    "public_media_match": 2,
    "author_credentials": 3,
    "images_quality": 3,
    "additional_rating": 3,
    "additional_comment": "Typischer Social-Media-Take ohne Kontext."
  }'::jsonb,
  now() - interval '7 days',
  now() - interval '7 days',
  now() - interval '7 days'
),

-- 8) Fake-Tagesschau Screenshot (4d3c...)
(
  '50617181-9201-4a2b-8c3d-4e5f6a7b8cb1',
  '4d3c2b1a-0f9e-8d7c-6b5a-4f3e2d1c0b9a',
  (SELECT id FROM auth.users WHERE email = 'gorm-labenz@hotmail.com'),
  '{
    "keyword_type": ["Tagesschau", "Eilmeldung", "Grenzschließung", "Screenshot", "Fake"],
    "content_type": ["bild"],
    "grammar": 3,
    "structure": 3,
    "headline": 3,
    "objectivity": 3,
    "perspectives": 3,
    "external_sources": 3,
    "claims_match_sources": 3,
    "public_media_match": 3,
    "author_credentials": 3,
    "images_quality": 2,
    "additional_rating": 3,
    "additional_comment": "Screenshot ohne URL ist extrem verdächtig – leicht zu fälschen."
  }'::jsonb,
  now() - interval '6 days',
  now() - interval '6 days',
  now() - interval '6 days'
),
(
  '61718192-0301-4a2b-8c3d-4e5f6a7b8cb2',
  '4d3c2b1a-0f9e-8d7c-6b5a-4f3e2d1c0b9a',
  (SELECT id FROM auth.users WHERE email = 'anna.schmidt@example.com'),
  '{
    "keyword_type": ["tagesschau screenshot", "fake breaking news"],
    "grammar": 3,
    "structure": 3,
    "headline": 3,
    "objectivity": 3,
    "perspectives": 3,
    "external_sources": 3,
    "claims_match_sources": 3,
    "public_media_match": 3,
    "author_credentials": 3,
    "images_quality": 2,
    "additional_rating": 3,
    "additional_comment": "Ohne Originalquelle praktisch immer Fake-Verdacht."
  }'::jsonb,
  now() - interval '5 days',
  now() - interval '5 days',
  now() - interval '5 days'
),

-- 9) Polizei Handy durchsuchen (1a2b...)
(
  '71819203-0405-4a2b-8c3d-4e5f6a7b8cc1',
  '1a2b3c4d-5e6f-7081-92a3-b4c5d6e7f809',
  (SELECT id FROM auth.users WHERE email = 'gorm-labenz@hotmail.com'),
  '{
    "keyword_type": ["Polizei", "Handy", "Durchsuchung", "Gesetz", "Bundesgesetzblatt"],
    "content_type": ["nachrichtenartikel"],
    "grammar": 2,
    "structure": 2,
    "headline": 2,
    "objectivity": 2,
    "perspectives": 2,
    "external_sources": 3,
    "claims_match_sources": 3,
    "public_media_match": 2,
    "author_credentials": 3,
    "images_quality": 3,
    "additional_rating": 2,
    "additional_comment": "Könnte einen wahren Kern haben, aber so formuliert stark überzogen."
  }'::jsonb,
  now() - interval '4 days',
  now() - interval '4 days',
  now() - interval '4 days'
),
(
  '81920304-0506-4a2b-8c3d-4e5f6a7b8cc2',
  '1a2b3c4d-5e6f-7081-92a3-b4c5d6e7f809',
  (SELECT id FROM auth.users WHERE email = 'anna.schmidt@example.com'),
  '{
    "keyword_type": ["phone search", "police powers", "Germany"],
    "grammar": 2,
    "structure": 2,
    "headline": 2,
    "objectivity": 2,
    "perspectives": 2,
    "external_sources": 3,
    "claims_match_sources": 3,
    "public_media_match": 2,
    "author_credentials": 3,
    "images_quality": 3,
    "additional_rating": 2,
    "additional_comment": "Für Bewertung bräuchte ich konkrete Gesetzes-/Urteilsreferenzen."
  }'::jsonb,
  now() - interval '3 days',
  now() - interval '3 days',
  now() - interval '3 days'
),

-- 10) Phishing SMS (89ab...)
(
  '92030405-0607-4a2b-8c3d-4e5f6a7b8cd1',
  '89abcdef-0123-489a-8bcd-ef0123456789',
  (SELECT id FROM auth.users WHERE email = 'gorm-labenz@hotmail.com'),
  '{
    "keyword_type": ["SMS", "Konto", "gesperrt", "EU-Regeln", "Phishing"],
    "content_type": ["Werbung"],
    "grammar": 3,
    "structure": 3,
    "headline": 3,
    "objectivity": 3,
    "perspectives": 3,
    "external_sources": 3,
    "claims_match_sources": 3,
    "public_media_match": 3,
    "author_credentials": 3,
    "images_quality": 3,
    "additional_rating": 3,
    "additional_comment": "Sehr klarer Scam-Indikator (Druck, Link, Drohung)."
  }'::jsonb,
  now() - interval '2 days',
  now() - interval '2 days',
  now() - interval '2 days'
),
(
  '03040506-0708-4a2b-8c3d-4e5f6a7b8cd2',
  '89abcdef-0123-489a-8bcd-ef0123456789',
  (SELECT id FROM auth.users WHERE email = 'anna.schmidt@example.com'),
  '{
    "keyword_type": ["phishing sms", "account locked", "fake link"],
    "grammar": 3,
    "structure": 3,
    "headline": 3,
    "objectivity": 3,
    "perspectives": 3,
    "external_sources": 3,
    "claims_match_sources": 3,
    "public_media_match": 3,
    "author_credentials": 3,
    "images_quality": 3,
    "additional_rating": 3,
    "additional_comment": "Eindeutig betrügerisch – nicht anklicken."
  }'::jsonb,
  now() - interval '36 hours',
  now() - interval '36 hours',
  now() - interval '36 hours'
)

;