-- ============================================
-- MIGRATION: Core Review System (Performance Optimized)
-- Tables: review_templates, cases, reviews, aggregated_reviews
-- ============================================

-- Enable pg_net for Edge Function calls
create extension if not exists "pg_net" with schema "extensions";

-- ============================================
-- REVIEW_TEMPLATES
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

-- ============================================
-- CASES
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
-- REVIEWS
-- User-Bewertungen zu Cases
-- ============================================

create table "public"."reviews" (
  "id" uuid not null default gen_random_uuid(),
  "case_id" uuid not null references public.cases(id) on delete cascade,
  "reviewed_by" uuid not null references public.profiles(id),
  "status" text not null default 'in_progress' check (status in ('in_progress', 'submitted')),
  "data" jsonb,
  "created_at" timestamp with time zone default now(),
  "submitted_at" timestamp with time zone
);

alter table "public"."reviews" enable row level security;

create unique index reviews_pkey on public.reviews using btree (id);
alter table "public"."reviews" add constraint "reviews_pkey" primary key using index "reviews_pkey";

-- Ein User kann nur eine Review pro Case haben
create unique index reviews_case_user_unique on public.reviews using btree (case_id, reviewed_by);
alter table "public"."reviews" add constraint "reviews_case_user_unique" unique using index "reviews_case_user_unique";

-- Indizes für Queries und Trigger
create index reviews_case_id_idx on public.reviews using btree (case_id);
create index reviews_reviewed_by_idx on public.reviews using btree (reviewed_by);
create index reviews_case_status_idx on public.reviews using btree (case_id, status);

-- Policies
create policy "Users can view their own reviews."
  on "public"."reviews"
  as permissive
  for select
  to authenticated
  using (reviewed_by = (select auth.uid()));

create policy "Authenticated users can create reviews."
  on "public"."reviews"
  as permissive
  for insert
  to authenticated
  with check (reviewed_by = (select auth.uid()));

create policy "Users can update their own in-progress reviews."
  on "public"."reviews"
  as permissive
  for update
  to authenticated
  using (reviewed_by = (select auth.uid()) and status = 'in_progress');

create policy "Users can delete their own in-progress reviews."
  on "public"."reviews"
  as permissive
  for delete
  to authenticated
  using (reviewed_by = (select auth.uid()) and status = 'in_progress');

create policy "Users can view submitted reviews for cases."
  on "public"."reviews"
  as permissive
  for select
  to authenticated
  using (
    reviewed_by = (select auth.uid()) 
    OR status = 'submitted'  -- Nur submitted reviews sind für alle sichtbar
  );

-- Grants
grant select, insert, update, delete on table "public"."reviews" to "authenticated";
grant all on table "public"."reviews" to "service_role";

-- ============================================
-- AGGREGATED_REVIEWS
-- Berechnete Ergebnisse (Existenz = published)
-- ============================================

create table "public"."aggregated_reviews" (
  "case_id" uuid not null references public.cases(id) on delete cascade,
  "review_count" integer not null default 0,
  "result_score" decimal(3,2),
  "data" jsonb,
  "reviewer_ids" uuid[],
  "calculated_at" timestamp with time zone default now()
);

alter table "public"."aggregated_reviews" enable row level security;

create unique index aggregated_reviews_pkey on public.aggregated_reviews using btree (case_id);
alter table "public"."aggregated_reviews" add constraint "aggregated_reviews_pkey" primary key using index "aggregated_reviews_pkey";

-- Policies
create policy "Aggregated reviews are viewable by everyone."
  on "public"."aggregated_reviews"
  as permissive
  for select
  to public
  using (true);

-- Nur service_role kann schreiben (via Edge Function)
create policy "Only service role can insert aggregated reviews."
  on "public"."aggregated_reviews"
  as permissive
  for insert
  to service_role
  with check (true);

create policy "Only service role can update aggregated reviews."
  on "public"."aggregated_reviews"
  as permissive
  for update
  to service_role
  using (true);

-- Grants
grant select on table "public"."aggregated_reviews" to "anon";
grant select on table "public"."aggregated_reviews" to "authenticated";
grant all on table "public"."aggregated_reviews" to "service_role";

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function: Setzt template_version bei Case-Erstellung
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

-- Trigger: Vor Case-Insert
create trigger on_case_created
  before insert on public.cases
  for each row
  execute function public.on_case_created();

-- Function: Ruft Edge Function auf wenn genug Reviews
create or replace function public.on_review_submitted()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
  v_supabase_url text;
  v_service_role_key text;
begin
  -- Nur bei Status-Wechsel zu 'submitted'
  if new.status = 'submitted' and (old.status is null or old.status = 'in_progress') then
    
    -- submitted_at setzen
    new.submitted_at := now();
    
    -- Reviews zählen
    select count(*) into v_count
    from public.reviews
    where case_id = new.case_id 
      and status = 'submitted';
    
    -- +1 für die aktuelle Review (noch nicht committed)
    v_count := v_count + 1;
    
    -- Ab 3 Reviews: Edge Function aufrufen
    if v_count >= 3 then
      -- Config aus Supabase Vault oder Environment
      v_supabase_url := current_setting('app.settings.supabase_url', true);
      v_service_role_key := current_setting('app.settings.service_role_key', true);
      
      -- Async HTTP Call zur Edge Function via pg_net
      perform net.http_post(
        url := v_supabase_url || '/functions/v1/calculate-aggregation',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || v_service_role_key
        ),
        body := jsonb_build_object('case_id', new.case_id)
      );
    end if;
  end if;
  
  return new;
end;
$$;

-- Trigger: Vor Review-Update (um submitted_at zu setzen)
create trigger on_review_submitted
  before update on public.reviews
  for each row
  execute function public.on_review_submitted();

-- Auch bei Insert, falls direkt mit status='submitted' erstellt
create trigger on_review_submitted_insert
  before insert on public.reviews
  for each row
  when (new.status = 'submitted')
  execute function public.on_review_submitted();