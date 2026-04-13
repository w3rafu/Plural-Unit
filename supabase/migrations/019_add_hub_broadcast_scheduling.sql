alter table public.hub_broadcasts
	add column if not exists updated_at timestamptz,
	add column if not exists is_draft boolean not null default false,
	add column if not exists publish_at timestamptz;

update public.hub_broadcasts
set updated_at = created_at
where updated_at is null;

alter table public.hub_broadcasts
	alter column updated_at set default now();

alter table public.hub_broadcasts
	alter column updated_at set not null;

create index if not exists idx_hub_broadcasts_org_draft
	on public.hub_broadcasts (organization_id, is_draft);

create index if not exists idx_hub_broadcasts_org_publish
	on public.hub_broadcasts (organization_id, publish_at);

drop policy if exists "Members read own broadcasts" on public.hub_broadcasts;
drop policy if exists "Members read active own broadcasts" on public.hub_broadcasts;
drop policy if exists "Members read live own broadcasts" on public.hub_broadcasts;

create policy "Members read live own broadcasts"
	on public.hub_broadcasts for select
	using (
		organization_id in (
			select organization_id
			from public.organization_memberships
			where profile_id = auth.uid()
		)
		and is_draft = false
		and archived_at is null
		and (publish_at is null or publish_at <= now())
		and (expires_at is null or expires_at > now())
	);

drop trigger if exists trg_hub_broadcasts_updated_at on public.hub_broadcasts;

create trigger trg_hub_broadcasts_updated_at
	before update on public.hub_broadcasts
	for each row execute function public.set_updated_at();