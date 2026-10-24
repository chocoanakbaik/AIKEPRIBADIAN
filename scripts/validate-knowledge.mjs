import { readFile } from "node:fs/promises";

const files = [
  "data/knowledge/creator-profile.json",
  "data/knowledge/facts.json",
  "data/knowledge/concepts.json",
  "data/knowledge/experiences.json",
  "data/knowledge/project-portfolio.json"
];

const seenIds = new Set();
let totalRecords = 0;
let failed = false;

for (const file of files) {
  try {
    const parsed = JSON.parse(await readFile(file, "utf8"));
    const records = Array.isArray(parsed) ? parsed : parsed?.documents;
    if (!Array.isArray(records)) {
      throw new Error('root must be an array or an object with a "documents" array');
    }

    const seenTitles = new Set();
    for (const [index, record] of records.entries()) {
      const label = `record ${index + 1}`;
      if (!record || typeof record !== "object" || Array.isArray(record)) {
        throw new Error(`${label} must be an object`);
      }

      const title = [record.title, record.name, record.topic, record.label]
        .find((value) => typeof value === "string" && value.trim());
      const content = [record.content, record.text, record.description, record.fact, record.answer]
        .find((value) => typeof value === "string" && value.trim());
      if (!title && !content) throw new Error(`${label} needs a title or content field`);
      if (typeof record.id === "string" && record.id.trim()) {
        if (seenIds.has(record.id)) throw new Error(`duplicate id across knowledge files: ${record.id}`);
        seenIds.add(record.id);
      }

      const normalizedTitle = String(title || "").trim().toLocaleLowerCase("id-ID");
      if (normalizedTitle && seenTitles.has(normalizedTitle)) {
        throw new Error(`duplicate title in this file: ${title}`);
      }
      if (normalizedTitle) seenTitles.add(normalizedTitle);

      if (String(title || "").length > 200) throw new Error(`${label} title exceeds 200 characters`);
      const body = String(content || "");
      if (body.length > 12000) throw new Error(`${label} content exceeds 12,000 characters`);
      if (typeof record.category === "string" && record.category.length > 80) {
        throw new Error(`${label} category exceeds 80 characters`);
      }
      if (record.tags !== undefined && !Array.isArray(record.tags) && typeof record.tags !== "string") {
        throw new Error(`${label} tags must be a string or an array`);
      }
      if (Array.isArray(record.tags) && record.tags.some((tag) => typeof tag !== "string")) {
        throw new Error(`${label} tags array may contain only strings`);
      }
    }

    totalRecords += records.length;
    console.log(`PASS ${file}: ${records.length} records`);
  } catch (error) {
    failed = true;
    console.error(`FAIL ${file}: ${error.message}`);
  }
}

console.log(`Knowledge validation: ${totalRecords} records across ${files.length} files`);
if (failed) process.exitCode = 1;
