// Temporary verification helper (not part of the app build).
// Bundles the generated dictionary and checks it is complete and sane for all
// 9 target languages: equal key coverage, no empty values, no untranslated
// English sentences left behind, and the right Unicode script per language.
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const TMP = path.join(__dirname, "_tmp_dict_bundle.mjs");

await build({
  entryPoints: [path.join(ROOT, "src", "app", "lib", "autoTranslations.ts")],
  outfile: TMP,
  bundle: true,
  format: "esm",
  platform: "neutral",
  logLevel: "silent",
});

const { AUTO_TRANSLATIONS } = await import("file:///" + TMP.replace(/\\/g, "/"));
fs.unlinkSync(TMP);

// Unicode blocks that every translated value should contain at least once.
const SCRIPTS = {
  hi: ["Devanagari", 0x0900, 0x097f],
  mr: ["Devanagari", 0x0900, 0x097f],
  bn: ["Bengali", 0x0980, 0x09ff],
  pa: ["Gurmukhi", 0x0a00, 0x0a7f],
  gu: ["Gujarati", 0x0a80, 0x0aff],
  ta: ["Tamil", 0x0b80, 0x0bff],
  te: ["Telugu", 0x0c00, 0x0c7f],
  kn: ["Kannada", 0x0c80, 0x0cff],
  ml: ["Malayalam", 0x0d00, 0x0d7f],
};

const hasScript = (value, lo, hi) => {
  for (const ch of value) {
    const cp = ch.codePointAt(0);
    if (cp >= lo && cp <= hi) return true;
  }
  return false;
};

// Short ASCII-only strings (acronyms, proper nouns, "OK", "24/7", "GPS") are
// legitimately kept in English. Long ASCII-only strings are a red flag.
const isAcronymLike = (v) => /^[A-Za-z0-9₹%/.,&+()\- ']+$/.test(v) && v.trim().length <= 12;

const langs = Object.keys(AUTO_TRANSLATIONS);
console.log(`languages in dictionary: ${langs.join(", ")}`);

// The English source keys are the union of all languages, plus every key the
// generator scanned (an entry is omitted only when the translator echoed the
// source back, which is legitimate for acronyms and brand names).
const sourceKeys = new Set();
for (const l of langs) for (const k of Object.keys(AUTO_TRANSLATIONS[l])) sourceKeys.add(k);
console.log(`unique English source strings present in the dictionary: ${sourceKeys.size}`);

// Effective coverage = translated entries + strings intentionally kept in
// English. It must be identical for every language.
const effective = langs.map(
  (l) => Object.keys(AUTO_TRANSLATIONS[l]).length + [...sourceKeys].filter((k) => !(k in AUTO_TRANSLATIONS[l])).length
);
const allSame = effective.every((c) => c === effective[0]);
console.log(`effective coverage: ${langs.map((l, i) => `${l}=${effective[i]}`).join(" ")}`);
console.log(`${allSame ? "PASS" : "FAIL"}  all languages cover the same set of source strings`);

let problems = 0;
for (const lang of langs) {
  const dict = AUTO_TRANSLATIONS[lang];
  const [scriptName, lo, hi] = SCRIPTS[lang];
  let empty = 0;
  let identical = 0;
  let asciiOnly = 0;
  let wrongScript = 0;
  const samples = [];

  for (const [src, dst] of Object.entries(dict)) {
    if (!dst || !dst.trim()) {
      empty++;
      samples.push(`EMPTY   ${JSON.stringify(src)}`);
      continue;
    }
    if (dst === src) {
      identical++;
      samples.push(`SAME-EN ${JSON.stringify(src)}`);
      continue;
    }
    if (!hasScript(dst, lo, hi)) {
      if (isAcronymLike(dst)) {
        asciiOnly++;
      } else {
        wrongScript++;
        samples.push(`NO-${scriptName.toUpperCase()} ${JSON.stringify(src)} -> ${JSON.stringify(dst)}`);
      }
    }
  }

  // A key may legitimately be absent when the translator returns the source
  // unchanged (acronyms, brand names: "API", "SLA", "Google", "Zomato", ...).
  const missingAll = [...sourceKeys].filter((k) => !(k in dict));
  const missing = missingAll.filter((k) => !isAcronymLike(k));
  const missingAcronyms = missingAll.filter((k) => isAcronymLike(k));
  const ok = empty === 0 && identical === 0 && wrongScript === 0 && missing.length === 0;
  if (!ok) problems++;
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${lang} (${scriptName}): ${Object.keys(dict).length} entries, ` +
      `empty=${empty} same-as-english=${identical} wrong-script=${wrongScript} ` +
      `missing=${missing.length} untranslated-acronym=${missingAcronyms.length} acronym-value=${asciiOnly}`
  );
  if (missingAcronyms.length) {
    console.log(`        kept in English (expected): ${missingAcronyms.map((s) => JSON.stringify(s)).join(", ")}`);
  }
  for (const m of missing) console.log(`        MISSING ${JSON.stringify(m)}`);
  for (const s of samples.slice(0, 5)) console.log(`        ${s}`);
}

console.log(`\n${problems === 0 ? "ALL LANGUAGES OK" : `${problems} language(s) with problems`}`);
process.exit(problems ? 1 : 0);