# Cloudflare Worker backend

This Worker replaces the Groq call previously made by the Netlify chat function. The browser continues to call `/.netlify/functions/chat`; Netlify forwards the request to the Worker using a shared server-side secret.

## Deploy once

1. Open the Cloudflare Worker named `choco-ai`.
2. Replace its editor contents with the complete source in `cloudflare/worker.js`, then deploy.
3. In the Worker settings, add these **secrets**:
   - `GROQ_API_KEY`: the Groq API key. Store it only as a Worker secret, never in frontend code or GitHub.
   - `CHAT_PROXY_SECRET`: a long random secret shared with Netlify. Generate a different value for this project; do not use an example or commit it.
   - Optional `GROQ_MODEL`: defaults to `openai/gpt-oss-20b`.
4. In Netlify site environment variables, add:
   - `CHOCO_WORKER_PROXY_SECRET`: exactly the same value as Cloudflare's `CHAT_PROXY_SECRET`.
   - `CHOCO_AI_WORKER_URL`: `https://choco-ai.hasbyprasetya09.workers.dev` (optional; this is the current default in the Netlify function).
5. Redeploy the Netlify site so the function receives the new environment variables.
6. Check `https://choco-ai.hasbyprasetya09.workers.dev/health`. It should return JSON showing the D1 database is connected. Then test a chat on the live site.

## D1

The Worker creates an `api_usage` table automatically and stores a SHA-256 hash of the client IP, not the raw IP. The current limit is 20 chat requests per 10-minute window per client IP. Existing `users`, `sessions`, `conversations`, and `messages` tables are left untouched.

## Important migration note

Google login, conversation history, and long-term memories still use Supabase. This Worker currently handles chat inference and D1-backed request limiting; it does not migrate Supabase account/history tables into D1. The Groq API key should be removed from Netlify environment variables after the Worker chat path is confirmed working.
