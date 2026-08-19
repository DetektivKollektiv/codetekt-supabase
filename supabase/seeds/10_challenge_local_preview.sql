-- Keep the production challenge visible during local development.
update public.challenge_configs
set
  starts_on = '2026-08-01',
  ends_on = '2026-08-20',
  visible_from = '2026-08-01 00:00:00 Europe/Berlin'::timestamptz,
  visible_until = '2026-08-20 23:59:59.999 Europe/Berlin'::timestamptz,
  messages = $json$
    [
      {
        "contentHtml": "<p>Die Challenge ist live: Löst gemeinsam 100 Fälle bis zum 20. August und schaut täglich rein, welche Ziele die Community erreicht.</p>",
        "visibleFrom": "2026-08-01T00:00:00+02:00",
        "visibleUntil": "2026-08-20T23:59:59.999+02:00"
      }
    ]
  $json$::jsonb,
  updated_at = now()
where id = 'd8d52b11-f3f9-4a0e-a4f6-1f4bb9f6b8ef';
