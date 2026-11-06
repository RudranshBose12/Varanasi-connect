-- Varanasi Connect admin allowlist and admin-only database policies.
-- Review and back up the production database before applying.

create table if not exists public.vc_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('owner','admin')),
  created_at timestamptz not null default now()
);

alter table public.vc_admins enable row level security;
revoke all on public.vc_admins from anon, authenticated;
grant select on public.vc_admins to authenticated;

drop policy if exists "Admins can read their own admin record" on public.vc_admins;
create policy "Admins can read their own admin record" on public.vc_admins
  for select to authenticated using (user_id = (select auth.uid()));

-- Initial owner: Discord account redking3597
insert into public.vc_admins(user_id,role)
values ('17a0ace5-e6af-4e29-85f4-9e57608c51e5','owner')
on conflict (user_id) do update set role='owner';

-- Table grants are paired with the RLS policies below.
grant insert, update, delete on public.events to authenticated;

drop policy if exists "VC admins can insert events" on public.events;
create policy "VC admins can insert events" on public.events for insert to authenticated
  with check (exists(select 1 from public.vc_admins a where a.user_id=(select auth.uid())));
drop policy if exists "VC admins can update events" on public.events;
create policy "VC admins can update events" on public.events for update to authenticated
  using (exists(select 1 from public.vc_admins a where a.user_id=(select auth.uid())))
  with check (exists(select 1 from public.vc_admins a where a.user_id=(select auth.uid())));
drop policy if exists "VC admins can delete events" on public.events;
create policy "VC admins can delete events" on public.events for delete to authenticated
  using (exists(select 1 from public.vc_admins a where a.user_id=(select auth.uid())));

drop policy if exists "VC admins can read all registrations" on public.event_registrations;
create policy "VC admins can read all registrations" on public.event_registrations for select to authenticated
  using (exists(select 1 from public.vc_admins a where a.user_id=(select auth.uid())));

drop policy if exists "VC admins can update reviews" on public.reviews;
create policy "VC admins can update reviews" on public.reviews for update to authenticated
  using (exists(select 1 from public.vc_admins a where a.user_id=(select auth.uid())))
  with check (exists(select 1 from public.vc_admins a where a.user_id=(select auth.uid())));
drop policy if exists "VC admins can delete reviews" on public.reviews;
create policy "VC admins can delete reviews" on public.reviews for delete to authenticated
  using (exists(select 1 from public.vc_admins a where a.user_id=(select auth.uid())));

drop policy if exists "VC admins can insert event images" on public.event_images;
create policy "VC admins can insert event images" on public.event_images for insert to authenticated
  with check (exists(select 1 from public.vc_admins a where a.user_id=(select auth.uid())));
drop policy if exists "VC admins can update event images" on public.event_images;
create policy "VC admins can update event images" on public.event_images for update to authenticated
  using (exists(select 1 from public.vc_admins a where a.user_id=(select auth.uid())))
  with check (exists(select 1 from public.vc_admins a where a.user_id=(select auth.uid())));
drop policy if exists "VC admins can delete event images" on public.event_images;
create policy "VC admins can delete event images" on public.event_images for delete to authenticated
  using (exists(select 1 from public.vc_admins a where a.user_id=(select auth.uid())));
