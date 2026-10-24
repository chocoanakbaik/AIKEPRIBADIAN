import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  normalizeKnowledgeSources,
  retrieveKnowledge
} from "../netlify/functions/core/retrieval.mjs";

const requiredFiles = [
  "netlify.toml",
  "public/index.html",
  "netlify/functions/chat.js",
  "netlify/functions/memory.js",
  "supabase/config.toml",
  "supabase/migrations/20261019010000_account_sync.sql",
  "supabase/migrations/20261021010000_knowledge_rag.sql"
];

for (const file of requiredFiles) {
  await readFile(file, "utf8");
  console.log(`PASS required file: ${file}`);
}

const [creatorProfile, facts, concepts, experiences, projectPortfolio] = await Promise.all([
  readFile("data/knowledge/creator-profile.json", "utf8").then(JSON.parse),
  readFile("data/knowledge/facts.json", "utf8").then(JSON.parse),
  readFile("data/knowledge/concepts.json", "utf8").then(JSON.parse),
  readFile("data/knowledge/experiences.json", "utf8").then(JSON.parse),
  readFile("data/knowledge/project-portfolio.json", "utf8").then(JSON.parse)
]);
const documents = normalizeKnowledgeSources([creatorProfile, facts, concepts, experiences, projectPortfolio]);
assert.ok(documents.length >= 5, "Local knowledge corpus must contain reviewed, useful documents.");

const cases = [
  { query: "Groq API Netlify frontend backend", expected: "project-stack" },
  { query: "retrieval augmented generation knowledge documents", expected: "rag-sources" },
  { query: "memory versus conversation history database", expected: "memory-vs-history" },
  { query: "evaluation benchmark before fine tuning", expected: "evaluation-before-training" },
  { query: "KasirKita Windows SQLite cashier products customers suppliers", expected: "project-kasirkita" },
  { query: "Sara Choco AI Help Center separate assistant relationship", expected: "assistant-relationship" },
  { query: "Chocobot Guardian Windows local system utility", expected: "project-chocobot-guardian" },
  { query: "daftar semua proyek produk portofolio lengkap Hasby", expected: "project-portfolio-index" },
  { query: "siapa payung utama yang menaungi semua proyek The Choco Corporation", expected: "brand-hierarchy-choco-ecosystem" }
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
