// Formkontrollen ur MCQ-lathunden i temarapporten: fynd som förklaring, förebilder och kopiera frågan.
import test from "node:test"; import assert from "node:assert/strict"; import fs from "node:fs";
import { loadApp, runHtml, INDEX } from "./harness.mjs";
import { setupDemoView } from "./fixtures.mjs";
import { build, apply } from "./sync-lathund.mjs";
const LONG = "Hämning av enzymet som bryter ned signalsubstansen i synapsklyftan, vilket förlänger effekten avsevärt";
const fresh = () => { const a = loadApp(); setupDemoView(a.ev);
  a.ev(`state.mode = "ask";
    globalThis.mk = function(over){
      const v = Object.assign({ seq:"901", code:"901", title:"901", n:100, sig:0.2, rpb:0.3, correctIdx:0,
        stem:"En 45-årig kvinna söker för trötthet sedan tre månader. Vilken är den mest sannolika orsaken?",
        opts:["Järnbrist","Hypotyreos","Depression","Sömnapné"], counts:[70,10,10,10], optPbis:[0.3,-0.1,-0.1,-0.1],
        bestDistIdx:-1, bestDistPbis:null, topDist:10, slotAmbiguous:false, orphanSlots:[], unmatched:0, tags:[], tagVals:[] }, over||{});
      v.ncorr = v.counts[v.correctIdx]; v.pcorr = v.ncorr / v.n * 100; return v; };
    globalThis.rules = v => formFindings(v).map(f => f.regel);`); return a; };

test("frågetexten delas i vinjett och stam vid sista meningen", () => {
  const { evj } = fresh();
  assert.deepEqual(evj(`splitStem("En kvinna söker för trötthet. Hon har inte feber. Vilken är den mest sannolika orsaken?")`),
    { vinjett: "En kvinna söker för trötthet. Hon har inte feber.", stam: "Vilken är den mest sannolika orsaken?" });
  assert.deepEqual(evj(`splitStem("Vilken struktur är skadad?")`), { vinjett: "", stam: "Vilken struktur är skadad?" });
  assert.deepEqual(evj(`splitStem("")`), { vinjett: "", stam: "" });
  assert.deepEqual(evj(`splitStem("Patienten har feber. Den mest sannolika diagnosen är:")`),
    { vinjett: "Patienten har feber.", stam: "Den mest sannolika diagnosen är:" });
});
test("formkontrollen hittar ett rätt svar som sticker ut, med lathundens rubrik och råd", () => {
  const { ev, evj } = fresh();
  const f = evj(`formFindings(mk({opts:[${JSON.stringify(LONG)},"Hypotyreos","Depression","Sömnapné"]}))`);
  const langst = f.find(x => x.regel === "langst");
  assert.ok(langst, JSON.stringify(f.map(x => x.regel)));
  assert.equal(langst.rubrik, "Rätt svar sticker ut.");
  assert.match(langst.fynd, /tecken/);
  assert.ok(langst.text.length > 20 && langst.varfor.length > 20 && langst.ref.includes("NBME"));
});
test("en ren fråga ger inga fynd som räknas", () => {
  const { evj } = fresh();
  assert.deepEqual(evj("rules(mk()).filter(r => FORM_REGLER[r].prio !== 'tips')"), []);
});
test("utan frågetext eller facit körs ingen kontroll", () => {
  const { evj } = fresh();
  assert.deepEqual(evj("rules(mk({stem:''}))"), []);
  assert.deepEqual(evj("rules(mk({correctIdx:-1, counts:[70,10,10,10]}))".replace("correctIdx:-1", "correctIdx:0, opts:['Järnbrist']")), []);
});
test("formfyndet visas som förklaring under en fråga på kortet", () => {
  const { ev } = fresh();
  // nära gissningsnivå utan diskriminering + negation i stammen: frågan om tydlighet får fyndet som förklaring
  const html = ev(`card(mk({rpb:0.05, counts:[28,25,24,23], stem:"Vilket av följande är inte ett symtom vid anemi?"}))`);
  assert.ok(html.includes("Att fråga sig"));
  assert.ok(html.includes('class="askform"'));
  assert.ok(html.split('class="askform"')[1].split("</details>")[0].includes("Ur MCQ-lathunden"));
});
test("formfynd utan statistiskt mönster visas inte på kortet, bara i den hopfällda formkontrollen", () => {
  const { ev } = fresh();
  const html = ev(`card(mk({n:90, counts:[60,12,10,8], rpb:0.35, opts:[${JSON.stringify(LONG)},"Hypotyreos","Depression","Sömnapné"]}))`);
  assert.ok(!html.includes('class="askform"'));
  assert.ok(!html.includes("Att fråga sig"));
  assert.match(html, /<details class="formall">/);
  assert.ok(html.split('<details class="formall">')[1].includes("Rätt svar sticker ut."));
});
test("ett fynd visas bara under en fråga det kan förklara", () => {
  const { evj } = fresh();
  // negation i stammen förklarar otydlighet, inte en mycket lätt fråga
  const STEM = "Vilket av följande är inte ett symtom vid anemi?";
  const easy = `mk({n:80, counts:[76,2,1,1], rpb:0.05, stem:${JSON.stringify(STEM)}})`;
  assert.ok(evj(`rules(${easy})`).includes("negstam"));
  assert.deepEqual(evj(`askQuestions(${easy}).map(q => q.key)`), ["latt"]);
  assert.deepEqual(evj(`formFor(${easy}, askQuestions(${easy}))`), {});
  const hard = `mk({rpb:0.05, counts:[28,25,24,23], stem:${JSON.stringify(STEM)}})`;
  const shown = evj(`formFor(${hard}, askQuestions(${hard}))`);
  assert.deepEqual(Object.keys(shown), ["tydlig"]);
  assert.ok(shown.tydlig.some(f => f.regel === "negstam"));
});
test("högst tre formfynd per kort", () => {
  const { evj } = fresh();
  const many = `mk({n:80, counts:[76,2,1,1], rpb:0.05, stem:"En patient har hjärtsvikt. Vilken behandling är bäst?",
    opts:["Både behandling av hjärtsvikt och samtidigt alltid noggrann uppföljning av patienten; dessutom kontroll","Aldrig a","Endast b","Inga c"]})`;
  assert.ok(evj(`rules(${many})`).length > 3);
  assert.ok(evj(`Object.values(formFor(${many}, askQuestions(${many}))).flat().length`) <= 3);
});
test("förebild: lagom svår, skiljer väl, utan formfynd och utan frågor", () => {
  const { ev } = fresh();
  assert.equal(ev("isForebild(mk({n:90, counts:[65,9,8,8], rpb:0.35}))"), true);
  assert.equal(ev(`isForebild(mk({n:90, counts:[65,9,8,8], rpb:0.35, opts:[${JSON.stringify(LONG)},"Hypotyreos","Depression","Sömnapné"]}))`), false);
  assert.equal(ev("isForebild(mk({n:90, counts:[81,3,3,3], rpb:0.35}))"), false);     // 90 % rätt, för lätt
  assert.equal(ev("isForebild(mk({n:90, counts:[40,20,15,15], rpb:0.35}))"), false);  // 44 % rätt, för svår
  assert.equal(ev("isForebild(mk({n:90, counts:[65,9,8,8], rpb:0.15}))"), false);     // skiljer för svagt
  assert.equal(ev("isForebild(mk({n:25, counts:[18,3,2,2], rpb:0.35}))"), false);     // för litet underlag
  assert.equal(ev("isForebild(mk({n:90, counts:[65,9,8,8], rpb:0.35, stem:''}))"), false);   // ingen text att kontrollera
  const html = ev("card(mk({n:90, counts:[65,9,8,8], rpb:0.35}))");
  assert.ok(html.includes("Fungerar som förebild"));
});
test("frågan kan kopieras i lathundens fältordning", () => {
  const { ev } = fresh();
  const t = ev("questionAsText(mk())");
  assert.equal(t, "Vinjett:\nEn 45-årig kvinna söker för trötthet sedan tre månader.\n\nStam:\nVilken är den mest sannolika orsaken?\n\nRätt svar:\nJärnbrist\n\nDistraktorer:\nHypotyreos\nDepression\nSömnapné");
});
test("appens egna kort påverkas inte", () => {
  const { ev } = fresh();
  ev("state.mode = 'edu'");
  const html = ev(`card(mk({n:80, counts:[76,2,1,1], rpb:0.05, opts:[${JSON.stringify(LONG)},"Hypotyreos","Depression","Sömnapné"]}))`);
  assert.ok(!html.includes("askform") && !html.includes("formall") && !html.includes("förebild"));
});
test("den exporterade rapporten och en urvalssida har formkontrollen med sig", () => {
  const { ev } = fresh();
  ev(`globalThis.E = temaEmbed(); E.views[0].view[0].stem = "En 45-årig kvinna söker för trötthet. Vilken är den mest sannolika orsaken?";
      E.views[0].view[0].opts[E.views[0].view[0].correctIdx] = ${JSON.stringify(LONG)};`);
  const page = runHtml(ev("buildTemaReport(E)"));
  assert.equal(page.ev("typeof KONTROLL.kor"), "function");
  assert.ok(page.el("#cards").innerHTML.includes('<details class="formall">'));
  assert.ok(page.el("#cards").innerHTML.includes("Rätt svar sticker ut."));
  assert.match(page.el("#goodlist").innerHTML, /förebild|^$/);
  const child = runHtml(page.ev("buildTemaReport(subsetEmbed(EMBED, [String(EMBED.views[0].view[0].seq)], state.th))"));
  assert.ok(child.el("#cards").innerHTML.includes("Rätt svar sticker ut."));
});
test("lathundens källa syns där råden visas", () => {
  const { ev } = fresh();
  const html = ev(`card(mk({n:80, counts:[76,2,1,1], rpb:0.05, opts:[${JSON.stringify(LONG)},"Hypotyreos","Depression","Sömnapné"]}))`);
  assert.ok(html.includes("NBME"));
});
test("kontrollen i Frågeluppen är densamma som i MCQ-lathunden", { skip: !process.env.LATHUND_DIR && "sätt LATHUND_DIR till lathundens mapp för att jämföra" }, () => {
  const html = fs.readFileSync(INDEX, "utf8");
  assert.equal(apply(html, build(process.env.LATHUND_DIR)), html);
});
test("frågan om ett alternativ som nästan ingen valde kräver ett formfynd som kan förklara det", () => {
  const { ev, evj } = fresh();
  const dead = "n:100, rpb:0.3, counts:[70,20,9,1]";
  assert.deepEqual(evj(`askQuestions(mk({${dead}})).map(q => q.key)`), []);                       // ren form: tyst
  const abs = `mk({${dead}, opts:["Järnbrist","Hypotyreos","Depression","Alltid sömnapné"]})`;
  assert.deepEqual(evj(`askQuestions(${abs}).map(q => q.key)`), ["distraktor"]);
  assert.ok(evj(`formFor(${abs}, askQuestions(${abs})).distraktor`).some(f => f.regel === "absolut"));
  assert.deepEqual(evj(`askQuestions(mk({${dead}, stem:""})).map(q => q.key)`), ["distraktor"]);   // ingen text att kontrollera: som förut
  ev("ASK_NEEDS_FORM.length = 0");                                                                 // regeln går att stänga av
  assert.deepEqual(evj(`askQuestions(mk({${dead}})).map(q => q.key)`), ["distraktor"]);
});
test("en tystad distraktorfråga tränger inte undan en annan fråga och hindrar inte förebild", () => {
  const { ev, evj } = fresh();
  assert.equal(ev("isForebild(mk({n:100, rpb:0.35, counts:[70,20,9,1]}))"), true);
  assert.deepEqual(evj("askQuestions(mk({n:100, rpb:0.05, counts:[92,6,1,1]})).map(q => q.key)"), ["latt"]);
});
