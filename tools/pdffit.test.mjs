// Kvittot i steg 1 efter prov på en T1-tenta (22 nov 2026): flervals- och flersvarsfrågor räknas var för sig, och en
// PDF som inte hör till resultaten ger en varning även när den saknar tentans namn i sidhuvudet.
import test from "node:test"; import assert from "node:assert/strict";
import { loadApp } from "./harness.mjs";
const fresh = () => { const a = loadApp();
  a.ev(`globalThis.D = demoToInspera(DEMO_DATA.DEMO); globalThis.J = parseJSON([D]);
        globalThis.PDF = JSON.parse(JSON.stringify(DEMO_DATA.PDF));`); return a; };

test("rätt PDF passar resultaten: frågorna finns och svarsalternativen känns igen", () => {
  const a = fresh();
  const f = a.evj("pdfFit(J, PDF)");
  assert.equal(f.single, a.ev("J.qMeta.filter(m => m.type === 'single').length"));
  assert.ok(f.textN > 5 && f.textOk / f.textN > 0.9);
  assert.equal(f.warning, null);
  assert.equal(a.ev("pdfFit(J, null)"), null);
});
test("en PDF från en annan tenta ger en varning, också utan tentans namn i sidhuvudet", () => {
  const a = fresh();
  a.ev(`globalThis.W1 = PDF.map(q => Object.assign({}, q, {opts: q.opts.map((o, i) => "Helt annan text " + q.seq + "-" + i)}));
        globalThis.W2 = PDF.slice(0, Math.floor(PDF.length / 2));`);
  assert.match(a.ev("pdfFit(J, W1).warning"), /^PDF:en verkar inte höra till den här tentan\. Svarsalternativen stämmer med resultaten för bara 0 av \d+ frågor\. Kontrollera att rätt PDF är vald\.$/);
  assert.match(a.ev("pdfFit(J, W2).warning"), /PDF:en har \d+ frågor med svarsalternativ, resultaten har \d+/);
});
test("kvittot räknar flervalsfrågor och flersvarsfrågor var för sig", () => {
  const a = fresh();
  a.ev(`globalThis.F = pdfFit(J, PDF);`);
  assert.equal(a.ev("pdfCountText({single:47, multi:5, other:0})"), "47 flervalsfrågor och 5 flersvarsfrågor lästa ur PDF:en");
  assert.equal(a.ev("pdfCountText({single:47, multi:0, other:0})"), "47 flervalsfrågor lästa ur PDF:en");
  assert.equal(a.ev("pdfCountText({single:1, multi:1, other:2})"), "1 flervalsfråga och 1 flersvarsfråga lästa ur PDF:en, och 2 som inte har svarsalternativ i resultaten");
});
test("kvittot i steg 1 visar uppdelningen och varningen", async () => {
  const a = fresh();
  a.ev(`state.prepFiles = [{ name: "f.json", text: async () => JSON.stringify(D) }];
        state.prepPdf = PDF.map(q => Object.assign({}, q, {opts: q.opts.map((o, i) => "Helt annan text " + q.seq + "-" + i)}));`);
  await a.ev("refreshPrep()");
  const h = a.el("#prep-receipt").innerHTML;
  assert.match(h, /flervalsfrågor lästa ur PDF:en/);
  assert.match(h, /class="warn">⚠ PDF:en verkar inte höra till den här tentan/);
  a.ev("state.prepPdf = PDF;"); await a.ev("refreshPrep()");
  assert.ok(!/verkar inte höra/.test(a.el("#prep-receipt").innerHTML));
  assert.match(a.el("#got-pdf").textContent, /flervalsfrågor/);
});
test("innan resultaten är valda säger PDF-rutan frågor med svarsalternativ", () => {
  const a = loadApp();
  assert.match(a.ev("$('#pdf').listeners.change[0].toString()"), /frågor med svarsalternativ/);
});
