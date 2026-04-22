-- 045: Add resource draft and archive lifecycle controls.

alter table public.hub_resources
	add column if not exists is_draft boolean not null default false,
	add column if not exists archived_at timestamptz;

create index if not exists idx_hub_resources_org_lifecycle
	on public.hub_resources (organization_id, is_draft, archived_at, sort_order);

drop policy if exists "Members read own resources"
	on public.hub_resources;

create policy "Members read own resources"
	on public.hub_resources for select
	using (
		organization_id in (
			select organization_id
			from public.organization_memberships
			where profile_id = auth.uid()
		)
		and is_draft = false
		and archived_at is null
	);
