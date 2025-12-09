-- ============================================
-- MIGRATION: Cases
-- Eingereichte Fälle zur Überprüfung
-- ============================================

create table "public"."cases" (
  "id" uuid not null default gen_random_uuid(),
  "submitted_by" uuid references public.profiles(id),
  "content" text not null,
  "content_type" text not null check (content_type in ('url', 'text')),
  "template_version" integer references public.review_templates(version),
  "submitted_at" timestamp with time zone default now()
);

alter table "public"."cases" enable row level security;

create unique index cases_pkey on public.cases using btree (id);
alter table "public"."cases" add constraint "cases_pkey" primary key using index "cases_pkey";

-- Index für schnelle Lookups
create index cases_submitted_by_idx on public.cases using btree (submitted_by);
create index cases_template_version_idx on public.cases using btree (template_version);

-- Policies
create policy "Cases are viewable by everyone."
  on "public"."cases"
  as permissive
  for select
  to public
  using (true);

create policy "Authenticated users can create cases."
  on "public"."cases"
  as permissive
  for insert
  to authenticated
  with check (submitted_by = (select auth.uid()));

create policy "Users can update their own cases."
  on "public"."cases"
  as permissive
  for update
  to authenticated
  using (submitted_by = (select auth.uid()));

create policy "Users can delete their own cases."
  on "public"."cases"
  as permissive
  for delete
  to authenticated
  using (submitted_by = (select auth.uid()));

-- Grants
grant select on table "public"."cases" to "anon";
grant select, insert, update, delete on table "public"."cases" to "authenticated";
grant all on table "public"."cases" to "service_role";

-- ============================================
-- TRIGGER: Auto-set template_version
-- ============================================

create or replace function public.on_case_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Template Version einfrieren (höchste verfügbare)
  if new.template_version is null then
    new.template_version := (
      select max(version) 
      from public.review_templates
    );
  end if;
  
  return new;
end;
$$;

create trigger on_case_created
  before insert on public.cases
  for each row
  execute function public.on_case_created();