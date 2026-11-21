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
  const bar = STATIC.slice(STATIC.indexOf('id="stepbar"'), STATIC.indexOf('id="uploadpanel"'));
  assert.match(bar, /id="step-prep"[^>]*>[\s\S]*?1[\s\S]*?Förbered filer/);
  assert.match(bar, /id="step-triage"[^>]*>[\s\S]*?2[\s\S]*?Hitta problemfrågor/);
  assert.match(bar, /id="step-report"[^>]*>[\s\S]*?3[\s\S]*?Skapa rapporter/);
  for (const gone of ['id="role-exam"', 'id="stepchoice"', 'id="step-back"', ">Jag är<", "Vad vill du göra?"]) assert.ok(!STATIC.includes(gone), gone);
});
test("sidan öppnar på steg 1, och steg 2 och 3 ber om datafilen", () => {
  const a = fresh();
  assert.equal(a.ev("state.prep"), true); assert.equal(on(a, "#step-prep"), true);
  click(a, "#step-triage");
  assert.equal(a.ev("state.prep"), false);
  assert.equal(on(a, "#step-triage"), true); assert.equal(on(a, "#step-prep"), false);
  assert.equal(a.el("#databox").classList.contains("hidden"), false);
  assert.equal(a.el("#drops").classList.contains("hidden"), true);
  assert.equal(a.el("#results").classList.contains("hidden"), true);
});
test("när filen är vald visas det valda steget direkt", async () => {
  const a = fresh();
  click(a, "#step-triage"); await a.ev("loadDataFile(FILE, 'f.html')");
  assert.equal(a.ev("state.step"), "triage");
  assert.equal(a.el("#results").classList.contains("hidden"), false);
  const b = fresh();
  click(b, "#step-report"); await b.ev("loadDataFile(FILE, 'f.html')");
  assert.equal(b.ev("state.step"), "report"); assert.equal(on(b, "#step-report"), true);
});
test("med en fil öppen byter man steg med ett klick, utan att välja filen igen", async () => {
  const a = fresh();
  click(a, "#step-triage"); await a.ev("loadDataFile(FILE, 'f.html')");
  click(a, "#step-report");
  assert.equal(a.ev("state.step"), "report"); assert.equal(on(a, "#step-report"), true); assert.equal(on(a, "#step-triage"), false);
  click(a, "#step-triage");
  assert.equal(a.ev("state.step"), "triage");
  click(a, "#step-prep");
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
  click(a, "#step-report"); await a.ev("loadDataFile(FILE, 'f.html')");
  a.ev("state.json.fullyGraded = false; state.json.ungradedPts = 12; setStep('report');");
  assert.equal(a.ev("state.step"), "triage");
  assert.equal(a.el("#step-report").disabled, true);
  assert.match(a.el("#step-report-note").textContent, /Steg 3 kräver färdig rättning[\s\S]*12 p/);
  a.ev("state.json.fullyGraded = true; setStep('report');");
  assert.equal(a.el("#step-report").disabled, false);
  assert.equal(a.el("#step-report-note").textContent, "");
});
test("en äldre datafil i HTML-format går fortfarande att öppna, och visar steg 2 och 3", async () => {
  const a = fresh();
  const page = runHtml(a.ev("FILE"));
  await page.ev("state.embeddedReady");
  assert.equal(page.el("#step-prep").classList.contains("hidden"), true);
  assert.equal(page.el("#stepbar").classList.contains("hidden"), false);
  assert.equal(page.ev("state.step"), "triage");
});
test("adressen följer steget, och de gamla adresserna fungerar", () => {
  const { ev } = fresh();
  assert.equal(ev("stepFromHash('#forbered')"), "prep");
  assert.equal(ev("stepFromHash('#problemfragor')"), "triage");
  assert.equal(ev("stepFromHash('#rapporter')"), "report");
  assert.equal(ev("stepFromHash('#samordnare')"), "prep");
  assert.equal(ev("stepFromHash('#examinator')"), "triage");
  assert.equal(ev("stepFromHash('#annat')"), null);
});
test("filen heter datafil, och texterna säger inte vem som gör vad", () => {
  assert.match(STATIC, /id="prep-save"[^>]*>Spara kombinerad datafil</);
  assert.match(STATIC, /id="databox"[\s\S]*?<label>Kombinerad datafil<\/label>/);
  const visible = STATIC.replace(/<style[\s\S]*?<\/style>/, "");
  assert.ok(!/[Kk]urssamordnar|[Ee]xaminator/.test(visible), "sidans fasta text nämner ingen roll");
  const a = fresh();
  click(a, "#step-prep"); a.ev("prepSynthetic()");
  return Promise.resolve((a.el("#prep-save").listeners.click || [])[0]({})).then(() => {
    assert.throws(() => a.ev("extractEmbedded('<html></html>')"), /inte en datafil/);
    assert.throws(() => a.ev("prepReceipt({jsonObjs:[JSON.parse(extractEmbedded(FILE))], pdfMcqs:null, tagRows:null})"), /redan en datafil/);
    assert.match(SRC, /downloadText\(`datafil_\$\{stamp\(\)\}\.json`/);
    const help = a.ev("HELP_HTML");
    assert.match(help, /De tre stegen/);
    assert.match(help, /I Linköping/);                                 // rollerna nämns bara som exempel
    for (const s of ["#stephint", "#log"]) assert.ok(!/[Kk]urssamordnar|[Ee]xaminator/.test(a.el(s).textContent), s);
  });
});

// ---- vidare från steg 1 utan att spara och välja filen igen (Kajsa 21 nov 2026) ----
test("från steg 1 går man direkt till steg 2 med filerna som redan är valda", async () => {
  const a = fresh();
  a.ev("prepSynthetic()");
  await a.ev("goStep('triage')");
  assert.equal(a.ev("state.prep"), false);
  assert.equal(a.ev("state.step"), "triage");
  assert.equal(a.ev("state.fromPackage"), true);                     // samma minimerade data som i en sparad datafil
  assert.equal(a.el("#results").classList.contains("hidden"), false);
  assert.equal(a.downloads.length, 0);                               // ingenting sparades
  await a.ev("goStep('report')");
  assert.equal(a.ev("state.step"), "report");
});
test("filerna i steg 1 ligger kvar när man går tillbaka, och datafilen går att spara efteråt", async () => {
  const a = fresh();
  a.ev("prepSynthetic()");
  await a.ev("goStep('triage')");
  click(a, "#step-prep");
  await a.ev("refreshPrep()");
  assert.equal(a.el("#prep-save").disabled, false);
  assert.ok(!/redan en datafil/.test(a.el("#prep-receipt").innerHTML));
  a.set("PREPBOX", {}); await a.ev("prepInputs().then(x => { PREPBOX.first = isPackage(x.jsonObjs[0]); PREPBOX.n = x.jsonObjs.length; })");
  assert.deepEqual(a.evj("PREPBOX"), { first: false, n: 1 }, "råfilerna finns kvar");
});
test("väljs nya filer i steg 1 räknas analysen om nästa gång man går vidare", async () => {
  const a = fresh();
  a.ev("prepSynthetic()");
  await a.ev("goStep('triage')");
  const n0 = a.ev("state.json.candCount");
  click(a, "#step-prep");
  a.ev(`(function(){ const d = demoToInspera(DEMO_DATA.DEMO); d.ext_inspera_candidates = d.ext_inspera_candidates.slice(0, 40);
          const text = JSON.stringify(d);
          document.querySelector("#json").listeners.change.forEach(f => f({ target: { files: [{ name: "ny.json", text: async () => text }] } })); })()`);
  await a.ev("goStep('triage')");
  assert.equal(a.ev("state.json.candCount"), 40);
  assert.notEqual(n0, 40);
});
test("utan filer i steg 1 ber steg 2 om datafilen, som förut", async () => {
  const a = fresh();
  await a.ev("goStep('triage')");
  assert.equal(a.ev("state.json || null"), null);
  assert.equal(a.el("#databox").classList.contains("hidden"), false);
});
test("datafilen är en ren datafil som väljs i verktyget: en enda väg in", async () => {
  const a = fresh();
  a.ev("prepSynthetic()");
  await (a.el("#prep-save").listeners.click || [])[0]({});
  const saved = a.downloads[a.downloads.length - 1].parts.join("");
  assert.ok(!/^<!DOCTYPE/i.test(saved));
  assert.equal(a.ev(`isPackage(JSON.parse(${JSON.stringify(saved)}))`), true);
  click(a, "#step-triage");
  await a.ev(`loadDataFile(${JSON.stringify(saved)}, 'datafil.json')`);
  assert.equal(a.ev("state.step"), "triage");
  assert.ok(!/dubbelklick/i.test(STATIC + a.ev("HELP_HTML") + a.el("#log").textContent));
  assert.match(STATIC, /id="databox"[\s\S]*?datafil_….json/);
  assert.match(STATIC, /id="prep-note"[^>]*>[\s\S]*?Gå vidare till steg 2/);
});

test("steg 1 har Spara framhävd och Gå vidare till steg 2 precis intill", async () => {
  assert.match(STATIC, /id="prep-save" class="btn-primary[^>]*>Spara kombinerad datafil<\/button>\s*<button id="prep-next" class="btn-ghost[^>]*>Gå vidare till steg 2</);
  assert.match(STATIC, /id="prep-note"[^>]*>[\s\S]*?inte analyserad än/);
  const a = fresh();
  await a.ev("refreshPrep()");
  assert.equal(a.el("#prep-next").disabled, true);                   // inga filer valda än
  a.ev("prepSynthetic()"); await a.ev("refreshPrep()");
  assert.equal(a.el("#prep-next").disabled, false);
  assert.equal(a.el("#prep-next").classList.contains("hidden"), false);
  await (a.el("#prep-next").listeners.click || [])[0]({});
  assert.equal(a.ev("state.step"), "triage");
  assert.equal(a.downloads.length, 0);
  assert.equal(a.el("#prep-next").classList.contains("hidden"), true);   // knappen hör till steg 1
  assert.match(STATIC, /id="prep-note"[^>]*>[\s\S]*?Gå vidare till steg 2[\s\S]*?ligger kvar/);
});

test("filrutorna i steg 1 är inte numrerade som stegen, och resultatfilen står först", () => {
  const drops = STATIC.slice(STATIC.indexOf('id="drops"'), STATIC.indexOf('class="computebar"'));
  assert.ok(!/<label>\s*[123] ·/.test(drops), "inga egna nummer bredvid stegens 1, 2, 3");
  assert.ok(drops.indexOf('id="d-json"') < drops.indexOf('id="d-pdf"') && drops.indexOf('id="d-pdf"') < drops.indexOf('id="d-tags"'));
  assert.match(drops, /Resultat från Inspera \(JSON\)[\s\S]*?behövs/);
  assert.match(drops, /Tentan \(PDF\)[\s\S]*?valfri/);
  assert.match(drops, /essäfrågornas text/);
});
test("kvittot vid varje filruta säger vad som lästes: studenter och orter, frågor, och vilka filter taggfilen ger", async () => {
  const a = fresh();
  a.ev(`globalThis.B1 = makeDirty(); B1.ext_inspera_assessmentRunTitle = "T5 2026 Jönköping 1";
        globalThis.B2 = makeDirty(); B2.ext_inspera_assessmentRunTitle = "T5 2026 Norrköping 2";`);
  const k = a.evj("prepReceipt({jsonObjs:[B1, B2], pdfMcqs:DEMO_DATA.PDF, tagRows:DEMO_DATA.TAGS})");
  assert.deepEqual(k.orter, ["Jönköping", "Norrköping"]);
  assert.ok(k.tagCols.length > 0);
  a.ev(`state.prepFiles = [B1, B2].map((d, i) => ({ name: "f" + i + ".json", text: async () => JSON.stringify(d) })); state.prepPdf = DEMO_DATA.PDF.slice();`);
  await a.ev("refreshPrep()");
  assert.match(a.el("#got-json").textContent, new RegExp(`2 filer[\\s\\S]*${k.candCount} studenter[\\s\\S]*Jönköping, Norrköping`));
  assert.match(a.el("#got-pdf").textContent, /flervalsfrågor/);
});
test("Gå vidare ligger direkt intill Spara, inte utknuffad till höger", () => {
  assert.match(SRC, /\.computebar \.btn-next\{[^}]*margin-left:0/);
});
