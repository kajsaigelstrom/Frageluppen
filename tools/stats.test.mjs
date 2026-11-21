// Tentamensstatistik (Kajsa 21 nov 2026): en export som liknar den Excel-mall kurssamordnarna fyller i för hand,
// med samma flikar och rubriker. Bara statistik: löpnummer i stället för Insperas id, och studieort per student.
import test from "node:test"; import assert from "node:assert/strict"; import fs from "node:fs";
import { loadApp, INDEX } from "./harness.mjs";
import { setupDirty } from "./fixtures.mjs";
const STATIC = fs.readFileSync(INDEX, "utf8").split("<script>")[0];
const two = async () => { const a = loadApp(); setupDirty(a.ev);
  a.ev(`globalThis.A1 = makeDirty(); A1.ext_inspera_assessmentRunTitle = "8LPG50 2026-06-01 Jönköping 9755";
        globalThis.A2 = makeDirty(); A2.ext_inspera_assessmentRunTitle = "8LPG50 2026-06-01 Norrköping 9754";
        globalThis.PK = JSON.parse(JSON.stringify(buildPackage({jsonObjs:[A1, A2], pdfMcqs:DEMO_DATA.PDF, tagRows:DEMO_DATA.TAGS})));
        setPrep(false);`);
  await a.ev("loadDataFile(buildExaminerFile(PK), 'f.html')"); a.ev("setStep('report')"); return a; };

test("studieorten läses ur resultatfilernas namn och följer med i filen till examinatorn", async () => {
  const a = loadApp();
  assert.deepEqual(a.evj(`ortNames(["8LPG50 2026-06-01 08:00 Jönköping 9755", "8LPG50 2026-06-01 08:00 Norrköping 9754"])`), ["Jönköping", "Norrköping"]);
  assert.deepEqual(a.evj(`ortNames(["Tenta A"])`), [""]);
  const b = await two();
  assert.deepEqual(b.evj("PK.orter"), ["Jönköping", "Norrköping"]);
  assert.deepEqual(b.evj("state.orter"), ["Jönköping", "Norrköping"]);
  const n = b.ev("A1.ext_inspera_candidates.length");
  assert.equal(b.ev("statsData().students[0].ort"), "Jönköping");
  assert.equal(b.ev(`statsData().students[${n}].ort`), "Norrköping");
  assert.ok(!/K-777|sourcedId/.test(b.ev("JSON.stringify(statsData())")));          // inga id från Inspera
});
test("statistiken räknas utan exkluderade frågor och med G-gränsen avrundad som i verktyget", async () => {
  const a = await two();
  const d0 = a.evj("statsData()");
  assert.equal(d0.students.length, a.ev("state.json.candCount"));
  assert.equal(d0.questions.length, a.ev("state.json.qMeta.length"));
  assert.equal(d0.gThr, Math.floor(0.65 * d0.max + 1e-9));
  assert.equal(d0.students.filter(s => s.g).length, a.ev("passMetric(state.excluded).pass"));
  const q = a.ev("String(state.json.qMeta[0].num)");
  a.ev(`state.excluded.set('${q}', 'Tekniskt fel')`);
  const d1 = a.evj("statsData()");
  assert.equal(d1.questions.length, d0.questions.length - 1);
  assert.ok(!d1.questions.some(x => String(x.num) === q));
  assert.deepEqual(d1.excluded.map(x => String(x.num)), [q]);
  assert.ok(d1.max < d0.max);
  assert.ok(Math.abs(d1.students[0].total - d1.students[0].scores.reduce((s, v) => s + v, 0)) < 1e-9);
  assert.ok(d1.themes.length > 0 && d1.themes.every(t => t.max > 0 && t.nums.length > 0));
});
test("arbetsboken har mallens flikar och rubriker, och betyget följer G-gränsen i Sammanfattning", async () => {
  const a = await two();
  const sh = a.evj("statsSheets(statsData())");
  assert.deepEqual(sh.map(s => s.name), ["Sammanfattning", "Resultat per sektion", "Resultat per fall"]);
  const res = sh[1].aoa, nq = a.ev("state.json.qMeta.length"), n = a.ev("state.json.candCount");
  assert.deepEqual(res[0].slice(0, 4), ["Antal deltagare", "Studieort", "Deltagare", "Q 1"]);
  assert.deepEqual(res[0].slice(3 + nq, 5 + nq), ["Slutpoäng", "Betyg"]);      // därefter Insperas uppgifter, när filen har dem
  assert.equal(res[1][1], "Jönköping");
  assert.match(res[1][4 + nq].f, /Sammanfattning!/);
  assert.ok(["G", "U"].includes(res[1][4 + nq].v));
  assert.deepEqual([res[n + 1][1], res[n + 2][1], res[n + 3][1], res[n + 4][1]],
    ["Maxpoäng per sektion", "Medel per sektion", "Medlet som procent av maxpoäng", "Fall/tema/ämne"]);
  const sum = sh[0].aoa.map(r => r[0]);
  for (const label of ["Maxpoäng", "G-gräns (poäng)", "Medelpoäng", "Bästa resultat", "Antal tentander", "Antal G", "Antal U", "Jönköping", "Norrköping", "Antal anmälda"]) assert.ok(sum.includes(label), label);
  assert.deepEqual(sh[2].aoa.map(r => r[0]), ["Fall/Tema/Ämne", "Uppgift", "Maxpoäng", "Medelvärde", "Medel som procent av maxpoäng"]);
});
test("diagramsidan har poängfördelningen och poäng per student och ort, med G-gränsen utritad", async () => {
  const a = await two();
  const h = a.ev("statsChartsHtml(statsData())");
  assert.equal((h.match(/<svg/g) || []).length, 2);
  assert.match(h, /G-gräns/); assert.match(h, /Jönköping/); assert.match(h, /Norrköping/);
  assert.equal((h.match(/<circle/g) || []).length, a.ev("state.json.candCount"));
  assert.ok(!/<script/.test(h));
});
test("knapparna heter Tentamensstatistik och Diagram, och finns bara i hela rapporten", async () => {
  assert.match(STATIC, /id="exp-xlsx"[^>]*>Tentamensstatistik</);
  assert.match(STATIC, /id="exp-charts"[^>]*>Diagram</);
  const a = await two();
  (a.el("#exp-charts").listeners.click || []).forEach(f => f({}));
  assert.match(a.downloads[a.downloads.length - 1].parts.join(""), /<h1>Poängfördelning<\/h1>/);
  a.ev("setStep('choose'); setStep('triage');");
  assert.equal(a.el("#exp-charts").classList.contains("hidden"), true);
});
test("G-gränsen i procent ändras direkt på rapportsidan och styr statistiken", async () => {
  assert.match(STATIC, /class="viewhead"[\s\S]*id="g-pct"/);
  const a = await two();
  assert.equal(a.el("#g-pct").value, "65");
  assert.equal(a.el("#gctl").classList.contains("hidden"), false);
  const max = a.ev("statsData().max");
  assert.match(a.el("#g-pts").textContent, new RegExp("= " + Math.floor(0.65 * max + 1e-9) + " p"));
  const change = v => { a.el("#g-pct").value = v; (a.el("#g-pct").listeners.change || []).forEach(f => f({ target: a.el("#g-pct") })); };
  change("70");
  assert.equal(a.ev("state.th.pass"), 70);
  assert.equal(a.ev("statsData().gThr"), Math.floor(0.70 * max + 1e-9));
  assert.match(a.el("#g-pts").textContent, new RegExp("= " + Math.floor(0.70 * max + 1e-9) + " p"));
  change("abc");                                                    // ogiltigt värde: gränsen står kvar
  assert.equal(a.ev("state.th.pass"), 70);
  assert.equal(a.el("#g-pct").value, "70");
  a.ev("setStep('choose'); setStep('triage');");
  assert.equal(a.el("#gctl").classList.contains("hidden"), true);
});
test("i arbetsboken är det procenten som bestämmer: poänggränsen och betygen räknas ur den", async () => {
  const a = await two();
  const sum = a.evj("statsSheets(statsData())[0].aoa");
  const row = l => sum.findIndex(r => r[0] === l);
  assert.equal(sum[row("G-gräns (%)")][1], 65);
  assert.equal(row("G-gräns (poäng)"), row("G-gräns (%)") + 1);
  const pts = sum[row("G-gräns (poäng)")][1];
  assert.equal(pts.v, a.ev("statsData().gThr"));
  assert.equal(pts.f, "ROUNDDOWN(B" + (row("G-gräns (%)") + 1) + "/100*B" + (row("Maxpoäng") + 1) + ",0)");
  const nq = a.ev("state.json.qMeta.length");
  assert.ok(a.evj("statsSheets(statsData())[1].aoa")[1][4 + nq].f.includes("Sammanfattning!$B$" + (row("G-gräns (poäng)") + 1)));
});
