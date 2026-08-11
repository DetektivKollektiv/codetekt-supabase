-- Keep the Landtagswahl challenge visible while the UI is being adjusted locally.
update public.challenge_configs
set
  starts_on = '2026-08-01',
  ends_on = '2026-08-20',
  visible_from = '2026-08-01 00:00:00+00'::timestamptz,
  visible_until = '2026-08-20 23:59:59.999+00'::timestamptz,
  updated_at = now()
where id = 'd8d52b11-f3f9-4a0e-a4f6-1f4bb9f6b8ef';
