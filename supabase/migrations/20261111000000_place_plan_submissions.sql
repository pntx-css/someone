create table if not exists public.place_plan_submissions (
  id uuid primary key default gen_random_uuid(),
  visits jsonb not null
    check (
      jsonb_typeof(visits) = 'array'
      and jsonb_array_length(visits) between 1 and 6
    ),
  created_at timestamptz not null default now()
);

create index if not exists place_plan_submissions_created_at_idx
  on public.place_plan_submissions (created_at desc);

alter table public.place_plan_submissions enable row level security;
revoke all on table public.place_plan_submissions from public, anon, authenticated;
grant all on table public.place_plan_submissions to service_role;
