update public.challenge_configs
set
  content = jsonb_set(content, '{milestones}', '[0, 50, 75, 100]'::jsonb),
  updated_at = now()
where id = 'd8d52b11-f3f9-4a0e-a4f6-1f4bb9f6b8ef';
