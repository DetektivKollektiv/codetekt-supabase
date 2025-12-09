-- ============================================
-- MIGRATION: Reviews
-- User-Bewertungen zu Cases
-- ============================================

create table "public"."review_answers" (
  "id" uuid not null default gen_random_uuid(),
  "case_id" uuid not null references public.cases(id) on delete cascade,
  "reviewed_by" uuid not null references public.profiles(id),
  "status" text not null default 'in_progress' check (status in ('in_progress', 'submitted')),
  "data" jsonb not null,
  "created_at" timestamp with time zone  not null default now(),
  "submitted_at" timestamp with time zone,
  
  -- Validierung: submitted_at nur bei status='submitted'
  constraint "review_answers_submitted_at_required_when_submitted"
    check (
      (status = 'in_progress' and submitted_at is null) or
      (status = 'submitted' and submitted_at is not null)
    )
);

alter table "public"."review_answers" enable row level security;

create unique index "review_answers_pkey" on "public"."review_answers" using btree (id);
alter table "public"."review_answers" add constraint "review_answers_pkey" primary key using index "review_answers_pkey";

-- Ein User kann nur eine Review pro Case haben
create unique index "review_answers_case_user_unique" on "public"."review_answers" using btree (case_id, reviewed_by);
alter table "public"."review_answers" add constraint "review_answers_case_user_unique" unique using index "review_answers_case_user_unique";

-- Indizes für Queries
create index "review_answers_case_id_idx" on "public"."review_answers" using btree (case_id);
create index "review_answers_reviewed_by_idx" on "public"."review_answers" using btree (reviewed_by);
create index "review_answers_case_status_idx" on "public"."review_answers" using btree (case_id, status);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Kombinierte SELECT Policy: User sieht eigene Reviews + submitted Reviews
create policy "Users can view own and submitted review_answers."
  on "public"."review_answers"
  as permissive
  for select
  to authenticated
  using (
    reviewed_by = (select auth.uid()) 
    OR status = 'submitted'
  );

create policy "Authenticated users can create review_answers."
  on "public"."review_answers"
  as permissive
  for insert
  to authenticated
  with check (reviewed_by = (select auth.uid()));

create policy "Users can update their own in-progress review_answers."
  on "public"."review_answers"
  as permissive
  for update
  to authenticated
  using (reviewed_by = (select auth.uid()) and status = 'in_progress');

create policy "Users can delete their own in-progress review_answers."
  on "public"."review_answers"
  as permissive
  for delete
  to authenticated
  using (reviewed_by = (select auth.uid()) and status = 'in_progress');

-- ============================================
-- GRANTS
-- ============================================

grant select, insert, update, delete on table "public"."review_answers" to "authenticated";
grant all on table "public"."review_answers" to "service_role";