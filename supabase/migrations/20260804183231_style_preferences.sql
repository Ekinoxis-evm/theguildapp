-- Taste-first onboarding (roadmap 8.2): clients keep style preferences on
-- their profile; matching (8.3) scores them against barber specialties.
alter table public.profiles
  add column style_preferences text[] not null default '{}';
