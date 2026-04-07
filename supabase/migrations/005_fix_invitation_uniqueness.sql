-- Fix invitation uniqueness so pending email invites and phone invites do not collide on NULL contacts.

alter table public.organization_invitations
  drop constraint if exists pending_email_key,
  drop constraint if exists pending_phone_key;

create unique index organization_invitations_pending_email_key
  on public.organization_invitations (organization_id, email)
  where status = 'pending' and email is not null;

create unique index organization_invitations_pending_phone_key
  on public.organization_invitations (organization_id, phone)
  where status = 'pending' and phone is not null;

alter table public.organization_invitations
  add constraint organization_invitations_contact_required
  check (num_nonnulls(email, phone) = 1);