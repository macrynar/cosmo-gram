/**
 * CI grep-test: no raw sign nominatives after "w " in source files.
 * Correct form: inSign(sign) → "w Baranie", "w Byku", etc.
 * Wrong form:   "w Baran", "w Byk", etc. (mianownik instead of miejscownik).
 */
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "fs";
import { join, extname, relative } from "path";
import { SIGN_LOCATIVE } from "@/lib/i18n/astro";

const CWD = process.cwd();
const SRC = join(CWD, "src");

// Files/prefixes that are explicitly allowed to contain nominative sign names
// (they are AI system prompt examples or the source of truth for declension maps)
const ALLOWLIST_PREFIXES = [
  "lib/i18n/astro.ts",
  "lib/deepseek.ts",        // correction system prompt examples
  "lib/moduleSpecs.ts",     // STYLE_BLOCK examples
  "lib/prompts/",           // prompt templates
];

function isAllowlisted(filePath: string): boolean {
  const rel = relative(SRC, filePath).replace(/\\/g, "/");
  return ALLOWLIST_PREFIXES.some(p => rel.startsWith(p));
}

function gatherTsFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) results.push(...gatherTsFiles(full));
    else if ([".ts", ".tsx"].includes(extname(entry.name))) results.push(full);
  }
  return results;
}

// Nominatives from SIGN_LOCATIVE keys
const SIGN_NOMINATIVES = Object.keys(SIGN_LOCATIVE);

function findViolations(filePath: string): string[] {
  const content = readFileSync(filePath, "utf-8");
  const lines   = content.split("\n");
  const found: string[] = [];

  lines.forEach((line, idx) => {
    const trimmed = line.trimStart();
    // Skip full-line comments
    if (trimmed.startsWith("//") || trimmed.startsWith("*")) return;

    for (const sign of SIGN_NOMINATIVES) {
      // Check for "w [sign]" not followed by the locative suffix
      // e.g., "w Baran" but not "w Baranie"
      const re = new RegExp(`\\bw ${sign}(?!${SIGN_LOCATIVE[sign].slice(sign.length)})\\b`, "g");
      if (re.test(line)) {
        found.push(`${relative(CWD, filePath)}:${idx + 1} → "w ${sign}" (should use inSign("${sign}") = "w ${SIGN_LOCATIVE[sign]}")`);
      }
    }
  });

  return found;
}

const allFiles  = gatherTsFiles(SRC).filter(f => !isAllowlisted(f));
const allViolations = allFiles.flatMap(f => findViolations(f));

describe("declension: no raw sign nominatives after 'w ' in source", () => {
  it("no violations found in src (excluding allowlist)", () => {
    expect(
      allViolations,
      allViolations.length > 0
        ? `Violations:\n${allViolations.join("\n")}`
        : "clean"
    ).toHaveLength(0);
  });
});
