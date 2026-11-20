// Essäfrågornas text läses ur tentans PDF. Raderna här är påhittade men följer Insperas utskrift:
// marginalnummer + "Fråga A1.1 (1,5 p)" vid vänstermarginalen, frågetexten indragen, sedan "Skriv ditt svar här".
import test from "node:test"; import assert from "node:assert/strict";
import { loadApp, runHtml } from "./harness.mjs";
import { setupDemoView, setupDirty } from "./fixtures.mjs";
const fresh = () => { const a = loadApp(); setupDemoView(a.ev); setupDirty(a.ev);
  a.ev(`globalThis.ln = (x0, top, text) => ({x0, top, text});
    globalThis.P1 = [ ln(91,55,"Anna (30 år) söker akut (10 p)"), ln(91,88,"Anna är 30 år och söker för huvudvärk."),
      ln(39,230,"1 Fråga A1.1 (1,5 p)"), ln(56,247,"Ange tre rimliga hypoteser för vad som kan ligga bakom"),
      ln(56,260,"besvären och motivera var och en."), ln(56,290,"Skriv ditt svar här. Ändringar sparas automatiskt."),
      ln(71,315,"Teckenf…"), ln(69,340,"Σ"), ln(501,658,"Ord: 0"), ln(91,741,"Du träffar Anna igen efter en vecka.") ];`); return a; };

test("essäfrågans text läses från rubriken till svarsrutan", () => {
  const { evj } = fresh();
  assert.deepEqual(evj("parseEssayLines([P1])"), [{ seq: 1, code: "A1.1", pts: "1,5 p",
    stem: "Ange tre rimliga hypoteser för vad som kan ligga bakom besvären och motivera var och en." }]);
});
test("kolon efter poängen och 'Skriv dina svar här' hanteras", () => {
  const { evj } = fresh();
  const r = evj(`parseEssayLines([[ ln(39,100,"5 Fråga A5.1 (4 p):"), ln(56,117,"Redogör stegvis för mekanismen."),
    ln(56,162,"(a) Hur når signalerna hjärnan? (1 p)"), ln(56,286,"Skriv dina svar här. Ändringar sparas automatiskt.") ]])`);
  assert.equal(r.length, 1);
  assert.equal(r[0].stem, "Redogör stegvis för mekanismen. (a) Hur når signalerna hjärnan? (1 p)");
  assert.equal(r[0].pts, "4 p");
});
test("flervalsfrågor tas inte för essäfrågor, och en indragen rad som börjar med en siffra är ingen rubrik", () => {
  const { evj } = fresh();
  const r = evj(`parseEssayLines([[ ln(39,100,"7 Fråga B1.1 (1 p)"), ln(56,117,"Vilken struktur är skadad?"), ln(56,140,"Välj ett alternativ:"),
    ln(70,160,"Thalamus"), ln(70,185,"Pons"), ln(56,240,"Totalpoäng: 1"),
    ln(39,300,"8 Fråga B1.2 (2 p)"), ln(56,317,"Patienten får"), ln(56,330,"45 gram kolhydrater. Förklara effekten."),
    ln(56,360,"Skriv ditt svar här. Ändringar sparas automatiskt.") ]])`);
  assert.deepEqual(r.map(e => e.seq), [8]);
  assert.equal(r[0].stem, "Patienten får 45 gram kolhydrater. Förklara effekten.");
});
test("en fråga som fortsätter på nästa sida hålls ihop, utan sidhuvud och sidnummer", () => {
  const { evj } = fresh();
  const r = evj(`parseEssayLines([
    [ ln(39,700,"3 Fråga A3.1 (3 p)"), ln(56,717,"Beskriv de två viktigaste"), ln(280,800,"3/62") ],
    [ ln(39,20,"2026-06-01 13:46 8LPG10 Tentamen 2026-06-01"), ln(56,60,"differentialdiagnoserna."), ln(56,90,"Skriv ditt svar här. Ändringar sparas automatiskt.") ] ])`);
  assert.equal(r.length, 1);
  assert.equal(r[0].seq, 3);
  assert.equal(r[0].stem, "Beskriv de två viktigaste differentialdiagnoserna.");
});
test("rakt numrerad tenta utan bokstavskod", () => {
  const { evj } = fresh();
  const r = evj(`parseEssayLines([[ ln(39,100,"12 Beskriv kortfattat hur njuren reglerar pH."), ln(56,130,"Skriv ditt svar här. Ändringar sparas automatiskt.") ]])`);
  assert.deepEqual(r, [{ seq: 12, code: "12", pts: null, stem: "Beskriv kortfattat hur njuren reglerar pH." }]);
});
test("en svarsruta utan rubrik före sig ger ingen fråga", () => {
  const { evj } = fresh();
  assert.deepEqual(evj(`parseEssayLines([[ ln(56,90,"Skriv ditt svar här. Ändringar sparas automatiskt.") ]])`), []);
  assert.deepEqual(evj("parseEssayLines([])"), []);
});
test("essätexterna följer med i tentapaketet och examinatorns fil", () => {
  const { ev, evj } = fresh();
  ev(`globalThis.pdf = (function(){ const x = JSON.parse(JSON.stringify(DEMO_DATA.PDF)); x.examName = "X"; x.essays = parseEssayLines([P1]); return x; })();
      globalThis.pk = JSON.parse(JSON.stringify(buildPackage({jsonObjs:[dirty], pdfMcqs:pdf, tagRows:null})));`);
  assert.deepEqual(evj("openPackage(pk).pdfMcqs.essays"), evj("pdf.essays"));
  assert.equal(ev("openPackage(pk).pdfMcqs.length"), ev("pdf.length"));
  ev("delete pk.pdf.essays");                                                   // paket från en äldre version
  assert.deepEqual(evj("openPackage(pk).pdfMcqs.essays || []"), []);
  assert.throws(() => ev("openPackage(Object.assign({}, pk, {pdf:{items:pk.pdf.items, essays:'x'}}))"), /går inte att läsa/);
});
test("essäkortet visar frågetexten, och den går att söka på", () => {
  const { ev } = fresh();
  ev(`globalThis.firstText = String(state.json.qMeta.find(q => q.type === "text" && q.max > 0).num);
      state.pdfMcqs = (function(){ const x = DEMO_DATA.PDF.slice(); x.essays = [{seq:+firstText, code:"A1.1", pts:"4 p", stem:"UNIK_ESSATEXT om hypoteser"}]; return x; })();
      globalThis.E = temaEmbed();`);
  assert.equal(ev("E.views.find(v => v.layout === 'essay').essays.find(e => e.seq === firstText).stem"), "UNIK_ESSATEXT om hypoteser");
  assert.equal(ev("E.views.find(v => v.layout === 'essay').essays.filter(e => e.stem).length"), 1);
  const page = runHtml(ev("buildTemaReport(E)"));
  page.ev("state.viewIdx = EMBED.views.findIndex(v=>v.layout==='essay'); state.mode='edu'; xExportTabs(); xExportRender();");
  assert.ok(page.el("#cards").innerHTML.includes("UNIK_ESSATEXT om hypoteser"));
  page.ev(`document.querySelector("#search").value = "unik_essatext"; applyFilters();`);
  assert.equal(page.ev("selVisible().length"), 1);
  // en ovald essäfrågas text följer inte med till en urvalssida
  const other = page.ev("EMBED.views.find(v=>v.layout==='essay').essays.find(e => !e.stem).seq");
  assert.ok(!page.ev(`buildTemaReport(subsetEmbed(EMBED, [${JSON.stringify(other)}], state.th))`).includes("UNIK_ESSATEXT"));
});
