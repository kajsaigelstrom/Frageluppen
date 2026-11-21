// Fynd ur den oberoende genomgången 21 nov 2026 (kod, användare, pedagogik) som var bekräftade fel.
import test from "node:test"; import assert from "node:assert/strict"; import fs from "node:fs";
import { loadApp, runHtml, INDEX } from "./harness.mjs";
import { setupDirty, setupDemoView } from "./fixtures.mjs";
const SRC = fs.readFileSync(INDEX, "utf8"), STATIC = SRC.split("<script>")[0];
const fresh = () => { const a = loadApp(); setupDirty(a.ev);
  a.ev(`globalThis.mk = d => JSON.stringify(buildPackage({jsonObjs:[d], pdfMcqs:DEMO_DATA.PDF, tagRows:DEMO_DATA.TAGS})); setPrep(false);`); return a; };

test("exkludering slår igenom i diskrimineringen även när Inspera kodar frågenumren som tal", () => {
  const a = fresh();
  a.ev(`globalThis.N = makeDirty(); N.ext_inspera_candidates.forEach(c => c.result.ext_inspera_questions.forEach(q => { q.ext_inspera_questionNumber = Number(q.ext_inspera_questionNumber); }));
        globalThis.J = parseJSON([N]); globalThis.EX = new Map([[String(J.mcqSeqs[0]), ""], [String(J.mcqSeqs[1]), ""]]);`);
  assert.equal(a.ev("typeof J.qMeta[0].num"), "number");
  const d = (ex, crit) => a.evj(`(o => J.mcqSeqs.slice(2, 30).map(q => o[q]))(computeDiscrimination(J, {criterion:'${crit}', excluded:${ex}}))`);
  for (const crit of ["whole", "mcq"]) assert.notDeepEqual(d("new Map()", crit), d("EX", crit), crit);
  const od = ex => a.evj(`(o => J.mcqSeqs.slice(2, 12).map(q => { const x = o[q]; return x instanceof Map ? [...x.entries()] : x; }))(computeOptDisc(J, {criterion:'whole', excluded:${ex}}))`);
  assert.notDeepEqual(od("new Map()"), od("EX"));
  a.ev("state.json = J; state.excluded = EX;");
  assert.equal(a.ev("passMetric(state.excluded).maxP"), a.ev("reducedMax(J)"));
});
test("en trasig fil efter en fungerande lämnar inga gamla resultat kvar", async () => {
  const a = fresh();
  await a.ev("loadDataFile(mk(dirty), 'f.json')");
  assert.equal(a.el("#results").classList.contains("hidden"), false);
  await a.ev(`loadDataFile('{"format":"frageluppen-tentapaket","formatVersion":99}', 'trasig.json')`);
  assert.equal(a.el("#results").classList.contains("hidden"), true);
  assert.equal(a.ev("state.step"), null);
  assert.equal(a.ev("state.vm || null"), null);
  assert.match(a.el("#log").textContent, /nyare version/);
});
test("filter, sökning och urval följer inte med till nästa fil", async () => {
  const a = fresh();
  await a.ev("loadDataFile(mk(dirty), 'f.json')"); a.ev("setStep('report')");
  a.ev(`toggleFacet('svar','latt'); toggleTag(state.tags.tagCols[0].name, state.vm.view[0].tagVals[0]); document.querySelector("#search").value = "x";`);
  await a.ev("loadDataFile(mk(dirty), 'g.json')");
  assert.deepEqual(a.evj("[state.facets, state.activeTags]"), [{}, {}]);
  assert.equal(a.el("#search").value, "");
});
test("temarapportens urvalsetikett har aldrig appens åtgärdsord", () => {
  const a = loadApp(); a.ev("setPrep(false); loadSynthetic(); setStep('report'); toggleFacet('titta','fraga');");
  const label = a.ev("temaEmbedFiltered().subset.label");
  assert.ok(!/Att se över/.test(label));
  assert.match(label, /Fråga på kortet/);
});
test("steg 1 visar inga varningar från förra analysen och låser inte steg 3", async () => {
  const a = fresh();
  await a.ev("loadDataFile(mk(dirty), 'f.json')");
  a.ev("state.json.fullyGraded = false; state.json.ungradedPts = 5; setStep('triage');");
  assert.equal(a.el("#step-report").disabled, true);
  a.ev("setPrep(true)");
  assert.equal(a.el("#warnings").classList.contains("hidden"), true);
  assert.equal(a.el("#step-report").disabled, false);
  assert.equal(a.el("#step-report-note").textContent, "");
  a.ev("setPrep(false)");
  assert.equal(a.el("#warnings").classList.contains("hidden"), false);
});
test("en fråga som ingen fick rätt på pekas ut, och kallas inte 'för få svar'", () => {
  const a = loadApp(); setupDemoView(a.ev);
  a.ev(`globalThis.Z = Object.assign({}, VIEW[0], {ncorr:0, pcorr:0, rpb:null, correctIdx:-1, n:120, advice:undefined});`);
  const adv = a.evj("advice(Z)");
  assert.equal(adv.l1[0].action, "Dubbelkolla facit");
  assert.match(adv.l1[0].why, /Ingen svarade rätt/);
  assert.equal(a.ev("rpbInfo(Z).label"), "ej mätbar");
  assert.equal(a.ev("rpbInfo(Object.assign({}, Z, {n:12})).label"), "för få svar");
  a.ev("state.mode = 'ask'");
  assert.deepEqual(a.evj("askQuestions(Z).map(q => q.key)"), ["facit"]);
});
test("temarapporten och översiktstabellen säger vilken tenta de gäller", () => {
  const a = loadApp(); a.ev("setPrep(false); loadSynthetic(); state.examName = 'T5 VT26 ordinarie'; setStep('report');");
  assert.equal(a.ev("temaEmbed().exam"), "T5 VT26 ordinarie");
  const page = runHtml(a.ev("buildTemaReport(temaEmbed())"));
  assert.match(page.el("#fileline").textContent, /^T5 VT26 ordinarie · /);
  a.ev("exportOverview()");
  assert.match(a.downloads[a.downloads.length - 1].parts.join(""), /T5 VT26 ordinarie/);
});
test("Excel: procenten vid antal G och U räknas om när G-gränsen ändras", () => {
  const a = loadApp(); a.ev("setPrep(false); loadSynthetic(); setStep('report');");
  const sum = a.evj("statsSheets(statsData())[0].aoa");
  const g = sum.find(r => r[0] === "Antal G");
  assert.match(g[2].f, /^ROUND\(B\d+\/B\d+\*100,2\)$/);
  assert.equal(typeof g[2].v, "number");
});
test("en fråga som är exkluderad i Inspera har ingen orsakslista att skriva över beskedet med", async () => {
  const a = fresh();
  a.ev(`globalThis.W = makeDirty(); globalThis.QX = W.ext_inspera_candidates[0].result.ext_inspera_questions[3].ext_inspera_questionNumber;
        W.ext_inspera_candidates.forEach(c => c.result.ext_inspera_questions.forEach(q => { if (q.ext_inspera_questionNumber === QX) q.ext_inspera_questionWeight = 0; }));`);
  await a.ev("loadDataFile(mk(W), 'f.json')"); a.ev("setStep('report')");
  const card = a.el("#cards").innerHTML.split(`id="card-${a.ev("QX")}"`)[1].split('class="q ')[0];
  assert.match(card, /Viktad till 0 % i Inspera/);
  assert.ok(!/class="card-reason"/.test(card));
  assert.match(card, /card-reinclude/);
});
test("rester och småfel ur genomgången är borta", () => {
  for (const gone of ["var(--bg)", "Paketet är gjort", "<h2>Förbered tentan", "endast aggregerade", "function reducedTotal", "function bestMatch", "function parseTags(", 'const UPDATED = "2026-11-20"'])
    assert.ok(!SRC.includes(gone), gone);
  assert.match(STATIC, /<h2>Förbered filer<\/h2>/);
  assert.match(SRC, /print-color-adjust:exact/);
  assert.match(SRC, /\.modebtn:disabled\{/);
  assert.ok(!/eh\.title = ok \?/.test(SRC), "verktygstipset på Temarapport skrivs inte över");
});
test("utskrift ur Temarapport (PDF) får rubrik med tenta och filter", () => {
  const a = loadApp(); a.ev("setPrep(false); loadSynthetic(); state.examName = 'T5 VT26'; setStep('report');");
  assert.match(SRC, /if\(EMBED\.autoPrint\) setTimeout\(\(\)=>\{ try\{ xExportPrint\(\)/);
  const page = runHtml(a.ev("buildTemaReport(temaEmbed())"));
  page.set("print", () => {}); page.ev("window.print = print; xExportPrint();");
  assert.match(page.el("#printhead").textContent, /T5 VT26/);
});
