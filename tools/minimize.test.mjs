import test from "node:test"; import assert from "node:assert/strict";
import { loadApp, fingerprint } from "./harness.mjs";
import { setupDirty, SENSITIVE } from "./fixtures.mjs";
const { ev, evj } = loadApp(); setupDirty(ev);

test("fixturen innehåller verkligen det känsliga", () => {
  const s = ev("JSON.stringify(dirty)");
  for (const bad of SENSITIVE) assert.ok(s.includes(bad), bad);
});
test("inget känsligt följer med", () => {
  const s = ev("JSON.stringify(minimizeInspera(dirty))");
  for (const bad of SENSITIVE) assert.ok(!s.includes(bad), bad);
});
test("siffrorna är identiska med råfilen", () => {
  assert.equal(fingerprint(ev, "parseJSON([minimizeInspera(dirty)])"), fingerprint(ev, "parseJSON([dirty])"));
});
test("kandidaterna får löpnummer i samma ordning", () => {
  assert.deepEqual(evj("parseJSON([minimizeInspera(dirty)]).candMeta.slice(0,3).map(c=>c.id)"), ["1","2","3"]);
  assert.equal(ev("minimizeInspera(dirty).ext_inspera_candidates[0].result.ext_inspera_candidateId"), "1");
});
test("autopoängens datatyp bevaras och ett saknat fält förblir saknat", () => {
  ev(`globalThis.d2 = makeDirty();
      d2.ext_inspera_candidates[0].result.ext_inspera_questions[0].ext_inspera_autoScore = 1.5;
      delete d2.ext_inspera_candidates[0].result.ext_inspera_questions[1].ext_inspera_autoScore;
      d2.ext_inspera_candidates[0].result.ext_inspera_questions[2].ext_inspera_autoScore = null;`);
  const q = evj("minimizeInspera(d2).ext_inspera_candidates[0].result.ext_inspera_questions.slice(0,3)");
  assert.equal(q[0].ext_inspera_autoScore, 1.5);
  assert.ok(!("ext_inspera_autoScore" in q[1]));
  assert.equal(q[2].ext_inspera_autoScore, null);
});
test("indata ändras inte", () => {
  const before = ev("JSON.stringify(dirty)"); ev("minimizeInspera(dirty)");
  assert.equal(ev("JSON.stringify(dirty)"), before);
});
test("flera flervalssvar på samma fråga följer med", () => {
  ev(`globalThis.d3 = makeDirty();
      globalThis.q3 = d3.ext_inspera_candidates[0].result.ext_inspera_questions.find(q=>(q.ext_inspera_candidateResponses||[]).some(isChoice));
      q3.ext_inspera_candidateResponses.push({ext_inspera_response:"simpleChoice_extra_b", ext_inspera_interactionValue:"Andra svaret"});
      globalThis.q3n = q3.ext_inspera_questionNumber;`);
  const rs = evj("minimizeInspera(d3).ext_inspera_candidates[0].result.ext_inspera_questions.find(q=>q.ext_inspera_questionNumber===q3n).ext_inspera_candidateResponses");
  assert.equal(rs.length, 2);
  assert.deepEqual(Object.keys(rs[1]).sort(), ["ext_inspera_interactionValue","ext_inspera_response"]);
});
test("alternativ nyckel och kandidater utan result-omslag hanteras", () => {
  ev(`globalThis.d4 = (function(){ const d=makeDirty(); return {candidates: d.ext_inspera_candidates.map(c=>c.result)}; })();`);
  assert.equal(fingerprint(ev, "parseJSON([minimizeInspera(d4)])"), fingerprint(ev, "parseJSON([d4])"));
  assert.ok(ev("minimizeInspera(d4).ext_inspera_candidates[0].result.ext_inspera_questions.length") > 0);
});
