-- 030_add_broadcast_acknowledgments.sql
--
-- Lightweight member engagement for broadcasts. Each member can acknowledge
-- a broadcast once (reversible). Admins and members can read all acknowledgments
-- within their organization so aggregate counts are visible.

create table if not exists public.hub_broadcast_acknowledgments (
	id uuid primary key default gen_random_uuid(),
	organization_id uuid not null references public.organizations(id) on delete cascade,
	broadcast_id uuid not null,
	profile_id uuid not null references public.profiles(id) on delete cascade,
	acknowledged_at timestamptz not null default timezone('utc', now()),
	constraint uq_broadcast_acknowledgment unique (organization_id, broadcast_id, profile_id)
);

alter table public.hub_broadcast_acknowledgments enable row level security;

create index if not exists idx_broadcast_ack_org_broadcast
	on public.hub_broadcast_acknowledgments (organization_id, broadcast_id);

-- Members read all acknowledgments within their org (for aggregate counts).
create policy "Members read broadcast acknowledgments"
	on public.hub_broadcast_acknowledgments for select
	using (
		exists (
			select 1
			from public.organization_memberships as memberships
			where memberships.organization_id = hub_broadcast_acknowledgments.organization_id
				and memberships.profile_id = auth.uid()
		)
	);

-- Members insert their own acknowledgment only.
create policy "Members insert own broadcast acknowledgment"
	on public.hub_broadcast_acknowledgments for insert
	with check (
		profile_id = auth.uid()
		and exists (
			select 1
			from public.organization_memberships as memberships
			where memberships.organization_id = hub_broadcast_acknowledgments.organization_id
				and memberships.profile_id = auth.uid()
		)
	);

-- Members delete their own acknowledgment only (undo).
create policy "Members delete own broadcast acknowledgment"
	on public.hub_broadcast_acknowledgments for delete
	using (
		profile_id = auth.uid()
		and exists (
			select 1
			from public.organization_memberships as memberships
			where memberships.organization_id = hub_broadcast_acknowledgments.organization_id
				and memberships.profile_id = auth.uid()
		)
	);
