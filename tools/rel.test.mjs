// Reliabilitet (Kajsas beslut 21 nov 2026, A18 och A10): alfa för hela tentan, flervalsdelen och essädelen, med
// medeldiskrimineringen bredvid. Mätfel och antal nära G-gränsen bara i Tentamensstatistiken.
import test from "node:test"; import assert from "node:assert/strict";
import { loadApp, runHtml } from "./harness.mjs";
const rep = () => { const a = loadApp(); a.ev("setPrep(false); loadSynthetic(); setStep('report');"); return a; };

test("Cronbachs alfa räknas på råpoängen, och saknas när den inte går att räkna", () => {
  const { ev } = loadApp();
  assert.ok(Math.abs(ev("alphaOf([[2,3],[4,5],[6,9]], [0,1])") - 0.947368) < 1e-5);
  assert.equal(ev("alphaOf([[1,1],[0,0],[1,1]], [0,1])"), 1);
  assert.equal(ev("alphaOf([[1,0],[0,1]], [0,1])"), null);            // totalpoängen varierar inte
  assert.equal(ev("alphaOf([[1,0],[0,1],[1,1]], [0])"), null);        // en enda fråga
});
test("reliabiliteten har tre delar, och exkluderade frågor räknas inte", () => {
  const a = rep();
  const r = a.evj("reliability()");
  assert.deepEqual(r.parts.map(p => p.label), ["Hela tentan", "Flervalsdelen", "Essädelen"]);
  const types = a.evj("state.json.qMeta.map(m => m.type)");
  assert.equal(r.parts[0].k, types.length);
  assert.equal(r.parts[1].k, types.filter(t => t === "single").length);
  assert.equal(r.parts[2].k, types.filter(t => t === "text").length);
  for (const p of r.parts) { assert.ok(p.alpha > 0 && p.alpha < 1, p.label); assert.ok(p.meanR > -1 && p.meanR < 1, p.label); }
  a.ev("state.excluded.set(String(state.json.mcqSeqs[0]), 'Fel i facit')");
  const r2 = a.evj("reliability()");
  assert.equal(r2.parts[0].k, r.parts[0].k - 1); assert.equal(r2.parts[1].k, r.parts[1].k - 1); assert.equal(r2.parts[2].k, r.parts[2].k);
});
test("mätfelet är standardavvikelsen gånger roten ur 1 − alfa, och antalet nära G-gränsen räknas på totalpoängen", () => {
  const a = rep();
  const d = a.evj("statsData()"), r = d.rel;
  const t = d.students.map(s => s.total), m = t.reduce((x, y) => x + y, 0) / t.length;
  const sd = Math.sqrt(t.reduce((s, x) => s + (x - m) ** 2, 0) / (t.length - 1));
  assert.ok(Math.abs(r.sem - sd * Math.sqrt(1 - r.parts[0].alpha)) < 1e-6);
  assert.equal(r.near, t.filter(x => Math.abs(x - d.gThr) <= r.sem).length);
});
test("Tentamensstatistikens Sammanfattning har alfa per del, mätfel och antal nära G-gränsen", () => {
  const a = rep();
  const rows = a.evj("statsSheets(statsData()).find(s => s.name === 'Sammanfattning').aoa.map(r => r.map(c => (c && typeof c === 'object') ? c.v : c))");
  const i = rows.findIndex(r => r[0] === "Reliabilitet");
  assert.deepEqual(rows[i], ["Reliabilitet", "Cronbachs alfa", "Medeldiskriminering (r)", "Antal frågor"]);
  assert.deepEqual(rows.slice(i + 1, i + 4).map(r => r[0]), ["Hela tentan", "Flervalsdelen", "Essädelen"]);
  assert.equal(typeof rows[i + 1][1], "number");
  assert.equal(rows[i + 3][4], "Frågor i samma MEQ-fall räknas som fristående, vilket kan ge ett något för högt värde.");
  assert.equal(rows[i + 4][0], "Mätfel i poäng (hela tentan)");
  assert.equal(rows[i + 5][0], "Studenter inom ett mätfel från G-gränsen");
  // formlerna för G och U pekar fortfarande på rätt rader
  assert.equal(rows[3][0], "G-gräns (poäng)"); assert.equal(rows[8][0], "Antal G"); assert.equal(rows[9][0], "Antal U");
});
test("temarapporten visar alfa för de tre delarna med brasklappen, men inte mätfel eller antal nära gränsen", () => {
  const a = rep();
  const E = a.evj("temaEmbed().rel");
  assert.deepEqual(Object.keys(E), ["parts"]);
  const page = runHtml(a.ev("buildTemaReport(temaEmbed())"));
  const h = page.el("#relbox").innerHTML;
  assert.match(h, /Hela tentan[\s\S]*Flervalsdelen[\s\S]*Essädelen/);
  assert.match(h, /0,\d\d/);                                           // decimalkomma
  assert.match(h, /Frågor i samma MEQ-fall räknas som fristående, vilket kan ge ett något för högt värde\./);
  assert.ok(!/Mätfel|G-gräns/.test(h));
  assert.ok(!/gäller hela tentan/.test(h));
  const child = runHtml(page.ev("buildTemaReport(subsetEmbed(EMBED, [String(EMBED.views[0].view[0].seq)], state.th))"));
  assert.match(child.el("#relbox").innerHTML, /Värdena gäller hela tentan, inte urvalet\./);
});
test("vid G-fältet står från vilken poäng man är godkänd", () => {
  const a = rep();
  const d = a.evj("statsData()");
  assert.equal(a.el("#g-pts").textContent, `godkänd från ${d.gThr} p`);
});
