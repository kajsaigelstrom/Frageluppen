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
test("sidan öppnar på steg 1, och steg 2 och 3 är gråa tills filer finns", async () => {
  const a = fresh();
  assert.equal(a.ev("state.prep"), true); assert.equal(on(a, "#step-prep"), true);
  assert.equal(a.el("#step-triage").disabled, true); assert.equal(a.el("#step-report").disabled, true);
  assert.match(a.el("#stephint").textContent, /Steg 2 och 3 tänds när filerna är inlästa/);
  await a.ev("goStep('triage')");                                      // utan filer händer inget
  assert.equal(a.ev("state.prep"), true);
  assert.equal(a.el("#results").classList.contains("hidden"), true);
  a.ev("prepSynthetic()"); await a.ev("refreshPrep()");
  assert.equal(a.el("#step-triage").disabled, false); assert.equal(a.el("#step-report").disabled, false);
});
test("en sparad datafil väljs i steg 1, och sidan står kvar där tills ett steg väljs", async () => {
  const a = fresh();
  await a.ev("loadDataFile(FILE, 'datafil.json', {saved:true, stay:true})");
  assert.equal(a.ev("state.prep"), true);
  assert.equal(a.el("#results").classList.contains("hidden"), true);
  assert.match(a.el("#prep-receipt").innerHTML, /sparad datafil/);
  assert.equal(a.el("#prep-save").disabled, true);                     // den är redan sparad
  assert.equal(a.el("#filesave").classList.contains("hidden"), true);
  assert.match(a.el("#fileline").textContent, /studenter/);
  click(a, "#prep-go3");
  await new Promise(r => setTimeout(r, 0));
  assert.equal(a.ev("state.step"), "report");
});
test("filraden syns i alla steg och säger om datafilen är sparad", async () => {
  const a = fresh();
  a.ev("prepSynthetic()"); await a.ev("refreshPrep()");
  const line = a.el("#fileline").textContent;
  assert.match(line, /studenter · \d+ frågor/);                         // redan i steg 1
  assert.equal(a.el("#filesave").classList.contains("hidden"), false);
  assert.match(STATIC, /id="filesave"[^>]*>Datafilen är inte sparad <button id="fileline-save"[^>]*>Spara</);
  await a.ev("goStep('triage')");
  assert.equal(a.ev("state.step"), "triage");
  assert.ok(a.el("#fileline").textContent.startsWith(line.split(" · ").slice(0, 2).join(" · ")));
  assert.equal(a.el("#filesave").classList.contains("hidden"), false); // följer med till steg 2
  await (a.el("#fileline-save").listeners.click || [])[0]({});
  assert.equal(a.downloads.length, 1);
  assert.equal(a.el("#filesave").classList.contains("hidden"), true);
  click(a, "#step-prep"); await a.ev("refreshPrep()");
  assert.equal(a.el("#filesave").classList.contains("hidden"), true);
});
test("kvittot säger om essäfrågorna är rättade och hur många frågor taggfilen matchade", async () => {
  const a = fresh();
  a.ev("prepSynthetic()"); await a.ev("refreshPrep()");
  const h = a.el("#prep-receipt").innerHTML;
  assert.match(h, /Essäfrågorna är (rättade|inte rättade än)\./);
  assert.ok(!/Taggfilen matchade/.test(h));                            // ingen taggfil vald: ingen rad
  a.ev(`globalThis.F = prepAnalysis({jsonObjs:[demoToInspera(DEMO_DATA.DEMO)], pdfMcqs:DEMO_DATA.PDF, tagRows:DEMO_DATA.TAGS});`);
  const f = a.evj("F");
  assert.ok(f.tagHit > 0 && f.tagHit <= f.total);
  assert.match(a.ev("receiptFacts(F)"), new RegExp(`Taggfilen matchade ${f.tagHit} av ${f.total} frågor\\.`));
  assert.match(a.ev("receiptFacts(Object.assign({}, F, {fullyGraded:false}))"), /Essäfrågorna är inte rättade än\./);
  assert.match(a.ev("receiptFacts(Object.assign({}, F, {tagHit:3}))"), /class="warn">Taggfilen matchade 3 av/);
});
test("verktyget frågar innan kommentarer och egna exkluderingar försvinner", async () => {
  const a = fresh();
  await a.ev("loadDataFile(FILE, 'f.json', {saved:true})");
  assert.equal(a.ev("hasWork()"), false);
  a.ev("globalThis.ASKED = 0; globalThis.confirm = () => { ASKED++; return false; };");
  await a.ev("loadDataFile(FILE, 'f.json', {saved:true})");
  assert.equal(a.ev("ASKED"), 0);                                      // inget att förlora: ingen fråga
  a.ev("state.comments.set('1', 'Oklar stam'); state.excluded.set('2', 'Fel i facit');");
  assert.equal(a.ev("hasWork()"), true);
  assert.equal(await a.ev("loadDataFile(FILE, 'f.json', {saved:true})"), false);
  assert.equal(a.ev("ASKED"), 1);
  assert.equal(a.ev("state.comments.get('1')"), "Oklar stam");          // nej: allt står kvar
  a.ev("state.comments.clear(); state.excluded.clear(); state.excluded.set('3', INSPERA_REASON);");
  assert.equal(a.ev("hasWork()"), false);                               // exkluderingar ur Inspera följer med filen
  assert.match(SRC, /addEventListener\("beforeunload"/);
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
    assert.ok(!/[Kk]urssamordnar|[Ee]xaminator|Linköping/.test(help));  // hjälpen nämner ingen roll (Kajsa 23 nov 2026)
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
test("utan filer går det inte att gå till steg 2: datafilen väljs i steg 1", async () => {
  const a = fresh();
  await a.ev("goStep('triage')");
  assert.equal(a.ev("state.json || null"), null);
  assert.equal(a.ev("state.prep"), true);
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
  assert.match(STATIC, /id="prep-note"[^>]*>[\s\S]*?gå direkt till steg 2 eller 3/);
});

test("steg 1 har Spara framhävd och stegens egna namn som val precis intill", async () => {
  assert.match(STATIC, /id="prep-save" class="btn-primary[^>]*>Spara kombinerad datafil<\/button>\s*<button id="prep-go2" class="btn-ghost[^>]*>.*?2.*?Hitta problemfrågor<\/button>\s*<button id="prep-go3" class="btn-ghost[^>]*>.*?3.*?Skapa rapporter</);
  assert.ok(!STATIC.includes('id="prep-next"') && !STATIC.includes("Gå vidare till steg 2"));
  assert.equal((STATIC.slice(STATIC.indexOf('id="prep-note"')).split("</ul>")[0].match(/<li>/g) || []).length, 3);   // tre korta punkter
  const a = fresh();
  await a.ev("refreshPrep()");
  assert.equal(a.el("#prep-go2").disabled, true);                    // inga filer valda än
  a.ev("prepSynthetic()"); await a.ev("refreshPrep()");
  assert.equal(a.el("#prep-go2").disabled, false);
  assert.equal(a.el("#prep-go2").classList.contains("hidden"), false);
  await (a.el("#prep-go2").listeners.click || [])[0]({});
  await new Promise(r => setTimeout(r, 0));
  assert.equal(a.ev("state.step"), "triage");
  assert.equal(a.downloads.length, 0);
  assert.equal(a.el("#prep-go2").classList.contains("hidden"), true);    // valen hör till steg 1
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

// ---- exporterna (Kajsa 21 nov 2026): knapparna säger formatet, PDF går till utskrift, och antalet står vid filter ----
test("exportknapparna säger formatet", () => {
  for (const [id, label] of [["exp-problems", "Problemfrågor (PDF)"], ["exp-html", "Temarapport (interaktiv)"], ["exp-temapdf", "Temarapport (PDF)"],
                             ["exp-overview", "Översiktstabell (PDF)"], ["exp-xlsx", "Tentamensstatistik (Excel)"], ["exp-charts", "Diagram (PDF)"]])
    assert.ok(STATIC.includes(`id="${id}"`) && new RegExp(`id="${id}"[^>]*>${label.replace(/[()]/g, "\\$&")}<`).test(STATIC), label);
});
test("exporterna som heter PDF öppnas för utskrift, och sparas som fil bara när fönstret inte går att öppna", async () => {
  const a = fresh();
  await a.ev("loadDataFile(FILE, 'f.json', {saved:true})"); a.ev("setStep('report')");
  a.ev(`globalThis.OPENED = []; window.open = () => { const w = { html:"", printed:0, document:{ open(){}, write(h){ w.html += h; }, close(){} }, focus(){}, print(){ w.printed++; } }; OPENED.push(w); return w; };`);
  click(a, "#exp-overview"); click(a, "#exp-charts");
  await new Promise(r => setTimeout(r, 450));
  assert.equal(a.downloads.length, 0);
  assert.equal(a.ev("OPENED.length"), 2);
  assert.match(a.ev("OPENED[0].html"), /<h1>Översiktstabell<\/h1>/);
  assert.ok(!/<script/i.test(a.ev("OPENED[0].html")));                 // sidan själv har inget skript
  assert.equal(a.ev("OPENED[0].printed"), 1);
  a.ev("window.open = () => null");
  click(a, "#exp-overview");
  assert.equal(a.downloads.length, 1);
});
test("med ett filter valt står antalet frågor på de exportknappar som följer filtret", async () => {
  const a = fresh();
  await a.ev("loadDataFile(FILE, 'f.json', {saved:true})"); a.ev("setStep('report')");
  assert.equal(a.el("#exp-html").textContent, "Temarapport (interaktiv)");
  a.ev("toggleFacet('typ','single')");
  const n = a.ev("pageItems().length"), all = a.ev("state.vm.view.length + state.scored.length");
  assert.ok(n < all);
  assert.equal(a.el("#exp-html").textContent, `Temarapport (interaktiv) · ${n} av ${all} frågor`);
  assert.equal(a.el("#exp-overview").textContent, `Översiktstabell (PDF) · ${n} av ${all} frågor`);
  assert.ok(!/exp-xlsx|exp-charts|exp-problems/.test(a.ev("renderExportLabels.toString()")));      // de följer inte filtret
  a.ev("clearFilters()");
  assert.equal(a.el("#exp-html").textContent, "Temarapport (interaktiv)");
});
test("temarapporten har alltid knappen Spara sidan med kommentarer, och hjälpen öppnar på aktuellt steg", async () => {
  const a = fresh();
  await a.ev("loadDataFile(FILE, 'f.json', {saved:true})"); a.ev("setStep('report')");
  const html = a.ev("buildTemaReport(temaEmbed())");
  assert.match(html, /id="dlsave"[^>]*>Spara sidan med kommentarer</);
  const page = runHtml(html);
  page.ev("state.comments.set(String(EMBED.views[0].view[0].seq), 'Min kommentar')");
  (page.el("#dlsave").listeners.click || []).forEach(f => f({}));
  assert.match(page.downloads[page.downloads.length - 1].parts.join(""), /Min kommentar/);
  const help = a.ev("HELP_HTML");
  assert.match(help, /data-step="prep"><summary>Steg 1: Förbered filer/);
  assert.match(help, /data-step="triage"><summary>Steg 2: Hitta problemfrågor/);
  assert.match(help, /data-step="report"><summary>Steg 3: Skapa rapporter/);
  assert.match(help, /G-gräns\.[\s\S]*Kontrollen mot Inspera\./);
  assert.match(help, /Med observationer<\/b> och <b>Bara mätvärden/);
});
test("sidans fasta delar är rätt nästlade: resultaten ligger inte inne i filpanelen", () => {
  const body = STATIC.slice(STATIC.indexOf("<body>"));
  assert.equal((body.match(/<div\b/g) || []).length, (body.match(/<\/div>/g) || []).length);
  const panel = body.slice(body.indexOf('<div class="panel" id="uploadpanel">'), body.indexOf('<div id="warnings">'));
  assert.equal((panel.match(/<div\b/g) || []).length, (panel.match(/<\/div>/g) || []).length);
});
