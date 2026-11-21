// Insperas slutbetyg och totalpoäng följer med i filen till examinatorn (Kajsa 21 nov 2026), så att verktyget kan
// jämföra sin egen uträkning med Insperas och varna när de skiljer sig. Datumet för betyget följer inte med.
import test from "node:test"; import assert from "node:assert/strict"; import fs from "node:fs";
import { loadApp, INDEX } from "./harness.mjs";
import { setupDirty } from "./fixtures.mjs";
const STATIC = fs.readFileSync(INDEX, "utf8").split("<script>")[0];
const fresh = () => { const a = loadApp(); setupDirty(a.ev);
  // G0: en export där Insperas totalpoäng och betyg stämmer med poängen per fråga och 65 %-gränsen
  a.ev(`globalThis.G0 = makeDirty();
        (function(){ const J = parseJSON([G0]), thr = Math.floor(0.65 * J.maxTotal + 1e-9);
          G0.ext_inspera_candidates.forEach((c, k) => { const t = J.cohortScores[k].reduce((s, v) => s + v, 0);
            c.result.ext_inspera_totalScore = t; c.result.ext_inspera_finalGrade = Math.ceil(t - 1e-9) >= thr ? "G" : "U"; }); })();
        globalThis.mk = d => buildExaminerFile(JSON.parse(JSON.stringify(buildPackage({jsonObjs:[d], pdfMcqs:DEMO_DATA.PDF, tagRows:DEMO_DATA.TAGS}))));
        setPrep(false);`);
  return a; };
const open = async (a, expr) => { await a.ev(`loadDataFile(mk(${expr}), 'f.html')`); a.ev("setStep('report')"); };

test("slutbetyg och totalpoäng följer med i filen, men inte datumet", () => {
  const { ev } = fresh();
  const r = "(c => c.result || c)(minimizeInspera(G0, 0).ext_inspera_candidates[0])";
  assert.equal(ev(`${r}.ext_inspera_finalGrade`), ev("G0.ext_inspera_candidates[0].result.ext_inspera_finalGrade"));
  assert.equal(ev(`${r}.ext_inspera_totalScore`), ev("G0.ext_inspera_candidates[0].result.ext_inspera_totalScore"));
  assert.ok(!ev("JSON.stringify(minimizeInspera(G0, 0))").includes("finalGradeDate"));
});
test("stämmer Insperas uppgifter med verktygets uträkning visas ingen varning", async () => {
  const a = fresh(); await open(a, "G0");
  assert.deepEqual(a.evj("(c => ({t: c.totalDiff, g: c.gradeDiff}))(gradeCheck())"), { t: 0, g: 0 });
  assert.equal(a.el("#gradenote").innerHTML, "");
});
test("skiljer sig totalpoäng eller betyg för någon student varnar verktyget, med antal", async () => {
  const a = fresh();
  a.ev(`globalThis.G1 = JSON.parse(JSON.stringify(G0));
        G1.ext_inspera_candidates[0].result.ext_inspera_totalScore += 3;
        G1.ext_inspera_candidates[1].result.ext_inspera_finalGrade = G1.ext_inspera_candidates[1].result.ext_inspera_finalGrade === "G" ? "U" : "G";`);
  await open(a, "G1");
  const c = a.evj("gradeCheck()");
  assert.equal(c.totalDiff, 1); assert.equal(c.gradeDiff, 1);
  const note = a.el("#gradenote").innerHTML;
  assert.match(note, /class="bad"/);
  assert.match(note, new RegExp(`Totalpoängen skiljer sig från Insperas för 1 av ${c.n} studenter`));
  assert.match(note, new RegExp(`Betyget skiljer sig från Insperas för 1 av ${c.n} studenter`));
  assert.match(note, /G-gräns/);
  assert.ok(!/K-777|sourcedId/.test(note));                              // aldrig vilka studenter
});
test("varningen räknas om när en fråga exkluderas eller G-gränsen ändras", async () => {
  const a = fresh(); await open(a, "G0");
  a.ev("state.excluded.set(String(state.json.qMeta[0].num), ''); render();");
  assert.ok(a.ev("gradeCheck().totalDiff") > 0);
  assert.match(a.el("#gradenote").innerHTML, /Totalpoängen skiljer sig/);
  a.ev("state.excluded.clear(); setThreshold('pass', 90); render();");
  assert.equal(a.ev("gradeCheck().totalDiff"), 0);
  assert.ok(a.ev("gradeCheck().gradeDiff") > 0);
});
test("en fil utan Insperas betyg och totalpoäng ger ingen kontroll, och ingen varning före betygssättning", async () => {
  const a = fresh();
  await open(a, "dirty.ext_inspera_candidates.forEach(c => { delete c.result.ext_inspera_finalGrade; delete c.result.ext_inspera_totalScore; }) || dirty");
  assert.equal(a.ev("gradeCheck()"), null);
  assert.equal(a.el("#gradenote").innerHTML, "");
  const b = fresh();
  b.ev(`globalThis.G1 = JSON.parse(JSON.stringify(G0)); G1.ext_inspera_candidates[0].result.ext_inspera_totalScore += 3;`);
  await b.ev("loadDataFile(mk(G1), 'f.html')"); b.ev("setStep('triage')");
  assert.equal(b.el("#gradenote").innerHTML, "");
});
test("Tentamensstatistiken har Insperas slutpoäng och betyg bredvid verktygets", async () => {
  const a = fresh(); await open(a, "G0");
  const head = a.evj("statsSheets(statsData())[1].aoa[0]");
  assert.deepEqual(head.slice(-4), ["Slutpoäng", "Betyg", "Slutpoäng i Inspera", "Betyg i Inspera"]);
  const sum = a.evj("statsSheets(statsData())[0].aoa").map(r => r[0]);
  assert.ok(sum.includes("Antal G enligt Inspera"));
});
test("texten till kurssamordnaren säger att betyg och totalpoäng följer med", () => {
  assert.ok(!/extratid, betyg och alla id tas bort/.test(fs.readFileSync(INDEX, "utf8")));
  assert.match(STATIC, /id="prephead"[\s\S]*?slutbetyg och totalpoäng följer med/i);
});
