import { readFile } from "node:fs/promises";

const files = [
  "data/knowledge/facts.json",
  "data/knowledge/concepts.json",
  "data/knowledge/experiences.json"
];

let failed = false;
for (const file of files) {
  try {
    const parsed = JSON.parse(await readFile(file, "utf8"));
    const records = Array.isArray(parsed) ? parsed : parsed?.documents;
    if (!Array.isArray(records)) throw new Error('root must be an array or an object with a "documents" array');
    for (const [index, record] of records.entries()) {
      if (!record || typeof record !== "object" || Array.isArray(record)) {
        throw new Error(`record ${index + 1} must be an object`);
      }
      const hasTitle = typeof record.title === "string" || typeof record.name === "string" || typeof record.topic === "string";
      const hasContent = typeof record.content === "string" || typeof record.text === "string" ||
        typeof record.description === "string" || typeof record.fact === "string" || typeof record.answer === "string";
      if (!hasTitle && !hasContent) throw new Error(`record ${index + 1} needs a title/name/topic or content/text/description/fact/answer field`);
      if (record.content && record.content.length > 12000) throw new Error(`record ${index + 1} exceeds the 12,000-character content limit`);
    }
    console.log(`PASS ${file}: ${records.length} records`);
  } catch (error) {
    failed = true;
    console.error(`FAIL ${file}: ${error.message}`);
  }
}
if (failed) process.exitCode = 1;
