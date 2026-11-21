// Temarapporten efter genomgången 21 nov 2026 (Kajsa): ingen förebildslista, kommentarer som vem som helst med
// rapporten kan skriva och få med i PDF:en, urvalet överst, en tabell, förklaringen som utfällning i stället för
// ett läge, och en rapport som följer examinatorns filter och kan skapas interaktiv eller som PDF.
import test from "node:test"; import assert from "node:assert/strict"; import fs from "node:fs";
import { loadApp, runHtml, INDEX } from "./harness.mjs";
import { setupDemoView } from "./fixtures.mjs";
const SRC = fs.readFileSync(INDEX, "utf8"), STATIC = SRC.split("<script>")[0];
const tema = () => { const a = loadApp(); setupDemoView(a.ev); const html = a.ev("buildTemaReport(temaEmbed())"); return { ...a, html, page: runHtml(html) }; };
const app = () => { const a = loadApp(); a.ev("setPrep(false); loadSynthetic(); collapseUpload(); setStep('report');"); return a; };
const staticOf = html => html.split("<script>")[0];

test("ingen förebildslista ovanför korten; förebilderna finns i filtret och på kortet", () => {
  const { html, page } = tema();
  assert.ok(!staticOf(html).includes('id="goodlist"'));
  assert.ok(!SRC.includes("buildGoodList") && !SRC.includes('id="goodlist"'));
  assert.match(page.el("#tagbar").innerHTML, /Förebild/);
  assert.match(page.el("#cards").innerHTML, /Fungerar som förebild/);
});
test("inga lägen i temarapporten: förklaringen av måttet är en utfällning på kortet", () => {
  const { ev, html, page } = tema();
  assert.equal(ev("temaEmbed().views[0].modes.length"), 1);
  assert.equal(page.el("#modeseg").innerHTML, "");
  assert.ok(!SRC.includes("ask-explain") && !SRC.includes("Med förklaringar"));
  const cards = page.el("#cards").innerHTML;
  assert.match(cards, /<details class="askmore"[^>]*data-k="[^"]+"[^>]*><summary>Mer om måttet<\/summary>/);
  assert.ok(!/<details class="askmore"[^>]* open/.test(cards));
  // en öppnad utfällning står kvar öppen när korten ritas om, och följer därmed med i utskriften
  const k = cards.match(/<details class="askmore"[^>]*data-k="([^"]+)"/)[1];
  page.ev(`state.open.add(${JSON.stringify(k)}); drawCards();`);
  assert.match(page.el("#cards").innerHTML, new RegExp(`data-k="${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}" open`));
});
test("kommentarer kan skrivas i temarapporten, utan att det står vem som skrev", () => {
  const a = app();
  const seq = a.ev("String(state.vm.view[0].seq)");
  a.ev(`state.comments.set('${seq}', 'Från examinatorn.'); render();`);
  const page = runHtml(a.ev("buildTemaReport(temaEmbed())"));
  const part = () => page.el("#cards").innerHTML.split(`id="card-${seq}"`)[1].split('class="q ')[0];
  assert.ok(!/Kommentar från/.test(page.el("#cards").innerHTML));
  assert.match(part(), /<textarea class="card-cmt"[^>]*>Från examinatorn\.<\/textarea>/);
  assert.match(part(), /<div class="cmtprint">Från examinatorn\.<\/div>/);     // det som skrivs ut
  const other = page.ev("String(EMBED.views[0].view[1].seq)");
  assert.match(page.el("#cards").innerHTML.split(`id="card-${other}"`)[1].split('class="q ')[0], /class="card-comment[^>]*>Lägg till kommentar</);
  page.ev(`state.comments.set('${other}', 'Temagruppens fråga till författaren.')`);
  const sub = page.evj(`temaSource().comments`);
  assert.deepEqual(sub.map(c => c[0]).sort(), [seq, other].sort());             // en sparad sida får med de nya kommentarerna
  const child = runHtml(page.ev(`buildTemaReport(subsetEmbed(temaSource(), [${JSON.stringify(other)}], state.th))`));
  assert.match(child.el("#cards").innerHTML, /Temagruppens fråga till författaren\./);
  assert.match(SRC, /@media print\{[^}]*\.card-cmt[\s\S]*?\.cmtprint/);
});
test("urvalet och de två exporterna står på raden överst; Excel och CSV är borta", () => {
  const { html } = tema();
  const st = staticOf(html), head = st.slice(st.indexOf('class="viewhead"'), st.indexOf('id="controlband"'));
  for (const id of ["sel-all", "sel-save", "dlprint", "dloverview"]) assert.ok(head.includes(`id="${id}"`), id);
  for (const gone of ['id="dlxlsx"', 'id="dlcsv"']) assert.ok(!st.includes(gone), gone);
  for (const gone of ["xExportCSV", "xExportXLSX", "xLoadXLSX", "xExportRows"]) assert.ok(!SRC.includes(gone), gone);
});
test("temarapporten följer examinatorns filter och säger vilket", () => {
  const a = app();
  const col = a.ev("state.tags.tagCols[0].name"), tag = a.ev("state.vm.view[0].tagVals[0]");
  a.ev(`toggleTag(${JSON.stringify(col)}, ${JSON.stringify(tag)})`);
  const n = a.ev("pageItems().length");
  assert.ok(n > 0 && n < a.ev("state.json.qMeta.length"));
  (a.el("#exp-html").listeners.click || []).forEach(f => f({}));
  const page = runHtml(a.downloads[a.downloads.length - 1].parts.join(""));
  assert.equal(page.ev("EMBED.views[0].view.length + EMBED.views[0].scored.length"), n);
  assert.match(page.el("#subsetline").innerHTML, new RegExp(`Urval: ${n} av \\d+ frågor`));
  assert.ok(page.el("#subsetline").innerHTML.includes(tag));
  a.ev("clearFilters()");
  (a.el("#exp-html").listeners.click || []).forEach(f => f({}));
  assert.equal(runHtml(a.downloads[a.downloads.length - 1].parts.join("")).el("#subsetline").innerHTML, "");
});
test("temarapporten kan också skapas som PDF: samma rapport, öppnad för utskrift", () => {
  assert.match(STATIC, /id="exp-temapdf"[^>]*>Temarapport \(PDF\)</);
  const a = app();
  let doc = ""; a.set("fakeOpen", () => ({ document: { open() {}, write(h) { doc = h; }, close() {} } }));
  a.ev("window.open = fakeOpen;");
  (a.el("#exp-temapdf").listeners.click || []).forEach(f => f({}));
  assert.match(doc, /<title>Temarapport<\/title>/);
  assert.equal(runHtml(doc).ev("EMBED.autoPrint"), true);
  assert.equal(a.ev("temaEmbed().autoPrint || false"), false);
  a.ev("setStep('choose'); setStep('triage');");
  assert.equal(a.el("#exp-temapdf").classList.contains("hidden"), true);
});
