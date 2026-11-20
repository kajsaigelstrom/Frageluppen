import test from "node:test"; import assert from "node:assert/strict";
import { loadApp, fingerprint } from "./harness.mjs";
import { setupDirty, SENSITIVE } from "./fixtures.mjs";
const { ev, evj } = loadApp(); setupDirty(ev);
ev(`globalThis.demoPdf = (function(){ const a = DEMO_DATA.PDF.slice(); a.examName = "8LPG10 Tentamen 2026-06-01"; return a; })();
    globalThis.tagRows = [["Nr","Tema"],["1","NSPR"]];
    globalThis.saved = o => JSON.parse(JSON.stringify(o));`);

test("paketet överlever att sparas och läsas", () => {
  ev("globalThis.p1 = saved(buildPackage({jsonObjs:[dirty], pdfMcqs:demoPdf, tagRows}))");
  assert.equal(fingerprint(ev, "parseJSON(openPackage(p1).jsonObjs)"), fingerprint(ev, "parseJSON([dirty])"));
  assert.equal(ev("openPackage(p1).pdfMcqs.examName"), "8LPG10 Tentamen 2026-06-01");
  assert.equal(ev("Array.isArray(openPackage(p1).pdfMcqs)"), true);
  assert.equal(ev("openPackage(p1).pdfMcqs.length"), ev("demoPdf.length"));
  assert.equal(ev("openPackage(p1).tagRows[1][1]"), "NSPR");
  assert.equal(ev("p1.format"), "frageluppen-tentapaket");
  assert.equal(ev("p1.formatVersion"), 1);
  assert.equal(ev("p1.toolVersion"), ev("VERSION"));
  assert.match(ev("p1.created"), /^\d{4}-\d{2}-\d{2}$/);
});
test("paket utan PDF och taggfil", () => {
  ev("globalThis.p0 = saved(buildPackage({jsonObjs:[dirty], pdfMcqs:null, tagRows:null}))");
  assert.equal(ev("openPackage(p0).pdfMcqs"), null);
  assert.equal(ev("openPackage(p0).tagRows"), null);
  assert.equal(ev("openPackage(p0).examWarning"), null);
});
test("tre resultatfiler ryms i ett paket", () => {
  ev(`globalThis.three = (function(){ const d = makeDirty(), c = d.ext_inspera_candidates, k = Math.floor(c.length/3);
        return [c.slice(0,k), c.slice(k,2*k), c.slice(2*k)].map(part => Object.assign({}, d, {ext_inspera_candidates: part})); })();
      globalThis.p3 = saved(buildPackage({jsonObjs:three, pdfMcqs:null, tagRows:null}));`);
  assert.equal(ev("p3.data.length"), 3);
  assert.equal(fingerprint(ev, "parseJSON(openPackage(p3).jsonObjs)"), fingerprint(ev, "parseJSON(three)"));
});
test("fel filpar ger en varning som följer med paketet", () => {
  ev(`globalThis.wrongPdf = (function(){ const a = DEMO_DATA.PDF.slice(); a.examName = "8LPG10 Tentamen 2026-08-13"; return a; })();
      globalThis.dT = Object.assign(makeDirty(), {ext_inspera_assessmentRunTitle:"8LPG10 Tentamen 2026-06-01"});
      globalThis.pw = saved(buildPackage({jsonObjs:[dT], pdfMcqs:wrongPdf, tagRows:null}));`);
  assert.match(ev("openPackage(pw).examWarning"), /olika tentatillfällen/);
  assert.equal(ev("pw.examName"), "8LPG10 Tentamen 2026-06-01");
});
test("isPackage skiljer paket från råfil", () => {
  assert.equal(ev("isPackage(p1)"), true);
  assert.equal(ev("isPackage(dirty)"), false);
  assert.equal(ev("isPackage(null)"), false);
  assert.equal(ev("isPackage({})"), false);
  assert.equal(ev("isPackage([])"), false);
});
test("nyare formatversion ger svenskt fel", () => {
  assert.throws(() => ev("openPackage(Object.assign({}, p1, {formatVersion:2}))"), /nyare version/);
});
test("trasigt paket ger svenskt fel", () => {
  assert.throws(() => ev("openPackage({format:'frageluppen-tentapaket', formatVersion:1})"), /går inte att läsa/);
  assert.throws(() => ev("openPackage(Object.assign({}, p1, {data:[]}))"), /går inte att läsa/);
  assert.throws(() => ev("openPackage(Object.assign({}, p1, {data:[{}]}))"), /går inte att läsa/);
  assert.throws(() => ev("openPackage(Object.assign({}, p1, {pdf:{items:'x'}}))"), /går inte att läsa/);
});
test("paketet innehåller inget känsligt", () => {
  const s = ev("JSON.stringify(p1)");
  for (const bad of SENSITIVE) assert.ok(!s.includes(bad), bad);
});
test("taggraderna ger samma taggar som förut", () => {
  assert.deepEqual(evj("parseTagsRows(openPackage(p1).tagRows).tagCols"), evj("parseTagsRows(tagRows).tagCols"));
});
