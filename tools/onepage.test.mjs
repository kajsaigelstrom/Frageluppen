// En sida i stället för flikarna Slutrapport MCQ, Essäfrågor och Totalrapport (Kajsa 20 nov 2026).
// Alla frågetyper har kort på samma sida och väljs med filtret Frågetyp. Översikten i tabellform är en egen export.
import test from "node:test"; import assert from "node:assert/strict";
import { loadApp, runHtml } from "./harness.mjs";
import { setupDemoView } from "./fixtures.mjs";
const app = () => { const a = loadApp(); a.ev("setPrep(false); loadSynthetic(); setStep('report');"); return a; };
const tema = () => { const a = loadApp(); setupDemoView(a.ev); const page = runHtml(a.ev("buildTemaReport(temaEmbed())")); return { ...a, page }; };
const nType = (ev, t) => ev(`state.json.qMeta.filter(q => q.type === '${t}' && q.max > 0).length`);
const cardsOf = (html, cls) => (html.match(new RegExp(`class="fttag">${cls}<`, "g")) || []).length;
const lastDownload = a => { const b = a.downloads[a.downloads.length - 1]; return b ? b.parts.join("") : ""; };

test("examinatorns hela rapport är en enda sida, utan flikar", () => {
  const { ev, evj, el } = app();
  assert.equal(ev("activeView().layout"), "all");
  assert.ok(!/class="reptab/.test(el("#viewtabs").innerHTML));
  assert.ok(!ev("VIEWS.some(v => v.layout === 'total')"));
});
test("sidan har kort för MCQ, essä och flersvar, i tentans ordning", () => {
  const { ev, el } = app();
  const html = el("#cards").innerHTML;
  assert.equal(cardsOf(html, "Essä"), nType(ev, "text"));
  assert.equal(cardsOf(html, "Flersvar"), nType(ev, "multi"));
  assert.ok(nType(ev, "multi") > 0 && nType(ev, "text") > 0);
  const nAll = ev("state.vm.view.length") + nType(ev, "text") + nType(ev, "multi");
  assert.equal(el("#count").textContent, `Visar ${nAll} av ${nAll} frågor`);
  const order = [...html.matchAll(/id="card-([^"]+)"/g)].map(m => Number(m[1]));
  assert.deepEqual(order, [...order].sort((a, b) => a - b));
});
test("filtret Frågetyp väljer korten", () => {
  const { ev, el } = app();
  ev("toggleFacet('typ','text')");
  const html = el("#cards").innerHTML;
  assert.equal(cardsOf(html, "Essä"), nType(ev, "text"));
  assert.equal(cardsOf(html, "Flersvar"), 0);
  assert.ok(!/class="opt[ "]/.test(html));                      // inga flervalskort
  ev("toggleFacet('typ','multi')");
  assert.equal(cardsOf(el("#cards").innerHTML, "Flersvar"), nType(ev, "multi"));
  assert.match(el("#tagbar").innerHTML, /Frågetyp/);
});
test("examinatorn exkluderar essä- och flersvarsfrågor på kortet", () => {
  const { ev, el } = app();
  const seq = ev("state.json.qMeta.find(q => q.type === 'text' && q.max > 0).num");
  assert.match(el("#cards").innerHTML, new RegExp(`class="card-exclude" data-qnum="${seq}"`));
  ev(`state.excluded.set('${seq}', ''); render();`);
  const card = el("#cards").innerHTML.split(`id="card-${seq}"`)[1].split('class="q ')[0];
  assert.match(card, /Exkluderad ur tentan/);
  assert.match(card, /card-reinclude/);
  assert.ok(ev("state.scored.find(e => e.seq === String(" + JSON.stringify(seq) + ")).excluded"));
});
test("flersvarskortet visar poängfördelningen och frågar om facit när poängen inte följer tentan", () => {
  const { ev, evj } = app();
  const m = evj("state.scored.find(e => e.typ === 'multi')");
  assert.equal(m.dist.reduce((s, d) => s + d.count, 0), m.n);
  assert.deepEqual(evj(`scoreQuestions(Object.assign(${JSON.stringify(m)}, {r:-0.3, n:100, dist:[{pts:0,count:30},{pts:1,count:30},{pts:2,count:40}]}))`).map(q => q.key), ["facit"]);
  assert.deepEqual(evj(`scoreQuestions(Object.assign(${JSON.stringify(m)}, {r:-0.3, n:100, dist:[{pts:0,count:30},{pts:1,count:30},{pts:2,count:40}], typ:'text'}))`).map(q => q.key), ["mall"]);
});
test("temarapporten är också en enda sida med alla frågetyper", () => {
  const { ev, page } = tema();
  assert.equal(page.ev("EMBED.views.length"), 1);
  assert.ok(!/class="reptab/.test(page.el("#viewtabs").innerHTML));
  const html = page.el("#cards").innerHTML;
  assert.equal(cardsOf(html, "Essä"), nType(ev, "text"));
  assert.equal(cardsOf(html, "Flersvar"), nType(ev, "multi"));
  assert.ok(/class="opt[ "]/.test(html));
  assert.ok(!/cohort|candMeta/.test(page.ev("JSON.stringify(EMBED)")));
  page.ev("toggleFacet('typ','single')");
  assert.equal(cardsOf(page.el("#cards").innerHTML, "Essä"), 0);
  assert.equal(page.ev("selVisible().length"), page.ev("currentView().length"));
});
test("urval över frågetyperna ger en sida med samma typer", () => {
  const { page } = tema();
  const mcq = page.ev("EMBED.views[0].view[0].seq"), ess = page.ev("EMBED.views[0].scored.find(e => e.typ === 'text').seq");
  const sub = page.evj(`subsetEmbed(EMBED, new Set([${JSON.stringify(String(mcq))}, ${JSON.stringify(ess)}]), state.th)`);
  assert.equal(sub.views.length, 1);
  assert.equal(sub.views[0].view.length, 1);
  assert.equal(sub.views[0].scored.length, 1);
  assert.equal(sub.views[0].total.rows.length, 2);
  assert.deepEqual(sub.subset, { n: 2, of: page.ev("EMBED.views[0].total.rows.length") });
});
test("översiktstabellen är en egen export, följer filtret och innehåller bara sammanräknade tal", () => {
  const a = app();
  a.ev("exportOverview()");
  const all = lastDownload(a);
  assert.match(all, /<table class="totaltable">/);
  assert.equal((all.match(/<tr class=/g) || []).length, a.ev("state.json.qMeta.length"));
  for (const t of [">MCQ<", ">Essä<", ">Flersvar<"]) assert.ok(all.includes(t), t);
  assert.ok(!/<script/i.test(all));
  a.ev("toggleFacet('typ','text'); exportOverview();");
  const ess = lastDownload(a);
  assert.equal((ess.match(/<tr class=/g) || []).length, nType(a.ev, "text"));
  assert.match(ess, /Filtrerat på Frågetyp: Essä/);
  const { page } = tema();
  page.ev("exportOverview()");
  assert.match(page.downloads[page.downloads.length - 1].parts.join(""), /<table class="totaltable">/);
});
test("knappen Översiktstabell är kopplad, i appen och i temarapporten", () => {
  const a = app();
  (a.el("#exp-overview").listeners.click || []).forEach(f => f({}));
  assert.match(lastDownload(a), /<h1>Översiktstabell<\/h1>/);
  const { page } = tema();
  const h = page.el("#dloverview").listeners.click || [];
  assert.equal(h.length, 1);
  h[0]({});
  assert.match(page.downloads[page.downloads.length - 1].parts.join(""), /<h1>Översiktstabell<\/h1>/);
});
test("hela rapporten visar ingen medelandel rätt", () => {
  const { el } = app();
  assert.ok(!/genomsnittlig/.test(el("#fileline").textContent + el("#cards").innerHTML));
});
