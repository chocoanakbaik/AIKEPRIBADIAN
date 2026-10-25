-- Jalankan sekali di Supabase SQL Editor.
-- Tabel ini terpisah dari conversations/messages yang sudah dipakai UI Choco AI.

create table if not exists public.chat_history (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) between 1 and 12000),
  created_at timestamptz not null default now()
);
create index if not exists chat_history_user_created_idx
  on public.chat_history (user_id, created_at desc, id desc);
alter table public.chat_history enable row level security;
-- Backend memakai service role; user biasa tidak mendapat akses langsung ke tabel ini.
revoke all on public.chat_history from anon, authenticated;

create table if not exists public.user_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'free' check (status in ('free', 'premium')),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscription_expiry_valid check (status <> 'premium' or expires_at is not null)
);
alter table public.user_subscriptions enable row level security;
-- Perubahan langganan hanya dilakukan backend service role/webhook terverifikasi.
revoke all on public.user_subscriptions from anon, authenticated;

create table if not exists public.payment_events (
  order_id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  gross_amount numeric(12,2) not null check (gross_amount > 0),
  transaction_status text not null,
  received_at timestamptz not null default now()
);
alter table public.payment_events enable row level security;
revoke all on public.payment_events from anon, authenticated;

-- Buat status free otomatis saat akun baru dibuat. Upsert tetap dilakukan backend untuk akun lama.
create or replace function public.choco_create_free_subscription()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.user_subscriptions (user_id, status)
  values (new.id, 'free')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists choco_auth_user_free_subscription on auth.users;
create trigger choco_auth_user_free_subscription
after insert on auth.users
for each row execute function public.choco_create_free_subscription();

-- Catatan konfigurasi:
-- Netlify environment variables wajib: SUPABASE_URL, SUPABASE_ANON_KEY,
-- SUPABASE_SERVICE_ROLE_KEY, GROQ_API_KEY, MIDTRANS_SERVER_KEY, PREMIUM_PRICE_IDR.
-- Jangan pernah menaruh service role key atau Midtrans server key di frontend/repository.
