-- ============================================
-- MIGRATION: Open Graph Data
-- Stores Open Graph metadata for URL cases
-- ============================================

-- Create table
create table "public"."open_graph_data" (
  -- Primary key (one-to-one with cases)
  "case_id" uuid not null references public.cases(id) on delete cascade,

  -- Open Graph metadata fields (all nullable - may be missing)
  "og_title" text,
  "og_description" text,
  "og_image" text,
  "og_image_alt" text,
  "og_image_width" integer,
  "og_image_height" integer,
  "og_url" text,
  "og_type" text,
  "og_site_name" text,
  "og_locale" text,

  -- Raw data and metadata
  "raw_data" jsonb,
  "fetch_status" text check (fetch_status in ('pending', 'success', 'partial', 'failed')),
  "fetch_error" text,
  "http_status_code" integer,
  "last_fetched_at" timestamp with time zone,

  -- Timestamps
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now()
);

-- Enable RLS
alter table "public"."open_graph_data" enable row level security;

-- Create primary key constraint
create unique index open_graph_data_pkey
  on public.open_graph_data using btree (case_id);
alter table "public"."open_graph_data"
  add constraint "open_graph_data_pkey"
  primary key using index "open_graph_data_pkey";

-- RLS Policies (public read, service role write)
create policy "Open Graph data is viewable by everyone."
  on "public"."open_graph_data"
  as permissive
  for select
  to public
  using (true);

create policy "Only service role can insert Open Graph data."
  on "public"."open_graph_data"
  as permissive
  for insert
  to service_role
  with check (true);

create policy "Only service role can update Open Graph data."
  on "public"."open_graph_data"
  as permissive
  for update
  to service_role
  using (true);

create policy "Only service role can delete Open Graph data."
  on "public"."open_graph_data"
  as permissive
  for delete
  to service_role
  using (true);

-- Grants
grant select on table "public"."open_graph_data" to "anon";
grant select on table "public"."open_graph_data" to "authenticated";
grant all on table "public"."open_graph_data" to "service_role";

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_open_graph_data_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Trigger for updated_at timestamp
CREATE TRIGGER update_open_graph_data_updated_at_trigger
  BEFORE UPDATE ON open_graph_data
  FOR EACH ROW
  EXECUTE FUNCTION update_open_graph_data_updated_at();
