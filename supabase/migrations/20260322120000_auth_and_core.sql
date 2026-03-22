create extension if not exists pgcrypto with schema extensions;

create type public.requirement_status as enum (
  'draft',
  'researching',
  'partially_matched',
  'matched',
  'blocked'
);

create type public.requirement_match_status as enum (
  'candidate',
  'shortlisted',
  'rejected'
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  category text,
  description text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.requirements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  title text not null,
  description text,
  category text,
  status public.requirement_status not null default 'draft',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  created_by_user_id uuid default auth.uid() references auth.users(id) on delete set null,
  name text not null,
  website text,
  email text,
  phone text,
  country text,
  region text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.requirement_suppliers (
  id uuid primary key default gen_random_uuid(),
  requirement_id uuid not null references public.requirements(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  fit_score numeric(5,2),
  notes text,
  match_status public.requirement_match_status not null default 'candidate',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (requirement_id, supplier_id)
);

create index products_user_id_idx on public.products(user_id);
create index requirements_product_id_idx on public.requirements(product_id);
create index suppliers_created_by_user_id_idx on public.suppliers(created_by_user_id);
create index requirement_suppliers_requirement_id_idx on public.requirement_suppliers(requirement_id);
create index requirement_suppliers_supplier_id_idx on public.requirement_suppliers(supplier_id);

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create trigger products_set_updated_at
before update on public.products
for each row
execute function public.set_updated_at();

create trigger requirements_set_updated_at
before update on public.requirements
for each row
execute function public.set_updated_at();

create trigger suppliers_set_updated_at
before update on public.suppliers
for each row
execute function public.set_updated_at();

create trigger requirement_suppliers_set_updated_at
before update on public.requirement_suppliers
for each row
execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', '')
  )
  on conflict (id) do update
    set email = excluded.email,
        display_name = nullif(excluded.display_name, ''),
        updated_at = timezone('utc', now());

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.requirements enable row level security;
alter table public.suppliers enable row level security;
alter table public.requirement_suppliers enable row level security;

create policy "Users can view own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Users can view own products"
on public.products
for select
to authenticated
using (user_id = auth.uid());

create policy "Users can create own products"
on public.products
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update own products"
on public.products
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete own products"
on public.products
for delete
to authenticated
using (user_id = auth.uid());

create policy "Users can view own requirements"
on public.requirements
for select
to authenticated
using (
  exists (
    select 1
    from public.products
    where products.id = requirements.product_id
      and products.user_id = auth.uid()
  )
);

create policy "Users can create own requirements"
on public.requirements
for insert
to authenticated
with check (
  exists (
    select 1
    from public.products
    where products.id = requirements.product_id
      and products.user_id = auth.uid()
  )
);

create policy "Users can update own requirements"
on public.requirements
for update
to authenticated
using (
  exists (
    select 1
    from public.products
    where products.id = requirements.product_id
      and products.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.products
    where products.id = requirements.product_id
      and products.user_id = auth.uid()
  )
);

create policy "Users can delete own requirements"
on public.requirements
for delete
to authenticated
using (
  exists (
    select 1
    from public.products
    where products.id = requirements.product_id
      and products.user_id = auth.uid()
  )
);

create policy "Authenticated users can view suppliers"
on public.suppliers
for select
to authenticated
using (true);

create policy "Authenticated users can create suppliers"
on public.suppliers
for insert
to authenticated
with check (created_by_user_id = auth.uid());

create policy "Users can view requirement supplier links for own requirements"
on public.requirement_suppliers
for select
to authenticated
using (
  exists (
    select 1
    from public.requirements
    join public.products on products.id = requirements.product_id
    where requirements.id = requirement_suppliers.requirement_id
      and products.user_id = auth.uid()
  )
);

create policy "Users can create requirement supplier links for own requirements"
on public.requirement_suppliers
for insert
to authenticated
with check (
  exists (
    select 1
    from public.requirements
    join public.products on products.id = requirements.product_id
    where requirements.id = requirement_suppliers.requirement_id
      and products.user_id = auth.uid()
  )
);

create policy "Users can update requirement supplier links for own requirements"
on public.requirement_suppliers
for update
to authenticated
using (
  exists (
    select 1
    from public.requirements
    join public.products on products.id = requirements.product_id
    where requirements.id = requirement_suppliers.requirement_id
      and products.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.requirements
    join public.products on products.id = requirements.product_id
    where requirements.id = requirement_suppliers.requirement_id
      and products.user_id = auth.uid()
  )
);

create policy "Users can delete requirement supplier links for own requirements"
on public.requirement_suppliers
for delete
to authenticated
using (
  exists (
    select 1
    from public.requirements
    join public.products on products.id = requirements.product_id
    where requirements.id = requirement_suppliers.requirement_id
      and products.user_id = auth.uid()
  )
);
