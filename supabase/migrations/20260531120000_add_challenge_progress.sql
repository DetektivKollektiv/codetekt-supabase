create table public.challenge_configs (
  id uuid primary key default gen_random_uuid(),
  starts_on date not null,
  ends_on date not null,
  visible_from timestamptz not null,
  visible_until timestamptz not null,
  content jsonb not null,
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint challenge_configs_valid_date_range check (ends_on >= starts_on),
  constraint challenge_configs_valid_visibility_range check (visible_until >= visible_from),
  constraint challenge_configs_content_is_object check (jsonb_typeof(content) = 'object'),
  constraint challenge_configs_messages_is_array check (jsonb_typeof(messages) = 'array')
);

alter table public.challenge_configs enable row level security;

create policy "Anonymous users can read visible challenge configs"
  on public.challenge_configs
  for select
  to anon
  using (
    now() >= visible_from
    and now() <= visible_until
  );

create policy "Authenticated users can read visible challenge configs"
  on public.challenge_configs
  for select
  to authenticated
  using (
    (
      now() >= visible_from
      and now() <= visible_until
    )
    or exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.is_admin
        and not profiles.is_deactivated
    )
  );

create policy "Admins can insert challenge configs"
  on public.challenge_configs
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.is_admin
        and not profiles.is_deactivated
    )
  );

create policy "Admins can update challenge configs"
  on public.challenge_configs
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.is_admin
        and not profiles.is_deactivated
    )
  )
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.is_admin
        and not profiles.is_deactivated
    )
  );

create policy "Admins can delete challenge configs"
  on public.challenge_configs
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.is_admin
        and not profiles.is_deactivated
    )
  );

grant select on table public.challenge_configs to anon, authenticated;
grant insert, update, delete on table public.challenge_configs to authenticated;

alter table public.profiles
  add column challenge_intro_seen_at timestamptz;

grant update (
  username,
  get_notifications,
  tutorial_completed_at,
  challenge_intro_seen_at,
  updated_at
)
on table public.profiles
to authenticated;

create or replace function public.get_challenge_progress(
  challenge_starts_on date,
  challenge_ends_on date,
  leaderboard_limit integer default 5
)
returns table (
  total_resolved_cases integer,
  daily_resolved_cases jsonb,
  leaderboard jsonb,
  user_resolved_points jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  with visible_challenge as (
    select
      challenge_configs.starts_on,
      challenge_configs.ends_on
    from public.challenge_configs
    where challenge_configs.starts_on = challenge_starts_on
      and challenge_configs.ends_on = challenge_ends_on
      and now() >= challenge_configs.visible_from
      and now() <= challenge_configs.visible_until
    limit 1
  ),
  challenge_reviews as (
    select
      review_answers_submitted.id,
      review_answers_submitted.case_id,
      review_answers_submitted.reviewed_by,
      review_answers_submitted.submitted_at,
      review_answers_submitted.submitted_at::date as submitted_on,
      row_number() over (
        order by
          review_answers_submitted.submitted_at asc,
          review_answers_submitted.id asc
      )::integer as progress_point
    from public.review_answers_submitted
    cross join visible_challenge
    where review_answers_submitted.submitted_at::date
      between visible_challenge.starts_on and visible_challenge.ends_on
  ),
  days as (
    select generate_series(
      visible_challenge.starts_on,
      visible_challenge.ends_on,
      '1 day'::interval
    )::date as resolved_on
    from visible_challenge
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
  ),
  user_points_json as (
    select jsonb_agg(
      challenge_reviews.progress_point
      order by challenge_reviews.progress_point
    ) as data
    from challenge_reviews
    where challenge_reviews.reviewed_by = (select auth.uid())
  )
  select
    (select count(*)::integer from challenge_reviews) as total_resolved_cases,
    coalesce((select data from daily_json), '[]'::jsonb) as daily_resolved_cases,
    coalesce((select data from leaderboard_json), '[]'::jsonb) as leaderboard,
    coalesce((select data from user_points_json), '[]'::jsonb) as user_resolved_points;
$$;

revoke all on function public.get_challenge_progress(date, date, integer)
  from public;

grant execute on function public.get_challenge_progress(date, date, integer)
  to anon, authenticated;
