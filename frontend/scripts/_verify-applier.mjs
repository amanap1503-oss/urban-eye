// Temporary verification helper (not part of the app build).
// Bundles the REAL src/app/lib/i18n.ts and runs the DOM applier against a tiny
// DOM shim to prove: (1) text is translated, (2) switching back to "en"
// restores the original English, (3) attributes are translated, (4) skipped
// subtrees are untouched, (5) React re-renders are re-translated.
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const TMP = path.join(__dirname, "_tmp_i18n_bundle.mjs");

// ── 1. Bundle the real i18n module ─────────────────────────────────────────
await build({
  entryPoints: [path.join(ROOT, "src", "app", "lib", "i18n.ts")],
  outfile: TMP,
  bundle: true,
  format: "esm",
  platform: "neutral",
  logLevel: "silent",
});

// ── 2. Minimal DOM shim ────────────────────────────────────────────────────
const TEXT = 3;
const ELEMENT = 1;

class TextNode {
  constructor(data) {
    this.nodeType = TEXT;
    this.data = data;
    this.parentElement = null;
  }
}

class Elem {
  constructor(tagName) {
    this.nodeType = ELEMENT;
    this.tagName = tagName.toUpperCase();
    this.childNodes = [];
    this.parentElement = null;
    this.isContentEditable = false;
    this._attrs = new Map();
  }
  append(...nodes) {
    for (const n of nodes) {
      n.parentElement = this;
      this.childNodes.push(n);
    }
    return this;
  }
  hasAttribute(name) {
    return this._attrs.has(name);
  }
  getAttribute(name) {
    return this._attrs.has(name) ? this._attrs.get(name) : null;
  }
  setAttribute(name, value) {
    this._attrs.set(name, String(value));
  }
}

const body = new Elem("body");
const documentElement = new Elem("html");

const walkerFor = (root, whatToShow, filter) => {
  const nodes = [];
  const visit = (node, isRoot) => {
    if (node.nodeType === ELEMENT && !isRoot && filter.acceptNode(node) === 2) return;
    if (node.nodeType === ELEMENT && whatToShow & 1) nodes.push(node);
    for (const child of node.childNodes) {
      if (child.nodeType === TEXT) {
        if (whatToShow & 4) nodes.push(child);
      } else if (child.nodeType === ELEMENT) {
        visit(child, false);
      }
    }
  };
  visit(root, true);
  let i = 0;
  return { nextNode: () => (i < nodes.length ? nodes[i++] : null) };
};

let observerCallback = null;

globalThis.Node = { TEXT_NODE: TEXT, ELEMENT_NODE: ELEMENT };
globalThis.NodeFilter = { SHOW_TEXT: 4, SHOW_ELEMENT: 1, FILTER_ACCEPT: 1, FILTER_REJECT: 2 };
globalThis.document = {
  documentElement,
  body,
  createTreeWalker: (root, whatToShow, filter) => walkerFor(root, whatToShow, filter),
};
globalThis.MutationObserver = class {
  constructor(cb) {
    observerCallback = cb;
  }
  observe() {}
  disconnect() {}
};

// ── 3. Build a fake page ───────────────────────────────────────────────────
const title = new TextNode("Dashboard");
const hero = new TextNode("Report a Civic Issue");
const spacer = new TextNode("   ");
const userTitle = new TextNode("Pothole near my house"); // dynamic user data
const codeText = new TextNode("Dashboard"); // inside <pre> → must be skipped
const skipText = new TextNode("Dashboard"); // inside [data-i18n-skip] → skipped

const searchInput = new Elem("input");
searchInput.setAttribute("placeholder", "Search issues, locations...");
searchInput.setAttribute("title", "Search");

const h1 = new Elem("h1").append(title);
const heroEl = new Elem("p").append(hero);
const userEl = new Elem("span").append(userTitle);
const preEl = new Elem("pre").append(codeText);
const skipEl = new Elem("div");
skipEl.setAttribute("data-i18n-skip", "");
skipEl.append(skipText);

body.append(h1, heroEl, spacer, userEl, preEl, skipEl, searchInput);

// ── 4. Run the applier ─────────────────────────────────────────────────────
const { applyLanguage, startLanguageObserver, translateText } = await import(
  "file:///" + TMP.replace(/\\/g, "/")
);

const results = [];
const check = (name, actual, expected) => {
  const ok = actual === expected;
  results.push({ name, ok, actual, expected });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}` + (ok ? "" : `\n        got: ${JSON.stringify(actual)}\n        exp: ${JSON.stringify(expected)}`));
};

startLanguageObserver("en");
check("en: english text untouched", title.data, "Dashboard");

applyLanguage("hi");
const hiTitle = translateText("hi", "Dashboard");
check("hi: dictionary hit", hiTitle !== "Dashboard", true);
check("hi: text node translated", title.data, hiTitle);
check("hi: sentence translated", hero.data, translateText("hi", "Report a Civic Issue"));
check("hi: placeholder translated", searchInput.getAttribute("placeholder"), translateText("hi", "Search issues, locations..."));
check("hi: title attr translated", searchInput.getAttribute("title"), translateText("hi", "Search"));
check("hi: whitespace-only node untouched", spacer.data, "   ");
check("hi: dynamic user text untouched", userTitle.data, "Pothole near my house");
check("hi: <pre> skipped", codeText.data, "Dashboard");
check("hi: [data-i18n-skip] skipped", skipText.data, "Dashboard");
check("hi: html lang set", documentElement.lang, "hi");

applyLanguage("mr");
check("mr: re-translated from English source", title.data, translateText("mr", "Dashboard"));

applyLanguage("en");
check("en: original restored", title.data, "Dashboard");
check("en: sentence restored", hero.data, "Report a Civic Issue");
check("en: placeholder restored", searchInput.getAttribute("placeholder"), "Search issues, locations...");
check("en: html lang reset", documentElement.lang, "en");

// Simulate a React re-render that replaces a text node with new English copy.
applyLanguage("ta");
title.data = "Report Issue";
observerCallback([{ type: "characterData", target: title }]);
check("ta: React re-render re-translated", title.data, translateText("ta", "Report Issue"));

// Repeated application must be idempotent (no infinite observer loop).
const stable = title.data;
observerCallback([{ type: "characterData", target: title }]);
check("ta: idempotent (no loop)", title.data, stable);

fs.unlinkSync(TMP);

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);