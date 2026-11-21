// Layouten (Kajsa 21 nov 2026): en smal rad överst med tentan och filen, varningar på en egen rad när de finns,
// vyns rubrik och lägesknappar på samma rad med en enda förklaring, och sedan korten. Ingen sifferruta.
import test from "node:test"; import assert from "node:assert/strict"; import fs from "node:fs";
import { loadApp, runHtml, INDEX } from "./harness.mjs";
import { setupDemoView } from "./fixtures.mjs";
const SRC = fs.readFileSync(INDEX, "utf8"), STATIC = SRC.split("<script>")[0];
const exam = step => { const a = loadApp(); a.ev(`setPrep(false); loadSynthetic(); collapseUpload(); setStep('${step}');`); return a; };
const tema = () => { const a = loadApp(); setupDemoView(a.ev); const html = a.ev("buildTemaReport(temaEmbed())"); return { ...a, html, page: runHtml(html) }; };
const body = a => a.ev("document.body.classList.contains('compact')");

test("med en fil vald blir sidhuvudet en smal rad som säger vilken tenta det är", () => {
  const a = exam("triage");
  assert.equal(body(a), true);
  const line = a.el("#fileline").textContent;
  assert.match(line, new RegExp(`${a.ev("state.json.candCount")} studenter`));
  assert.match(line, new RegExp(`${a.ev("state.json.qMeta.length")} frågor`));
  assert.match(line, new RegExp(`${a.ev("state.json.mcqSeqs.length")} MCQ`));
  assert.equal(a.el("#uploadpanel").classList.contains("hidden"), true);
  assert.equal(a.el("#reopen").classList.contains("hidden"), false);
});
test("Byt fil öppnar filpanelen och det fulla sidhuvudet igen", () => {
  const a = exam("triage");
  (a.el("#reopen").listeners.click || []).forEach(f => f({}));
  assert.equal(body(a), false);
  assert.equal(a.el("#uploadpanel").classList.contains("hidden"), false);
  assert.equal(a.el("#reopen").classList.contains("hidden"), true);
});
test("kurssamordnaren har det fulla sidhuvudet", () => {
  const a = loadApp();
  assert.equal(body(a), false);
  assert.equal(a.el("#fileline").textContent, "");
});
test("exkluderade frågor och maxpoäng står i raden överst i hela rapporten", () => {
  const a = exam("report");
  assert.ok(!/exkluderad/.test(a.el("#fileline").textContent));
  a.ev("state.excluded.set(String(state.json.qMeta[0].num), ''); render();");
  assert.match(a.el("#fileline").textContent, /1 exkluderad/);
  assert.match(a.el("#fileline").textContent, /maxpoäng [\d,]+ av [\d,]+/);
});
test("sifferrutan, den hopfällda filrutan och de dubbla förklaringarna är borta", () => {
  for (const gone of ['id="summary"', 'id="uploadmini"', 'id="minisummary"', 'class="modelabel">Visningsläge', '$("#summary")', '$("#minisummary")'])
    assert.ok(!SRC.includes(gone), gone);
  for (const step of ["triage", "report"]) assert.ok(!exam(step).el("#viewtabs").innerHTML.includes("rephint"), step);
});
test("varningarna har en egen rad utanför filpanelen", () => {
  assert.match(STATIC, /<div id="warnings">[\s\S]*?id="examwarn"[\s\S]*?id="qa"[\s\S]*?id="pdfnote"[\s\S]*?<\/div>\s*<\/div>/);
  const panel = STATIC.slice(STATIC.indexOf('id="uploadpanel"'), STATIC.indexOf('id="warnings"'));
  assert.ok(!/id="(examwarn|qa|pdfnote)"/.test(panel));
});
test("lägesknapparna före betygssättning visar antal, och förklaringen är en enda rad", () => {
  const a = exam("triage");
  const n = a.ev("state.vm.view.filter(v => v.advice.l1.length && !isExcluded(v.seq)).length");
  assert.match(a.el("#modeseg").innerHTML, new RegExp(`Att se över · ${n}<`));
  assert.match(a.el("#modeseg").innerHTML, new RegExp(`Alla flervalsfrågor · ${a.ev("state.vm.view.length")}<`));
  assert.match(a.el("#modehint").textContent, /poängen på flervalsdelen/);
  assert.equal(a.el("#results").classList.contains("premode"), true);
  const r = exam("report");
  assert.ok(!/ · \d/.test(r.el("#modeseg").innerHTML));
  assert.match(r.el("#modehint").textContent, /poängen på hela tentan/);
  assert.equal(r.el("#results").classList.contains("premode"), false);
});
test("raden om att verktyget utvecklas står i sidfoten", () => {
  const foot = STATIC.slice(STATIC.indexOf("<footer"));
  assert.match(foot, /utvecklas fortfarande/);
  assert.ok(!/utvecklas fortfarande/.test(STATIC.slice(0, STATIC.indexOf("<footer"))));
});
test("temarapporten har samma skelett: en rad överst, nivånoteringen, lägen och en förklaring", () => {
  const { ev, html, page } = tema();
  for (const gone of ['id="summary"', 'id="viewtabs"', "Så fungerade tentans frågor", "Visningsläge"]) assert.ok(!html.split("<script>")[0].includes(gone), gone);
  assert.ok(html.includes("Den säger inget om huruvida en fråga ligger på rätt nivå"));
  const line = page.el("#fileline").textContent;
  assert.match(line, new RegExp(`${ev("state.json.candCount")} studenter`));
  assert.match(line, /MCQ/); assert.match(line, /essä/);
  assert.match(page.el("#modehint").textContent, /Hur varje fråga fungerade/);
});
test("en urvalssida säger i raden överst att den är ett urval", () => {
  const { page } = tema();
  const child = runHtml(page.ev("buildTemaReport(subsetEmbed(EMBED, [String(EMBED.views[0].view[0].seq)], state.th))"));
  assert.match(child.el("#subsetline").innerHTML, /Urval: 1 av \d+ frågor/);
  assert.match(child.el("#fileline").textContent, /1 fråga/);
});
test("tentans namn är det som resultatfilerna har gemensamt, inte den första ortens", () => {
  const { evj } = loadApp();
  assert.equal(evj(`commonTitle(["8LPG50/SKR5 2026-06-01 08:00-13:00 Jönköping 9755", "8LPG50/SKR5 2026-06-01 08:00-13:00 Norrköping 9754"])`), "8LPG50/SKR5 2026-06-01 08:00-13:00");
  assert.equal(evj(`commonTitle(["Tenta A 2026"])`), "Tenta A 2026");
  assert.equal(evj(`commonTitle(["Alfa", "Beta"])`), "Alfa");            // inget gemensamt: första namnet
  assert.equal(evj(`commonTitle([])`), null);
});
