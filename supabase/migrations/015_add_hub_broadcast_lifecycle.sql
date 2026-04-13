alter table public.hub_broadcasts
	add column if not exists is_pinned boolean not null default false,
	add column if not exists archived_at timestamptz,
	add column if not exists expires_at timestamptz;

create index if not exists idx_hub_broadcasts_org_pinned
	on public.hub_broadcasts (organization_id, is_pinned);

create index if not exists idx_hub_broadcasts_org_archived
	on public.hub_broadcasts (organization_id, archived_at desc);

create index if not exists idx_hub_broadcasts_org_expires
	on public.hub_broadcasts (organization_id, expires_at);

drop policy if exists "Members read own broadcasts" on public.hub_broadcasts;

create policy "Members read active own broadcasts"
	on public.hub_broadcasts for select
	using (
		organization_id in (
			select organization_id
			from public.organization_memberships
			where profile_id = auth.uid()
		)
		and archived_at is null
		and (expires_at is null or expires_at > now())
	);
