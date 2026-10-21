# Choco AI knowledge base (RAG)

Choco AI now retrieves relevant references before asking Groq to generate a reply. It combines small local JSON datasets with the optional Supabase full-text index. The current implementation is deliberately lightweight and does not require a vector database.

## Local repository knowledge

Add reviewed, non-secret reference records to one of:

- `data/knowledge/facts.json`
- `data/knowledge/concepts.json`
- `data/knowledge/experiences.json`

Each file is a JSON array. A record can use `title`, `content`, optional `category`, `source`, and `tags`. Keep each content field below 12,000 characters. GitHub Actions validates these files and runs a retrieval benchmark on every push and pull request.

Do not put credentials, private user conversations, authentication tokens, or other users' private data into these public repository files.

## Supabase knowledge documents

The migration `20261021010000_knowledge_rag.sql` creates `public.knowledge_documents`. After the migration is applied:

- Add documents through the Supabase Table Editor while signed in as the owner account.
- Set `owner_id` to the authenticated owner's UUID.
- Keep `visibility = private` unless the content is intentionally suitable for every visitor.
- Set `visibility = public` only for content that may be returned to guest users.
- Keep content factual, reviewed, and scoped to one subject per document.

The browser sends the current Supabase access token to the chat endpoint. The backend calls `search_knowledge` using the anon key and that token. Row-level security ensures private records are retrievable only by their owner; the backend does not use or expose a service-role key.

If the migration is not yet applied or Supabase retrieval fails, chat falls back to the normal model response and local repository retrieval. RAG is an enhancement, not a hard dependency.

## Search limitations

This first version uses PostgreSQL full-text search and lightweight lexical matching. It is not semantic/vector search. The quality workflow measures the retrieval baseline; consider embeddings only if real test queries show that lexical search is insufficient.
