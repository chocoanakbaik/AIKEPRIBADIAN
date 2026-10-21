-- Curated knowledge for retrieval-augmented generation.
-- Documents are private by default. A document is visible to everyone only when
-- its owner explicitly marks it as public.
create table if not exists public.knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  content text not null check (char_length(content) between 1 and 12000),
  category text not null default 'general' check (char_length(category) <= 80),
  source text not null default 'admin',
  visibility text not null default 'private' check (visibility in ('private', 'public')),
  metadata jsonb not null default '{}'::jsonb,
  search_vector tsvector generated always as (
    to_tsvector('simple'::regconfig, coalesce(title, '') || ' ' || coalesce(content, '') || ' ' || coalesce(category, ''))
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists knowledge_documents_search_idx
  on public.knowledge_documents using gin (search_vector);
create index if not exists knowledge_documents_owner_updated_idx
  on public.knowledge_documents (owner_id, updated_at desc);
create index if not exists knowledge_documents_public_idx
  on public.knowledge_documents (visibility) where visibility = 'public';

alter table public.knowledge_documents enable row level security;

drop policy if exists "Knowledge readable by owner or when public" on public.knowledge_documents;
create policy "Knowledge readable by owner or when public"
  on public.knowledge_documents for select
  using (visibility = 'public' or auth.uid() = owner_id);

drop policy if exists "Users create own knowledge" on public.knowledge_documents;
create policy "Users create own knowledge"
  on public.knowledge_documents for insert
  with check (auth.uid() = owner_id);

drop policy if exists "Users update own knowledge" on public.knowledge_documents;
create policy "Users update own knowledge"
  on public.knowledge_documents for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "Users delete own knowledge" on public.knowledge_documents;
create policy "Users delete own knowledge"
  on public.knowledge_documents for delete
  using (auth.uid() = owner_id);

grant select on public.knowledge_documents to anon, authenticated;
grant insert, update, delete on public.knowledge_documents to authenticated;

create or replace function public.search_knowledge(query_text text, result_limit integer default 4)
returns table (
  id uuid,
  title text,
  content text,
  category text,
  source text,
  rank real
)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  with query_input as (
    select websearch_to_tsquery('simple'::regconfig, left(coalesce(query_text, ''), 500)) as q
  )
  select
    d.id,
    d.title,
    left(d.content, 1800) as content,
    d.category,
    d.source,
    ts_rank(d.search_vector, q.q)::real as rank
  from public.knowledge_documents d
  cross join query_input q
  where length(trim(coalesce(query_text, ''))) > 1
    and numnode(q.q) > 0
    and d.search_vector @@ q.q
  order by ts_rank(d.search_vector, q.q) desc, d.updated_at desc
  limit greatest(1, least(coalesce(result_limit, 4), 8));
$$;

grant execute on function public.search_knowledge(text, integer) to anon, authenticated;

create or replace function public.choco_set_knowledge_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists knowledge_documents_set_updated_at on public.knowledge_documents;
create trigger knowledge_documents_set_updated_at
  before update on public.knowledge_documents
  for each row execute function public.choco_set_knowledge_updated_at();
