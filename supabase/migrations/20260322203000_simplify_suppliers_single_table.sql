create extension if not exists vector with schema extensions;

drop table if exists public.supplier_search_documents;
drop table if exists public.supplier_capabilities;

alter table public.suppliers
add column if not exists products text[] not null default '{}'::text[],
add column if not exists embedding extensions.vector(1536);

create index if not exists suppliers_embedding_idx
on public.suppliers
using ivfflat (embedding extensions.vector_cosine_ops)
with (lists = 100);

truncate table public.suppliers cascade;
