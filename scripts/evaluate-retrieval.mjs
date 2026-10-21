import assert from "node:assert/strict";
import { normalizeKnowledgeSources, retrieveKnowledge } from "../netlify/functions/core/retrieval.mjs";

const corpus = normalizeKnowledgeSources([[
  { id: "memory", title: "Persistent memory", content: "Store explicit stable preferences and long-term project decisions.", category: "memory" },
  { id: "rag", title: "Retrieval augmented generation", content: "Retrieve relevant reference documents before generating an answer.", category: "architecture" },
  { id: "fine-tuning", title: "Fine tuning readiness", content: "Fine-tune a base model only after collecting clean approved examples and evaluation results.", category: "training" },
  { id: "ci", title: "Continuous integration", content: "Run automated tests and data validation on every code change.", category: "quality" }
]]);

const cases = [
  { query: "stable preferences and long term project decisions", expected: "memory" },
  { query: "retrieve relevant reference documents before generating answer", expected: "rag" },
  { query: "clean approved examples and evaluation results before fine tune", expected: "fine-tuning" },
  { query: "automated tests and data validation on code changes", expected: "ci" }
];

let passed = 0;
for (const item of cases) {
  const results = retrieveKnowledge(item.query, corpus, { limit: 3 });
  const ok = results.some((result) => result.id === item.expected);
  console.log(`${ok ? "PASS" : "FAIL"} query="${item.query}" expected=${item.expected} top=${results[0]?.id || "none"}`);
  if (ok) passed += 1;
}
console.log(`Retrieval evaluation: ${passed}/${cases.length} (${Math.round((passed / cases.length) * 100)}%)`);
assert.equal(passed, cases.length, "Retrieval evaluation did not meet the baseline.");
