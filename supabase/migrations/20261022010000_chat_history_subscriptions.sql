-- Required schema for the Vercel chat and Midtrans webhook endpoints.
-- Idempotent so it can safely follow the existing account-sync migration.

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

grant select, insert, update, delete on public.chat_history to service_role;
grant select, insert, update, delete on public.user_subscriptions to service_role;
grant select, insert, update, delete on public.payment_events to service_role;
grant usage, select on all sequences in schema public to service_role;

create or replace function public.choco_create_free_subscription()
returns trigger
language plpgsql
security definer
set search_path = public
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

-- A duplicate Midtrans notification must not extend a subscription twice.
create or replace function public.choco_activate_premium_payment(
  p_order_id text,
  p_user_id uuid,
  p_gross_amount numeric,
  p_transaction_status text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_order text;
  resulting_expiry timestamptz;
begin
  if p_order_id is null or length(trim(p_order_id)) < 1
     or p_user_id is null or p_gross_amount is null or p_gross_amount <= 0
     or p_transaction_status not in ('settlement', 'capture') then
    raise exception 'Invalid payment activation parameters';
  end if;

  insert into public.payment_events (order_id, user_id, gross_amount, transaction_status)
  values (p_order_id, p_user_id, p_gross_amount, p_transaction_status)
  on conflict (order_id) do nothing
  returning order_id into inserted_order;

  if inserted_order is null then
    select expires_at into resulting_expiry
      from public.user_subscriptions where user_id = p_user_id;
    return jsonb_build_object('duplicate', true, 'expires_at', resulting_expiry);
  end if;

  insert into public.user_subscriptions (user_id, status, expires_at, updated_at)
  values (p_user_id, 'premium', now() + interval '30 days', now())
  on conflict (user_id) do update
    set status = 'premium',
        expires_at = greatest(
          now(),
          coalesce(public.user_subscriptions.expires_at, now())
        ) + interval '30 days',
        updated_at = now()
  returning expires_at into resulting_expiry;

  return jsonb_build_object('duplicate', false, 'expires_at', resulting_expiry);
end;
$$;

revoke all on function public.choco_activate_premium_payment(text, uuid, numeric, text)
  from public, anon, authenticated;
grant execute on function public.choco_activate_premium_payment(text, uuid, numeric, text)
  to service_role;
