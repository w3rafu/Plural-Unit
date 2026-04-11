-- Performance indexes for columns used by RLS policies and frequent lookups.

create index idx_memberships_profile
  on public.organization_memberships(profile_id);

create index idx_invitations_org
  on public.organization_invitations(organization_id);

create index idx_invitations_token
  on public.organization_invitations(token);

create index idx_broadcasts_org
  on public.hub_broadcasts(organization_id);

create index idx_events_org
  on public.hub_events(organization_id);
