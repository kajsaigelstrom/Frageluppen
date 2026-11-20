// Mönstersammanfattningen i temarapporten: enkla regler (mycket lätt, alternativ som nästan ingen valde,
// återkommande formfynd) står en gång överst i stället för på varje kort.
import test from "node:test"; import assert from "node:assert/strict";
import { loadApp, runHtml } from "./harness.mjs";
import { setupDemoView } from "./fixtures.mjs";
const LONG = "Hämning av enzymet som bryter ned signalsubstansen i synapsklyftan, vilket förlänger effekten avsevärt";
const fresh = () => { const a = loadApp(); setupDemoView(a.ev);
  a.ev(`state.mode = "ask";
    globalThis.mk = function(over){
      const v = Object.assign({ seq:"901", code:"901", title:"901", n:100, sig:0.2, rpb:0.3, correctIdx:0,
        stem:"En 45-årig kvinna söker för trötthet sedan tre månader. Vilken är den mest sannolika orsaken?",
        opts:["Järnbrist","Hypotyreos","Depression","Sömnapné"], counts:[70,10,10,10], optPbis:[0.3,-0.1,-0.1,-0.1],
        bestDistIdx:-1, bestDistPbis:null, topDist:10, slotAmbiguous:false, orphanSlots:[], unmatched:0, tags:[], tagVals:[] }, over||{});
      v.ncorr = v.counts[v.correctIdx]; v.pcorr = v.ncorr / v.n * 100; return v; };
    globalThis.LONGOPTS = [${JSON.stringify(LONG)},"Hypotyreos","Depression","Sömnapné"];
    globalThis.V3 = [ mk({seq:"1", counts:[95,2,2,1], rpb:0.05, opts:LONGOPTS}),
                      mk({seq:"2", counts:[92,3,3,2], rpb:0.05, opts:LONGOPTS}),
                      mk({seq:"3", counts:[65,15,10,10], rpb:0.35}) ];
    globalThis.row = (view, key) => patternSummary(view).find(r => r.key === key) || null;`); return a; };

test("korten får bara frågor som är specifika för just den frågan", () => {
  const { evj } = fresh();
  assert.deepEqual(evj("ASK_SUMMARY"), ["latt", "ledtrad", "distraktor"]);
  assert.deepEqual(evj("cardQuestions(mk({n:80, counts:[76,2,1,1], rpb:0.05})).map(q => q.key)"), []);
  assert.deepEqual(evj("cardQuestions(mk({rpb:-0.4, counts:[50,20,15,15]})).map(q => q.key)"), ["facit"]);
  assert.deepEqual(evj("cardQuestions(mk({rpb:0.05, counts:[28,25,24,23]})).map(q => q.key)"), ["tydlig"]);
});
test("en mycket lätt fråga har ingen ruta på kortet men behåller märkningen", () => {
  const { ev } = fresh();
  const html = ev("card(mk({n:80, counts:[76,2,1,1], rpb:0.05}))");
  assert.ok(!html.includes("Att fråga sig") && !html.includes("askbox"));
  assert.ok(html.includes("badge easy"));
});
test("mycket lätta frågor sammanfattas en gång, med nivåfrågan", () => {
  const { ev, evj } = fresh();
  const r = evj("row(V3, 'latt')");
  assert.equal(r.head, "2 av 3 frågor klarades av minst 90 %.");
  assert.deepEqual(r.seqs, ["1", "2"]);
  assert.equal(r.ask, "Är det väntat för de här målen, eller prövar frågorna något enklare än ni avsåg?");
  ev("setThreshold('easy', 96)");
  assert.equal(evj("row(V3, 'latt')"), null);
});
test("alternativ som nästan ingen valde sammanfattas en gång", () => {
  const { evj } = fresh();
  const r = evj("row([mk({seq:'1', counts:[70,20,9,1]}), mk({seq:'2'}), mk({seq:'3'})], 'distraktor')");
  assert.equal(r.head, "I 1 av 3 frågor valdes minst ett alternativ av färre än 5 %.");
  assert.deepEqual(r.seqs, ["1"]);
  assert.equal(r.ask, "Var alternativen rimliga svar för en student som inte kan området?");
});
test("återkommande formfynd sammanfattas per regel, med lathundens råd", () => {
  const { evj } = fresh();
  const r = evj("row(V3, 'form:langst')");
  assert.equal(r.head, "I 2 av 3 frågor: Rätt svar sticker ut.");
  assert.deepEqual(r.seqs, ["1", "2"]);
  assert.ok(r.form.text.length > 20 && r.form.ref.includes("NBME"));
  assert.equal(r.minor, false);
  const minor = evj("patternSummary(V3).filter(r => r.minor).map(r => r.key)");
  assert.ok(minor.every(k => k.startsWith("form:")));
  assert.ok(evj("patternSummary(V3).filter(r => r.minor)").every(r => evj(`FORM_REGLER[${JSON.stringify(r.key.slice(5))}].prio`) === "tips"));
});
test("exkluderade frågor och för små underlag räknas inte", () => {
  const { ev, evj } = fresh();
  ev("state.excluded.set('1', 'Tekniskt fel')");
  assert.equal(evj("row(V3, 'latt')").head, "1 av 2 frågor klarades av minst 90 %.");
  assert.equal(evj("row(V3, 'form:langst')").head, "I 1 av 2 frågor: Rätt svar sticker ut.");
  assert.equal(evj("row([mk({seq:'9', n:5, counts:[5,0,0,0], rpb:null})], 'latt')"), null);
});
test("inga mönster ger en tom sammanfattning", () => {
  const { evj } = fresh();
  assert.deepEqual(evj("patternSummary([mk({seq:'3', counts:[65,15,10,10], rpb:0.35})]).filter(r => !r.minor)"), []);
  assert.deepEqual(evj("patternSummary([])"), []);
});
test("rapporten visar sammanfattningen och kan filtrera korten på ett mönster", () => {
  const { ev } = fresh();
  const page = runHtml(ev("buildTemaReport(temaEmbed())"));
  const p = page.el("#patterns").innerHTML;
  assert.ok(p.includes("Mönster i de här frågorna"));
  assert.match(p, /\d+ av 47 frågor klarades av minst 90 %\./);
  assert.ok(p.includes("Visa frågorna"));
  const nEasy = page.ev("EMBED.views[0].view.filter(v => v.pcorr >= 90).length");
  page.ev("togglePattern('latt')");
  assert.equal((page.el("#cards").innerHTML.match(/class="q /g) || []).length, nEasy);
  assert.equal(page.ev("selVisible().length"), nEasy);                      // "Markera alla visade" väljer just de frågorna
  assert.ok(page.el("#patterns").innerHTML.includes("Visa alla"));
  page.ev("togglePattern('latt')");
  assert.equal((page.el("#cards").innerHTML.match(/class="q /g) || []).length, 47);
});
test("sammanfattningen följer temafiltret", () => {
  const { ev } = fresh();
  const page = runHtml(ev("buildTemaReport(temaEmbed())"));
  const tag = page.ev("EMBED.views[0].view[0].tagVals[0]"), col = page.ev("state.tags.tagCols[0].name");
  const n = page.ev(`EMBED.views[0].view.filter(v => v.tagVals[0] === ${JSON.stringify(tag)}).length`);
  page.ev(`togglePattern('latt'); state.activeTags[${JSON.stringify(col)}] = new Set([${JSON.stringify(tag)}]); applyFilters();`);
  assert.match(page.el("#patterns").innerHTML, new RegExp(` av ${n} frågor`));
  assert.ok(!page.el("#patterns").innerHTML.includes(" av 47 frågor"));
  assert.ok(page.ev("selVisible().length") <= n);
  page.ev("clearFilters()");
  assert.equal(page.ev("state.patternKey || null"), null);                  // Rensa filter tar även bort mönsterfiltret
});
test("Totalrapporten har ingen mönstersammanfattning, urvalssidan har sin egen", () => {
  const { ev } = fresh();
  const page = runHtml(ev("buildTemaReport(temaEmbed())"));
  page.ev("state.viewIdx = 1; xExportTabs(); xExportRender();");
  assert.equal(page.el("#patterns").innerHTML, "");
  const easy = page.evj("EMBED.views[0].view.filter(v => v.pcorr >= 90).slice(0,2).map(v => String(v.seq))");
  const other = page.ev("String(EMBED.views[0].view.find(v => v.pcorr < 90).seq)");
  const child = runHtml(page.ev(`buildTemaReport(subsetEmbed(EMBED, ${JSON.stringify(easy.concat(other))}, state.th))`));
  assert.ok(child.el("#patterns").innerHTML.includes("2 av 3 frågor klarades av minst 90 %."));
});
test("formfynden står med det vanligaste först", () => {
  const { evj } = fresh();
  const view = `[ mk({seq:"1", stem:"Vilket av följande är inte korrekt?", opts:LONGOPTS}),
                  mk({seq:"2", stem:"Vilket av följande är inte korrekt?"}),
                  mk({seq:"3", stem:"Vilket av följande är inte korrekt?"}) ]`;
  const main = evj(`patternSummary(${view}).filter(r => r.key.startsWith("form:") && !r.minor).map(r => r.seqs.length)`);
  assert.ok(main.length >= 2);
  assert.deepEqual(main, [...main].sort((a, b) => b - a));
});
