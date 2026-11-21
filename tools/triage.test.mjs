// Vyn före betygssättning (Kajsa 21 nov 2026): bara de frågor som statistiken pekar ut, plus en reducerad
// visning av alla flervalsfrågor för överblick. Inget filter, bara sök och sortering. Inga råd "till nästa gång".
import test from "node:test"; import assert from "node:assert/strict";
import { loadApp } from "./harness.mjs";
const tri = () => { const a = loadApp(); a.ev("setPrep(false); loadSynthetic(); setStep('triage');"); return a; };
const ids = html => [...html.matchAll(/id="card-([^"]+)"/g)].map(m => m[1]);
const FLAGGED = "state.vm.view.filter(v => v.advice.l1.length).map(v => String(v.seq))";

test("vyn öppnar på frågorna att se över, med alla flervalsfrågor som andra val", () => {
  const { ev, evj, el } = tri();
  assert.deepEqual(evj("activeView().modes.map(m => m.label)"), ["Att se över", "Alla flervalsfrågor"]);
  assert.equal(ev("state.mode"), "action");
  assert.ok(evj(FLAGGED).length > 0);
  assert.deepEqual(ids(el("#cards").innerHTML).sort(), evj(FLAGGED).sort());
  assert.ok(!/Triage/.test(el("#modeseg").innerHTML + el("#modehint").textContent));
});
test("en exkluderad fråga står kvar bland dem att se över, så att den kan återinkluderas", () => {
  const { ev, evj, el } = tri();
  const seq = ev("String(state.vm.view.find(v => !v.advice.l1.length).seq)");
  ev(`state.excluded.set('${seq}', 'Tekniskt fel'); render();`);
  assert.ok(ids(el("#cards").innerHTML).includes(seq));
  assert.match(el("#cards").innerHTML.split(`id="card-${seq}"`)[1], /card-reinclude/);
});
test("sökrutan hittar en fråga som statistiken inte pekar ut", () => {
  const { ev, el } = tri();
  const code = ev("state.vm.view.find(v => !v.advice.l1.length).code");
  ev(`document.querySelector("#search").value = ${JSON.stringify(code)}; applyFilters();`);
  assert.ok(el("#cards").innerHTML.includes("card-exclude"));
  assert.ok(ids(el("#cards").innerHTML).length >= 1);
});
test("inga råd till nästa gång före betygssättning, i något av lägena", () => {
  const { ev, el } = tri();
  for (const m of ["action", "edu"]) {
    ev(`state.mode = '${m}'; drawCards();`);
    const html = el("#cards").innerHTML;
    assert.ok(!/Till nästa gång|Förbättra svarsalternativen|Ta upp i undervisningen|Inga anmärkningar|bekräftad must-know/.test(html), m);
  }
});
test("alla flervalsfrågor visas reducerat: mätvärden och alternativ, och rutan bara där något ska ses över", () => {
  const { ev, evj, el } = tri();
  ev("state.mode = 'edu'; render();");
  const html = el("#cards").innerHTML;
  assert.equal(ids(html).length, ev("state.vm.view.length"));
  assert.equal((html.match(/class="advbox"/g) || []).length, evj(FLAGGED).length);
  assert.match(el("#modehint").textContent, /överblick/);
});
test("inget filter i vyn, bara sök och sortering, och filter från rapporten följer inte med", () => {
  const a = loadApp();
  a.ev("setPrep(false); loadSynthetic(); setStep('report'); toggleFacet('svar','latt'); setStep('choose'); setStep('triage');");
  assert.equal(a.el("#tagbar").innerHTML, "");
  assert.deepEqual(a.evj("state.facets"), {});
  assert.deepEqual(ids(a.el("#cards").innerHTML).sort(), a.evj(FLAGGED).sort());
  a.ev("setStep('choose'); setStep('report');");
  assert.match(a.el("#tagbar").innerHTML, /Svårighet/);
});
test("sammanfattningen före betygssättning räknar bara det som hör dit", () => {
  const { el } = tri();
  const s = el("#summary").innerHTML;
  assert.match(s, /att se över/);
  assert.ok(!/tips|automatiska flaggor/.test(s));
});
test("listan överst visas bara som register i läget med alla frågor", () => {
  const { ev, el } = tri();
  assert.equal(el("#actionlist").innerHTML, "");
  ev("state.mode = 'edu'; refreshLists(); drawCards();");
  assert.match(el("#actionlist").innerHTML, /fråga\(or\) att se över/);
});
test("för få svar: vyn säger det och visar alla frågor", () => {
  const { ev, el } = tri();
  ev("state.json.candCount = 12; render();");
  assert.equal(ids(el("#cards").innerHTML).length, ev("state.vm.view.length"));
  assert.match(el("#nnote").innerHTML + el("#actionlist").innerHTML, /[Ff]ör få svar|Litet underlag/);
});
test("ingen fråga utpekad: vyn säger det och pekar på läget med alla frågor", () => {
  const { ev, el } = tri();
  ev("state.vm.view.forEach(v => { v.advice.l1 = []; }); drawCards();");
  assert.match(el("#cards").innerHTML, /Statistiken pekar inte ut någon fråga/);
  assert.match(el("#cards").innerHTML, /Alla flervalsfrågor/);
});
test("examinatorns PDF före betygssättning har bara det som ska ses över", () => {
  const a = tri();
  let doc = ""; a.set("open", () => ({ document: { open(){}, write(h){ doc = h; }, close(){} } }));
  a.ev("window.open = open; exportPdf();");
  assert.match(doc, /Att se över/);
  assert.ok(!/Förbättra svarsalternativen|Ta upp i undervisningen|Triage/.test(doc));
});
