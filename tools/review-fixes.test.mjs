// Tester för fynden i slutgranskningen av v3.25.0–3.26.0.
import test from "node:test"; import assert from "node:assert/strict";
import { loadApp, runHtml } from "./harness.mjs";
import { setupDemoView, setupDirty } from "./fixtures.mjs";
const fresh = () => { const a = loadApp(); setupDemoView(a.ev); setupDirty(a.ev); return a; };
const ACTION = /Dubbelkolla facit|[Öö]verväg|Att se över|utesluta/;

test("hopp till ett bortfiltrerat kort lämnar aldrig temarapportens läge", () => {
  const { ev } = fresh();
  const page = runHtml(ev("buildTemaReport(temaEmbed())"));
  page.ev("document.getElementById = () => null; jumpToCard(String(EMBED.views[0].view[0].seq));");
  assert.equal(page.ev("state.mode"), "ask");
  assert.doesNotMatch(page.el("#cards").innerHTML, ACTION);
  page.ev("state.mode = 'ask-explain'; jumpToCard('finns-inte');");
  assert.notEqual(page.ev("state.mode"), "edu");
});
test("godkäntgränsen i en temarapport kan inte återställas av läsaren", () => {
  const { ev } = fresh();
  ev("setThreshold('pass', 55)");
  assert.equal(ev("thresholdsCustom()"), true);                 // i appen räknas godkäntgränsen
  const page = runHtml(ev("buildTemaReport(temaEmbed())"));
  assert.equal(page.ev("state.th.pass"), 55);
  assert.equal(page.ev("thresholdsCustom(false)"), false);     // i rapporten är inget anpassat av läsaren
  assert.ok(page.el("#th-custom").classList.contains("hidden") || page.el("#th-custom").innerHTML === "");
  page.ev("setThreshold('easy', 80); resetThresholds(false);");
  assert.equal(page.ev("state.th.pass"), 55);
  assert.equal(page.ev("state.th.easy"), 90);
  assert.match(page.el("#passmetric").innerHTML, /Nått 55 %-gränsen/);
});
test("fil som inte är JSON ger ett svenskt fel", () => {
  const { ev } = fresh();
  for (const bad of ["", "%PDF-1.4", '{"format":"frageluppen-tentapaket","da'])
    assert.throws(() => ev(`parseJsonFile(${JSON.stringify(bad)}, "resultat.json")`), /resultat\.json.*går inte att läsa/, JSON.stringify(bad));
  assert.equal(ev(`parseJsonFile('{"a":1}', "x.json").a`), 1);
});
test("strukturellt trasiga paket och filer ger svenskt fel, aldrig ett motorfel", () => {
  const { ev } = fresh();
  ev("globalThis.pk = JSON.parse(JSON.stringify(buildPackage({jsonObjs:[dirty], pdfMcqs:DEMO_DATA.PDF, tagRows:null})))");
  const broken = [
    "Object.assign({}, pk, {data:[{ext_inspera_candidates:[null]}]})",
    "Object.assign({}, pk, {data:[{ext_inspera_candidates:[{result:null}]}]})",
    "Object.assign({}, pk, {data:[null]})",
    "Object.assign({}, pk, {pdf:{items:[null]}})",
    "Object.assign({}, pk, {pdf:{items:['skräp']}})",
    "Object.assign({}, pk, {tagRows:['x']})",
    "Object.assign({}, pk, {formatVersion:'2'})",
  ];
  for (const b of broken) assert.throws(() => ev(`resolveInputs([${b}], {})`), /går inte att läsa|nyare version/, b);
  for (const b of ["null", "[]", "42", '"text"'])
    assert.throws(() => ev(`resolveInputs([${b}], {})`), /har inte det format/, b);
  assert.throws(() => ev("prepReceipt({jsonObjs:[null], pdfMcqs:null, tagRows:null})"), /har inte det format/);
});
test("löpnumren är unika över flera resultatfiler", () => {
  const { ev, evj } = fresh();
  ev(`globalThis.three = (function(){ const d = makeDirty(), c = d.ext_inspera_candidates, k = Math.floor(c.length/3);
        return [c.slice(0,k), c.slice(k,2*k), c.slice(2*k)].map(part => Object.assign({}, d, {ext_inspera_candidates: part})); })();`);
  const ids = evj("parseJSON(openPackage(buildPackage({jsonObjs:three, pdfMcqs:null, tagRows:null})).jsonObjs).candMeta.map(c=>c.id)");
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual(ids.slice(0, 3), ["1", "2", "3"]);
  assert.equal(ids[ids.length - 1], String(ids.length));
});
test("paketets PDF ger ingen varning mot nästa tentas resultat", async () => {
  const { ev, el } = fresh();
  ev(`state.pdfMcqs = (function(){ const a = DEMO_DATA.PDF.slice(); a.examName = "8LPG10 Tentamen 2026-06-01"; return a; })();
      state.pdfFromPackage = true;
      state.jsonFiles = [{ name:"b.json", text: async () => '{"ext_inspera_assessmentRunTitle":"8LPG10 Tentamen 2026-08-13"}' }];`);
  await ev("checkExamMatch()");
  assert.equal(el("#examwarn").textContent, "");
  ev("state.pdfFromPackage = false");                 // examinatorns egen PDF varnar som förut
  await ev("checkExamMatch()");
  assert.match(el("#examwarn").textContent, /olika tentatillfällen/);
});
test("en ny körning tar bort en gammal varning om fel filpar", async () => {
  const { ev, el } = fresh();
  ev(`document.querySelector("#examwarn").textContent = "⚠ gammal varning"; document.querySelector("#examwarn").className = "bad";
      state.pdfMcqs = DEMO_DATA.PDF.slice(); state.pdfFromPackage = true; state.pdfIsDemo = false; state.tagsFile = null;
      state.jsonFiles = [{ name:"b.json", text: async () => JSON.stringify(buildPackage({jsonObjs:[dirty], pdfMcqs:null, tagRows:null})) }];`);
  await ev("tryRun()");
  assert.equal(el("#examwarn").textContent, "");
  assert.equal(ev("state.fromPackage"), true);
});
test("uppmaningar till examinatorn syns inte för temarapportens läsare", () => {
  const { ev } = fresh();
  const page = runHtml(ev("buildTemaReport(temaEmbed())"));
  assert.doesNotMatch(page.el("#goodlist").innerHTML, /Bekräfta|återanvänder/);
  ev("state.mode = 'ask'");
  assert.doesNotMatch(ev("card(Object.assign({}, VIEW[0], {n: 12, advice: undefined}))"), /bedöm utifrån/);
  assert.match(ev("card(Object.assign({}, VIEW[0], {n: 12, advice: undefined}))"), /För få svar \(n=12\)/);
  assert.doesNotMatch(ev("card(Object.assign({}, VIEW[0], {unmatched: 3, advice: undefined}))"), /kontrollera att rätt PDF/);
  ev("state.mode = 'edu'");                              // appen är oförändrad
  assert.match(ev("card(Object.assign({}, VIEW[0], {n: 12, advice: undefined}))"), /bedöm utifrån/);
  assert.match(ev("card(Object.assign({}, VIEW[0], {unmatched: 3, advice: undefined}))"), /kontrollera att rätt PDF/);
});
test("Tillbaka till analysen visar resultaten igen", () => {
  const { ev, el } = fresh();
  ev("setPrep(true)");
  assert.equal(el("#results").classList.contains("hidden"), true);
  ev("setPrep(false)");
  assert.equal(el("#results").classList.contains("hidden"), false);
});
test("tentapaketet sparas utan att länken dras in direkt", async () => {
  const { ev, downloads, urlEvents } = fresh();
  ev("state.prep = true; state.prepDemo = true;");
  await ev("savePackage()");
  assert.equal(downloads.length, 1);
  assert.equal(JSON.parse(downloads[0].parts[0]).format, "frageluppen-tentapaket");
  assert.deepEqual(urlEvents, ["create"]);
});
