// Tre steg i stället för rollvalet "Jag är" (Kajsa 21 nov 2026): 1 Förbered filer, 2 Hitta problemfrågor,
// 3 Skapa rapporter. Stegen säger vad man gör, inte vem man är, så verktyget passar fler än Linköpings läkarprogram.
import test from "node:test"; import assert from "node:assert/strict"; import fs from "node:fs";
import { loadApp, runHtml, INDEX } from "./harness.mjs";
import { setupDirty } from "./fixtures.mjs";
const SRC = fs.readFileSync(INDEX, "utf8"), STATIC = SRC.split("<script>")[0];
const fresh = () => { const a = loadApp(); setupDirty(a.ev);
  a.ev(`globalThis.FILE = buildExaminerFile(JSON.parse(JSON.stringify(buildPackage({jsonObjs:[dirty], pdfMcqs:DEMO_DATA.PDF, tagRows:DEMO_DATA.TAGS}))));`); return a; };
const click = (a, id) => (a.el(id).listeners.click || []).forEach(f => f({}));
const on = (a, id) => a.el(id).classList.contains("on");

test("stegraden har tre steg, och rollvalet och mellansteget är borta", () => {
  const bar = STATIC.slice(STATIC.indexOf('id="rolebar"'), STATIC.indexOf('id="uploadpanel"'));
  assert.match(bar, /id="role-prep"[^>]*>[\s\S]*?1[\s\S]*?Förbered filer/);
  assert.match(bar, /id="step-triage"[^>]*>[\s\S]*?2[\s\S]*?Hitta problemfrågor/);
  assert.match(bar, /id="step-report"[^>]*>[\s\S]*?3[\s\S]*?Skapa rapporter/);
  for (const gone of ['id="role-exam"', 'id="stepchoice"', 'id="step-back"', ">Jag är<", "Vad vill du göra?"]) assert.ok(!STATIC.includes(gone), gone);
});
test("sidan öppnar på steg 1, och steg 2 och 3 ber om analysfilen", () => {
  const a = fresh();
  assert.equal(a.ev("state.prep"), true); assert.equal(on(a, "#role-prep"), true);
  click(a, "#step-triage");
  assert.equal(a.ev("state.prep"), false);
  assert.equal(on(a, "#step-triage"), true); assert.equal(on(a, "#role-prep"), false);
  assert.equal(a.el("#exambox").classList.contains("hidden"), false);
  assert.equal(a.el("#drops").classList.contains("hidden"), true);
  assert.equal(a.el("#results").classList.contains("hidden"), true);
});
test("när filen är vald visas det valda steget direkt", async () => {
  const a = fresh();
  click(a, "#step-triage"); await a.ev("loadExaminerFile(FILE, 'f.html')");
  assert.equal(a.ev("state.step"), "triage");
  assert.equal(a.el("#results").classList.contains("hidden"), false);
  const b = fresh();
  click(b, "#step-report"); await b.ev("loadExaminerFile(FILE, 'f.html')");
  assert.equal(b.ev("state.step"), "report"); assert.equal(on(b, "#step-report"), true);
});
test("med en fil öppen byter man steg med ett klick, utan att välja filen igen", async () => {
  const a = fresh();
  click(a, "#step-triage"); await a.ev("loadExaminerFile(FILE, 'f.html')");
  click(a, "#step-report");
  assert.equal(a.ev("state.step"), "report"); assert.equal(on(a, "#step-report"), true); assert.equal(on(a, "#step-triage"), false);
  click(a, "#step-triage");
  assert.equal(a.ev("state.step"), "triage");
  click(a, "#role-prep");
  assert.equal(a.ev("state.prep"), true);
  assert.equal(a.el("#results").classList.contains("hidden"), true);
  assert.equal(a.el("#uploadpanel").classList.contains("hidden"), false);
  click(a, "#step-report");                                           // tillbaka: filen finns kvar
  assert.equal(a.ev("state.step"), "report");
  assert.equal(a.el("#results").classList.contains("hidden"), false);
  assert.equal(a.el("#uploadpanel").classList.contains("hidden"), true);
});
test("steg 3 kräver färdig rättning, och säger det", async () => {
  const a = fresh();
  click(a, "#step-report"); await a.ev("loadExaminerFile(FILE, 'f.html')");
  a.ev("state.json.fullyGraded = false; state.json.ungradedPts = 12; setStep('report');");
  assert.equal(a.ev("state.step"), "triage");
  assert.equal(a.el("#step-report").disabled, true);
  assert.match(a.el("#step-report-note").textContent, /Steg 3 kräver färdig rättning[\s\S]*12 p/);
  a.ev("state.json.fullyGraded = true; setStep('report');");
  assert.equal(a.el("#step-report").disabled, false);
  assert.equal(a.el("#step-report-note").textContent, "");
});
test("en analysfil som öppnas med dubbelklick visar steg 2 och 3, inte steg 1", async () => {
  const a = fresh();
  const page = runHtml(a.ev("FILE"));
  await page.ev("state.embeddedReady");
  assert.equal(page.el("#role-prep").classList.contains("hidden"), true);
  assert.equal(page.el("#rolebar").classList.contains("hidden"), false);
  assert.equal(page.ev("state.step"), "triage");
});
test("adressen följer steget, och de gamla adresserna fungerar", () => {
  const { ev } = fresh();
  assert.equal(ev("roleFromHash('#forbered')"), "prep");
  assert.equal(ev("roleFromHash('#problemfragor')"), "triage");
  assert.equal(ev("roleFromHash('#rapporter')"), "report");
  assert.equal(ev("roleFromHash('#samordnare')"), "prep");
  assert.equal(ev("roleFromHash('#examinator')"), "triage");
  assert.equal(ev("roleFromHash('#annat')"), null);
});
test("filen heter analysfil, och texterna säger inte vem som gör vad", () => {
  assert.match(STATIC, /id="prep-save"[^>]*>Spara analysfilen</);
  assert.match(STATIC, /id="exambox"[\s\S]*?<label>Analysfilen<\/label>/);
  const visible = STATIC.replace(/<style[\s\S]*?<\/style>/, "");
  assert.ok(!/[Kk]urssamordnar|[Ee]xaminator/.test(visible), "sidans fasta text nämner ingen roll");
  const a = fresh();
  click(a, "#role-prep"); a.ev("prepSynthetic()");
  return Promise.resolve((a.el("#prep-save").listeners.click || [])[0]({})).then(() => {
    assert.throws(() => a.ev("extractEmbedded('<html></html>')"), /inte en analysfil/);
    assert.throws(() => a.ev("prepReceipt({jsonObjs:[JSON.parse(extractEmbedded(FILE))], pdfMcqs:null, tagRows:null})"), /redan en analysfil/);
    assert.match(SRC, /downloadText\(`analysfil_\$\{stamp\(\)\}\.html`/);
    const help = a.ev("HELP_HTML");
    assert.match(help, /De tre stegen/);
    assert.match(help, /I Linköping/);                                 // rollerna nämns bara som exempel
    for (const s of ["#rolehint", "#computehint", "#log"]) assert.ok(!/[Kk]urssamordnar|[Ee]xaminator/.test(a.el(s).textContent), s);
  });
});
