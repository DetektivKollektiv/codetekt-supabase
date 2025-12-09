-- ============================================
-- MIGRATION: Aggregated Reviews
-- Berechnete Ergebnisse (via Edge Functions)
-- ============================================

create table "public"."aggregated_reviews" (
  "case_id" uuid not null references public.cases(id) on delete cascade,
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

-- Nur service_role kann schreiben (via Edge Functions)
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