// Tillgänglighet och städning (Kajsas beslut 21 nov 2026, B8 och C3–C5).
import test from "node:test"; import assert from "node:assert/strict"; import fs from "node:fs";
import { loadApp, runHtml, INDEX } from "./harness.mjs";
const SRC = fs.readFileSync(INDEX, "utf8"), CSS = SRC.slice(SRC.indexOf("<style>"), SRC.indexOf("</style>"));
const lum = h => { const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(1 + i, 3 + i), 16) / 255).map(c => c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const cssVar = n => (CSS.match(new RegExp(`--${n}:(#[0-9a-f]{6})`)) || [])[1];
const hex = v => v.startsWith("var(") ? cssVar(v.slice(6, -1)) : v;

test("etiketterna för diskriminering och svårighet har kontrast minst 4,5", () => {
  for (const cls of ["rpb-good", "rpb-mid", "rpb-bad", "rpb-na", "rpb-lowconf", "badge.hard", "badge.bad", "badge.easy"]) {
    const m = CSS.match(new RegExp(`\\.${cls.replace(".", "\\.")}\\{background:([^;]+);color:([^;}]+)`));
    assert.ok(m, cls);
    assert.ok(contrast(hex(m[2]), hex(m[1])) >= 4.5, `${cls}: ${contrast(hex(m[2]), hex(m[1])).toFixed(2)}`);
  }
  assert.ok(contrast(cssVar("trap-ink"), cssVar("card")) >= 4.5);
});
test("filterknapparna är riktiga knappar med aria-pressed, och har synlig fokusmarkering", () => {
  const a = loadApp(); a.ev("setPrep(false); loadSynthetic(); setStep('report');");
  const h = a.el("#tagbar").innerHTML;
  assert.match(h, /<button type="button" class="chip [^>]*aria-pressed="false"/);
  assert.ok(!/<span class="(chip|fchip)/.test(h));
  a.ev("toggleFacet('typ','single')");
  const h2 = a.el("#tagbar").innerHTML;
  assert.match(h2, /<button type="button" class="chip on[^>]*aria-pressed="true"[^>]*data-facet="typ"/);
  assert.match(h2, /<button type="button" class="fchip" aria-label="Ta bort filtret MCQ"/);
  assert.match(CSS, /\.chip:focus-visible[^{]*\{outline:2px solid/);
});
test("stapeln har inga värdeord: bara RÄTT och vanligare än rätt svar", () => {
  assert.ok(!/content:"(effektiv|mindre effektiv|ineffektiv)"/.test(CSS));
  assert.match(CSS, /content:"vanligare än rätt svar"/);
});
test("i diagrammet är G en fylld punkt och U en ofylld ring", () => {
  const a = loadApp(); a.ev("setPrep(false); loadSynthetic(); setStep('report');");
  const svg = a.ev("statsChartsHtml(statsData())");
  const d = a.evj("statsData().students.map(s => s.g)");
  assert.equal((svg.match(/<circle[^>]*fill="#3f7a63"/g) || []).length, d.filter(Boolean).length);
  assert.equal((svg.match(/<circle[^>]*fill="#fff" stroke="#b3261e"/g) || []).length, d.filter(g => !g).length);
});
test("spärren för orättad tenta är borta: steg 3 visar steg 2 när rättningen inte är klar", () => {
  assert.ok(!/showGate|viewstub|stubmode/.test(SRC));
  const a = loadApp(); a.ev("setPrep(false); loadSynthetic(); setStep('report');");
  a.ev("state.json.fullyGraded = false; state.json.ungradedPts = 4; state.view = 'final'; render();");
  assert.equal(a.ev("state.step"), "triage"); assert.equal(a.ev("state.view"), "pre-mcq");
});
test("kontrollraden och kommentarslyssnarna finns en gång och delas med temarapporten", () => {
  assert.equal((SRC.match(/<option value="trap-desc">/g) || []).length, 1);
  assert.equal((SRC.match(/class="legend"/g) || []).length, 1);
  assert.equal((SRC.match(/closest\("\.card-cmt"\)/g) || []).length, 1);
  const a = loadApp(); a.ev("setPrep(false); loadSynthetic(); setStep('report');");
  assert.match(a.el("#controlhost").innerHTML, /id="search"[\s\S]*id="sort"[\s\S]*id="tagbar"[\s\S]*id="patterns"[\s\S]*class="legend"/);
  assert.ok(!a.el("#controlhost").innerHTML.includes('id="relbox"'));
  const html = a.ev("buildTemaReport(temaEmbed())");
  assert.match(html, /id="search"[\s\S]*id="relbox"[\s\S]*id="patterns"[\s\S]*class="legend"[\s\S]*id="cards"/);
  const page = runHtml(html);
  assert.ok((page.el("#cards").listeners.input || []).length >= 1);
});
