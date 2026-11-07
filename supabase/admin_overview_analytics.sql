-- Admin overview activity and active-account tracking.
-- Apply to production only after the project owner approves the database change.

create table if not exists public.vc_site_activity (
  id uuid primary key default gen_random_uuid(),
  activity_type text not null check (activity_type in ('page_view', 'click', 'login')),
  page_path text not null check (char_length(page_path) <= 180),
  target text check (target is null or char_length(target) <= 180),
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint vc_site_activity_login_has_user check (activity_type <> 'login' or user_id is not null),
  constraint vc_site_activity_click_has_target check (activity_type <> 'click' or target is not null)
);

create index if not exists vc_site_activity_type_created_idx
  on public.vc_site_activity (activity_type, created_at desc);
create index if not exists vc_site_activity_created_idx
  on public.vc_site_activity (created_at);

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create or replace function private.prune_old_vc_site_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.vc_site_activity where created_at < now() - interval '90 days';
  return null;
end;
$$;
revoke all on function private.prune_old_vc_site_activity() from public, anon, authenticated;
drop trigger if exists prune_old_vc_site_activity on public.vc_site_activity;
create trigger prune_old_vc_site_activity
  after insert on public.vc_site_activity
  for each statement execute function private.prune_old_vc_site_activity();

alter table public.vc_site_activity enable row level security;
revoke all on public.vc_site_activity from anon, authenticated;
grant insert on public.vc_site_activity to anon, authenticated;
grant select on public.vc_site_activity to authenticated;

drop policy if exists "Visitors can record anonymous page views and clicks" on public.vc_site_activity;
create policy "Visitors can record anonymous page views and clicks"
  on public.vc_site_activity for insert to anon
  with check (user_id is null and activity_type in ('page_view', 'click'));

drop policy if exists "Signed in visitors can record activity and their login" on public.vc_site_activity;
create policy "Signed in visitors can record activity and their login"
  on public.vc_site_activity for insert to authenticated
  with check (
    (activity_type in ('page_view', 'click') and user_id is null)
    or (activity_type = 'login' and user_id = (select auth.uid()))
  );

drop policy if exists "VC admins can read website activity" on public.vc_site_activity;
create policy "VC admins can read website activity"
  on public.vc_site_activity for select to authenticated
  using (exists (select 1 from public.vc_admins a where a.user_id = (select auth.uid())));

create table if not exists public.vc_active_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_seen timestamptz not null default now()
);

alter table public.vc_active_accounts enable row level security;
revoke all on public.vc_active_accounts from anon, authenticated;
grant select, insert, update, delete on public.vc_active_accounts to authenticated;

drop policy if exists "Accounts can maintain their own active status" on public.vc_active_accounts;
create policy "Accounts can maintain their own active status"
  on public.vc_active_accounts for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "VC admins can view active account status" on public.vc_active_accounts;
create policy "VC admins can view active account status"
  on public.vc_active_accounts for select to authenticated
  using (exists (select 1 from public.vc_admins a where a.user_id = (select auth.uid())));
