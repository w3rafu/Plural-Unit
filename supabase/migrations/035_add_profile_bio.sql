-- Migration 035: Add bio field to profiles
-- Allows members to write a short bio (up to 500 characters).

alter table public.profiles
  add column if not exists bio text;

comment on column public.profiles.bio is 'Short member bio, max 500 characters.';
