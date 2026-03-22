create extension if not exists vector with schema extensions;

create index if not exists requirements_status_updated_at_idx
on public.requirements(status, updated_at);

create or replace function public.match_suppliers_by_embedding(
  query_embedding extensions.vector(1536),
  match_count int default 10
)
returns table (
  supplier_id uuid,
  similarity double precision
)
language sql
stable
as $$
  select
    suppliers.id as supplier_id,
    greatest(
      0::double precision,
      1 - (suppliers.embedding OPERATOR(extensions.<=>) query_embedding)
    ) as similarity
  from public.suppliers
  where suppliers.embedding is not null
  order by suppliers.embedding OPERATOR(extensions.<=>) query_embedding
  limit greatest(coalesce(match_count, 10), 1)
$$;

grant execute
on function public.match_suppliers_by_embedding(extensions.vector, int)
to authenticated, service_role;
