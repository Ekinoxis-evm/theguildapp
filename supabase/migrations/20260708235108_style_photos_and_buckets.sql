-- Migration 003: style photos + private storage buckets (roadmap 1.5).
-- Style photos are highly sensitive PII (docs/SECURITY.md): private
-- buckets, owner-only access; barber access will be added narrowly with
-- bookings in Phase 2.

-- ============ style_photos ============
-- One row per (client, angle). updated_at feeds the booking-time
-- "is your style current?" gate.

create type public.photo_position as enum ('front', 'left', 'right', 'back');

create table public.style_photos (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  position public.photo_position not null,
  storage_path text not null,
  updated_at timestamptz not null default now(),
  primary key (profile_id, position)
);

alter table public.style_photos enable row level security;

create policy "style_photos: owner select"
  on public.style_photos for select
  to authenticated
  using ((select auth.uid()) = profile_id);

create policy "style_photos: owner insert"
  on public.style_photos for insert
  to authenticated
  with check ((select auth.uid()) = profile_id);

create policy "style_photos: owner update"
  on public.style_photos for update
  to authenticated
  using ((select auth.uid()) = profile_id)
  with check ((select auth.uid()) = profile_id);

create policy "style_photos: owner delete"
  on public.style_photos for delete
  to authenticated
  using ((select auth.uid()) = profile_id);

create trigger style_photos_set_updated_at
  before update on public.style_photos
  for each row execute function public.set_updated_at();

-- ============ Storage buckets (both PRIVATE) ============

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('style-photos', 'style-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Object paths are namespaced by user id: {auth.uid()}/{filename}.
-- Owner-only for every operation, in both buckets.

create policy "user media: owner select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id in ('avatars', 'style-photos')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "user media: owner insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id in ('avatars', 'style-photos')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "user media: owner update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id in ('avatars', 'style-photos')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "user media: owner delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id in ('avatars', 'style-photos')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
