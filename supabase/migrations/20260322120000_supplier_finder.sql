do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'requirement_status'
  ) then
    create type public.requirement_status as enum ('draft', 'researching', 'matched', 'blocked');
  end if;

  if not exists (
    select 1
    from pg_type
    where typname = 'supplier_match_status'
  ) then
    create type public.supplier_match_status as enum ('candidate', 'shortlisted', 'rejected');
  end if;
end $$;

create table if not exists public.requirements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null,
  title text not null,
  description text,
  category text,
  status public.requirement_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website text not null,
  email text,
  phone text,
  country text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.requirement_suppliers (
  id uuid primary key default gen_random_uuid(),
  requirement_id uuid not null references public.requirements(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  match_status public.supplier_match_status not null default 'candidate',
  fit_score numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (requirement_id, supplier_id)
);

create unique index if not exists idx_suppliers_website
  on public.suppliers (website);

create index if not exists idx_reqsupp_requirement_id
  on public.requirement_suppliers (requirement_id);

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'products'
  ) and not exists (
    select 1
    from pg_constraint
    where conname = 'requirements_product_id_fkey'
  ) then
    alter table public.requirements
      add constraint requirements_product_id_fkey
      foreign key (product_id)
      references public.products(id)
      on delete cascade;
  end if;
end $$;
