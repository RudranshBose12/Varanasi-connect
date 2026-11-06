-- Per-user dashboard shortcut permissions. Admin/owner access is derived from vc_admins.
-- Moderators can be granted only the individual dashboard shortcuts they need.
create table if not exists public.vc_dashboard_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  can_view_website_panel boolean not null default false,
  can_view_bot_dashboard boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.vc_dashboard_access enable row level security;
revoke all on public.vc_dashboard_access from anon, authenticated;
grant select on public.vc_dashboard_access to authenticated;
drop policy if exists "Users can read their own dashboard access" on public.vc_dashboard_access;
create policy "Users can read their own dashboard access"
  on public.vc_dashboard_access for select to authenticated
  using (user_id = (select auth.uid()));
