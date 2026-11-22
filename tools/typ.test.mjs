// Den fjärde frågetypen (Kajsa 22 nov 2026, efter prov på en T1-tenta): automaträttade frågor som varken är flervals-
// eller flersvarsfrågor (markera i bild, välj i löptext, para ihop) är inte essäfrågor.
import test from "node:test"; import assert from "node:assert/strict";
import { loadApp, runHtml } from "./harness.mjs";
// Gör om tentans första essäfråga till en automaträttad fråga: inga manuella poäng, poängen som autoScore.
const withAuto = (overrideFor = 0) => { const a = loadApp();
  a.ev(`globalThis.D = demoToInspera(DEMO_DATA.DEMO); globalThis.J0 = parseJSON([D]);
        globalThis.QN = String(J0.qMeta.find(m => m.type === "text").num);
        D.ext_inspera_candidates.forEach((c, k) => { const q = (c.result || c).ext_inspera_questions.find(q => String(q.ext_inspera_questionNumber) === QN);
          const s = (q.ext_inspera_manualScores || []).reduce((t, m) => t + (m.ext_inspera_manualScore || 0), 0) + (q.ext_inspera_autoScore || 0);
          q.ext_inspera_autoScore = s; q.ext_inspera_manualScores = k < ${overrideFor} ? [{ext_inspera_manualScore: 0}] : []; });
        globalThis.J1 = parseJSON([D]);`); return a; };
const show = a => a.ev(`state.jsonFiles=[{name:'p', text: async()=>JSON.stringify(buildPackage({jsonObjs:[D],pdfMcqs:DEMO_DATA.PDF,tagRows:null}))}]; globalThis.P=tryRun();`);

test("en automaträttad fråga utan valrutor är typen auto, också när några få studenter fått manuell poäng", () => {
  const a = withAuto();
  assert.equal(a.ev("J0.qMeta.find(m => String(m.num) === QN).type"), "text");
  assert.equal(a.ev("J1.qMeta.find(m => String(m.num) === QN).type"), "auto");
  assert.equal(a.ev("J1.qMeta.filter(m => m.type === 'text').length"), a.ev("J0.qMeta.filter(m => m.type === 'text').length") - 1);
  assert.equal(a.ev("J1.fullyGraded"), a.ev("J0.fullyGraded"));
  const b = withAuto(5);                                             // fem studenter har en manuell justering
  assert.equal(b.ev("J1.qMeta.find(m => String(m.num) === QN).type"), "auto");
});
test("en orättad essäfråga är fortfarande en essäfråga", () => {
  const a = loadApp();
  a.ev(`globalThis.D = demoToInspera(DEMO_DATA.DEMO); globalThis.QN = String(parseJSON([D]).qMeta.find(m => m.type === "text").num);
        D.ext_inspera_candidates.forEach(c => { const q = (c.result || c).ext_inspera_questions.find(q => String(q.ext_inspera_questionNumber) === QN);
          q.ext_inspera_autoScore = 0; q.ext_inspera_manualScores = []; });
        globalThis.J = parseJSON([D]);`);
  assert.equal(a.ev("J.qMeta.find(m => String(m.num) === QN).type"), "text");
  assert.equal(a.ev("J.fullyGraded"), false);
});
test("typen går samma väg genom den sparade datafilen, och har eget kort, eget filterval och egen rad i filraden", async () => {
  const a = withAuto(); await show(a); await a.ev("P");
  a.ev("setPrep(false); collapseUpload(); setStep('report');");
  assert.equal(a.ev("state.json.qMeta.find(m => String(m.num) === QN).type"), "auto");
  const e = "state.scored.find(e => String(e.seq) === QN)";
  assert.equal(a.ev(`${e}.typ`), "auto");
  const h = a.ev(`scoreCard(${e})`);
  assert.match(h, /class="fttag">Övrig, automaträttad</);
  assert.ok(!/badge (easy|hard)/.test(h));
  assert.match(a.el("#fileline").textContent, /1 övrig/);
  assert.deepEqual(a.evj("FACETS.find(g => g.key === 'typ').values"), [["single", "MCQ"], ["text", "Essä"], ["multi", "Flersvar"], ["auto", "Övrig"]]);
  a.ev("toggleFacet('typ','auto')");
  assert.deepEqual(a.evj("pageItems().map(it => String(it.seq))"), [a.ev("QN")]);
  a.ev("clearFilters()");
  assert.equal(a.ev(`overviewPayload().rows.find(r => String(r.num) === QN).typeLabel`), "Övrig");
  const page = runHtml(a.ev("buildTemaReport(temaEmbed())"));
  assert.match(page.el("#fileline").textContent, /1 övrig/);
  assert.match(page.el("#cards").innerHTML, /Övrig, automaträttad/);
});
test("en automaträttad fråga får uppmaningen om facit, inte om bedömningsmallen, och räknas inte i essädelen", async () => {
  const a = withAuto(); await show(a); await a.ev("P");
  a.ev("setPrep(false); collapseUpload(); setStep('report');");
  const q = a.evj(`scoreQuestions({n:100, r:-0.4, typ:"auto", excluded:false, dist:[{pts:0, count:40}, {pts:1, count:60}]})`);
  assert.equal(q[0].key, "facit");
  assert.match(q[0].todo, /Kontrollera facit och poängregeln/);
  const r = a.evj("reliability()"), nText = a.ev("state.json.qMeta.filter(m => m.type === 'text').length");
  assert.equal(r.parts[2].k, nText);
  assert.ok(a.evj("scorePatterns(state.scored)").every(p => !p.seqs.includes(a.ev("QN"))));
  assert.match(a.ev("HELP_HTML"), /Övrig/);
});
