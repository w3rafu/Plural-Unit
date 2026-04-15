create table if not exists public.hub_operator_workflow_state (
	organization_id uuid not null references public.organizations(id) on delete cascade,
	workflow_key text not null,
	workflow_kind text not null check (workflow_kind in ('execution_item', 'followup_signal')),
	status text not null check (status in ('reviewed', 'deferred')),
	reviewed_by_profile_id uuid not null references public.profiles(id) on delete cascade,
	note text not null default '',
	reviewed_against_signature text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	primary key (organization_id, workflow_key)
);

create index if not exists idx_hub_operator_workflow_state_org_kind
	on public.hub_operator_workflow_state (organization_id, workflow_kind);

create index if not exists idx_hub_operator_workflow_state_org_updated
	on public.hub_operator_workflow_state (organization_id, updated_at desc);

alter table public.hub_operator_workflow_state enable row level security;

drop policy if exists "Admins read hub operator workflow state"
	on public.hub_operator_workflow_state;

create policy "Admins read hub operator workflow state"
	on public.hub_operator_workflow_state for select
	using (
		exists (
			select 1
			from public.organization_memberships as memberships
			where memberships.organization_id = hub_operator_workflow_state.organization_id
				and memberships.profile_id = auth.uid()
				and memberships.role = 'admin'
		)
	);

drop policy if exists "Admins manage hub operator workflow state"
	on public.hub_operator_workflow_state;

create policy "Admins manage hub operator workflow state"
	on public.hub_operator_workflow_state for all
	using (
		exists (
			select 1
			from public.organization_memberships as memberships
			where memberships.organization_id = hub_operator_workflow_state.organization_id
				and memberships.profile_id = auth.uid()
				and memberships.role = 'admin'
		)
	)
	with check (
		reviewed_by_profile_id = auth.uid()
		and exists (
			select 1
			from public.organization_memberships as memberships
			where memberships.organization_id = hub_operator_workflow_state.organization_id
				and memberships.profile_id = auth.uid()
				and memberships.role = 'admin'
		)
	);

drop trigger if exists trg_hub_operator_workflow_state_updated_at on public.hub_operator_workflow_state;

create trigger trg_hub_operator_workflow_state_updated_at
	before update on public.hub_operator_workflow_state
	for each row execute function public.set_updated_at();