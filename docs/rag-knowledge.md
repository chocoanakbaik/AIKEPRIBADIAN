# Choco AI knowledge base (RAG)

Choco AI uses reviewed local documents as retrieval context before asking Groq to generate a reply. The retrieval implementation is a dependency-free lexical matcher; it is not semantic/vector search. The chat endpoint imports the local corpus, normalizes it, retrieves a bounded number of relevant records per question, and marks retrieved text as reference data rather than instructions.

## Local repository knowledge

- `data/knowledge/creator-profile.json`: reviewed creator profile, development preferences, and projects.
- `data/knowledge/facts.json`: verifiable facts about this repository and runtime.
- `data/knowledge/concepts.json`: general AI-engineering concepts.
- `data/knowledge/experiences.json`: approved real personal experiences only; this file intentionally starts empty.
- `data/knowledge/project-portfolio.json`: project catalog and the relationship between Choco AI and Sara; distinguishes purpose, implementation, planned scope, and unverified production behavior.

Each record uses an `id`, `title`, `content`, `category`, `source`, and optional `tags`. Keep each record below 12,000 characters. GitHub Actions validates IDs, fields, length limits, and retrieval tests against fixtures and repository data.

Do not put credentials, private user conversations, authentication tokens, or other users' private data into these public repository files. Do not fabricate personal facts or experiences. Keep project statuses anchored to each project's README and current implementation.

## Supabase knowledge documents

The repository contains a migration for a `knowledge_documents` table and search function. However, the current `netlify/functions/chat.js` path reviewed for this branch retrieves the locally imported JSON corpus; it does not yet call the Supabase search function. Do not describe private Supabase knowledge as live retrieval until that integration is implemented and tested. If dynamic private knowledge is added later, preserve owner scoping and row-level security, and never expose a service-role key.

## Search limitations and evaluation

The implementation uses lexical token matching. It can miss paraphrases, spelling variants, or questions with too little token overlap. The quality workflow should include queries for identity, projects, architecture, privacy, memory, and feature status. Consider embeddings only if evaluation shows lexical retrieval is insufficient. CI passing does not prove production credentials, database migrations, authentication, or the live site are configured correctly.
