-- ============================================
-- MIGRATION: Review Answers In Progress
-- Private drafts visible only to author, tracks published state
-- ============================================

create table "public"."review_answers_in_progress" (
  "id" uuid not null default gen_random_uuid(),
  "case_id" uuid not null references public.cases(id) on delete cascade,
  "reviewed_by" uuid not null references public.profiles(id),
  "data" jsonb not null,
  "submitted_review_answers_id" uuid references public.review_answers_submitted(id) on delete set null,
  "has_unpublished_changes" boolean not null default true,
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now()
);

alter table "public"."review_answers_in_progress" enable row level security;

create unique index "review_answers_in_progress_pkey" on "public"."review_answers_in_progress" using btree (id);
alter table "public"."review_answers_in_progress" add constraint "review_answers_in_progress_pkey" primary key using index "review_answers_in_progress_pkey";

-- One in-progress review per user per case
create unique index "review_answers_in_progress_case_user_unique" on "public"."review_answers_in_progress" using btree (case_id, reviewed_by);
alter table "public"."review_answers_in_progress" add constraint "review_answers_in_progress_case_user_unique" unique using index "review_answers_in_progress_case_user_unique";

-- Indexes for queries
create index "review_answers_in_progress_case_id_idx" on "public"."review_answers_in_progress" using btree (case_id);
create index "review_answers_in_progress_reviewed_by_idx" on "public"."review_answers_in_progress" using btree (reviewed_by);
create index "review_answers_in_progress_submitted_id_idx" on "public"."review_answers_in_progress" using btree (submitted_review_answers_id);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Users can manage (SELECT/INSERT/UPDATE/DELETE) only their own in-progress reviews
create policy "Users can manage their own in-progress reviews."
  on "public"."review_answers_in_progress"
  as permissive
  for all
  to authenticated
  using (reviewed_by = (select auth.uid()))
  with check (reviewed_by = (select auth.uid()));

-- ============================================
-- GRANTS
-- ============================================

-- Authenticated users: FULL control of their own records
grant select, insert, update, delete on table "public"."review_answers_in_progress" to "authenticated";

-- Service role: FULL control (for edge function operations)
grant all on table "public"."review_answers_in_progress" to "service_role";
