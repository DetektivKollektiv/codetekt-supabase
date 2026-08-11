-- ============================================
-- MIGRATION: Challenge messages
-- ============================================

alter table public.challenge_configs
  add column if not exists messages jsonb default '[]'::jsonb;

update public.challenge_configs
set messages = '[]'::jsonb
where messages is null;

alter table public.challenge_configs
  alter column messages set default '[]'::jsonb,
  alter column messages set not null;

alter table public.challenge_configs
  drop constraint if exists challenge_configs_messages_is_array;

alter table public.challenge_configs
  add constraint challenge_configs_messages_is_array
  check (jsonb_typeof(messages) = 'array');
