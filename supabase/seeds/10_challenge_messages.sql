-- ============================================
-- SEED: Challenge Messages
-- ============================================

update public.challenge_configs
set
  messages = $$[
    {
      "contentHtml": "<p>Die Challenge ist live: Löst gemeinsam 200 Fälle bis zum 20. August und schaut täglich rein, welche Ziele die Community erreicht.</p>",
      "visibleFrom": "2026-08-01T00:00:00+00:00",
      "visibleUntil": "2026-08-20T23:59:59.999+00:00"
    }
  ]$$::jsonb,
  updated_at = now()
where id = 'd8d52b11-f3f9-4a0e-a4f6-1f4bb9f6b8ef';
