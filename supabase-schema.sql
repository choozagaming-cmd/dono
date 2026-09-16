-- Personal Stream Interaction Hub — production schema
-- Run in your Supabase SQL editor after replacing YOUR_ADMIN_USER_UUID.

create extension if not exists pgcrypto;

create table if not exists public.overlay_layouts (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Main Overlay',
  layout jsonb not null,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.stream_events (
  id uuid primary key default gen_random_uuid(),
  provider_event_id text unique,
  event_type text not null check (event_type in ('support','drop','challenge')),
  viewer_name text not null default 'Anonymous',
  amount_minor bigint not null check (amount_minor >= 0),
  currency text not null default 'PKR',
  message text,
  tts boolean not null default false,
  title text,
  rarity text,
  icon text,
  asset_url text,
  sound_url text,
  payment_status text not null default 'pending' check (payment_status in ('pending','verified','failed','refunded')),
  moderation_status text not null default 'pending' check (moderation_status in ('pending','approved','blocked')),
  played_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.rare_drops (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  rarity text not null,
  price_minor bigint not null,
  currency text not null default 'PKR',
  inventory integer,
  active boolean not null default true,
  description text,
  asset_url text,
  sound_url text,
  tts_included boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  price_minor bigint not null,
  currency text not null default 'PKR',
  active boolean not null default true,
  description text,
  rules text,
  icon text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.overlay_layouts enable row level security;
alter table public.stream_events enable row level security;
alter table public.rare_drops enable row level security;
alter table public.challenges enable row level security;

-- Public viewers can read only active menu items.
create policy "public can read active drops" on public.rare_drops for select to anon using (active = true);
create policy "public can read active challenges" on public.challenges for select to anon using (active = true);

-- Do NOT grant anonymous insert on stream_events. Verified payments should insert server-side only.
revoke insert, update, delete on public.stream_events from anon, authenticated;
revoke insert, update, delete on public.overlay_layouts from anon;

-- Replace YOUR_ADMIN_USER_UUID before applying these admin policies.
-- create policy "admin manages layouts" on public.overlay_layouts for all to authenticated using (auth.uid() = 'YOUR_ADMIN_USER_UUID'::uuid) with check (auth.uid() = 'YOUR_ADMIN_USER_UUID'::uuid);
-- create policy "admin reads events" on public.stream_events for select to authenticated using (auth.uid() = 'YOUR_ADMIN_USER_UUID'::uuid);
-- create policy "admin updates events" on public.stream_events for update to authenticated using (auth.uid() = 'YOUR_ADMIN_USER_UUID'::uuid) with check (auth.uid() = 'YOUR_ADMIN_USER_UUID'::uuid);
-- create policy "admin manages drops" on public.rare_drops for all to authenticated using (auth.uid() = 'YOUR_ADMIN_USER_UUID'::uuid) with check (auth.uid() = 'YOUR_ADMIN_USER_UUID'::uuid);
-- create policy "admin manages challenges" on public.challenges for all to authenticated using (auth.uid() = 'YOUR_ADMIN_USER_UUID'::uuid) with check (auth.uid() = 'YOUR_ADMIN_USER_UUID'::uuid);

-- Recommended realtime path: broadcast an approved, verified event to a private topic.
create or replace function public.broadcast_stream_event()
returns trigger
security definer
set search_path = ''
language plpgsql
as $$
begin
  if NEW.payment_status = 'verified' and NEW.moderation_status = 'approved' then
    perform realtime.broadcast_changes(
      'stream:main',
      TG_OP,
      TG_OP,
      TG_TABLE_NAME,
      TG_TABLE_SCHEMA,
      NEW,
      OLD
    );
  end if;
  return NEW;
end;
$$;

drop trigger if exists stream_events_broadcast on public.stream_events;
create trigger stream_events_broadcast
after insert or update on public.stream_events
for each row execute function public.broadcast_stream_event();
