-- Browser push subscriptions and delivery tracking for opt-in event alerts.
create table public.vc_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index vc_push_subscriptions_user_id_idx
  on public.vc_push_subscriptions(user_id);

alter table public.vc_push_subscriptions enable row level security;
revoke all on public.vc_push_subscriptions from public, anon, authenticated;
grant all on public.vc_push_subscriptions to service_role;

create table public.vc_push_deliveries (
  subscription_id uuid not null references public.vc_push_subscriptions(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  notification_type text not null check (notification_type in ('new_event','event_reminder')),
  sent_at timestamptz not null default now(),
  primary key (subscription_id,event_id,notification_type)
);

alter table public.vc_push_deliveries enable row level security;
revoke all on public.vc_push_deliveries from public, anon, authenticated;
grant all on public.vc_push_deliveries to service_role;

-- This secret is generated in production and is available only to service_role.
create table public.vc_push_config (
  config_key text primary key,
  config_value text not null
);

alter table public.vc_push_config enable row level security;
revoke all on public.vc_push_config from public, anon, authenticated;
grant all on public.vc_push_config to service_role;

insert into public.vc_push_config(config_key,config_value)
values ('cron_secret',gen_random_uuid()::text||gen_random_uuid()::text);

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'vc-event-push-dispatch',
  '*/5 * * * *',
  $job$
    select net.http_post(
      url := 'https://dtckvnyuwysulevilfse.supabase.co/functions/v1/event-notifications',
      headers := jsonb_build_object(
        'Content-Type','application/json',
        'apikey','sb_publishable_LiuULCT4WLxAdL3qq3zuZg_KNgfrnCa',
        'Authorization','Bearer '||(select config_value from public.vc_push_config where config_key='cron_secret')
      ),
      body := jsonb_build_object('action','dispatch'),
      timeout_milliseconds := 10000
    );
  $job$
);
