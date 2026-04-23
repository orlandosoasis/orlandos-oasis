#!/usr/bin/env node
/**
 * Font audit: scans the codebase for any non-Manrope font usage,
 * specifically lingering "Inter" font references.
 *
 * Usage:
 *   node scripts/audit-fonts.mjs
 *   npm run audit:fonts
 *
 * Exits 1 if any forbidden font references are found, 0 otherwise.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, extname } from "node:path";

const ROOT = process.cwd();
const SCAN_DIRS = ["src", "public", "index.html"];
const EXCLUDE_DIRS = new Set([
  "node_modules", "dist", "build", ".git", ".next", ".turbo", "coverage",
]);
const EXTS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
  ".css", ".scss", ".sass", ".less",
  ".html", ".htm", ".svg", ".json",
]);

// Patterns that indicate a real font reference to "Inter" (not the word
// "interface", "interval", "interactive", etc.)
const PATTERNS = [
  { name: "fontFamily prop/attribute with Inter",
    re: /font-?[Ff]amily\s*[:=]\s*["'`][^"'`]*\bInter\b[^"'`]*["'`]/g },
  { name: "Quoted 'Inter' font literal",
    re: /["'`]\s*Inter\s*["'`]/g },
  { name: "CSS font shorthand with Inter",
    re: /\bInter\s*,\s*(sans-serif|system-ui|-apple-system)/g },
  { name: "Google Fonts Inter import",
    re: /fonts\.googleapis\.com\/[^"'`\s]*family=Inter\b/g },
  { name: "Tailwind font-inter utility",
    re: /\bfont-inter\b/g },
];

function walk(path, files = []) {
  let stat;
  try { stat = statSync(path); } catch { return files; }
  if (stat.isFile()) {
    if (EXTS.has(extname(path))) files.push(path);
    return files;
  }
  for (const entry of readdirSync(path)) {
    if (EXCLUDE_DIRS.has(entry)) continue;
    walk(join(path, entry), files);
  }
  return files;
}

const files = SCAN_DIRS.flatMap((d) => walk(join(ROOT, d)));
const findings = [];

for (const file of files) {
  const content = readFileSync(file, "utf8");
  const lines = content.split("\n");
  for (const { name, re } of PATTERNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(content)) !== null) {
      const lineNum = content.slice(0, m.index).split("\n").length;
      findings.push({
        file: relative(ROOT, file),
        line: lineNum,
        rule: name,
        snippet: lines[lineNum - 1]?.trim().slice(0, 160) ?? "",
      });
    }
  }
}

console.log(`\n🔤 Font Audit — scanned ${files.length} files\n`);

if (findings.length === 0) {
  console.log("✅ No forbidden font references found. Manrope is enforced.\n");
  process.exit(0);
}

console.log(`❌ Found ${findings.length} forbidden font reference(s):\n`);
for (const f of findings) {
  console.log(`  ${f.file}:${f.line}`);
  console.log(`    rule: ${f.rule}`);
  console.log(`    > ${f.snippet}\n`);
}
process.exit(1);
