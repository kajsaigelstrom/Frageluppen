// Räknereglerna efter genomgången 21 nov 2026 (Kajsas beslut): en gräns för litet underlag, blankt som fel,
// samma regel för alla frågetyper, etiketterna god och låg, förebildens krav, och gemensam uppslagning av taggar.
import test from "node:test"; import assert from "node:assert/strict";
import { loadApp } from "./harness.mjs";
import { setupDemoView } from "./fixtures.mjs";

const app = () => { const a = loadApp(); setupDemoView(a.ev);
  a.ev(`globalThis.mkV = o => Object.assign({seq:"900", code:"X1", title:"X1", stem:"En patient söker för huvudvärk sedan tre dagar. Vilken åtgärd är mest lämplig?",
      opts:["Avvakta med ny kontroll","Remiss till neurolog","Datortomografi akut","Lumbalpunktion"], correctIdx:0, n:100, counts:[60,20,12,8],
      optPbis:[0.3,-0.2,-0.1,-0.1], bestDistIdx:-1, bestDistPbis:null, slotAmbiguous:false, orphanSlots:[], unmappedPdf:[], tagVals:[], tags:[]}, o,
      {ncorr:(o.counts||[60])[0], pcorr:(o.counts||[60])[0]/(o.n||100)*100, sig:2/Math.sqrt(o.n||100)});
    globalThis.psy = v => { const a = advice(v); return {l1:a.l1.map(x=>x.psy), l2:a.l2.map(x=>x.psy)}; };`);
  return a; };

test("diskrimineringen heter god från 0,30 och låg under 0,10, utan etikett däremellan", () => {
  const a = app();
  assert.equal(a.ev("TH_DEFAULT.goodDisc"), 0.30);
  const lab = r => a.ev(`rpbInfo(mkV({rpb:${r}})).label`);
  assert.equal(lab(0.31), "god"); assert.equal(lab(0.30), "god");
  assert.equal(lab(0.25), ""); assert.equal(lab(0.10), "");
  assert.equal(lab(0.05), "låg"); assert.equal(lab(-0.05), "låg");
  const src = a.ev("rpbInfo.toString() + polyInfo.toString()");
  assert.ok(!/mycket god|acceptabel|0,20\+/.test(src));
  a.ev("setThreshold('goodDisc', 0.35)");
  assert.equal(lab(0.31), "");
});
test("filtret har ett val för god diskriminering och inget val för stark", () => {
  const a = app();
  const f = a.evj("FACETS");
  assert.deepEqual(f.find(g => g.key === "disk").values.map(v => v[0]), ["neg", "lag", "mellan", "god", "na"]);
  assert.deepEqual(f.find(g => g.key === "titta").values.map(v => v[0]), ["fraga", "forebild", "excl"]);
  assert.equal(a.ev("typeof isExemplary"), "undefined");
  assert.equal(a.ev("discBucket(rpbInfo(mkV({rpb:0.2})), 0.2)"), "mellan");
  assert.equal(a.ev("discBucket(rpbInfo(mkV({rpb:0.4})), 0.4)"), "god");
});
test("under 30 svar ges inga observationer eller uppmaningar, utom när ingen svarade rätt", () => {
  const a = app();
  assert.equal(a.ev("MIN_N"), 30);
  assert.equal(a.ev("typeof MIN_N_DIST"), "undefined");
  assert.deepEqual(a.evj("psy(mkV({n:25, counts:[6,15,3,1], rpb:0.0}))"), { l1: [], l2: [] });
  assert.deepEqual(a.evj("psy(mkV({n:25, counts:[0,15,6,4], rpb:null})).l1"), ["none-correct"]);
  assert.equal(a.ev("rpbInfo(mkV({n:25, counts:[15,5,3,2], rpb:0.4})).label"), "för få svar");
  assert.equal(a.ev("levelBadgeFor(25, 95)"), "");
  assert.match(a.ev("levelBadgeFor(30, 95)"), /Lätt/);
});
test("Se över frågan nära gissningsnivå utlöses när r är under 2/√n eller inte mätbar", () => {
  const a = app();
  const hard = o => a.evj(`advice(mkV(${o})).l1.filter(x => x.psy === "hard").map(x => x.rState)`);
  assert.deepEqual(hard("{counts:[25,30,25,20], rpb:0.25}"), []);            // över 2/√100 = 0,20
  assert.deepEqual(hard("{counts:[25,30,25,20], rpb:0.15}"), ["low"]);
  assert.deepEqual(hard("{counts:[25,30,25,20], rpb:-0.10}"), ["low"]);      // svagt negativ inom bruset räknas som låg
  assert.deepEqual(hard("{counts:[4,40,30,26], rpb:0.5}"), ["na"]);          // bara 4 rätt: inte mätbar
  assert.deepEqual(a.evj("psy(mkV({counts:[25,30,25,20], rpb:-0.25})).l1"), ["rpb-neg"]);
});
test("sällan valda alternativ bedöms bara när felen räcker för att alla distraktorer kan nå 5 %", () => {
  const a = app();
  const dead = o => a.evj(`psy(mkV(${o})).l2.includes("distractor-eff")`);
  assert.equal(dead("{counts:[90,6,3,1], rpb:0.2}"), false);                 // 10 % fel, tre distraktorer kräver 15 %
  assert.equal(dead("{counts:[84,12,3,1], rpb:0.2}"), true);
  assert.equal(dead("{counts:[70,20,8,2], rpb:0.2}"), true);
  assert.equal(dead("{counts:[70,12,10,8], rpb:0.2}"), false);
});
test("essä och flersvar följer samma regel som flervalsfrågor", () => {
  const a = app();
  a.ev(`globalThis.sc = (dev, val) => Array.from({length:100}, (_, i) => i < dev ? val : 1);`);
  const lab = (dev, r) => a.ev(`polyInfo(sc(${dev}, 0), ${r}, 1, "text").label`);
  assert.equal(lab(3, -0.5), "ej mätbar");        // 3 av 100 avviker från det vanligaste poängtalet
  assert.equal(lab(7, -0.5), "osäker");
  assert.equal(lab(20, -0.15), "låg");            // inom bruset (−2/√100 = −0,20)
  assert.equal(lab(20, -0.25), "negativ");
  assert.equal(lab(20, 0.35), "god");
  assert.equal(lab(20, 0.2), "");
  assert.equal(a.ev(`polyInfo(sc(10, 0).slice(0, 25), 0.4, 1, "text").label`), "för få svar");
  // spridda poäng räknas som mätbara även när få har full poäng
  assert.equal(a.ev(`polyInfo(Array.from({length:100}, (_, i) => i < 3 ? 2 : i % 4 * 0.5), 0.35, 2, "text").label`), "god");
  const q = (dev, r) => a.evj(`scoreQuestions({n:100, r:${r}, typ:"text", excluded:false, dist:[{pts:0, count:${dev}}, {pts:1, count:${100 - dev}}]}).map(x => x.key)`);
  assert.deepEqual(q(3, -0.5), []);
  assert.deepEqual(q(20, -0.25), ["mall"]);
});
test("förebild kräver god diskriminering över brusgränsen, och har inget krav på andel rätt", () => {
  const a = app();
  const fb = o => a.ev(`(v => { v.advice = advice(v); return isForebild(v); })(mkV(${o}))`);
  assert.equal(fb("{counts:[45,20,19,16], rpb:0.35}"), true);                // 45 % rätt: inget intervall längre
  assert.equal(fb("{counts:[60,15,13,12], rpb:0.25}"), false);               // under gränsen för god
  assert.equal(fb("{n:36, counts:[20,6,5,5], rpb:0.31}"), false);            // 0,31 är under 2/√36 = 0,33
  assert.equal(fb("{counts:[70,20,8,2], rpb:0.35}"), false);                 // har en observation på kortet
  assert.ok(!/50|85|medelsvår/.test(a.ev("isForebild.toString()")));
});
test("blankt svar räknas som fel: i andel rätt, i diskrimineringen och i svarsfördelningen", () => {
  const a = app();
  a.ev(`globalThis.D0 = demoToInspera(DEMO_DATA.DEMO); globalThis.J0 = parseJSON([D0]); globalThis.QN = String(J0.mcqSeqs[0]);
        globalThis.D1 = demoToInspera(DEMO_DATA.DEMO);
        D1.ext_inspera_candidates.slice(0, 6).forEach(c => { const q = (c.result || c).ext_inspera_questions.find(q => String(q.ext_inspera_questionNumber) === QN);
          q.ext_inspera_candidateResponses = []; q.ext_inspera_autoScore = 0; });
        globalThis.J1 = parseJSON([D1]);`);
  const n = a.ev("J1.candCount");
  assert.equal(a.ev("J1.agg[QN].n"), n);
  assert.equal(a.ev("J1.agg[QN].blank"), 6);
  assert.equal(a.ev("J0.agg[QN].blank"), 0);
  assert.equal(a.ev("J1.agg[QN].pairs.length"), n);
  // diskrimineringen mot flervalsdelen blir densamma som när den räknas ur poängen (där blankt är 0 p)
  const direct = a.ev("computeDiscrimination(J1, {criterion:'mcq'})[QN]");
  const viaScores = a.ev("computeDiscrimination(J1, {criterion:'mcq', excluded:new Set(['finns-inte'])})[QN]");
  assert.ok(Math.abs(direct - viaScores) < 1e-9);
  a.ev("state.json = J1; state.excluded = new Map(); rebuildView();");
  const v = "VIEW.find(v => String(v.seq) === QN)";
  assert.equal(a.ev(`${v}.blank`), 6);
  assert.equal(a.ev(`${v}.counts.reduce((s, x) => s + x, 0) + ${v}.blank`), n);
  assert.match(a.ev(`card(${v})`), /Inget svar/);
  assert.ok(!/Inget svar/.test(a.ev("card(VIEW.find(v => String(v.seq) !== QN && !v.blank))")));
});
test("taggar slås upp på ett sätt: frågenummer först, sedan frågans namn", () => {
  const a = app();
  a.ev(`state.tags = parseTagsRows([["Namn","Tema"],["X1","Neuro"],["PDFKOD","Psyke"]]); state.json.qTitle["900"] = "X1";`);
  assert.deepEqual(a.evj("tagValsFor('900', 'PDFKOD')"), ["Neuro"]);        // namnet ur resultatfilen går före PDF:ens kod
  assert.deepEqual(a.evj("tagValsFor('901', 'PDFKOD')"), ["Psyke"]);        // PDF:ens kod som sista utväg
  a.ev(`state.tags = parseTagsRows([["Nr","Namn","Tema"],["900","Annat","Sinne"],["5","X1","Neuro"]]);`);
  assert.deepEqual(a.evj("tagValsFor('900', 'X1')"), ["Sinne"]);
  assert.equal(a.ev("typeof lookupTagVals"), "undefined");
  a.ev("setPrep(false); loadSynthetic(); setStep('report');");
  const cards = a.evj("state.vm.view.map(v => [String(v.seq), v.tagVals[0] || ''])");
  const stats = new Map(a.evj("statsData().questions.map(q => [String(q.num), q.tema])"));
  for (const [seq, t] of cards) assert.equal(stats.get(seq), t, seq);
  assert.equal(a.ev("tagMatchCount().total"), a.ev("state.json.qMeta.length"));
});
test("översiktstabellen har samma etikett som kortet för varje flervalsfråga", () => {
  const a = loadApp(); a.ev("setPrep(false); loadSynthetic(); setStep('report');");
  const rows = new Map(a.evj("overviewPayload().rows.filter(r => r.isSingle).map(r => [String(r.num), r.info.label])"));
  const cards = a.evj("state.vm.view.map(v => [String(v.seq), neutralInfo(rpbInfo(v), v.rpb).label])");
  assert.ok(cards.length > 5);
  for (const [seq, label] of cards) assert.equal(rows.get(seq), label, seq);
  assert.match(a.ev("overviewPayload.toString()"), /bestDistIdx|byCard/);
});
