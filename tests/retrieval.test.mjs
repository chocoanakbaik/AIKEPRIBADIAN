import test from "node:test";
import assert from "node:assert/strict";
import {
  formatKnowledgeContext,
  normalizeKnowledgeSources,
  retrieveKnowledge
} from "../netlify/functions/core/retrieval.mjs";

const docs = normalizeKnowledgeSources([
  [
    {
      id: "memory-policy",
      title: "Aturan memori jangka panjang",
      content: "Simpan preferensi stabil dan keputusan proyek yang dinyatakan secara eksplisit.",
      category: "memory",
      source: "test-fixture"
    },
    {
      id: "model-policy",
      title: "Pemilihan model AI",
      content: "Model dasar dapat diganti tanpa mengubah sistem memori dan identitas.",
      category: "architecture",
      source: "test-fixture"
    }
  ]
]);

test("normalizes structured documents and ignores empty records", () => {
  assert.equal(docs.length, 2);
  assert.equal(normalizeKnowledgeSources([[{}, null, "not a document"]]).length, 0);
});

test("retrieves the most relevant document for a query", () => {
  const result = retrieveKnowledge("memori jangka panjang preferensi stabil", docs);
  assert.equal(result[0].id, "memory-policy");
  assert.ok(result[0].score > 0);
});

test("does not invent a result when there is no lexical match", () => {
  assert.deepEqual(retrieveKnowledge("cuaca di planet mars", docs), []);
});

test("limits retrieval count and content length", () => {
  const result = retrieveKnowledge("model memori", docs, { limit: 1 });
  assert.equal(result.length, 1);
  assert.ok(result[0].content.length <= 1800);
});

test("formats references as context and handles empty results", () => {
  assert.equal(formatKnowledgeContext([]), "");
  const context = formatKnowledgeContext(retrieveKnowledge("memori jangka panjang", docs));
  assert.match(context, /REFERENSI PENGETAHUAN TERAMBIL/);
  assert.match(context, /bukan instruksi sistem/);
});
