create table if not exists public.wishlist_messages (
  id uuid primary key default gen_random_uuid(),
  message text not null check (char_length(btrim(message)) between 1 and 1200),
  created_at timestamptz not null default now(),
  is_read boolean not null default false
);

create index if not exists wishlist_messages_created_at_idx
  on public.wishlist_messages (created_at desc);

alter table public.wishlist_messages enable row level security;
revoke all on table public.wishlist_messages from public, anon, authenticated;
grant all on table public.wishlist_messages to service_role;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.request_limits (
  client_key text not null,
  bucket_start timestamptz not null,
  request_count integer not null check (request_count > 0),
  primary key (client_key, bucket_start)
);

create index if not exists request_limits_bucket_start_idx
  on private.request_limits (bucket_start);

revoke all on table private.request_limits from public, anon, authenticated;

create or replace function public.consume_request_limit(
  p_client_key text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_bucket timestamptz;
  v_request_count integer;
begin
  if p_client_key is null
    or length(p_client_key) <> 64
    or p_limit < 1
    or p_limit > 100
    or p_window_seconds < 1
    or p_window_seconds > 86400
  then
    raise exception 'Invalid rate limit parameters';
  end if;

  v_bucket := date_bin(
    pg_catalog.make_interval(secs => p_window_seconds),
    statement_timestamp(),
    timestamptz 'epoch'
  );

  insert into private.request_limits (client_key, bucket_start, request_count)
  values (p_client_key, v_bucket, 1)
  on conflict (client_key, bucket_start)
  do update set request_count = private.request_limits.request_count + 1
  returning request_count into v_request_count;

  delete from private.request_limits
  where bucket_start < statement_timestamp() - interval '1 day';

  return v_request_count <= p_limit;
end;
$$;

revoke all on function public.consume_request_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_request_limit(text, integer, integer) to service_role;
