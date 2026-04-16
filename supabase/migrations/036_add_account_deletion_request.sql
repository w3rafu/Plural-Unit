-- Migration 036: Add account deletion request
-- Records that a member has requested account deletion.
-- Actual data removal is handled as an out-of-band ops process.

alter table public.profiles
  add column if not exists deletion_requested_at timestamptz;

comment on column public.profiles.deletion_requested_at
  is 'Timestamp when the member requested account deletion. NULL means no request.';

-- RPC: request_account_deletion
-- Sets deletion_requested_at for the calling user.
create or replace function public.request_account_deletion()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set deletion_requested_at = now()
  where id = auth.uid()
    and deletion_requested_at is null;
end;
$$;

revoke all on function public.request_account_deletion() from public;
grant execute on function public.request_account_deletion() to authenticated;
