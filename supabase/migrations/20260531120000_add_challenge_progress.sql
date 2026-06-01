create table if not exists public.challenge_configs (
  id uuid primary key default gen_random_uuid(),
  is_active boolean not null default false,
  starts_on date not null,
  ends_on date not null,
  content jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint challenge_configs_valid_date_range check (ends_on >= starts_on),
  constraint challenge_configs_content_is_object check (jsonb_typeof(content) = 'object')
);

create unique index if not exists challenge_configs_single_active_idx
  on public.challenge_configs (is_active)
  where is_active;

alter table public.challenge_configs enable row level security;

drop policy if exists "Anyone can read active challenge configs" on public.challenge_configs;
create policy "Anyone can read active challenge configs"
  on public.challenge_configs
  for select
  to anon, authenticated
  using (is_active);

drop policy if exists "Admins can manage challenge configs" on public.challenge_configs;
create policy "Admins can manage challenge configs"
  on public.challenge_configs
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.is_admin
        and not profiles.is_deactivated
    )
  )
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.is_admin
        and not profiles.is_deactivated
    )
  );

create or replace function public.get_challenge_progress(
  challenge_starts_on date,
  challenge_ends_on date,
  tag_values text[] default '{}'::text[],
  leaderboard_limit integer default 5
)
returns table (
  total_resolved_cases integer,
  daily_resolved_cases jsonb,
  tag_goal_results jsonb,
  leaderboard jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  with challenge_reviews as (
    select
      review_answers_submitted.id,
      review_answers_submitted.case_id,
      review_answers_submitted.reviewed_by,
      review_answers_submitted.submitted_at::date as submitted_on
    from public.review_answers_submitted
    where review_answers_submitted.submitted_at::date
      between challenge_starts_on and challenge_ends_on
  ),
  days as (
    select generate_series(
      challenge_starts_on,
      challenge_ends_on,
      '1 day'::interval
    )::date as resolved_on
  ),
  daily_counts as (
    select
      challenge_reviews.submitted_on,
      count(*)::integer as resolved_cases
    from challenge_reviews
    group by challenge_reviews.submitted_on
  ),
  daily_json as (
    select jsonb_agg(
      jsonb_build_object(
        'date',
        days.resolved_on,
        'resolvedCases',
        coalesce(daily_counts.resolved_cases, 0)
      )
      order by days.resolved_on
    ) as data
    from days
    left join daily_counts
      on daily_counts.submitted_on = days.resolved_on
  ),
  tag_input as (
    select unnest(coalesce(tag_values, '{}'::text[])) as tag_value
  ),
  tagged_reviews as (
    select distinct
      tag_input.tag_value,
      challenge_reviews.id as review_id
    from tag_input
    join public.case_keywords
      on tag_input.tag_value = any(public.case_keywords.values)
    join challenge_reviews
      on challenge_reviews.case_id = public.case_keywords.case_id
  ),
  tag_counts as (
    select
      tag_input.tag_value,
      count(tagged_reviews.review_id)::integer as resolved_cases
    from tag_input
    left join tagged_reviews
      on tagged_reviews.tag_value = tag_input.tag_value
    group by tag_input.tag_value
  ),
  tag_json as (
    select jsonb_agg(
      jsonb_build_object(
        'tagValue',
        tag_counts.tag_value,
        'resolvedCases',
        tag_counts.resolved_cases
      )
      order by array_position(coalesce(tag_values, '{}'::text[]), tag_counts.tag_value)
    ) as data
    from tag_counts
  ),
  leaderboard_rows as (
    select
      challenge_reviews.reviewed_by as user_id,
      coalesce(public.profiles.username, 'Unbekannt') as username,
      count(*)::integer as reviewed_cases,
      count(distinct challenge_reviews.submitted_on)::integer as active_days
    from challenge_reviews
    left join public.profiles
      on public.profiles.id = challenge_reviews.reviewed_by
    where not coalesce(public.profiles.is_deactivated, false)
    group by challenge_reviews.reviewed_by, public.profiles.username
    order by reviewed_cases desc, active_days desc, username asc
    limit greatest(coalesce(leaderboard_limit, 5), 0)
  ),
  leaderboard_json as (
    select jsonb_agg(
      jsonb_build_object(
        'userId',
        leaderboard_rows.user_id,
        'username',
        leaderboard_rows.username,
        'reviewedCases',
        leaderboard_rows.reviewed_cases,
        'activeDays',
        leaderboard_rows.active_days
      )
      order by leaderboard_rows.reviewed_cases desc,
        leaderboard_rows.active_days desc,
        leaderboard_rows.username asc
    ) as data
    from leaderboard_rows
  )
  select
    (select count(*)::integer from challenge_reviews) as total_resolved_cases,
    coalesce((select data from daily_json), '[]'::jsonb) as daily_resolved_cases,
    coalesce((select data from tag_json), '[]'::jsonb) as tag_goal_results,
    coalesce((select data from leaderboard_json), '[]'::jsonb) as leaderboard;
$$;

grant select on public.challenge_configs to anon, authenticated;
grant execute on function public.get_challenge_progress(date, date, text[], integer)
  to anon, authenticated;

insert into public.challenge_configs (
  id,
  is_active,
  starts_on,
  ends_on,
  content
)
values (
  'd8d52b11-f3f9-4a0e-a4f6-1f4bb9f6b8ef',
  true,
  '2026-09-01',
  '2026-09-25',
  '{
    "eyebrow": "Landtagswahlen 2026",
    "title": "Community Challenge",
    "totalTarget": 200,
    "milestones": [0, 50, 100, 150, 200],
    "dailyGoals": [3, 5, 10],
    "descriptionColumns": [
      "codetekt e. V. ist eine gemeinnützige Organisation mit dem Ziel, Strategien zum Erkennen und Eindämmen von Desinformation zu entwickeln.",
      "Gemeinsam fördern wir Medien- und Nachrichtenkompetenz und machen sichtbar, wie weit die Community in der Challenge schon gekommen ist."
    ],
    "tagGoals": [
      {
        "label": "Landtagswahl 2026",
        "tagValue": "Landtagswahl 2026",
        "target": 12
      },
      {
        "label": "KI-Fakes",
        "tagValue": "KI-Fakes",
        "target": 12
      },
      {
        "label": "Demokratie",
        "tagValue": "Demokratie",
        "target": 12
      }
    ],
    "leaderboardLimit": 5
  }'::jsonb
)
on conflict (id) do update
set
  is_active = excluded.is_active,
  starts_on = excluded.starts_on,
  ends_on = excluded.ends_on,
  content = excluded.content,
  updated_at = now();
