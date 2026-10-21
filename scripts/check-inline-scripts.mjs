import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const html = readFileSync("public/index.html", "utf8");
const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
  .filter((match) => match[2].trim() && !/type\s*=\s*["']application\/(?:ld\+json|json)["']/i.test(match[1]));

if (!scripts.length) {
  console.error("No inline JavaScript blocks found in public/index.html");
  process.exit(1);
}

const tempDir = mkdtempSync(join(tmpdir(), "choco-inline-js-"));
let failures = 0;
try {
  scripts.forEach((match, index) => {
    const file = join(tempDir, `inline-${index + 1}.mjs`);
    writeFileSync(file, match[2], "utf8");
    const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
    if (result.status !== 0) {
      failures += 1;
      console.error(`FAIL inline script ${index + 1}:\n${result.stderr || result.stdout}`);
    } else {
      console.log(`PASS inline script ${index + 1}`);
    }
  });
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
if (failures) process.exitCode = 1;
