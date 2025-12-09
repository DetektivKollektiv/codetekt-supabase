-- ============================================
-- MIGRATION: Aggregated Reviews
-- Berechnete Ergebnisse (via Edge Functions)
-- ============================================

create table "public"."review_aggregations" (
  "case_id" uuid not null references public.cases(id) on delete cascade,
  "result_score" decimal(3,2) not null,
  "data" jsonb not null,
  "reviewer_ids" uuid[] not null,
  "calculated_at" timestamp with time zone not null default now()
);

alter table "public"."review_aggregations" enable row level security;

create unique index review_aggregations_pkey on public.review_aggregations using btree (case_id);
alter table "public"."review_aggregations" add constraint "review_aggregations_pkey" primary key using index "review_aggregations_pkey";

-- Policies
create policy "Aggregated reviews are viewable by everyone."
  on "public"."review_aggregations"
  as permissive
  for select
  to public
  using (true);

-- Nur service_role kann schreiben (via Edge Functions)
create policy "Only service role can insert aggregated reviews."
  on "public"."review_aggregations"
  as permissive
  for insert
  to service_role
  with check (true);

create policy "Only service role can update aggregated reviews."
  on "public"."review_aggregations"
  as permissive
  for update
  to service_role
  using (true);

-- Grants
grant select on table "public"."review_aggregations" to "anon";
grant select on table "public"."review_aggregations" to "authenticated";
grant all on table "public"."review_aggregations" to "service_role";