-- Keep profile creation consistent across hosted Supabase and self-hosted Production.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  insert into public.profiles (id, username)
  values (new.id, null);
  return new;
end;
$function$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Repair accounts created while the trigger was missing without inventing usernames.
insert into public.profiles (id, username)
select users.id, null
from auth.users as users
left join public.profiles as profiles on profiles.id = users.id
where profiles.id is null
on conflict (id) do nothing;

-- Avatar storage is not part of the product and should not expose unused policies.
drop policy if exists "Anyone can upload an avatar" on storage.objects;
drop policy if exists "Avatar images are publicly accessible" on storage.objects;
