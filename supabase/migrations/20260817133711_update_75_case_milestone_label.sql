update public.challenge_configs
set
  content = jsonb_set(
    content,
    '{milestones,2,label}',
    '"Mehr Gewinne"'::jsonb
  ),
  updated_at = now()
where id = 'd8d52b11-f3f9-4a0e-a4f6-1f4bb9f6b8ef'
  and content #>> '{milestones,2,value}' = '75';
