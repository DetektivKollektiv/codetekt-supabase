update public.challenge_configs
set
  content = jsonb_set(
    content,
    '{trustShares}',
    $json$
      {
        "title": "Trust-Shares",
        "count": 0,
        "description": "So viele Fälle wurden bereits von der Community geteilt"
      }
    $json$::jsonb,
    true
  ),
  updated_at = now()
where id = 'd8d52b11-f3f9-4a0e-a4f6-1f4bb9f6b8ef';
