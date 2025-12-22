-- ============================================
-- MIGRATION: Review Answers Submitted
-- Published reviews visible to all, writable only by edge functions
-- ============================================

create table "public"."review_answers_submitted" (
  "id" uuid not null default gen_random_uuid(),
  "case_id" uuid not null references public.cases(id) on delete cascade,
  "reviewed_by" uuid not null references public.profiles(id),
  "data" jsonb not null,
  "created_at" timestamp with time zone not null default now(),
  "submitted_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now()
);

alter table "public"."review_answers_submitted" enable row level security;

create unique index "review_answers_submitted_pkey" on "public"."review_answers_submitted" using btree (id);
alter table "public"."review_answers_submitted" add constraint "review_answers_submitted_pkey" primary key using index "review_answers_submitted_pkey";

-- One submitted review per user per case
create unique index "review_answers_submitted_case_user_unique" on "public"."review_answers_submitted" using btree (case_id, reviewed_by);
alter table "public"."review_answers_submitted" add constraint "review_answers_submitted_case_user_unique" unique using index "review_answers_submitted_case_user_unique";

-- Indexes for queries
create index "review_answers_submitted_case_id_idx" on "public"."review_answers_submitted" using btree (case_id);
create index "review_answers_submitted_reviewed_by_idx" on "public"."review_answers_submitted" using btree (reviewed_by);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- All authenticated users can view submitted reviews (public visibility)
create policy "Submitted reviews are viewable by everyone."
  on "public"."review_answers_submitted"
  as permissive
  for select
  to authenticated
  using (true);

-- NO INSERT/UPDATE/DELETE policies for authenticated users
-- Only service_role (edge functions) can write to this table

-- ============================================
-- GRANTS
-- ============================================

-- Authenticated users: READ-ONLY access
grant select on table "public"."review_answers_submitted" to "authenticated";

-- Service role: FULL control (for edge functions)
grant all on table "public"."review_answers_submitted" to "service_role";
