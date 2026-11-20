// Flödet: kurssamordnaren skapar en fil → examinatorn väljer filen → väljer "problemfrågor före betygssättning"
// eller "hela rapporten". Ingen godkäntstatistik i vyerna.
import test from "node:test"; import assert from "node:assert/strict"; import fs from "node:fs";
import { loadApp, runHtml, fingerprint, INDEX } from "./harness.mjs";
import { setupDirty } from "./fixtures.mjs";
const fresh = () => { const a = loadApp(); setupDirty(a.ev);
  a.ev(`globalThis.pkg = JSON.parse(JSON.stringify(buildPackage({jsonObjs:[dirty], pdfMcqs:DEMO_DATA.PDF, tagRows:DEMO_DATA.TAGS})));
        globalThis.FILE = buildExaminerFile(pkg);`); return a; };
const STATIC = fs.readFileSync(INDEX, "utf8").split("<script>")[0];

test("filens innehåll går att läsa ut ur kurssamordnarens HTML-fil", () => {
  const { ev, evj } = fresh();
  assert.deepEqual(JSON.parse(ev("extractEmbedded(FILE)")), evj("pkg"));
  assert.deepEqual(JSON.parse(ev("extractEmbedded(JSON.stringify(pkg))")), evj("pkg"));       // ett tentapaket från 3.25.0 går också
  for (const bad of ["", "<html><body>hej</body></html>", "%PDF-1.4", '{"ext_inspera_candidates":[]}'])
    assert.throws(() => ev(`extractEmbedded(${JSON.stringify(bad)})`), /inte en fil från kurssamordnaren/, bad);
});
test("examinatorns ingång har en enda filruta, och kurssamordnarens har de tre", () => {
  assert.match(STATIC, /<input[^>]*id="examfile"[^>]*accept="[^"]*\.html/);
  assert.ok(!STATIC.includes('id="compute"'));
  const { ev, el } = fresh();
  ev("setPrep(false)");
  assert.equal(el("#drops").classList.contains("hidden"), true);
  assert.equal(el("#exambox").classList.contains("hidden"), false);
  ev("setPrep(true)");
  assert.equal(el("#drops").classList.contains("hidden"), false);
  assert.equal(el("#exambox").classList.contains("hidden"), true);
});
test("när filen är vald visas valet, inte resultaten", async () => {
  const { ev, el } = fresh();
  ev("setPrep(false)");
  await ev("loadExaminerFile(FILE, 'tenta-till-examinator.html')");
  assert.equal(ev("state.step"), "choose");
  assert.equal(fingerprint(ev, "state.json"), fingerprint(ev, "parseJSON([dirty])"));
  assert.equal(el("#stepchoice").classList.contains("hidden"), false);
  assert.equal(el("#results").classList.contains("hidden"), true);
  assert.match(STATIC, /id="step-triage"[^>]*>[\s\S]*?problemfrågor/i);
  assert.match(STATIC, /id="step-report"[^>]*>[\s\S]*?hela rapporten/i);
});
test("fel fil ger ett begripligt fel och inget val", async () => {
  const { ev, el } = fresh();
  ev("setPrep(false)");
  await ev("loadExaminerFile('<html><body>något annat</body></html>', 'annan.html')");
  assert.match(el("#log").textContent, /inte en fil från kurssamordnaren/);
  assert.notEqual(ev("state.step"), "choose");
});
test("problemfrågor före betygssättning: en egen vy med bara flervalsfrågorna att se över", async () => {
  const { ev, el } = fresh();
  ev("setPrep(false)"); await ev("loadExaminerFile(FILE, 'f.html')");
  ev("setStep('triage')");
  assert.equal(ev("state.step"), "triage");
  assert.equal(ev("state.view"), "pre-mcq");
  assert.equal(ev("state.mode"), "action");
  assert.equal(el("#results").classList.contains("hidden"), false);
  assert.equal(el("#stepchoice").classList.contains("hidden"), true);
  const tabs = el("#viewtabs").innerHTML;
  assert.ok(!tabs.includes("Slutrapport") && !tabs.includes("Totalrapport"));
  assert.equal(el("#exp-html").classList.contains("hidden"), true);          // export till temagrupper hör till hela rapporten
  assert.equal(el("#exp-xlsx").classList.contains("hidden"), true);
  assert.equal(el("#exp-pdf").classList.contains("hidden"), false);          // listan till rättarna
});
test("hela rapporten: vyerna efter rättning, med export", async () => {
  const { ev, el } = fresh();
  ev("setPrep(false)"); await ev("loadExaminerFile(FILE, 'f.html')");
  ev("setStep('report')");
  assert.equal(ev("state.step"), "report");
  assert.equal(ev("state.view"), "final-mcq");
  const tabs = el("#viewtabs").innerHTML;
  assert.ok(tabs.includes("Slutrapport MCQ") && tabs.includes("Totalrapport") && !tabs.includes("Preliminär"));
  for (const id of ["#exp-html", "#exp-xlsx", "#exp-pdf"]) assert.equal(el(id).classList.contains("hidden"), false, id);
  ev("setStep('choose')");
  assert.equal(el("#stepchoice").classList.contains("hidden"), false);
  assert.equal(el("#results").classList.contains("hidden"), true);
});
test("hela rapporten kräver färdig rättning", async () => {
  const { ev, el } = fresh();
  ev("setPrep(false)"); await ev("loadExaminerFile(FILE, 'f.html')");
  ev("state.json.fullyGraded = false; state.json.ungradedPts = 12; setStep('choose');");
  assert.equal(el("#step-report").disabled, true);
  assert.match(el("#step-report-note").textContent, /färdig rättning/);
  ev("setStep('report')");
  assert.equal(ev("state.step"), "choose");
});
test("en fil som öppnas med dubbelklick hamnar också i valet", async () => {
  const { ev } = fresh();
  const page = runHtml(ev("FILE"));
  await page.ev("state.embeddedReady");
  assert.equal(page.ev("state.step"), "choose");
  assert.equal(page.el("#stepchoice").classList.contains("hidden"), false);
  assert.equal(page.el("#results").classList.contains("hidden"), true);
});
test("verktyget har ingen inbyggd exempeltenta", () => {
  const src = fs.readFileSync(INDEX, "utf8");
  for (const gone of ['id="demo"', "Visa exempel", "DEMO_DATA", "loadDemo", "demoToInspera"]) assert.ok(!src.includes(gone), gone);
});
test("ingen godkäntstatistik i vyerna eller i temarapporten", async () => {
  const { ev, el } = fresh();
  ev("setPrep(false)"); await ev("loadExaminerFile(FILE, 'f.html')");
  ev("setStep('report')");
  assert.equal(el("#passmetric").innerHTML, "");
  ev("state.view = 'total'; render();");
  assert.ok(!/-gränsen|godkän/i.test(el("#totalreport").innerHTML));
  assert.ok(!ev("settingsHtml(false)").includes("Godkäntgräns"));
  assert.match(STATIC + fs.readFileSync(INDEX, "utf8"), /wireSettings\(false,/);
  assert.equal(ev("temaEmbed().passSnapshot"), null);
  const page = runHtml(ev("buildTemaReport(temaEmbed())"));
  assert.equal(page.el("#passmetric").innerHTML, "");
  page.ev("state.viewIdx = EMBED.views.findIndex(v=>v.layout==='total'); xExportTabs(); xExportRender();");
  assert.ok(!/-gränsen/.test(page.el("#totalreport").innerHTML));
});
test("kurssamordnarens ingång visar aldrig valet eller resultaten", () => {
  const { ev, el } = fresh();
  ev("setPrep(false); loadSynthetic(); setStep('report'); setPrep(true);");
  assert.equal(el("#stepchoice").classList.contains("hidden"), true);
  assert.equal(el("#results").classList.contains("hidden"), true);
});

// ---- exkludering av valfri fråga (även essäfrågor) i Totalrapporten ----
test("en essäfråga kan exkluderas och återinkluderas i Totalrapporten", () => {
  const { ev, el } = fresh();
  ev(`setPrep(false); loadSynthetic(); setStep('report'); state.view = 'total'; render();
      globalThis.ESSQ = String(state.json.qMeta.find(q => q.type === 'text' && q.max > 0).num);
      globalThis.fire = (type, cls, extra) => document.querySelector("#totalreport").listeners[type]
        .forEach(f => f({ target: Object.assign({ closest: s => s === cls ? { dataset: { qnum: ESSQ }, value: (extra||{}).value } : null }, extra||{}) }));`);
  const html0 = el("#totalreport").innerHTML;
  assert.ok(html0.includes(`class="card-exclude tr-exclude" data-qnum="${ev("ESSQ")}"`));
  assert.ok(html0.includes('<th class="trex">Exkludering</th>'));
  const max0 = ev("reducedMax(state.json)");
  ev("fire('click', '.tr-exclude')");
  assert.equal(ev("isExcluded(ESSQ)"), true);
  assert.ok(ev("reducedMax(state.json)") < max0);
  const html1 = el("#totalreport").innerHTML;
  assert.ok(html1.includes(`class="card-reinclude tr-reinclude" data-qnum="${ev("ESSQ")}"`));
  assert.ok(html1.includes(`class="card-reason tr-reason" data-qnum="${ev("ESSQ")}"`));
  ev("fire('change', '.tr-reason', {value:'Låg kvalitet'})");
  assert.equal(ev("exclReason(ESSQ)"), "Låg kvalitet");
  // exkluderingen följer med till temarapportens essäkort
  assert.equal(ev("temaEmbed().views.find(v => v.layout === 'essay').essays.find(e => e.seq === ESSQ).excluded"), true);
  assert.equal(ev("temaEmbed().views.find(v => v.layout === 'essay').essays.find(e => e.seq === ESSQ).reason"), "Låg kvalitet");
  ev("fire('click', '.tr-reinclude')");
  assert.equal(ev("isExcluded(ESSQ)"), false);
  assert.equal(ev("reducedMax(state.json)"), max0);
});
test("temarapportens Totalrapport har ingen exkluderingskolumn", () => {
  const { ev } = fresh();
  ev("setPrep(false); loadSynthetic(); setStep('report');");
  const page = runHtml(ev("buildTemaReport(temaEmbed())"));
  page.ev("state.viewIdx = EMBED.views.findIndex(v=>v.layout==='total'); xExportTabs(); xExportRender();");
  assert.ok(!/tr-exclude|Exkludering<\/th>/.test(page.el("#totalreport").innerHTML));
});
