create table public.hub_event_reminders (
	id uuid primary key default gen_random_uuid(),
	event_id uuid not null unique references public.hub_events(id) on delete cascade,
	organization_id uuid not null references public.organizations(id) on delete cascade,
	delivery_channel text not null default 'in_app' check (delivery_channel in ('in_app')),
	reminder_offsets integer[] not null default '{}',
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create index idx_hub_event_reminders_org_event
	on public.hub_event_reminders (organization_id, event_id);

create index idx_hub_event_reminders_org_updated
	on public.hub_event_reminders (organization_id, updated_at desc);

alter table public.hub_event_reminders enable row level security;

create policy "Admins manage event reminders"
	on public.hub_event_reminders for all
	using (
		organization_id in (
			select organization_id
			from public.organization_memberships
			where profile_id = auth.uid() and role = 'admin'
		)
	);

create trigger trg_hub_event_reminders_updated_at
	before update on public.hub_event_reminders
	for each row execute function public.set_updated_at();