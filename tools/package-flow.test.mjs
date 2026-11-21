import test from "node:test"; import assert from "node:assert/strict";
import { loadApp, fingerprint } from "./harness.mjs";
import { setupDirty } from "./fixtures.mjs";
const { ev, evj } = loadApp(); setupDirty(ev);
ev(`globalThis.saved = o => JSON.parse(JSON.stringify(o));
    globalThis.pkgPdf = (function(){ const a = DEMO_DATA.PDF.slice(); a.examName = "Paketets PDF 2026-06-01"; return a; })();
    globalThis.pk = saved(buildPackage({jsonObjs:[dirty], pdfMcqs:pkgPdf, tagRows:[["Nr","Tema"],["1","PAKET"]]}));
    globalThis.ownPdf = (function(){ const a = DEMO_DATA.PDF.slice(0,3); a.examName = "Egen PDF"; return a; })();
    globalThis.ownTags = [["Nr","Tema"],["1","EGEN"]];`);

test("ett paket öppnas", () => {
  ev("globalThis.r1 = resolveInputs([pk], {pdfMcqs:null, tagRows:null})");
  assert.equal(ev("r1.fromPackage"), true);
  assert.equal(fingerprint(ev, "parseJSON(r1.jsonObjs)"), fingerprint(ev, "parseJSON([dirty])"));
  assert.equal(ev("r1.pdfMcqs.examName"), "Paketets PDF 2026-06-01");
  assert.equal(ev("r1.tagRows[1][1]"), "PAKET");
});
test("examinatorns egen taggfil gäller före paketets", () => {
  assert.equal(ev("resolveInputs([pk], {pdfMcqs:null, tagRows:ownTags}).tagRows[1][1]"), "EGEN");
});
test("examinatorns egen PDF gäller före paketets, och paketets varning släpps", () => {
  ev(`globalThis.pkW = Object.assign({}, pk, {examWarning:"VARNING"});
      globalThis.r3 = resolveInputs([pkW], {pdfMcqs:ownPdf, tagRows:null});`);
  assert.equal(ev("r3.pdfMcqs.examName"), "Egen PDF");
  assert.equal(ev("r3.pdfMcqs.length"), 3);
  assert.equal(ev("r3.examWarning"), null);
  assert.equal(ev("resolveInputs([pkW], {pdfMcqs:null, tagRows:null}).examWarning"), "VARNING");
});
test("paket plus råfil ger fel", () => {
  assert.throws(() => ev("resolveInputs([pk, dirty], {pdfMcqs:null, tagRows:null})"), /kan inte kombineras/);
  assert.throws(() => ev("resolveInputs([pk, pk], {pdfMcqs:null, tagRows:null})"), /kan inte kombineras/);
});
test("råfiler passerar orörda", () => {
  ev("globalThis.r5 = resolveInputs([dirty], {pdfMcqs:ownPdf, tagRows:ownTags})");
  assert.equal(ev("r5.fromPackage"), false);
  assert.equal(ev("r5.jsonObjs[0] === dirty"), true);
  assert.equal(ev("r5.pdfMcqs === ownPdf"), true);
  assert.equal(ev("r5.tagRows === ownTags"), true);
  assert.equal(ev("r5.examWarning"), null);
});
test("kvittot räknar kandidater över flera filer och visar varning", () => {
  ev(`globalThis.two = [makeDirty(), makeDirty()];`);
  const k = evj("prepReceipt({jsonObjs:two, pdfMcqs:pkgPdf, tagRows:ownTags})");
  assert.equal(k.candCount, 2 * ev("dirty.ext_inspera_candidates.length"));
  assert.equal(k.mcqPdf, ev("pkgPdf.length"));
  assert.equal(k.hasTags, true);
  assert.equal(k.examName, ev("dirty.ext_inspera_assessmentRunTitle"));
  const k0 = evj("prepReceipt({jsonObjs:[dirty], pdfMcqs:null, tagRows:null})");
  assert.equal(k0.mcqPdf, null); assert.equal(k0.hasTags, false); assert.equal(k0.warning, null);
});
test("ett paket kan inte förberedas en gång till", () => {
  assert.throws(() => ev("prepReceipt({jsonObjs:[pk], pdfMcqs:null, tagRows:null})"), /redan en analysfil/);
});
