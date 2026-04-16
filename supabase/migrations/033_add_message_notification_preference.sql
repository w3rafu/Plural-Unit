-- 033: Add message_enabled to hub_notification_preferences
--
-- Gives message push its own opt-in toggle (default true) so members
-- can control message push independently of broadcast/event alerts.

alter table public.hub_notification_preferences
  add column if not exists message_enabled boolean not null default true;
