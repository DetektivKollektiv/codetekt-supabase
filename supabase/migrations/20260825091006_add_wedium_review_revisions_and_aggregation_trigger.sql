-- Track which review state an aggregation was calculated from. The public API
-- may still return an older aggregation after a PUT, but a stale worker must
-- never overwrite a newer result or recreate an aggregation after a DELETE.

alter table public.wedium_posts
  add column review_revision bigint not null default 0;

alter table public.wedium_posts
  add constraint wedium_posts_review_revision_nonnegative
  check (review_revision >= 0);

alter table public.wedium_review_aggregations
  add column source_revision bigint;

-- Keep this migration safe if an environment already contains Wedium data.
update public.wedium_review_aggregations as aggregation
set source_revision = post.review_revision
from public.wedium_posts as post
where post.id = aggregation.post_id;

alter table public.wedium_review_aggregations
  alter column source_revision set not null;

-- Publish only if the post still has the revision used by the worker. Locking
-- the post row makes the comparison and aggregation upsert atomic with the
-- revision increment performed by the review trigger below.
create function public.publish_wedium_review_aggregation(
  p_post_id uuid,
  p_source_revision bigint,
  p_result_score numeric,
  p_data jsonb,
  p_reviewer_ids uuid[]
)
returns boolean
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  current_revision bigint;
begin
  select review_revision
  into current_revision
  from public.wedium_posts
  where id = p_post_id
  for update;

  if current_revision is null or current_revision <> p_source_revision then
    return false;
  end if;

  insert into public.wedium_review_aggregations (
    post_id,
    result_score,
    data,
    reviewer_ids,
    calculated_at,
    source_revision
  )
  values (
    p_post_id,
    p_result_score,
    p_data,
    p_reviewer_ids,
    now(),
    p_source_revision
  )
  on conflict (post_id) do update
  set result_score = excluded.result_score,
      data = excluded.data,
      reviewer_ids = excluded.reviewer_ids,
      calculated_at = excluded.calculated_at,
      source_revision = excluded.source_revision;

  return true;
end;
$$;

revoke all on function public.publish_wedium_review_aggregation(
  uuid,
  bigint,
  numeric,
  jsonb,
  uuid[]
) from public, anon, authenticated;

grant execute on function public.publish_wedium_review_aggregation(
  uuid,
  bigint,
  numeric,
  jsonb,
  uuid[]
) to service_role;

-- Increment the post revision for every review mutation. DELETE also removes
-- the old aggregate in the same transaction so it becomes unavailable as soon
-- as the deletion succeeds. pg_net starts the worker after commit.
create function public.trigger_wedium_review_aggregation()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_post_id uuid;
  request_id bigint;
  webhook_secret text;
begin
  if tg_op = 'DELETE' then
    target_post_id := old.post_id;
  else
    target_post_id := new.post_id;
  end if;

  update public.wedium_posts
  set review_revision = review_revision + 1
  where id = target_post_id;

  if tg_op = 'DELETE' then
    delete from public.wedium_review_aggregations
    where post_id = target_post_id;
  end if;

  select decrypted_secret
  into webhook_secret
  from vault.decrypted_secrets
  where name = 'db_webhook_secret';

  begin
    select net.http_post(
      url := public.get_project_url() ||
        '/functions/v1/set-wedium-review-aggregation',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'X-Db-Secret', webhook_secret
      ),
      body := jsonb_build_object('post_id', target_post_id),
      timeout_milliseconds := 5000
    ) into request_id;

    raise log
      'Wedium review aggregation triggered for post_id: %, request_id: %',
      target_post_id,
      request_id;
  exception
    when others then
      raise log
        'Failed to trigger Wedium aggregation for post_id: %. Error: %',
        target_post_id,
        sqlerrm;
  end;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

revoke all on function public.trigger_wedium_review_aggregation()
from public, anon, authenticated;

create trigger trigger_wedium_review_aggregation_on_change
after insert or update or delete on public.wedium_reviews
for each row
execute function public.trigger_wedium_review_aggregation();
