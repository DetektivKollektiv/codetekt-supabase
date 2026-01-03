-- ============================================
-- MIGRATION: Case Disputes
-- Table: review_disputes
-- ============================================

-- ============================================
-- review_disputes
-- Admin-Queue für Metadata-Disputes (z.B. Content-Type)
-- ============================================

create table "public"."review_disputes" (
  "id" uuid not null default gen_random_uuid(),
  "case_id" uuid not null references public.cases(id) on delete cascade,
  "template_version" integer not null references public.review_templates(version),
  "field_id" text not null,
  
  -- Original-Wert und Dispute-Info
  "original_value" text not null,
  "disputed_by" uuid not null references public.profiles(id),
  "reason" text,
  "created_at" timestamp with time zone default now(),
  
  -- Admin-Resolution
  "resolved_by" uuid references public.profiles(id),
  "resolution" text check (resolution in ('original_kept', 'changed')),
  "final_value" text,
  "resolved_at" timestamp with time zone
);

alter table "public"."review_disputes" enable row level security;

-- Primary Key
create unique index review_disputes_pkey on public.review_disputes using btree (id);
alter table "public"."review_disputes" add constraint "review_disputes_pkey" primary key using index "review_disputes_pkey";

-- Nur ein offener Dispute pro Feld pro Case (kritisch!)
create unique index idx_review_disputes_one_open 
  on public.review_disputes(case_id, field_id) 
  where resolved_at is null;

-- Admin-Queue Index (für schnelle Abfragen offener Disputes)
create index idx_review_disputes_pending 
  on public.review_disputes(created_at) 
  where resolved_at is null;

-- Lookup-Indizes
create index review_disputes_case_id_idx on public.review_disputes using btree (case_id);
create index review_disputes_disputed_by_idx on public.review_disputes using btree (disputed_by);
create index review_disputes_resolved_by_idx on public.review_disputes using btree (resolved_by);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Alle authentifizierten User können Disputes sehen
create policy "Authenticated users can view all disputes."
  on "public"."review_disputes"
  as permissive
  for select
  to authenticated
  using (true);

-- Authenticated User können Disputes erstellen
create policy "Authenticated users can create disputes."
  on "public"."review_disputes"
  as permissive
  for insert
  to authenticated
  with check (disputed_by = (select auth.uid()));

-- Nur service_role kann Disputes resolven (via Admin-Interface oder Edge Function)
create policy "Only service role can update disputes."
  on "public"."review_disputes"
  as permissive
  for update
  to service_role
  using (true);

-- ============================================
-- GRANTS
-- ============================================

grant select, insert on table "public"."review_disputes" to "authenticated";
grant all on table "public"."review_disputes" to "service_role";

-- ============================================
-- HELPER FUNCTION: Check if field has admin resolution
-- ============================================

create or replace function public.has_admin_resolution(
  p_case_id uuid,
  p_field_id text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.review_disputes
    where case_id = p_case_id
      and field_id = p_field_id
      and resolved_at is not null
  );
$$;

-- Diese Funktion wird von get-review Edge Function genutzt
-- um zu prüfen ob ein Feld noch disputable ist