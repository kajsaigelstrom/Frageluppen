// Kör Frågeluppens logik utan webbläsare: plockar ut det stora <script>-blocket ur index.html
// och kör det i en Node-sandbox med stubbad DOM. Används av testerna i den här mappen.
// Innehåller ingen tentadata – testerna bygger syntetisk data ur verktygets demoläge.
//
//   node --test tools/*.test.mjs
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const INDEX = path.join(HERE, "..", "index.html");

/** Källkoden i verktygets huvudskript (det sista <script> utan src). */
export function appSource() {
  const html = fs.readFileSync(INDEX, "utf8");
  const blocks = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  if (!blocks.length) throw new Error("Hittade inget inbäddat skript i index.html");
  return blocks.reduce((a, b) => (b.length > a.length ? b : a));
}

function makeEl() {
  const cls = new Set();
  const el = {
    classList: { add(...c) { c.forEach(x => cls.add(x)); }, remove(...c) { c.forEach(x => cls.delete(x)); },
      toggle(c, on) { const want = on === undefined ? !cls.has(c) : !!on; want ? cls.add(c) : cls.delete(c); return want; },
      contains(c) { return cls.has(c); } },
    style: {}, dataset: {}, files: [], children: [],
    innerHTML: "", textContent: "", value: "", disabled: false, checked: false,
    listeners: {},
    addEventListener(type, fn) { (el.listeners[type] ||= []).push(fn); }, removeEventListener() {}, appendChild() {}, remove() {},
    setAttribute() {}, getAttribute() { return null; }, click() {}, focus() {}, scrollIntoView() {},
    querySelector() { return makeEl(); }, querySelectorAll() { return []; }, closest() { return null; },
  };
  return el;
}

function run(code, filename, docHtml) {
  const cache = new Map();
  const bySel = s => { if (!cache.has(s)) cache.set(s, makeEl()); return cache.get(s); };
  const document = {
    querySelector: bySel,
    getElementById: id => bySel("#" + id),
    querySelectorAll: () => [],
    createElement: () => makeEl(),
    addEventListener() {},
    body: makeEl(), documentElement: makeEl(),
  };
  // Sidans egen källa, som en webbläsare ger den (utan doctype) – appen bygger examinatorns fil ur den.
  document.documentElement.outerHTML = (docHtml || "").replace(/^\s*<!DOCTYPE[^>]*>\s*/i, "");
  // Inbäddade datablock (<script type="application/json" id="…">) görs läsbara via getElementById.
  for (const m of (docHtml || "").matchAll(/<script type="application\/json" id="([^"]+)">([\s\S]*?)<\/script>/g)) bySel("#" + m[1]).textContent = m[2];
  const downloads = [], urlEvents = [];
  const laterUnref = (fn, ms) => { const t = setTimeout(fn, ms); if (t && t.unref) t.unref(); return t; };   // håll inte testkörningen vid liv
  const sandbox = {
    document, console, setTimeout: laterUnref, clearTimeout,
    alert() {}, confirm() { return true; }, print() {},
    navigator: { userAgent: "node" }, location: { hash: "" },
    URL: { createObjectURL(b) { downloads.push(b); urlEvents.push("create"); return "blob:test"; }, revokeObjectURL() { urlEvents.push("revoke"); } },
    Blob: class { constructor(parts, opts) { this.parts = parts; this.opts = opts; } },
    __downloads: downloads,
  };
  sandbox.window = sandbox;
  const ctx = vm.createContext(sandbox);
  new vm.Script(code, { filename }).runInContext(ctx);   // kastar vid syntaxfel och vid fel under start
  const ev = c => vm.runInContext(c, ctx);
  const evj = c => { const s = vm.runInContext(`JSON.stringify(${c})`, ctx); return s === undefined ? undefined : JSON.parse(s); };
  const set = (name, value) => { sandbox[name] = value; };   // lägg in ett värde som global i sandboxen
  return { ev, evj, set, el: bySel, downloads, urlEvents };
}

/** Laddar appen. ev(kod) ger råvärdet, evj(kod) ger en JSON-klon (jämförbar med deepEqual),
 *  el(selektor) ger det stubbade elementet (t.ex. el("#cards").innerHTML). */
export function loadApp() { return run(appSource(), "index.html<script>", fs.readFileSync(INDEX, "utf8")); }

/** Kör skriptet i en exporterad rapport (HTML-sträng) på samma sätt. Det som sidan ritar hamnar i
 *  de stubbade elementens innerHTML och kan läsas med el(). */
export function runHtml(html) {
  const blocks = [...html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*application\/json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  if (!blocks.length) throw new Error("Rapporten innehåller inget skript");
  return run(blocks.reduce((a, b) => (b.length > a.length ? b : a)), "rapport<script>", html);
}

/** Sammanfattning av allt som statistiken bygger på, som JSON-sträng. Två indata som ger samma
 *  sträng ger samma siffror i alla vyer. jsonExpr är ett uttryck som ger parseJSON:s resultat. */
export function fingerprint(ev, jsonExpr) {
  return ev(`(function(J){
    const perQ={};
    for(const qn of Object.keys(J.agg)){ const a=J.agg[qn];
      perQ[qn]={n:a.n,ncorr:a.ncorr,total:a.total,max:a.max,picks:[...a.picks],slotN:[...a.slotN]}; }
    return JSON.stringify({candCount:J.candCount,mcqSeqs:J.mcqSeqs,qMeta:J.qMeta,cohortScores:J.cohortScores,
      ungradedPts:J.ungradedPts,fullyGraded:J.fullyGraded,maxTotal:J.maxTotal,discMcq:J.discMcq,perQ});
  })(${jsonExpr})`);
}
