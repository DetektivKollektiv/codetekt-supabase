-- ============================================
-- MIGRATION: Challenge visibility, intro state and DB-backed copy
-- ============================================

alter table public.profiles
  add column if not exists challenge_intro_seen_at timestamptz;

grant update (
  username,
  get_notifications,
  tutorial_completed_at,
  challenge_intro_seen_at,
  updated_at
)
on table public.profiles
to authenticated;

alter table public.challenge_configs
  add column if not exists visible_from timestamptz,
  add column if not exists visible_until timestamptz;

update public.challenge_configs
set
  visible_from = coalesce(visible_from, starts_on::timestamptz),
  visible_until = coalesce(
    visible_until,
    ((ends_on + 1)::timestamptz - interval '1 millisecond')
  );

alter table public.challenge_configs
  alter column visible_from set not null,
  alter column visible_until set not null;

alter table public.challenge_configs
  drop constraint if exists challenge_configs_valid_visibility_range;

alter table public.challenge_configs
  add constraint challenge_configs_valid_visibility_range
  check (visible_until >= visible_from);

drop policy if exists "Anyone can read active challenge configs" on public.challenge_configs;
drop policy if exists "Anyone can read visible active challenge configs" on public.challenge_configs;
drop policy if exists "Anyone can read visible challenge configs" on public.challenge_configs;
drop index if exists public.challenge_configs_single_active_idx;

alter table public.challenge_configs
  drop column if exists is_active;

create policy "Anyone can read visible challenge configs"
  on public.challenge_configs
  for select
  to anon, authenticated
  using (
    now() >= visible_from
    and now() <= visible_until
  );

drop function if exists public.get_challenge_progress(date, date, text[], integer);
drop function if exists public.get_challenge_progress(date, date, integer);

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
    select jsonb_agg(challenge_reviews.progress_point order by challenge_reviews.progress_point) as data
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

update public.challenge_configs
set
  starts_on = '2026-07-14',
  ends_on = '2026-08-01',
  visible_from = '2026-07-14 00:00:00+00'::timestamptz,
  visible_until = '2026-08-01 23:59:59.999+00'::timestamptz,
  content = '{
    "eyebrow": "Community Challenge zu den Landtagswahlen 2026",
    "title": "Gemeinsam zur 200",
    "totalTarget": 200,
    "milestones": [0, 50, 100, 150, 200],
    "dailyGoals": [3, 5, 10],
    "descriptionColumns": [
      "Löst gemeinsam 200 Fälle, erreicht tägliche Ziele und macht sichtbar, wie stark die Community gegen Falschinformationen arbeitet.",
      "Das Leaderboard zeigt, welche co:detectives besonders aktiv sind."
    ],
    "intro": {
      "eyebrow": "Community Challenge",
      "title": "Mach mit bei unserer Streak-Challenge!",
      "descriptionHtml": "Im September wird in vier Bundesländern gewählt und Falschinformationen haben wieder Hochsaison. Sie verunsichern, spalten und beeinflussen Entscheidungen. Unsere Antwort: <strong>Flood the zone with trust!</strong>",
      "imageSrc": "/images/title.svg",
      "imageAlt": "",
      "sections": [
        {
          "bodyHtml": "<p>Als codetekt-Community prüfen wir deshalb täglich Nachrichten auf ihre Vertrauenswürdigkeit und teilen unsere Ergebnisse sichtbar mit der Welt. So bleibst du selbst informiert, trainierst dein Gespür für Falschinformationen und stärkst Nachrichtenkompetenz in deinem Umfeld.</p>"
        },
        {
          "heading": "Checken und gewinnen:",
          "bodyHtml": "<p>Werde co:detective und checke jeden Tag mindestens eine Nachricht auf unserer Trust-Checking-Plattform. Im <a href=\"/tutorial\">Tutorial</a> findest du den Einstieg. Ein Trust-Check dauert im Schnitt 10-20 Minuten und mit etwas Routine geht dir das Prüfen schnell locker von der Hand.</p><p>Die gelösten Fälle kannst du anschließend teilen: mit deinem Netzwerk auf Social Media, in Gesprächen oder direkt dort, wo Falschinformationen auftauchen - zum Beispiel in Kommentarspalten von Nachrichtenseiten. Nutze dafür die Share-Funktion.</p><p>Die Top-3 co:detectives mit den meisten Checks sowie fünf weitere Teilnehmende, die aus allen Teilnehmenden gelost werden, gewinnen vertrauenswürdige Preise. Mehr Infos folgen.</p>"
        },
        {
          "heading": "Fragen?",
          "bodyHtml": "<p>Tausch dich auf unserem <a href=\"https://discord.gg/fFABTPSxXA\" target=\"_blank\" rel=\"noopener noreferrer\">Discord-Server</a> mit anderen co:detectives aus oder schreib uns eine <a href=\"mailto:info@codetekt.org\">Mail</a>.</p>"
        }
      ]
    },
    "leaderboardLimit": 5
  }'::jsonb,
  updated_at = now()
where id = 'd8d52b11-f3f9-4a0e-a4f6-1f4bb9f6b8ef';
