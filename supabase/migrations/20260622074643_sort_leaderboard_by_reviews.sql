create or replace function public.get_user_leaderboard(limit_count integer default 10)
returns table(
  user_id uuid,
  username text,
  cases_count bigint,
  reviews_count bigint,
  total_contributions bigint
)
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
begin
  return query
  select *
  from (
    select
      p.id as user_id,
      p.username,
      coalesce(c.cases_count, 0) as cases_count,
      coalesce(r.reviews_count, 0) as reviews_count,
      coalesce(c.cases_count, 0) + coalesce(r.reviews_count, 0) as total_contributions
    from public.profiles p
    left join (
      select submitted_by, count(*) as cases_count
      from public.cases
      group by submitted_by
    ) c on p.id = c.submitted_by
    left join (
      select reviewed_by, count(*) as reviews_count
      from public.review_answers_submitted
      group by reviewed_by
    ) r on p.id = r.reviewed_by
    where p.username is not null
  ) leaderboard
  order by
    leaderboard.reviews_count desc,
    leaderboard.cases_count desc,
    leaderboard.username asc,
    leaderboard.user_id asc
  limit limit_count;
end;
$function$;
