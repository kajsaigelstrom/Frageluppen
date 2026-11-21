// Examinatorns fil: kurssamordnaren sparar EN HTML-fil (verktyget + minimerad data) som examinatorn bara öppnar.
import test from "node:test"; import assert from "node:assert/strict";
import { loadApp, runHtml, fingerprint } from "./harness.mjs";
import { setupDirty, SENSITIVE } from "./fixtures.mjs";
const fresh = () => { const a = loadApp(); setupDirty(a.ev);
  a.ev(`globalThis.pdf = (function(){ const x = JSON.parse(JSON.stringify(DEMO_DATA.PDF)); x.examName = "8LPG10 Tentamen 2026-06-01"; return x; })();
        globalThis.pkg = JSON.parse(JSON.stringify(buildPackage({jsonObjs:[dirty], pdfMcqs:pdf, tagRows:DEMO_DATA.TAGS})));
        globalThis.FILE = buildExaminerFile(pkg);`); return a; };
const dataBlock = html => html.split('<script type="application/json" id="fl-data">')[1].split("</script>")[0];

test("filen är en hel sida med datan inbäddad en gång", () => {
  const { ev, evj } = fresh();
  const html = ev("FILE");
  assert.match(html, /^<!DOCTYPE html>/);
  assert.equal(html.split('id="fl-data"').length, 2);
  assert.ok(html.indexOf('id="fl-data"') < html.indexOf("<body"));
  assert.deepEqual(JSON.parse(dataBlock(html)), evj("pkg"));
});
test("datablocket innehåller inget känsligt", () => {
  const { ev } = fresh();
  for (const bad of SENSITIVE) assert.ok(!dataBlock(ev("FILE")).includes(bad), bad);
});
test("text som liknar HTML i en fråga kan inte bryta filen", () => {
  const { ev, evj } = fresh();
  ev(`pkg.pdf.items[0].stem = "Vad betyder </script><!-- <script>alert(1)</script> här?"; globalThis.FILE2 = buildExaminerFile(pkg);`);
  const block = dataBlock(ev("FILE2"));
  assert.ok(!/<\/script|<!--|<script/i.test(block));
  assert.equal(JSON.parse(block).pdf.items[0].stem, "Vad betyder </script><!-- <script>alert(1)</script> här?");
  const page = runHtml(ev("FILE2"));
  assert.ok(page.ev("!!state.embedded"));
});
test("filen öppnar direkt i analysen med samma siffror som råfilen", async () => {
  const { ev } = fresh();
  const page = runHtml(ev("FILE"));
  await page.ev("state.embeddedReady");
  assert.equal(page.ev("state.prep"), false);
  assert.equal(page.ev("state.fromPackage"), true);
  assert.equal(page.ev("state.json.candCount"), ev("dirty.ext_inspera_candidates.length"));
  assert.equal(fingerprint(page.ev, "state.json"), fingerprint(ev, "parseJSON([dirty])"));
  assert.equal(page.ev("state.pdfMcqs.length"), ev("pdf.length"));
  assert.ok(page.ev("!!state.tags"));
});
test("den öppnade filen döljer steg 1 och har ingen ruta överst", async () => {
  const { ev } = fresh();
  const page = runHtml(ev("FILE"));
  await page.ev("state.embeddedReady");
  assert.equal(page.el("#step-prep").classList.contains("hidden"), true);
  assert.ok(!ev("FILE").includes("embnote"));                    // rutan överst är borttagen (Kajsa 21 nov 2026)
  assert.ok(page.el("#uploadfull").classList.contains("hidden"));
});
test("vanliga sidan har ingen inbäddad tenta och landar hos kurssamordnaren", () => {
  const { ev, el } = fresh();
  assert.equal(ev("state.embedded || null"), null);
  assert.equal(ev("state.prep"), true);
  assert.equal(el("#step-prep").classList.contains("on"), true);
});
test("tillfällesvarningen följer med in i filen", async () => {
  const { ev } = fresh();
  ev(`globalThis.wrong = (function(){ const x = JSON.parse(JSON.stringify(DEMO_DATA.PDF)); x.examName = "8LPG10 Tentamen 2026-08-13"; return x; })();
      globalThis.dT = Object.assign(makeDirty(), {ext_inspera_assessmentRunTitle:"8LPG10 Tentamen 2026-06-01"});
      globalThis.FILEW = buildExaminerFile(JSON.parse(JSON.stringify(buildPackage({jsonObjs:[dT], pdfMcqs:wrong, tagRows:null}))));`);
  const page = runHtml(ev("FILEW"));
  await page.ev("state.embeddedReady");
  assert.match(page.el("#examwarn").textContent, /olika tentatillfällen/);
});
test("trasig inbäddad data ger ett svenskt fel i stället för en tom sida", async () => {
  const { ev } = fresh();
  const broken = ev("FILE").replace(/(<script type="application\/json" id="fl-data">)[\s\S]*?(<\/script>)/, (_, a, b) => a + '{"format":"frageluppen-tentapaket","da' + b);
  const page = runHtml(broken);
  await page.ev("state.embeddedReady");
  assert.match(page.el("#log").textContent, /går inte att läsa/);
});
