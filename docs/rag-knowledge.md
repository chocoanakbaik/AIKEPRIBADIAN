# Choco AI knowledge base (RAG)

Choco AI retrieves relevant references before asking Groq to generate a reply. It combines reviewed local JSON documents with the optional Supabase full-text index. The current implementation is deliberately lightweight and does not require a vector database.

## Local repository knowledge

Reviewed starter records live in:
- `data/knowledge/facts.json`: verifiable facts about this repository and runtime.
- `data/knowledge/concepts.json`: general AI engineering concepts.
- `data/knowledge/experiences.json`: real personal experiences only when supplied and approved; this file intentionally starts empty.

Each file is a JSON array. Records use an `id`, `title`, `content`, `category`, `source`, and optional `tags`. Content must stay below 12,000 characters. GitHub Actions validates the records and runs retrieval tests against both a fixture and the real repository corpus.

Do not put credentials, private user conversations, authentication tokens, or other users' private data into these public repository files. Do not fabricate personal facts or experiences to make the corpus look complete.

## Supabase knowledge documents

The migration `20261021010000_knowledge_rag.sql` creates `public.knowledge_documents`. After the migration is applied:
- Add documents through Supabase Table Editor while signed in as the intended owner.
- Set `owner_id` to that owner's authenticated UUID.
- Keep `visibility = private` unless content is intentionally suitable for every visitor.
- Set `visibility = public` only for content that may be returned to guest users.
- Keep content factual, reviewed, and scoped to one subject per document.

The browser sends its current Supabase access token to the chat endpoint. The backend calls `search_knowledge` using the anon key and that token. Row-level security ensures private records are retrievable only by their owner; the backend does not use or expose a service-role key.

If the migration is not yet applied or Supabase retrieval fails, chat falls back to local repository retrieval and normal model response. RAG is an enhancement, not a hard dependency.

## Search limitations and evaluation

This first version uses PostgreSQL full-text search and lightweight lexical matching. It is not semantic/vector search. The quality workflow measures retrieval against fixtures and the actual local corpus; consider embeddings only if real test queries show that lexical search is insufficient.
