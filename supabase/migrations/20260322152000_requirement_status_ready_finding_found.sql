create type public.requirement_status_v2 as enum (
  'ready',
  'finding',
  'found'
);

alter table public.requirements
alter column status drop default;

alter table public.requirements
alter column status type public.requirement_status_v2
using (
  case status::text
    when 'draft' then 'ready'::public.requirement_status_v2
    when 'researching' then 'finding'::public.requirement_status_v2
    when 'partially_matched' then 'finding'::public.requirement_status_v2
    when 'matched' then 'found'::public.requirement_status_v2
    when 'blocked' then 'finding'::public.requirement_status_v2
    else 'ready'::public.requirement_status_v2
  end
);

alter table public.requirements
alter column status set default 'ready'::public.requirement_status_v2;

drop type public.requirement_status;

alter type public.requirement_status_v2 rename to requirement_status;
