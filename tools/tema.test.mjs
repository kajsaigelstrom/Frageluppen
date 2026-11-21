import test from "node:test"; import assert from "node:assert/strict";
import { loadApp, runHtml } from "./harness.mjs";
import { setupDemoView } from "./fixtures.mjs";
const fresh = () => { const a = loadApp(); setupDemoView(a.ev); return a; };
const NOTE = "Statistiken visar hur frågorna fungerade i den här studentgruppen. Den säger inget om huruvida en fråga ligger på rätt nivå i förhållande till kursplanen.";
const ACTION_WORDS = /Dubbelkolla facit|dubbelkolla facit|[Uu]tesluta|Att se över|Till nästa gång|Inga anmärkningar|Exkludera frågan|Triage|att åtgärda|automatiska flaggor|Förbättra svarsalternativen|Ta upp i undervisningen/;

test("temarapporten är en sida med frågorna efter rättning", () => {
  const { evj } = fresh();
  assert.deepEqual(evj("temaEmbed().views.map(v=>v.id)"), ["final"]);
  assert.deepEqual(evj("temaEmbed().views.map(v=>v.layout)"), ["all"]);
  assert.equal(evj("temaEmbed().kind"), "tema");
  assert.equal(evj("temaEmbed().subset"), null);
  assert.deepEqual(evj("temaEmbed().views[0].modes.map(m=>m.id)"), ["ask", "ask-explain"]);
  assert.equal(evj("temaEmbed().mode"), "ask");
});
test("temarapporten bär gränserna", () => {
  const { ev, evj } = fresh();
  ev("setThreshold('easy', 85)");
  assert.equal(evj("temaEmbed().th.easy"), 85);
});
test("inga individdata i temarapporten", () => {
  const { ev } = fresh();
  const s = ev("JSON.stringify(temaEmbed())");
  for (const bad of ["cohortScores", "candMeta", "mcqSlot", "optData", "pairs"]) assert.ok(!s.includes(bad), bad);
});
test("kortet i läget ask visar frågor men inga åtgärder", () => {
  const { ev } = fresh();
  ev("state.mode = 'ask'; globalThis.vD = VIEW.find(v => advice(v).l1.some(a => a.psy === 'dist-pos'));");
  const html = ev("card(vD)");
  assert.ok(html.includes("Att fråga sig"));
  assert.ok(html.includes("att försvara som rätt eller delvis rätt?"));
  assert.doesNotMatch(html, ACTION_WORDS);
  assert.doesNotMatch(html, /Mer om psykometriken|card-exclude/);
});
test("inget kort i temalägena innehåller åtgärdsord", () => {
  const { ev } = fresh();
  for (const mode of ["ask", "ask-explain"]) {
    ev(`state.mode = '${mode}'`);
    assert.doesNotMatch(ev("VIEW.map(card).join('')"), ACTION_WORDS, mode);
  }
});
test("kort utan mönster har ingen ruta", () => {
  const { ev } = fresh();
  ev("state.mode = 'ask'; globalThis.vOk = VIEW.find(v => askQuestions(v).length === 0 && !advice(v).note);");
  assert.ok(!ev("card(vOk)").includes("Att fråga sig"));
  assert.ok(!ev("card(vOk)").includes("askbox"));
});
test("läget ask-explain visar förklaring men ingen åtgärd", () => {
  const { ev } = fresh();
  ev("state.mode = 'ask-explain'; globalThis.vD = VIEW.find(v => advice(v).l1.some(a => a.psy === 'dist-pos'));");
  const html = ev("card(vD)");
  assert.ok(html.includes("Varje svarsalternativ får ett eget r"));
  assert.doesNotMatch(html, ACTION_WORDS);
});
test("ofärdig rättning ger ingen temarapport", () => {
  const { ev } = fresh();
  ev("state.json.fullyGraded = false");
  assert.equal(ev("temaEmbed()"), null);
});
test("rapportens HTML har noteringen och rubriken", () => {
  const { ev } = fresh();
  const html = ev("buildTemaReport(temaEmbed())");
  assert.ok(html.includes(NOTE));
  assert.match(html, /<h1[^>]*>Temarapport<\/h1>/);
  assert.ok(html.includes("<title>Temarapport</title>"));
  assert.ok(html.includes('id="settings-open"'));
});
test("den exporterade sidan går att köra och ritar kort utan åtgärder", () => {
  const { ev } = fresh();
  const page = runHtml(ev("buildTemaReport(temaEmbed())"));
  const cards = page.el("#cards").innerHTML;
  assert.ok(cards.includes("Att fråga sig"));
  assert.doesNotMatch(cards, ACTION_WORDS);
  assert.doesNotMatch(page.el("#summary").innerHTML, /att åtgärda|tips|automatiska flaggor/);
  assert.ok(page.el("#summary").innerHTML.includes("studenter"));
  const tabs = page.el("#viewtabs").innerHTML;
  assert.ok(!tabs.includes("reptab") && tabs.includes("Välj frågetyp i filtret"));
  assert.ok(!tabs.includes("Preliminär"));
  assert.ok(!/andel rätt/.test(page.el("#summary").innerHTML));        // ingen medelandel rätt (Kajsa 21 nov 2026)
  assert.match(page.el("#goodlist").innerHTML, /fungerar som förebild|^$/);   // sedan formkontrollen: förebilder i stället för enbart diskriminering
});
test("översiktstabellen ur den exporterade sidan är fri från åtgärdsord", () => {
  const { ev } = fresh();
  const page = runHtml(ev("buildTemaReport(temaEmbed())"));
  page.ev("exportOverview()");
  const t = page.downloads[page.downloads.length - 1].parts.join("");
  assert.ok(t.includes("totaltable"));
  assert.doesNotMatch(t, ACTION_WORDS);
  assert.doesNotMatch(t, /Granska bedömningsmatrisen/);
});
test("gränser kan ändras i den exporterade sidan", () => {
  const { ev } = fresh();
  const page = runHtml(ev("buildTemaReport(temaEmbed())"));
  const count = () => (page.el("#cards").innerHTML.match(/badge easy/g) || []).length;
  const before = count();
  assert.equal(page.ev("setThreshold('easy', 80)"), true);
  page.ev("xExportRender()");
  assert.ok(count() > before);
  assert.ok(!page.ev("settingsHtml(false)").includes("Godkäntgräns"));
});
test("Excel-raderna i temarapporten har frågor, inte flaggor", () => {
  const { ev } = fresh();
  const page = runHtml(ev("buildTemaReport(temaEmbed())"));
  const head = page.evj("xExportRows().aoa[0]");
  assert.ok(head.includes("Att fråga sig")); assert.ok(!head.includes("Flaggor"));
  assert.doesNotMatch(JSON.stringify(page.evj("xExportRows().aoa")), /undefined/);
});
test("exkluderad fråga visas med orsak i temarapporten", () => {
  const { ev } = fresh();
  ev("state.excluded.set(String(VIEW[0].seq), 'Tekniskt fel'); rebuildView();");
  const page = runHtml(ev("buildTemaReport(temaEmbed())"));
  assert.ok(page.el("#cards").innerHTML.includes("Exkluderad ur tentan"));
  assert.ok(page.el("#cards").innerHTML.includes("Tekniskt fel"));
});
test("essä- och flersvarsfrågornas poängfördelning följer med i temarapporten", () => {
  const { ev } = fresh();
  const n = ev("state.json.qMeta.filter(q => q.type !== 'single' && q.max > 0).length");
  assert.ok(n > 0);
  assert.equal(ev("temaEmbed().views[0].scored.filter(e => e.dist.length).length"), n);
});
