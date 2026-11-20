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
  const el = {
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    style: {}, dataset: {}, files: [], children: [],
    innerHTML: "", textContent: "", value: "", disabled: false, checked: false,
    addEventListener() {}, removeEventListener() {}, appendChild() {}, remove() {},
    setAttribute() {}, getAttribute() { return null; }, click() {}, focus() {}, scrollIntoView() {},
    querySelector() { return makeEl(); }, querySelectorAll() { return []; }, closest() { return null; },
  };
  return el;
}

/** Laddar appen. ev(kod) ger råvärdet, evj(kod) ger en JSON-klon (jämförbar med deepEqual). */
export function loadApp() {
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
  const downloads = [];
  const sandbox = {
    document, console, setTimeout, clearTimeout,
    alert() {}, confirm() { return true; },
    navigator: { userAgent: "node" },
    URL: { createObjectURL(b) { downloads.push(b); return "blob:test"; }, revokeObjectURL() {} },
    Blob: class { constructor(parts, opts) { this.parts = parts; this.opts = opts; } },
    __downloads: downloads,
  };
  sandbox.window = sandbox;
  const ctx = vm.createContext(sandbox);
  new vm.Script(appSource(), { filename: "index.html<script>" }).runInContext(ctx);   // kastar vid syntaxfel
  const ev = code => vm.runInContext(code, ctx);
  const evj = code => { const s = vm.runInContext(`JSON.stringify(${code})`, ctx); return s === undefined ? undefined : JSON.parse(s); };
  return { ev, evj, el: bySel, downloads };
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
