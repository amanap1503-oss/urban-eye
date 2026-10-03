// gen-i18n.mjs
// ---------------------------------------------------------------------------
// Build-time helper that powers the GLOBAL language switching feature.
//
// It scans the existing UI source for user-facing static text (JSX text nodes,
// common string attributes and plain string literals) and produces a static
// English -> <language> dictionary that is consumed by the project's existing
// i18n implementation (src/app/lib/i18n.ts).
//
// Usage:
//   node scripts/gen-i18n.mjs --dry      # only print the candidate strings
//   node scripts/gen-i18n.mjs            # translate + write autoTranslations.ts
//
// Only STATIC UI text found in the source is included, therefore user entered
// content, API data, YOLO/Gemini results and database values are never
// translated.
// ---------------------------------------------------------------------------

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src", "app");
const OUT = path.join(ROOT, "src", "app", "lib", "autoTranslations.ts");

const LANGUAGES = ["hi", "mr", "bn", "ta", "te", "gu", "kn", "ml", "pa"];

const DRY = process.argv.includes("--dry");

// Directories / files that hold data, code or third party widgets.
const EXCLUDE_DIRS = ["components/ui", "components/figma", "data", "lib"];
const EXCLUDE_FILES = ["App.tsx"];

// ---------------------------------------------------------------------------
// 1. Collect source files
// ---------------------------------------------------------------------------
function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(SRC, full).replace(/\\/g, "/");
    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.some((d) => rel === d || rel.startsWith(d + "/"))) continue;
      walk(full, acc);
    } else if (/\.(tsx|ts)$/.test(entry.name)) {
      if (EXCLUDE_FILES.includes(rel)) continue;
      acc.push(full);
    }
  }
  return acc;
}

// ---------------------------------------------------------------------------
// 2. String extraction heuristics
// ---------------------------------------------------------------------------
const ATTRS = ["placeholder", "title", "aria-label", "alt", "label"];

// Words that reveal a string is really a CSS value / code token / font name.
const TECH_WORDS =
  /\b(rgba?|hsla?|oklch|sans-serif|monospace|linear-gradient|translate|rotate|scale|calc|var|Inter|Space Grotesk|JetBrains|url|px|rem|em|vh|vw|deg|ease|cubic-bezier|true|false|null|undefined|number|string|boolean|function|className|style|width|height|color|background|border|margin|padding|display|flex|grid|block|none|auto|hidden|static|relative|absolute|fixed|sticky|container|dashboard-region)\b/i;

// Tailwind-ish utility tokens (present in className string literals).
const CSS_TOKEN =
  /(?:^|\s)(?:bg|text|border|from|to|via|hover|focus|active|group|flex|grid|inline|block|rounded|shadow|opacity|absolute|relative|fixed|sticky|overflow|z|gap|p|m|px|py|mx|my|mt|mb|ml|mr|w|h|min|max|top|left|right|bottom|inset|leading|tracking|font|space|divide|ring|outline|transition|transform|translate|scale|rotate|cursor|select|pointer|resize|backdrop|blur|aspect|order|col|row|justify|items|content|self|place|object|fill|stroke|list|align|whitespace|truncate|uppercase|lowercase|capitalize|italic|underline|antialiased|sm|md|lg|xl|prose|container)-\S+/i;

// Single lowercase words that are genuine UI labels.
const WORD_ALLOWLIST = new Set([
  "all", "none", "new", "open", "closed", "resolved", "pending", "active",
  "dismiss", "cancel", "close", "save", "edit", "delete", "remove", "clear",
  "search", "filter", "sort", "home", "back", "next", "yes", "no", "or", "and",
  "total", "unread", "read", "loading", "error", "success", "warning", "info",
  "upvote", "upvotes", "comment", "comments", "issue", "issues", "report",
  "reports", "status", "category", "priority", "location", "photo", "photos",
  "profile", "rewards", "points", "badge", "badges", "level", "rank", "city",
  "map", "kanban", "dashboard", "admin", "employee", "staff", "officer",
  "team", "assign", "assignment", "resolution", "approved", "rejected",
  "minutes", "hours", "days", "weeks", "today", "yesterday", "tomorrow",
]);

function isTranslatable(raw) {
  const s = raw.trim().replace(/\s+/g, " ");
  if (!s || s.length < 2 || s.length > 180) return false;
  const letters = (s.match(/[A-Za-z]/g) || []).length;
  if (letters < 2) return false;
  if (s.includes("${")) return false;
  if (/https?:\/\//i.test(s) || /\bwww\./i.test(s) || /@[a-z0-9.-]+\./i.test(s)) return false;
  // Structural / code characters
  if (/[\[\]{}<>=\\`|;()]/.test(s)) return false;
  // Code operators / member access
  if (/&&|\|\||=>|==|!=|\.\w+\s*\(/.test(s)) return false;
  if (/^\S+\.\S+\s*\?$/.test(s)) return false;
  if (/\//.test(s) || /:/.test(s)) return false;
  if (s.startsWith("#") || s.startsWith("--") || s.startsWith("@") || s.startsWith(".")) return false;
  // Font stacks / quoted fragments
  if (/['"]/.test(s)) return false;
  // Purely numeric / units
  if (/^[\d.\s]+$/.test(s)) return false;
  if (/^[\d.]+(px|rem|em|%|vh|vw|deg|s|ms)$/i.test(s)) return false;
  // SVG path data (e.g. `d="M 40 0 L 0 0 0 40"`) — code, never UI text.
  if (/^[MmLlHhVvCcSsQqTtAaZz][MmLlHhVvCcSsQqTtAaZz\d\s.,+-]*$/.test(s) && /\d/.test(s)) return false;
  // Digit-dominant strings with stray single letters (coordinate lists).
  {
    const digits = (s.match(/\d/g) || []).length;
    if (digits >= 3 && digits >= letters * 2) return false;
  }
  // Dense symbol soup
  const symbolish = (s.match(/[^\w\s.,!?'&%-]/g) || []).length;
  if (symbolish > 2) return false;
  // Tech vocabulary / css utility classes
  if (TECH_WORDS.test(s)) return false;
  if (CSS_TOKEN.test(s)) return false;
  // Font weight / size numbers glued to words
  if (/\b\w+-\d/.test(s)) return false;
  // camelCase / snake_case / kebab-case identifiers
  if (/[a-z][A-Z]/.test(s)) return false;
  if (/_/.test(s)) return false;
  if (/^[a-z0-9]+(-[a-z0-9]+)+$/.test(s)) return false;
  // Single tokens: only capitalised words or allow-listed UI words
  const isSingle = !/\s/.test(s);
  if (isSingle) {
    if (/^[A-Z][a-z]+$/.test(s)) return true;
    if (/^[A-Z][A-Za-z]*$/.test(s)) return true; // TitleCase / Capitalized
    return WORD_ALLOWLIST.has(s.toLowerCase());
  }
  // Multi word: require that words are mostly natural language
  if (!/^[A-Za-z0-9][A-Za-z0-9 .,!?'&%-]*$/.test(s)) return false;
  return true;
}

function stripComments(code) {
  return code.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");
}

function extract(file) {
  const code = stripComments(fs.readFileSync(file, "utf8"));
  const found = []; // { text, literal }

  // JSX text nodes: >Some text<
  const jsxText = />\s*([^<>{}]+?)\s*</g;
  let m;
  while ((m = jsxText.exec(code))) found.push({ text: m[1], literal: false });

  // Attributes: placeholder="..." / title='...'
  const attrRe = new RegExp(`(?:${ATTRS.join("|")})\\s*=\\s*("[^"]*"|'[^']*'|\\{[^}]*\\})`, "g");
  while ((m = attrRe.exec(code))) {
    const val = m[1];
    if (val.startsWith("{") || val.endsWith("}")) continue;
    found.push({ text: val.slice(1, -1), literal: false });
  }

  // Plain string literals (covers arrays such as column labels, badges, ...)
  const strRe = /"([^"\\\n]{2,200})"|'([^'\\\n]{2,200})'/g;
  while ((m = strRe.exec(code))) found.push({ text: m[1] ?? m[2], literal: true });

  return found;
}

// ---------------------------------------------------------------------------
// 3. Translation via the public Google dictionary endpoint (CORS friendly)
// ---------------------------------------------------------------------------
const ENDPOINT = "https://clients5.google.com/translate_a/t";

async function translateBatch(texts, lang) {
  const params = new URLSearchParams();
  params.set("client", "dict-chrome-ex");
  params.set("sl", "en");
  params.set("tl", lang);
  for (const t of texts) params.append("q", t);
  const res = await fetch(`${ENDPOINT}?${params.toString()}`, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const arr = Array.isArray(json) ? json : [json];
  return arr.map((v) => (Array.isArray(v) ? v.join("") : String(v)));
}

async function translateAll(strings, lang) {
  const out = {};
  const BATCH_CHARS = 1200;
  let batch = [];
  let batchLen = 0;

  const flush = async () => {
    if (!batch.length) return;
    let attempt = 0;
    for (;;) {
      try {
        const res = await translateBatch(batch, lang);
        batch.forEach((src, i) => {
          const t = res[i];
          if (t && t.trim() && t !== src) out[src] = t;
        });
        break;
      } catch (e) {
        attempt++;
        if (attempt >= 4) {
          console.warn(`  ! ${lang} batch failed: ${e.message}`);
          break;
        }
        await sleep(600 * attempt);
      }
    }
    batch = [];
    batchLen = 0;
    await sleep(120);
  };

  for (const s of strings) {
    if (batchLen + s.length > BATCH_CHARS && batch.length) await flush();
    batch.push(s);
    batchLen += s.length;
  }
  await flush();
  return out;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// 4. Main
// ---------------------------------------------------------------------------
async function main() {
  const files = walk(SRC);
  const set = new Set();
  for (const f of files) {
    for (const { text, literal } of extract(f)) {
      const s = text.trim().replace(/\s+/g, " ");
      if (!isTranslatable(text)) continue;
      // String literals must look like a label/sentence (start capitalised)
      // so that code tokens and css class fragments are ignored.
      if (literal) {
        const isSingle = !/\s/.test(s);
        const allow = isSingle && WORD_ALLOWLIST.has(s.toLowerCase());
        if (!/^[A-Z]/.test(s) && !allow) continue;
      }
      set.add(s);
    }
  }
  const strings = [...set].sort();
  console.log(`Extracted ${strings.length} unique UI strings from ${files.length} files.`);

  if (DRY) {
    console.log(strings.join("\n"));
    return;
  }

  const dict = {};
  for (const lang of LANGUAGES) {
    process.stdout.write(`Translating -> ${lang} ... `);
    dict[lang] = await translateAll(strings, lang);
    console.log(`${Object.keys(dict[lang]).length} entries`);
  }

  const header =
    "// AUTO-GENERATED by scripts/gen-i18n.mjs — DO NOT EDIT BY HAND.\n" +
    "// Static English -> <language> dictionary for the whole application.\n" +
    "// Consumed by src/app/lib/i18n.ts (existing i18n implementation).\n\n" +
    "export const AUTO_TRANSLATIONS: Record<string, Record<string, string>> = {\n";

  let body = "";
  for (const lang of LANGUAGES) {
    body += `  ${lang}: {\n`;
    for (const [src, dst] of Object.entries(dict[lang])) {
      body += `    ${JSON.stringify(src)}: ${JSON.stringify(dst)},\n`;
    }
    body += "  },\n";
  }
  body += "};\n";

  fs.writeFileSync(OUT, header + body, "utf8");
  console.log(`Wrote ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});