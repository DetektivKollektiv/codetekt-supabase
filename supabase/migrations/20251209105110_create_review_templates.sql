-- ============================================
-- MIGRATION: Review Templates
-- Versionierte Fragebögen
-- ============================================

create table "public"."review_templates" (
  "version" integer not null,
  "template" jsonb not null,
  "created_by" uuid references public.profiles(id),
  "created_at" timestamp with time zone default now()
);

alter table "public"."review_templates" enable row level security;

create unique index review_templates_pkey on public.review_templates using btree (version);
alter table "public"."review_templates" add constraint "review_templates_pkey" primary key using index "review_templates_pkey";

-- Policies
create policy "Review templates are viewable by everyone."
  on "public"."review_templates"
  as permissive
  for select
  to public
  using (true);

create policy "Only authenticated users can create review templates."
  on "public"."review_templates"
  as permissive
  for insert
  to authenticated
  with check (created_by = (select auth.uid()));

-- Grants
grant select on table "public"."review_templates" to "anon";
grant select on table "public"."review_templates" to "authenticated";
grant all on table "public"."review_templates" to "service_role";