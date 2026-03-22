create extension if not exists vector with schema extensions;

create table public.supplier_capabilities (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  capability_type text not null,
  materials text[] not null default '{}'::text[],
  formats text[] not null default '{}'::text[],
  min_moq numeric,
  max_moq numeric,
  certifications text[] not null default '{}'::text[],
  regions_served text[] not null default '{}'::text[],
  description text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.supplier_search_documents (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  capability_id uuid references public.supplier_capabilities(id) on delete cascade,
  document_text text not null,
  embedding extensions.vector(1536),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index supplier_capabilities_supplier_id_idx
on public.supplier_capabilities(supplier_id);

create index supplier_capabilities_type_status_idx
on public.supplier_capabilities(capability_type, status);

create index supplier_search_documents_supplier_id_idx
on public.supplier_search_documents(supplier_id);

create index supplier_search_documents_capability_id_idx
on public.supplier_search_documents(capability_id);

create index supplier_search_documents_embedding_idx
on public.supplier_search_documents
using ivfflat (embedding extensions.vector_cosine_ops)
with (lists = 100);

create trigger supplier_capabilities_set_updated_at
before update on public.supplier_capabilities
for each row
execute function public.set_updated_at();

create trigger supplier_search_documents_set_updated_at
before update on public.supplier_search_documents
for each row
execute function public.set_updated_at();

alter table public.supplier_capabilities enable row level security;
alter table public.supplier_search_documents enable row level security;

create policy "Authenticated users can view supplier capabilities"
on public.supplier_capabilities
for select
to authenticated
using (true);

create policy "Authenticated users can create capabilities for own suppliers"
on public.supplier_capabilities
for insert
to authenticated
with check (
  exists (
    select 1
    from public.suppliers
    where suppliers.id = supplier_capabilities.supplier_id
      and suppliers.created_by_user_id = auth.uid()
  )
);

create policy "Users can update capabilities for own suppliers"
on public.supplier_capabilities
for update
to authenticated
using (
  exists (
    select 1
    from public.suppliers
    where suppliers.id = supplier_capabilities.supplier_id
      and suppliers.created_by_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.suppliers
    where suppliers.id = supplier_capabilities.supplier_id
      and suppliers.created_by_user_id = auth.uid()
  )
);

create policy "Users can delete capabilities for own suppliers"
on public.supplier_capabilities
for delete
to authenticated
using (
  exists (
    select 1
    from public.suppliers
    where suppliers.id = supplier_capabilities.supplier_id
      and suppliers.created_by_user_id = auth.uid()
  )
);

create policy "Authenticated users can view supplier search documents"
on public.supplier_search_documents
for select
to authenticated
using (true);

create policy "Authenticated users can create search docs for own suppliers"
on public.supplier_search_documents
for insert
to authenticated
with check (
  exists (
    select 1
    from public.suppliers
    where suppliers.id = supplier_search_documents.supplier_id
      and suppliers.created_by_user_id = auth.uid()
  )
);

create policy "Users can update search docs for own suppliers"
on public.supplier_search_documents
for update
to authenticated
using (
  exists (
    select 1
    from public.suppliers
    where suppliers.id = supplier_search_documents.supplier_id
      and suppliers.created_by_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.suppliers
    where suppliers.id = supplier_search_documents.supplier_id
      and suppliers.created_by_user_id = auth.uid()
  )
);

create policy "Users can delete search docs for own suppliers"
on public.supplier_search_documents
for delete
to authenticated
using (
  exists (
    select 1
    from public.suppliers
    where suppliers.id = supplier_search_documents.supplier_id
      and suppliers.created_by_user_id = auth.uid()
  )
);
