create table if not exists public.hub_notification_preferences (
	id uuid primary key default gen_random_uuid(),
	organization_id uuid not null references public.organizations(id) on delete cascade,
	profile_id uuid not null references public.profiles(id) on delete cascade,
	broadcast_enabled boolean not null default true,
	event_enabled boolean not null default true,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	unique (organization_id, profile_id)
);

create index if not exists idx_hub_notification_preferences_org_profile
	on public.hub_notification_preferences (organization_id, profile_id);

create index if not exists idx_hub_notification_preferences_profile_updated
	on public.hub_notification_preferences (profile_id, updated_at desc);

alter table public.hub_notification_preferences enable row level security;

drop policy if exists "Members manage own hub notification preferences"
	on public.hub_notification_preferences;

create policy "Members manage own hub notification preferences"
	on public.hub_notification_preferences for all
	using (
		profile_id = auth.uid()
		and organization_id in (
			select organization_id
			from public.organization_memberships
			where profile_id = auth.uid()
		)
	);

drop trigger if exists trg_hub_notification_preferences_updated_at on public.hub_notification_preferences;

create trigger trg_hub_notification_preferences_updated_at
	before update on public.hub_notification_preferences
	for each row execute function public.set_updated_at();

create table if not exists public.hub_notification_reads (
	id uuid primary key default gen_random_uuid(),
	organization_id uuid not null references public.organizations(id) on delete cascade,
	profile_id uuid not null references public.profiles(id) on delete cascade,
	notification_kind text not null check (notification_kind in ('broadcast', 'event')),
	source_id uuid not null,
	read_at timestamptz not null default now(),
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	unique (organization_id, profile_id, notification_kind, source_id)
);

create index if not exists idx_hub_notification_reads_org_profile_kind
	on public.hub_notification_reads (organization_id, profile_id, notification_kind);

create index if not exists idx_hub_notification_reads_org_profile_read_at
	on public.hub_notification_reads (organization_id, profile_id, read_at desc);

alter table public.hub_notification_reads enable row level security;

drop policy if exists "Members manage own hub notification reads"
	on public.hub_notification_reads;

create policy "Members manage own hub notification reads"
	on public.hub_notification_reads for all
	using (
		profile_id = auth.uid()
		and organization_id in (
			select organization_id
			from public.organization_memberships
			where profile_id = auth.uid()
		)
	);

drop trigger if exists trg_hub_notification_reads_updated_at on public.hub_notification_reads;

create trigger trg_hub_notification_reads_updated_at
	before update on public.hub_notification_reads
	for each row execute function public.set_updated_at();