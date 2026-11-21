// Hela rapporten efter rättningen (Kajsa 21 nov 2026): lägen som säger vad de gör, ingen lista som upprepar korten,
// inget grönt besked på kort utan råd, och exporterna samlade på rubrikraden.
import test from "node:test"; import assert from "node:assert/strict"; import fs from "node:fs";
import { loadApp, INDEX } from "./harness.mjs";
const STATIC = fs.readFileSync(INDEX, "utf8").split("<script>")[0];
const rep = () => { const a = loadApp(); a.ev("setPrep(false); loadSynthetic(); setStep('report');"); return a; };

test("lägena heter Med råd och Bara mätvärden", () => {
  const { evj, el } = rep();
  assert.deepEqual(evj("activeView().modes.map(m => m.label)"), ["Med råd", "Bara mätvärden"]);
  assert.ok(!/Utbildningsläge|Förenklad vy/.test(fs.readFileSync(INDEX, "utf8")));
  assert.match(el("#modehint").textContent, /råd/);
});
test("ingen lista över förebilder ovanför korten; de väljs i filtret i stället", () => {
  const { ev, el } = rep();
  assert.match(el("#tagbar").innerHTML, /Förebild/);
  assert.ok(!/Stark diskriminering/.test(el("#tagbar").innerHTML));
  const n = ev("state.vm.view.filter(v => !isExcluded(v.seq) && isForebild(v)).length");
  assert.ok(n > 0);
  ev("toggleFacet('titta','forebild')");
  assert.equal(ev("pageItems().length"), n);
  assert.ok(ev("pageItems().every(it => it.k === 'mcq' && isForebild(it.x))"));
});
test("kort utan råd har ingen ruta och inget grönt besked", () => {
  const { ev, el } = rep();
  const html = el("#cards").innerHTML;
  assert.ok(!/Inga anmärkningar|ser ut att fungera|bekräftad must-know|class="advok"/.test(html));
  const withAdvice = ev("state.vm.view.filter(v => !isExcluded(v.seq) && (v.advice.l1.length || v.advice.l2.length || v.advice.note)).length");
  assert.equal((html.match(/class="advbox"/g) || []).length, withAdvice);
});
test("exporterna står samlade på rubrikraden, med Temarapport först", () => {
  const head = STATIC.slice(STATIC.indexOf('class="viewhead"'), STATIC.indexOf('id="modehint"'));
  const order = [...head.matchAll(/id="(exp-[a-z]+)"/g)].map(m => m[1]);
  assert.deepEqual(order, ["exp-problems", "exp-html", "exp-temapdf", "exp-overview", "exp-xlsx", "exp-charts"]);   // Problemfrågor syns bara före betygssättning
  const ctrls = STATIC.slice(STATIC.indexOf('id="cardctrls"'), STATIC.indexOf('id="tagbar"'));
  assert.ok(!/id="exp-/.test(ctrls));
  const { ev, el } = rep();
  for (const id of ["#exp-html", "#exp-temapdf", "#exp-overview", "#exp-xlsx", "#exp-charts"]) assert.equal(el(id).classList.contains("hidden"), false, id);
  ev("setStep('choose'); setStep('triage');");
  for (const id of ["#exp-html", "#exp-overview", "#exp-xlsx"]) assert.equal(el(id).classList.contains("hidden"), true, id);
});
