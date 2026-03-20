-- ============================================
-- MIGRATION: Aggregation reviewers RPC
-- Returns reviewer profile information for aggregated cases
-- ============================================

create or replace function public.get_aggregation_reviewers(case_ids uuid[] default null)
returns table (
  case_id uuid,
  reviewer_id uuid,
  username text
)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select
    ra.case_id,
    reviewer.reviewer_id,
    p.username
  from public.review_aggregations_without_open_disputes ra
  cross join lateral unnest(ra.reviewer_ids) as reviewer(reviewer_id)
  join public.profiles p on p.id = reviewer.reviewer_id
  where case_ids is null or ra.case_id = any(case_ids)
  order by ra.case_id, p.username nulls last, reviewer.reviewer_id;
$$;

grant execute on function public.get_aggregation_reviewers(uuid[]) to authenticated;
grant execute on function public.get_aggregation_reviewers(uuid[]) to anon;
