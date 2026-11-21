// Frågor som examinatorn har exkluderat i Inspera är viktade till 0 % i exporten (Kajsa 21 nov 2026). Verktyget
// känner igen det och räknar dem som exkluderade, så att beslutet följer med från Inspera utan någon egen fil.
import test from "node:test"; import assert from "node:assert/strict";
import { loadApp, runHtml } from "./harness.mjs";
import { setupDirty } from "./fixtures.mjs";
const fresh = () => { const a = loadApp(); setupDirty(a.ev);
  a.ev(`globalThis.W = makeDirty();
        globalThis.QX = W.ext_inspera_candidates[0].result.ext_inspera_questions[3].ext_inspera_questionNumber;
        globalThis.QY = W.ext_inspera_candidates[0].result.ext_inspera_questions[5].ext_inspera_questionNumber;
        W.ext_inspera_candidates.forEach((c, i) => c.result.ext_inspera_questions.forEach(q => {
          if (q.ext_inspera_questionNumber === QX) q.ext_inspera_questionWeight = 0;
          if (q.ext_inspera_questionNumber === QY && i < 2) q.ext_inspera_questionWeight = 0; }));
        globalThis.mk = d => buildExaminerFile(JSON.parse(JSON.stringify(buildPackage({jsonObjs:[d], pdfMcqs:DEMO_DATA.PDF, tagRows:DEMO_DATA.TAGS}))));`);
  return a; };

test("vikten följer med i filen till examinatorn", () => {
  const { ev } = fresh();
  const q = "(c => (c.result || c).ext_inspera_questions)(minimizeInspera(W, 0).ext_inspera_candidates[0])";
  assert.equal(ev(`${q}.find(x => x.ext_inspera_questionNumber === QX).ext_inspera_questionWeight`), 0);
  assert.equal(ev(`${q}.find(x => x.ext_inspera_questionNumber !== QX && x.ext_inspera_questionNumber !== QY).ext_inspera_questionWeight`), 1);
});
test("en fråga som är viktad till 0 % för studenterna känns igen, och enstaka studenter redovisas för sig", () => {
  const { ev, evj } = fresh();
  assert.deepEqual(evj("parseJSON([W]).zeroWeight"), [String(ev("QX"))]);
  assert.deepEqual(evj("parseJSON([W]).partialZero"), [{ num: String(ev("QY")), n: 2 }]);
  assert.deepEqual(evj("parseJSON([dirty]).zeroWeight"), []);
});
test("när filen öppnas räknas frågan som exkluderad, och det står varför", async () => {
  const { ev, el } = fresh();
  ev("setPrep(false)"); await ev("loadExaminerFile(mk(W), 'f.html')");
  assert.equal(ev("isExcluded(QX)"), true);
  assert.match(ev("exclReason(QX)"), /0 % i Inspera/);
  assert.equal(ev("isExcluded(QY)"), false);
  const note = el("#weightnote").innerHTML;
  assert.match(note, new RegExp(`fråga ${ev("QX")}`));
  assert.match(note, /räknas som exkluderad/);
  assert.match(note, new RegExp(`[Ff]råga ${ev("QY")}[^.]*2 av ${ev("state.json.candCount")} studenter`));
  ev("setStep('report')");
  assert.match(el("#fileline").textContent, /1 exkluderad/);
  assert.match(el("#cards").innerHTML.split(`id="card-${ev("QX")}"`)[1].split('class="q ')[0], /Exkluderad ur tentan[\s\S]*0 % i Inspera/);
  assert.equal(ev(`temaEmbed().excluded.find(e => e[0] === String(QX))[1]`), ev("exclReason(QX)"));
});
test("en fil utan viktade frågor ger ingen exkludering och ingen rad", async () => {
  const { ev, el } = fresh();
  ev("setPrep(false)"); await ev("loadExaminerFile(mk(dirty), 'f.html')");
  assert.equal(ev("state.excluded.size"), 0);
  assert.equal(el("#weightnote").innerHTML, "");
});
test("en exkludering som bara görs i verktyget säger att den ska göras i Inspera också", async () => {
  const { ev, el } = fresh();
  ev("setPrep(false)"); await ev("loadExaminerFile(mk(W), 'f.html')"); ev("setStep('triage')");
  const other = ev("String(state.vm.view.find(v => String(v.seq) !== String(QX)).seq)");
  ev(`state.excluded.set('${other}', ''); render();`);
  const part = seq => el("#cards").innerHTML.split(`id="card-${seq}"`)[1].split('class="q ')[0];
  assert.match(part(other), /Gäller bara här[\s\S]*0 % i Inspera/);
  assert.ok(!/Gäller bara här/.test(part(ev("QX"))));
});
test("temarapporten visar frågan som exkluderad utan uppmaningen till examinatorn", async () => {
  const { ev } = fresh();
  ev("setPrep(false)"); await ev("loadExaminerFile(mk(W), 'f.html')"); ev("setStep('report')");
  const page = runHtml(ev("buildTemaReport(temaEmbed())"));
  assert.match(page.el("#cards").innerHTML, /Exkluderad ur tentan/);
  assert.ok(!/Gäller bara här/.test(page.el("#cards").innerHTML));
});
