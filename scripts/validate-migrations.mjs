import { readFile } from "node:fs/promises";

const basePath = "supabase/migrations/20261019010000_account_sync.sql";
const ragPath = "supabase/migrations/20261021010000_knowledge_rag.sql";
const checks = [];

const base = (await readFile(basePath, "utf8")).toLowerCase();
const rag = (await readFile(ragPath, "utf8")).toLowerCase();

for (const table of ["profiles", "conversations", "messages", "memories"]) {
  checks.push({
    name: `account schema enables RLS for ${table}`,
    ok: base.includes(`alter table public.${table} enable row level security`)
  });
}
checks.push(
  { name: "knowledge table enables RLS", ok: rag.includes("alter table public.knowledge_documents enable row level security") },
  { name: "knowledge documents are private by default", ok: /visibility text not null default 'private'/.test(rag) },
  { name: "knowledge reads are owner/public scoped", ok: rag.includes("visibility = 'public' or auth.uid() = owner_id") },
  { name: "knowledge writes require owner identity", ok: rag.includes("with check (auth.uid() = owner_id)") },
  { name: "search RPC uses invoker privileges", ok: rag.includes("security invoker") },
  { name: "search RPC caps result count", ok: rag.includes("least(coalesce(result_limit, 4), 8)") },
  { name: "RAG migration does not embed credentials", ok: !/(service_role|supabase_access_token|groq_api_key|password\s*=)/i.test(rag) }
);

let failures = 0;
for (const check of checks) {
  console.log(`${check.ok ? "PASS" : "FAIL"} ${check.name}`);
  if (!check.ok) failures += 1;
}
console.log(`Migration security checks: ${checks.length - failures}/${checks.length}`);
if (failures) process.exitCode = 1;
