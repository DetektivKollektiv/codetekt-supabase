-- ============================================
-- MIGRATION: Wedium Community Checks
-- Separate storage for Wedium users, posts, reviews, and aggregations
-- ============================================

create table public.wedium_users (
  id uuid primary key default gen_random_uuid(),
  user_hash text not null unique,
  created_at timestamptz not null default now(),

  constraint wedium_users_user_hash_format
    check (user_hash ~ '^[0-9a-f]{64}$')
);

create table public.wedium_posts (
  id uuid primary key default gen_random_uuid(),
  post_hash text not null unique,

  constraint wedium_posts_post_hash_format
    check (post_hash ~ '^[0-9a-f]{64}$')
);

create table public.wedium_reviews (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.wedium_posts(id) on delete cascade,
  reviewed_by uuid not null references public.wedium_users(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now(),
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint wedium_reviews_post_reviewer_unique
    unique (post_id, reviewed_by),

  constraint wedium_reviews_data_object
    check (jsonb_typeof(data) = 'object')
);

create index wedium_reviews_reviewed_by_idx
  on public.wedium_reviews (reviewed_by);

create table public.wedium_review_aggregations (
  post_id uuid primary key references public.wedium_posts(id) on delete cascade,
  result_score decimal(3,2) not null,
  data jsonb not null,
  reviewer_ids uuid[] not null,
  calculated_at timestamptz not null default now(),

  constraint wedium_review_aggregations_result_score_range
    check (result_score between 0 and 3),

  constraint wedium_review_aggregations_reviewer_ids_minimum
    check (cardinality(reviewer_ids) >= 2),

  constraint wedium_review_aggregations_data_object
    check (jsonb_typeof(data) = 'object')
);

alter table public.wedium_users enable row level security;
alter table public.wedium_posts enable row level security;
alter table public.wedium_reviews enable row level security;
alter table public.wedium_review_aggregations enable row level security;

-- Wedium data is only accessed through server-side Edge Functions.
revoke all privileges on table
  public.wedium_users,
  public.wedium_posts,
  public.wedium_reviews,
  public.wedium_review_aggregations
from public, anon, authenticated;

-- Explicit grant required for projects where automatic Data API exposure is disabled.
grant all privileges on table
  public.wedium_users,
  public.wedium_posts,
  public.wedium_reviews,
  public.wedium_review_aggregations
to service_role;
