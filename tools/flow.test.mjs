// Flödet: kurssamordnaren skapar en fil → examinatorn väljer filen → väljer "problemfrågor före betygssättning"
// eller "hela rapporten". Ingen godkäntstatistik i vyerna.
import test from "node:test"; import assert from "node:assert/strict"; import fs from "node:fs";
import { loadApp, runHtml, fingerprint, INDEX } from "./harness.mjs";
import { setupDirty } from "./fixtures.mjs";
const fresh = () => { const a = loadApp(); setupDirty(a.ev);
  a.ev(`globalThis.pkg = JSON.parse(JSON.stringify(buildPackage({jsonObjs:[dirty], pdfMcqs:DEMO_DATA.PDF, tagRows:DEMO_DATA.TAGS})));
        globalThis.FILE = buildExaminerFile(pkg);`); return a; };
const STATIC = fs.readFileSync(INDEX, "utf8").split("<script>")[0];

test("filens innehåll går att läsa ut ur datafilen", () => {
  const { ev, evj } = fresh();
  assert.deepEqual(JSON.parse(ev("extractEmbedded(FILE)")), evj("pkg"));
  assert.deepEqual(JSON.parse(ev("extractEmbedded(JSON.stringify(pkg))")), evj("pkg"));       // ett tentapaket från 3.25.0 går också
  for (const bad of ["", "<html><body>hej</body></html>", "%PDF-1.4", '{"ext_inspera_candidates":[]}'])
    assert.throws(() => ev(`extractEmbedded(${JSON.stringify(bad)})`), /inte en datafil/, bad);
});
test("steg 2 och 3 har en enda filruta, och steg 1 har de tre", () => {
  assert.match(STATIC, /<input[^>]*id="datafile"[^>]*accept="[^"]*\.html/);
  assert.ok(!STATIC.includes('id="compute"'));
  const { ev, el } = fresh();
  ev("setPrep(false)");
  assert.equal(el("#drops").classList.contains("hidden"), true);
  assert.equal(el("#databox").classList.contains("hidden"), false);
  ev("setPrep(true)");
  assert.equal(el("#drops").classList.contains("hidden"), false);
  assert.equal(el("#databox").classList.contains("hidden"), true);
});
test("när filen är vald visas steg 2 direkt, med samma siffror som råfilerna ger", async () => {
  const { ev, el } = fresh();
  ev("setPrep(false)");
  await ev("loadDataFile(FILE, 'datafil.html')");
  assert.equal(ev("state.step"), "triage");
  assert.equal(fingerprint(ev, "state.json"), fingerprint(ev, "parseJSON([dirty])"));
  assert.equal(el("#results").classList.contains("hidden"), false);
});
test("fel fil ger ett begripligt fel och inga resultat", async () => {
  const { ev, el } = fresh();
  ev("setPrep(false)");
  await ev("loadDataFile('<html><body>något annat</body></html>', 'annan.html')");
  assert.match(el("#log").textContent, /inte en datafil/);
  assert.equal(ev("state.step"), null);
});
test("problemfrågor före betygssättning: en egen vy med bara flervalsfrågorna att se över", async () => {
  const { ev, el } = fresh();
  ev("setPrep(false)"); await ev("loadDataFile(FILE, 'f.html')");
  ev("setStep('triage')");
  assert.equal(ev("state.step"), "triage");
  assert.equal(ev("state.view"), "pre-mcq");
  assert.equal(ev("state.mode"), "action");
  assert.equal(el("#results").classList.contains("hidden"), false);
  const tabs = el("#viewtabs").innerHTML;
  assert.ok(!tabs.includes("Slutrapport") && !tabs.includes("Totalrapport"));
  assert.equal(el("#exp-html").classList.contains("hidden"), true);          // export till temagrupper hör till hela rapporten
  assert.equal(el("#exp-xlsx").classList.contains("hidden"), true);
});
test("hela rapporten: en sida efter rättning, med export", async () => {
  const { ev, el } = fresh();
  ev("setPrep(false)"); await ev("loadDataFile(FILE, 'f.html')");
  ev("setStep('report')");
  assert.equal(ev("state.step"), "report");
  assert.equal(ev("state.view"), "final");
  const tabs = el("#viewtabs").innerHTML;
  assert.ok(tabs.includes("Hela rapporten") && !tabs.includes("reptab") && !tabs.includes("Preliminär"));
  for (const id of ["#exp-html", "#exp-xlsx", "#exp-overview"]) assert.equal(el(id).classList.contains("hidden"), false, id);
  ev("setStep('triage')");
  assert.equal(ev("state.view"), "pre-mcq");
});
test("hela rapporten kräver färdig rättning", async () => {
  const { ev, el } = fresh();
  ev("setPrep(false)"); await ev("loadDataFile(FILE, 'f.html')");
  ev("state.json.fullyGraded = false; state.json.ungradedPts = 12; setStep('choose');");
  assert.equal(el("#step-report").disabled, true);
  assert.match(el("#step-report-note").textContent, /färdig rättning/);
  ev("setStep('report')");
  assert.equal(ev("state.step"), "triage");
});
test("en fil som öppnas med dubbelklick hamnar i steg 2", async () => {
  const { ev } = fresh();
  const page = runHtml(ev("FILE"));
  await page.ev("state.embeddedReady");
  assert.equal(page.ev("state.step"), "triage");
  assert.equal(page.el("#results").classList.contains("hidden"), false);
});
test("verktyget har ingen inbyggd exempeltenta", () => {
  const src = fs.readFileSync(INDEX, "utf8");
  for (const gone of ['id="demo"', "Visa exempel", "DEMO_DATA", "loadDemo", "demoToInspera"]) assert.ok(!src.includes(gone), gone);
});
test("ingen godkäntstatistik i vyerna eller i temarapporten", async () => {
  const { ev, el } = fresh();
  ev("setPrep(false)"); await ev("loadDataFile(FILE, 'f.html')");
  ev("setStep('report')");
  assert.ok(!fs.readFileSync(INDEX, "utf8").includes("passmetric"));           // rutan för godkäntandel finns inte kvar
  ev("state.view = 'total'; render();");
  assert.ok(!/-gränsen|godkän/i.test(el("#totalreport").innerHTML));
  assert.ok(!ev("settingsHtml(false)").includes("Godkäntgräns"));
  assert.match(STATIC + fs.readFileSync(INDEX, "utf8"), /wireSettings\(false,/);
  assert.equal(ev("'passSnapshot' in temaEmbed()"), false);
  assert.ok(!/passmetric|passSnapshot|passMetric/.test(ev("buildTemaReport(temaEmbed())")));   // varken ruta, data eller uträkning i rapporten
  const page = runHtml(ev("buildTemaReport(temaEmbed())"));
  assert.ok(!/-gränsen/.test(page.el("#cards").innerHTML + page.el("#fileline").textContent));
});
test("steg 1 visar aldrig resultaten", () => {
  const { ev, el } = fresh();
  ev("setPrep(false); loadSynthetic(); setStep('report'); setPrep(true);");
  assert.equal(el("#results").classList.contains("hidden"), true);
});

// ---- exkludering av valfri fråga (även essä- och flersvarsfrågor) på kortet ----
test("en essäfråga kan exkluderas och återinkluderas på sitt kort", () => {
  const { ev, el } = fresh();
  ev(`setPrep(false); loadSynthetic(); setStep('report');
      globalThis.ESSQ = String(state.json.qMeta.find(q => q.type === 'text' && q.max > 0).num);
      globalThis.fire = (type, cls, extra) => document.querySelector("#cards").listeners[type]
        .forEach(f => f({ target: Object.assign({ closest: s => s === cls ? { dataset: { qnum: ESSQ }, value: (extra||{}).value } : null }, extra||{}) }));`);
  const html0 = el("#cards").innerHTML;
  assert.ok(html0.includes(`class="card-exclude" data-qnum="${ev("ESSQ")}"`));
  const max0 = ev("reducedMax(state.json)");
  ev("fire('click', '.card-exclude')");
  assert.equal(ev("isExcluded(ESSQ)"), true);
  assert.ok(ev("reducedMax(state.json)") < max0);
  const html1 = el("#cards").innerHTML;
  assert.ok(html1.includes(`class="card-reinclude" data-qnum="${ev("ESSQ")}"`));
  assert.ok(html1.includes(`class="card-reason" data-qnum="${ev("ESSQ")}"`));
  ev("fire('change', '.card-reason', {value:'Låg kvalitet'})");
  assert.equal(ev("exclReason(ESSQ)"), "Låg kvalitet");
  // exkluderingen följer med till temarapportens essäkort
  assert.equal(ev("temaEmbed().views[0].scored.find(e => e.seq === ESSQ).excluded"), true);
  assert.equal(ev("temaEmbed().views[0].scored.find(e => e.seq === ESSQ).reason"), "Låg kvalitet");
  ev("fire('click', '.card-reinclude')");
  assert.equal(ev("isExcluded(ESSQ)"), false);
  assert.equal(ev("reducedMax(state.json)"), max0);
});
test("temarapportens kort har inga exkluderingsknappar", () => {
  const { ev } = fresh();
  ev("setPrep(false); loadSynthetic(); setStep('report');");
  const page = runHtml(ev("buildTemaReport(temaEmbed())"));
  assert.ok(!/card-exclude|card-reinclude/.test(page.el("#cards").innerHTML));
});
