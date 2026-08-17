-- Align the cafes table with the createCafe() payload.
-- This migration is additive and preserves all existing rows.
alter table public.cafes
  add column if not exists official_menu_url text;

comment on column public.cafes.official_menu_url is
  'Optional URL for the cafe official menu page.';
