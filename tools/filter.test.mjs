// Filterraden: tema (ur taggfilen), frågetyp, svårighet, diskriminering och "att titta på", på rapportsidan och i
// temarapporten. Inom en grupp breddar flera val urvalet; mellan grupper smalnar de av. Varje knapp visar hur
// många frågor den träffar givet de andra gruppernas val.
import test from "node:test"; import assert from "node:assert/strict";
import { loadApp, runHtml } from "./harness.mjs";
import { setupDemoView } from "./fixtures.mjs";
const fresh = () => { const a = loadApp(); setupDemoView(a.ev); return a; };
const tema = () => { const a = fresh(); const page = runHtml(a.ev("buildTemaReport(temaEmbed())")); return { ...a, page }; };
const group = (pg, key) => pg.evj(`filterGroups().find(g => g.key === ${JSON.stringify(key)}) || null`);
const count = (g, val) => (g.values.find(v => v.val === val) || { n: null }).n;

test("svårighet och diskriminering delas in efter gränserna under Inställningar", () => {
  const { ev, evj } = fresh();
  const f = o => evj(`mkFacets(${JSON.stringify(o)})`);
  assert.equal(f({ typ: "single", pct: 95, info: { label: "god", cls: "rpb-good" }, r: 0.25 }).svar, "latt");
  assert.equal(f({ typ: "single", pct: 70, info: { label: "god", cls: "rpb-good" }, r: 0.25 }).svar, "medel");
  assert.equal(f({ typ: "single", pct: 40, info: { label: "god", cls: "rpb-good" }, r: 0.25 }).svar, "svar");
  ev("setThreshold('easy', 70)");
  assert.equal(f({ typ: "single", pct: 70, info: { label: "god" }, r: 0.25 }).svar, "latt");
  const d = (label, r, cls) => evj(`discBucket(${JSON.stringify({ label, cls: cls || "" })}, ${r === null ? "null" : r})`);
  assert.equal(d("dubbelkolla facit", -0.3), "neg");
  assert.equal(d("dubbelkolla facit", 0.05), "lag");          // facit-varning med positivt r (starka valde en distraktor)
  assert.equal(d("negativ", -0.2), "neg");
  assert.equal(d("låg (svagt negativ)", -0.05), "lag");
  assert.equal(d("låg", 0.05), "lag");
  assert.equal(d("acceptabel", 0.15), "acc");
  assert.equal(d("god", 0.25), "god");
  assert.equal(d("mycket god", 0.4), "mgod");
  assert.equal(d("för få svar", null, "rpb-na"), "na");
  assert.equal(d("ej mätbar", 0.3, "rpb-na"), "na");
  assert.equal(d("osäker", 0.35), "mgod");                      // osäkert men mätt: efter värdet
  assert.equal(d("osäker", 0.15), "acc");
});
test("flera val i samma grupp breddar, val i olika grupper smalnar av", () => {
  const { page } = tema();
  page.ev("toggleFacet('typ','single')");                       // räkna på flervalsfrågorna
  const all = page.ev("EMBED.views[0].view");
  const n = pred => page.ev(`EMBED.views[0].view.filter(v => ${pred}).length`);
  page.ev("toggleFacet('svar','latt')");
  assert.equal(page.ev("selVisible().length"), n("v.pcorr >= 90"));
  page.ev("toggleFacet('svar','svar')");
  assert.equal(page.ev("selVisible().length"), n("v.pcorr >= 90 || v.pcorr < 60"));
  const col = page.ev("state.tags.tagCols[0].name"), tag = page.ev("EMBED.views[0].view.find(v => v.pcorr >= 90).tagVals[0]");
  page.ev(`toggleTag(${JSON.stringify(col)}, ${JSON.stringify(tag)})`);
  assert.equal(page.ev("selVisible().length"), n(`(v.pcorr >= 90 || v.pcorr < 60) && v.tagVals[0] === ${JSON.stringify(tag)}`));
  assert.ok(page.ev("selVisible().length") < all.length);
});
test("knapparna räknar med de andra gruppernas val men inte sin egen", () => {
  const { page } = tema();
  page.ev("toggleFacet('typ','single')");
  const before = group(page, "svar");
  page.ev("toggleFacet('svar','latt')");
  assert.deepEqual(group(page, "svar").values.map(v => v.n), before.values.map(v => v.n));      // egen grupp oförändrad
  const disk = group(page, "disk");
  const easy = page.ev("EMBED.views[0].view.filter(v => v.pcorr >= 90).length");
  assert.equal(disk.values.reduce((s, v) => s + v.n, 0), easy);                                  // andra grupper räknar bara de lätta
  assert.equal(group(page, "svar").values.find(v => v.val === "latt").on, true);
});
test("en grupp med bara ett värde visas inte, utom när den har ett val", () => {
  const { ev, page } = tema();
  const typ = group(page, "typ");
  assert.ok(typ && typ.values.length >= 2);
  assert.ok(count(typ, "single") > 0 && count(typ, "text") > 0);
  const onlyMcq = runHtml(ev("buildTemaReport(subsetEmbed(temaEmbed(), temaEmbed().views[0].view.slice(0,3).map(v => String(v.seq)), state.th))"));
  assert.equal(group(onlyMcq, "typ"), null);                    // ett urval med bara MCQ har ingen grupp för frågetyp
  onlyMcq.ev("toggleFacet('typ','single')");
  assert.ok(group(onlyMcq, "typ"));                              // utom när den har ett val
});
test("essä- och flersvarskorten filtreras på svårighet och diskriminering", () => {
  const { page } = tema();
  page.ev("toggleFacet('typ','text'); toggleFacet('svar','latt')");
  const vis = page.evj("scoredVisible().map(e => e.pct)");
  assert.ok(vis.every(p => p >= 90));
  assert.equal(vis.length, page.ev("EMBED.views[0].scored.filter(e => e.typ === 'text' && e.pct >= 90).length"));
  assert.match(page.el("#count").textContent, new RegExp(`Visar ${vis.length} av \\d+ frågor`));
});
test("att titta på: fråga på kortet, förebild och exkluderad", () => {
  const { ev, page } = tema();
  const g = group(page, "titta");
  const labels = Object.fromEntries(g.values.map(v => [v.val, v.label]));
  assert.equal(labels.fraga, "Fråga på kortet");
  page.ev("toggleFacet('titta','fraga')");
  assert.ok(page.evj("selVisible()").length === page.ev("EMBED.views[0].view.filter(v => cardQuestions(v).length).length"));
  page.ev("clearFilters(); toggleFacet('titta','forebild')");
  assert.equal(page.ev("selVisible().length"), page.ev("EMBED.views[0].view.filter(isForebild).length"));
});
test("valda filter står på en rad och kan tas bort ett i taget", () => {
  const { page } = tema();
  page.ev("toggleFacet('svar','latt'); toggleFacet('disk','mgod');");
  const bar = page.el("#tagbar").innerHTML;
  assert.match(bar, /class="filtsel"/);
  assert.match(bar, /Lätt ✕/);
  assert.match(bar, /Mycket god ✕/);
  assert.equal(page.ev("filtersActive()"), true);
  page.ev("toggleFacet('svar','latt')");
  assert.doesNotMatch(page.el("#tagbar").innerHTML, /Lätt ✕/);
  page.ev("clearFilters()");
  assert.deepEqual(page.evj("state.facets"), {});
  assert.equal(page.ev("filtersActive()"), false);
  assert.doesNotMatch(page.el("#tagbar").innerHTML, /class="filtsel"/);
});
test("mönster, urval och Excel följer filtret", () => {
  const { page } = tema();
  page.ev("toggleFacet('disk','mgod')");
  const n = page.ev("selVisible().length");
  assert.ok(n > 0 && n < page.ev("EMBED.views[0].view.length + EMBED.views[0].scored.length"));
  assert.equal(page.evj("xExportRows().aoa").length - 1, n);
  const pat = page.evj("patternSummary(currentView({ignorePattern:true}))");
  assert.ok(pat.every(r => r.seqs.length <= n));
  page.ev("selAllVisible()");
  assert.equal(page.ev("state.sel.size"), n);
});
test("filtret gäller alla frågetyper samtidigt", () => {
  const { page } = tema();
  page.ev("toggleFacet('svar','latt')");
  assert.ok(page.evj("scoredVisible().map(e => e.pct)").every(p => p >= 90));
  assert.ok(page.evj("currentView().map(v => v.pcorr)").every(p => p >= 90));
});
test("filterraden i examinatorns rapportvy", () => {
  const { ev, el } = fresh();
  ev("setPrep(false); loadSynthetic(); setStep('report');");
  assert.match(el("#tagbar").innerHTML, /Svårighet/);
  assert.match(el("#tagbar").innerHTML, /Att se över/);              // appens kort har "Att se över", inte frågor
  assert.match(el("#tagbar").innerHTML, /Frågetyp/);
  ev("toggleFacet('svar','svar')");
  assert.ok(ev("currentView().every(v => v.pcorr < 60)"));
  assert.ok(ev("scoredVisible().every(e => e.pct < 60)"));
  ev("clearFilters(); toggleFacet('typ','text');");
  const cards = (el("#cards").innerHTML.match(/class="fttag">Essä</g) || []).length;
  assert.equal(cards, ev("state.json.qMeta.filter(q => q.type === 'text' && q.max > 0).length"));
});
test("frågetyperna heter MCQ, Flersvar och Essä i översiktstabellen", () => {
  const { page } = tema();
  page.ev("exportOverview()");
  const t = page.downloads[page.downloads.length - 1].parts.join("");
  assert.ok(t.includes(">Essä<") && t.includes(">MCQ<") && !t.includes(">Fritext<"));
});
test("listan över förebilder följer filtret, och registret före betygssättning följer sökningen", () => {
  const { ev, el, page } = tema();
  const nFb = page.ev("EMBED.views[0].view.filter(isForebild).length");
  assert.ok(nFb > 0);
  assert.match(page.el("#goodlist").innerHTML, new RegExp(`${nFb} fråga\\(or\\) som fungerar som förebild`));
  page.ev("toggleFacet('disk','lag')");                                  // förebilder skiljer väl, så ingen är kvar
  assert.equal(page.el("#goodlist").innerHTML, "");
  // före betygssättning finns inget filter, men registret över frågor att se över följer sökningen
  ev("setPrep(false); loadSynthetic(); setStep('triage'); state.mode = 'edu'; render();");
  const nAct = (el("#actionlist").innerHTML.match(/class="actionrow/g) || []).length;
  assert.ok(nAct > 0);
  const code = ev("state.vm.view.find(v => v.advice.l1.length).code");
  ev(`document.querySelector("#search").value = ${JSON.stringify(code)}; applyFilters();`);
  const nAct2 = (el("#actionlist").innerHTML.match(/class="actionrow/g) || []).length;
  assert.ok(nAct2 >= 1 && nAct2 <= nAct);
});
