alter table public.requirement_suppliers
add column if not exists outreach_state text not null default 'pending'
check (outreach_state in ('pending', 'ready', 'contacting', 'contacted', 'failed'));

alter table public.requirement_suppliers
add column if not exists outreach_attempts integer not null default 0;

alter table public.requirement_suppliers
add column if not exists outreach_claimed_at timestamptz;

alter table public.requirement_suppliers
add column if not exists outreach_last_attempted_at timestamptz;

alter table public.requirement_suppliers
add column if not exists outreach_contacted_at timestamptz;

alter table public.requirement_suppliers
add column if not exists outreach_last_error text;

update public.requirement_suppliers
set outreach_state = case
  when match_status = 'shortlisted' then 'ready'
  else 'pending'
end
where outreach_state = 'pending';

create or replace function public.requirement_suppliers_sync_outreach_state()
returns trigger
language plpgsql
as $$
begin
  if new.match_status = 'shortlisted' and (
    tg_op = 'INSERT'
    or old.match_status is distinct from new.match_status
  ) then
    if new.outreach_state in ('pending', 'failed') then
      new.outreach_state = 'ready';
    end if;
  elsif new.match_status <> 'shortlisted' then
    if new.outreach_state in ('ready', 'contacting') then
      new.outreach_state = 'pending';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists requirement_suppliers_sync_outreach_state
on public.requirement_suppliers;

create trigger requirement_suppliers_sync_outreach_state
before insert or update on public.requirement_suppliers
for each row
execute function public.requirement_suppliers_sync_outreach_state();

create index if not exists requirement_suppliers_outreach_queue_idx
on public.requirement_suppliers(outreach_state, updated_at)
where outreach_state in ('ready', 'contacting');
