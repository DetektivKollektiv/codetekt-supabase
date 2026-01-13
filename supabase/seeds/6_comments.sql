-- ============================================
-- SEED: Case Comments System
-- Test-Daten für Kommentare, Moderationen, Likes und Reports
-- ============================================

-- ============================================
-- CASE COMMENTS
-- ============================================

-- Case 1: Mehrere Kommentare (normale Diskussion)
INSERT INTO public.case_comments (
  id,
  case_id,
  author_id,
  content,
  created_at
) VALUES 
  -- Gorm's Kommentar
  (
    'c0000001-0001-4001-8001-000000000001',
    '11111111-1111-4111-8111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Interessanter Fall. Die Quelle wirkt auf den ersten Blick seriös, aber einige Behauptungen sind nicht ausreichend belegt.',
    now() - interval '1 day 3 hours'
  ),
  -- Anna's Kommentar
  (
    'c0000001-0001-4001-8001-000000000002',
    '11111111-1111-4111-8111-111111111111',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Stimme zu. Besonders die Statistiken im dritten Absatz sollten genauer geprüft werden.',
    now() - interval '1 day 1 hour'
  ),
  -- Max's Kommentar
  (
    'c0000001-0001-4001-8001-000000000003',
    '11111111-1111-4111-8111-111111111111',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'Hat jemand die Originalquelle der Studie gefunden? Würde gerne selbst nachprüfen.',
    now() - interval '20 hours'
  ),
  -- Lisa's Kommentar
  (
    'c0000001-0001-4001-8001-000000000004',
    '11111111-1111-4111-8111-111111111111',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'Hier ist der Link zur Originalstudie: https://example.com/original-study. Die Daten sind von 2023.',
    now() - interval '18 hours'
  ),
  -- Gorm's bearbeiteter Kommentar (wird später editiert)
  (
    'c0000001-0001-4001-8001-000000000005',
    '11111111-1111-4111-8111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Habe Zweifel an der Glaubwürdigkeit dieser Quelle.',
    now() - interval '12 hours'
  );

-- Update: Simuliere Edit bei Gorm's zweitem Kommentar
UPDATE public.case_comments
SET 
  content = 'Update: Nach nochmaliger Prüfung muss ich meine Einschätzung korrigieren. Die Quelle ist vertrauenswürdig.',
  edited_at = now() - interval '10 hours',
  updated_at = now() - interval '10 hours'
WHERE id = 'c0000001-0001-4001-8001-000000000005';

-- Case 2: Kommentare mit problematischen Inhalten
INSERT INTO public.case_comments (
  id,
  case_id,
  author_id,
  content,
  created_at
) VALUES 
  -- Normaler Kommentar
  (
    'c0000002-0002-4002-8002-000000000001',
    '22222222-2222-4222-8222-222222222222',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'Die Klimapolitik-Analyse ist sehr gut recherchiert und ausgewogen.',
    now() - interval '18 hours'
  ),
  -- Spam-Kommentar (wird moderiert)
  (
    'c0000002-0002-4002-8002-000000000002',
    '22222222-2222-4222-8222-222222222222',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'JETZT HIER KLICKEN!!! Verdiene 5000€ pro Tag von zu Hause!!! www.spam-site.com',
    now() - interval '15 hours'
  ),
  -- Beleidigender Kommentar (wird moderiert)
  (
    'c0000002-0002-4002-8002-000000000003',
    '22222222-2222-4222-8222-222222222222',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'Die Autorin hat keine Ahnung wovon sie spricht. Absoluter Schwachsinn!',
    now() - interval '10 hours'
  ),
  -- Normaler Kommentar nach Moderation
  (
    'c0000002-0002-4002-8002-000000000004',
    '22222222-2222-4222-8222-222222222222',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Wichtiger Punkt zur CO2-Bepreisung: Die aktuellen Modelle berücksichtigen soziale Gerechtigkeit nicht ausreichend.',
    now() - interval '5 hours'
  ),
  -- Kommentar moderiert von Admin der später gelöscht wird (NULL test)
  (
    'c0000002-0002-4002-8002-000000000005',
    '22222222-2222-4222-8222-222222222222',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Dies ist ein Testkommentar für gelöschten Moderator.',
    now() - interval '3 hours'
  );

-- ============================================
-- MODERATIONS (versteckte Kommentare)
-- ============================================

INSERT INTO public.case_comment_moderations (
  id,
  comment_id,
  reason,
  moderated_by,
  moderated_at
) VALUES 
  -- Spam moderiert (von Gorm)
  (
    'a0000001-0001-4001-8001-000000000001',
    'c0000002-0002-4002-8002-000000000002',
    'Dieser Kommentar wurde als Spam identifiziert und verstößt gegen unsere Richtlinien zu Werbung und kommerziellen Inhalten.',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',  -- Gorm (Admin)
    now() - interval '14 hours'
  ),
  -- Beleidigung moderiert (von Gorm)
  (
    'a0000002-0002-4002-8002-000000000002',
    'c0000002-0002-4002-8002-000000000003',
    'Dieser Kommentar verstößt gegen unsere Nutzerrichtlinien bezüglich respektvoller Kommunikation und wurde ausgeblendet.',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',  -- Gorm (Admin)
    now() - interval '9 hours'
  ),
  -- Moderation mit NULL moderator (simuliert gelöschten Admin)
  (
    'a0000003-0003-4003-8003-000000000003',
    'c0000002-0002-4002-8002-000000000005',
    'Dieser Kommentar wurde von einem ehemaligen Administrator moderiert.',
    NULL,  -- Gelöschter Admin
    now() - interval '2 hours'
  );

-- ============================================
-- LIKES
-- ============================================

INSERT INTO public.case_comment_likes (
  id,
  comment_id,
  user_id,
  created_at
) VALUES 
  -- Case 1 Likes
  -- Gorm's erster Kommentar: 3 Likes
  (
    'b0000001-0001-4001-8001-000000000001',
    'c0000001-0001-4001-8001-000000000001',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',  -- Anna liked
    now() - interval '1 day 2 hours'
  ),
  (
    'b0000002-0002-4002-8002-000000000002',
    'c0000001-0001-4001-8001-000000000001',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',  -- Max liked
    now() - interval '1 day 1 hour'
  ),
  (
    'b0000003-0003-4003-8003-000000000003',
    'c0000001-0001-4001-8001-000000000001',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',  -- Lisa liked
    now() - interval '23 hours'
  ),
  
  -- Anna's Kommentar: 2 Likes
  (
    'b0000004-0004-4004-8004-000000000004',
    'c0000001-0001-4001-8001-000000000002',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',  -- Gorm liked
    now() - interval '1 day'
  ),
  (
    'b0000005-0005-4005-8005-000000000005',
    'c0000001-0001-4001-8001-000000000002',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',  -- Max liked
    now() - interval '22 hours'
  ),
  
  -- Lisa's Kommentar: 4 Likes (sehr hilfreich mit Link)
  (
    'b0000006-0006-4006-8006-000000000006',
    'c0000001-0001-4001-8001-000000000004',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',  -- Gorm liked
    now() - interval '17 hours'
  ),
  (
    'b0000007-0007-4007-8007-000000000007',
    'c0000001-0001-4001-8001-000000000004',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',  -- Anna liked
    now() - interval '16 hours'
  ),
  (
    'b0000008-0008-4008-8008-000000000008',
    'c0000001-0001-4001-8001-000000000004',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',  -- Max liked
    now() - interval '15 hours'
  ),
  (
    'b0000009-0009-4009-8009-000000000009',
    'c0000001-0001-4001-8001-000000000004',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',  -- Lisa liked (eigener Kommentar)
    now() - interval '14 hours'
  ),
  
  -- Case 2 Likes
  -- Max's Kommentar: 1 Like
  (
    'b0000010-0010-4010-8010-000000000010',
    'c0000002-0002-4002-8002-000000000001',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',  -- Anna liked
    now() - interval '17 hours'
  ),
  
  -- Gorm's Kommentar: 2 Likes
  (
    'b0000011-0011-4011-8011-000000000011',
    'c0000002-0002-4002-8002-000000000004',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',  -- Anna liked
    now() - interval '4 hours'
  ),
  (
    'b0000012-0012-4012-8012-000000000012',
    'c0000002-0002-4002-8002-000000000004',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',  -- Max liked
    now() - interval '3 hours'
  );

-- ============================================
-- REPORTS
-- ============================================

INSERT INTO public.case_comment_reports (
  id,
  comment_id,
  reported_by,
  reason,
  created_at
) VALUES 
  -- Spam Reports (führte zur Moderation)
  (
    'd0000001-0001-4001-8001-000000000001',
    'c0000002-0002-4002-8002-000000000002',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',  -- Gorm reported
    'Offensichtlicher Spam mit externem Link zu dubioser Website.',
    now() - interval '15 hours'
  ),
  
  -- Beleidigung Reports (führte zur Moderation)
  (
    'd0000002-0002-4002-8002-000000000002',
    'c0000002-0002-4002-8002-000000000003',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',  -- Anna reported
    'Unangemessene und beleidigende Sprache gegenüber der Autorin.',
    now() - interval '11 hours'
  ),
  
  -- Zweiter Report für denselben Kommentar von anderem User
  (
    'd0000003-0003-4003-8003-000000000003',
    'c0000002-0002-4002-8002-000000000003',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',  -- Lisa reported auch
    'Völlig unangebrachter Ton.',
    now() - interval '10 hours'
  ),
  
  -- Unresolved Report (noch zu prüfen)
  (
    'd0000004-0004-4004-8004-000000000004',
    'c0000001-0001-4001-8001-000000000003',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',  -- Lisa reported
    'Die Behauptung über die Originalquelle scheint nicht korrekt zu sein.',
    now() - interval '2 hours'
  ),
  
  -- Unresolved Report (false positive - wird später als unbegründet markiert)
  (
    'd0000005-0005-4005-8005-000000000005',
    'c0000001-0001-4001-8001-000000000002',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',  -- Max reported
    'Ich glaube das ist Desinformation',
    now() - interval '5 hours'
  );

-- ============================================
-- Zusammenfassung der Test-Daten
-- ============================================

-- Case 1 (Ukraine-Artikel):
--   - 5 Kommentare (1 davon editiert)
--   - 0 Moderationen
--   - 9 Likes verteilt
--   - 2 unresolved Reports

-- Case 2 (Klimapolitik):
--   - 5 Kommentare (3 davon versteckt durch Moderation)
--   - 3 Moderationen (Spam + Beleidigung + NULL moderator)
--   - 3 Likes
--   - 3 Reports (2x derselbe moderierte Kommentar)

-- Insgesamt:
--   - 10 Kommentare (3 versteckt, 1 editiert)
--   - 3 Moderationen (1 mit NULL moderator für gelöschten Admin)
--   - 12 Likes
--   - 5 Reports (3 für moderierte Comments, 2 für nicht-moderierte)
--   - Alle 4 Test-User haben interagiert

-- ============================================
-- Test-Szenarien abgedeckt:
-- ============================================
-- ✅ Normale Kommentare
-- ✅ Editierte Kommentare (mit edited_at)
-- ✅ Moderierte Kommentare (versteckt)
-- ✅ Moderation mit gelöschtem Admin (moderated_by = NULL)
-- ✅ Likes auf verschiedene Kommentare
-- ✅ Mehrere Reports für denselben Kommentar
-- ✅ Unresolved Reports (Admin-Queue)
-- ✅ GDPR-Test: User-Löschung → CASCADE
-- ✅ Admin-Löschung → Moderationen bleiben mit NULL