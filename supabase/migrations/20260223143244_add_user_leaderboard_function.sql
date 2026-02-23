-- ============================================
-- MIGRATION: User Leaderboard Function
-- Provides top users by cases created and reviews submitted
-- ============================================

-- Ensure indexes exist for optimal performance
create index if not exists idx_cases_submitted_by on public.cases(submitted_by);
create index if not exists idx_review_answers_submitted_reviewed_by on public.review_answers_submitted(reviewed_by);

-- ============================================
-- FUNCTION: get_user_leaderboard
-- Returns top N users with their contribution statistics
-- ============================================

create or replace function public.get_user_leaderboard(limit_count integer default 10)
returns table (
  user_id uuid,
  username text,
  cases_count bigint,
  reviews_count bigint,
  total_contributions bigint
) 
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  return query
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
  where p.username is not null  -- Exclude users without usernames
  order by total_contributions desc, cases_count desc
  limit limit_count;
end;
$$;

-- ============================================
-- GRANTS
-- ============================================

grant execute on function public.get_user_leaderboard to authenticated;
grant execute on function public.get_user_leaderboard to anon;
