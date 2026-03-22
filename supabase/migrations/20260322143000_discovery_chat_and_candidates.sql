create type public.discovery_message_role as enum (
  'user',
  'assistant',
  'system',
  'tool'
);

create type public.requirement_candidate_status as enum (
  'proposed',
  'accepted',
  'discarded'
);

create table public.discovery_threads (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  title text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.discovery_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.discovery_threads(id) on delete cascade,
  role public.discovery_message_role not null,
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.requirement_candidates (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.discovery_threads(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  source_message_id uuid references public.discovery_messages(id) on delete set null,
  title text not null,
  description text,
  category text,
  status public.requirement_candidate_status not null default 'proposed',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index discovery_threads_product_id_idx
on public.discovery_threads(product_id);

create index discovery_threads_created_at_idx
on public.discovery_threads(created_at);

create index discovery_messages_thread_id_idx
on public.discovery_messages(thread_id);

create index discovery_messages_created_at_idx
on public.discovery_messages(created_at);

create index requirement_candidates_product_id_idx
on public.requirement_candidates(product_id);

create index requirement_candidates_thread_id_idx
on public.requirement_candidates(thread_id);

create index requirement_candidates_created_at_idx
on public.requirement_candidates(created_at);

create trigger discovery_threads_set_updated_at
before update on public.discovery_threads
for each row
execute function public.set_updated_at();

create trigger discovery_messages_set_updated_at
before update on public.discovery_messages
for each row
execute function public.set_updated_at();

create trigger requirement_candidates_set_updated_at
before update on public.requirement_candidates
for each row
execute function public.set_updated_at();

alter table public.discovery_threads enable row level security;
alter table public.discovery_messages enable row level security;
alter table public.requirement_candidates enable row level security;

create policy "Users can view own discovery threads"
on public.discovery_threads
for select
to authenticated
using (
  exists (
    select 1
    from public.products
    where products.id = discovery_threads.product_id
      and products.user_id = auth.uid()
  )
);

create policy "Users can create own discovery threads"
on public.discovery_threads
for insert
to authenticated
with check (
  exists (
    select 1
    from public.products
    where products.id = discovery_threads.product_id
      and products.user_id = auth.uid()
  )
);

create policy "Users can update own discovery threads"
on public.discovery_threads
for update
to authenticated
using (
  exists (
    select 1
    from public.products
    where products.id = discovery_threads.product_id
      and products.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.products
    where products.id = discovery_threads.product_id
      and products.user_id = auth.uid()
  )
);

create policy "Users can delete own discovery threads"
on public.discovery_threads
for delete
to authenticated
using (
  exists (
    select 1
    from public.products
    where products.id = discovery_threads.product_id
      and products.user_id = auth.uid()
  )
);

create policy "Users can view own discovery messages"
on public.discovery_messages
for select
to authenticated
using (
  exists (
    select 1
    from public.discovery_threads
    join public.products on products.id = discovery_threads.product_id
    where discovery_threads.id = discovery_messages.thread_id
      and products.user_id = auth.uid()
  )
);

create policy "Users can create own discovery messages"
on public.discovery_messages
for insert
to authenticated
with check (
  exists (
    select 1
    from public.discovery_threads
    join public.products on products.id = discovery_threads.product_id
    where discovery_threads.id = discovery_messages.thread_id
      and products.user_id = auth.uid()
  )
);

create policy "Users can update own discovery messages"
on public.discovery_messages
for update
to authenticated
using (
  exists (
    select 1
    from public.discovery_threads
    join public.products on products.id = discovery_threads.product_id
    where discovery_threads.id = discovery_messages.thread_id
      and products.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.discovery_threads
    join public.products on products.id = discovery_threads.product_id
    where discovery_threads.id = discovery_messages.thread_id
      and products.user_id = auth.uid()
  )
);

create policy "Users can delete own discovery messages"
on public.discovery_messages
for delete
to authenticated
using (
  exists (
    select 1
    from public.discovery_threads
    join public.products on products.id = discovery_threads.product_id
    where discovery_threads.id = discovery_messages.thread_id
      and products.user_id = auth.uid()
  )
);

create policy "Users can view own requirement candidates"
on public.requirement_candidates
for select
to authenticated
using (
  exists (
    select 1
    from public.products
    where products.id = requirement_candidates.product_id
      and products.user_id = auth.uid()
  )
);

create policy "Users can create own requirement candidates"
on public.requirement_candidates
for insert
to authenticated
with check (
  exists (
    select 1
    from public.products
    where products.id = requirement_candidates.product_id
      and products.user_id = auth.uid()
  )
  and exists (
    select 1
    from public.discovery_threads
    where discovery_threads.id = requirement_candidates.thread_id
      and discovery_threads.product_id = requirement_candidates.product_id
  )
);

create policy "Users can update own requirement candidates"
on public.requirement_candidates
for update
to authenticated
using (
  exists (
    select 1
    from public.products
    where products.id = requirement_candidates.product_id
      and products.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.products
    where products.id = requirement_candidates.product_id
      and products.user_id = auth.uid()
  )
);

create policy "Users can delete own requirement candidates"
on public.requirement_candidates
for delete
to authenticated
using (
  exists (
    select 1
    from public.products
    where products.id = requirement_candidates.product_id
      and products.user_id = auth.uid()
  )
);
