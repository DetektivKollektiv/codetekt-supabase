-- ============================================
-- MIGRATION: Restrict profile self-service writes
-- Blocks clients from setting privileged profile fields such as is_admin.
-- ============================================

revoke insert on table public.profiles from anon;
revoke insert on table public.profiles from authenticated;

revoke update on table public.profiles from anon;
revoke update on table public.profiles from authenticated;

grant update (username, get_notifications, updated_at)
on table public.profiles
to authenticated;
