-- Remove implicit RPC access from existing functions. Trigger functions and
-- internal helpers remain executable by their owner and trusted service role.
revoke execute on all functions in schema public
from public, anon, authenticated;

-- PostgreSQL grants EXECUTE on new functions to PUBLIC globally by default.
-- Revoke that global default, then remove Supabase's schema-specific grants.
alter default privileges for role postgres
revoke execute on functions from public;

alter default privileges for role postgres in schema public
revoke execute on functions from anon, authenticated;

-- These aggregate RPCs intentionally remain SECURITY DEFINER. Anonymous users
-- may read their aggregate output, but not the underlying submitted reviews.
grant execute on function public.get_user_leaderboard(integer)
to anon, authenticated;

grant execute on function public.get_challenge_progress(date, date, integer)
to anon, authenticated;

grant execute on function public.get_aggregation_reviewers(uuid[])
to anon, authenticated;

-- RLS policies call this function for signed-in users. It remains SECURITY
-- DEFINER so it can read the caller's profile without recursively applying RLS.
grant execute on function public.is_active_profile()
to authenticated;
