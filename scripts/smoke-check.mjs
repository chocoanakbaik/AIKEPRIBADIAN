import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  normalizeKnowledgeSources,
  retrieveKnowledge
} from "../netlify/functions/core/retrieval.mjs";

const requiredFiles = [
  "vercel.json",
  "public/index.html",
  "public/auth.js",
  "public/ad-rotation.js",
  "api/tanya-ai.mjs",
  "api/supabase-config.mjs",
  "api/memory.mjs",
  "data/knowledge/tcs-products.mjs",
  "netlify/functions/core/retrieval.mjs",
  "supabase/config.toml",
  "supabase/migrations/20261019010000_account_sync.sql",
  "supabase/migrations/20261021010000_knowledge_rag.sql",
  "supabase/migrations/20261022010000_chat_history_subscriptions.sql"
];

for (const file of requiredFiles) {
  await readFile(file, "utf8");
  console.log(`PASS required file: ${file}`);
}

const [facts, concepts, experiences] = await Promise.all([
  readFile("data/knowledge/facts.json", "utf8").then(JSON.parse),
  readFile("data/knowledge/concepts.json", "utf8").then(JSON.parse),
  readFile("data/knowledge/experiences.json", "utf8").then(JSON.parse)
]);
const documents = normalizeKnowledgeSources([facts, concepts, experiences]);
assert.ok(documents.length >= 5, "Local knowledge corpus must contain reviewed, useful documents.");

const cases = [
  { query: "Groq API Vercel frontend backend", expected: "project-stack" },
  { query: "retrieval augmented generation knowledge documents", expected: "rag-sources" },
  { query: "memory versus conversation history database", expected: "memory-vs-history" },
  { query: "evaluation benchmark before fine tuning", expected: "evaluation-before-training" }
];

let passed = 0;
for (const item of cases) {
  const results = retrieveKnowledge(item.query, documents, { limit: 4 });
  const found = results.some((result) => result.id === item.expected);
  console.log(`${found ? "PASS" : "FAIL"} real-corpus query: ${item.query}; expected=${item.expected}`);
  if (found) passed += 1;
}
assert.equal(passed, cases.length, "Real repository knowledge failed the retrieval smoke baseline.");
console.log(`Repository smoke checks passed; real-corpus retrieval ${passed}/${cases.length}.`);
