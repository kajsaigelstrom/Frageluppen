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
test("formfyndet visas som möjlig förklaring under observationen på kortet", () => {
  const { ev } = fresh();
  // nära gissningsnivå utan diskriminering + negation i stammen: frågan om tydlighet får fyndet som förklaring
  const html = ev(`card(mk({rpb:0.05, counts:[28,25,24,23], stem:"Vilket av följande är inte ett symtom vid anemi?"}))`);
  assert.ok(html.includes("Nära gissningsnivå"));
  assert.ok(html.includes('class="askform"'));
  assert.ok(html.split('class="askform"')[1].split("</details>")[0].includes("Ur MCQ-lathunden"));
});
test("formkontrollen körs bara på frågor med en svaghet och på tänkbara förebilder", () => {
  const { ev } = fresh();
  ev("globalThis.CALLS = 0; { const kor = KONTROLL.kor; KONTROLL.kor = function(){ CALLS++; return kor.apply(this, arguments); }; }");
  // varken svag eller tänkbar förebild (skiljer för svagt): prövas inte
  const html = ev(`card(mk({n:100, counts:[70,10,10,10], rpb:0.15, opts:[${JSON.stringify(LONG)},"Hypotyreos","Depression","Sömnapné"]}))`);
  assert.equal(ev("CALLS"), 0);
  assert.ok(!html.includes("Rätt svar sticker ut.") && !html.includes("askbox") && !html.includes("Ur MCQ-lathunden"));
  ev(`card(mk({n:80, counts:[76,2,1,1], rpb:0.05, opts:[${JSON.stringify(LONG)},"Hypotyreos","Depression","Sömnapné"]}))`);
  const afterWeak = ev("CALLS"); assert.ok(afterWeak > 0);
  ev("card(mk({n:90, counts:[65,9,8,8], rpb:0.35}))");                     // tänkbar förebild: prövas
  assert.ok(ev("CALLS") > afterWeak);
});
test("en mycket lätt fråga får formfyndet som möjlig förklaring på kortet", () => {
  const { ev } = fresh();
  const html = ev(`card(mk({n:80, counts:[76,2,1,1], rpb:0.05, opts:[${JSON.stringify(LONG)},"Hypotyreos","Depression","Sömnapné"]}))`);
  assert.ok(html.includes("Mycket lätt fråga"));
  assert.ok(html.includes("Rätt svar sticker ut."));
  assert.match(html, /tecken, den längsta distraktorn/);
  assert.ok(!html.includes("Att fråga sig"));
  // utan formfynd: ingen ruta alls
  assert.ok(!ev("card(mk({n:80, counts:[76,2,1,1], rpb:0.05}))").includes("advbox"));
});
test("regler som bara är tips används aldrig som förklaring", () => {
  const { evj } = fresh();
  const tips = evj("Object.keys(FORM_REGLER).filter(r => FORM_REGLER[r].prio === 'tips')");
  const used = new Set(evj("Object.values(FORM_EXPLAINS).flat()"));
  assert.deepEqual(tips.filter(r => used.has(r) && r !== "markor"), []);
  assert.deepEqual(evj("FORM_EXPLAINS.forsvar.includes('markor')"), true);     // enda undantaget: bästa-svar-markör vid försvarbar distraktor
  // väl uppbyggda parallella alternativ (2 × 2) ger ingen förklaring trots att tipsregeln "ojämna inledningar" slår
  const sym = `mk({n:80, counts:[76,2,1,1], rpb:0.05, stem:"Vilken dos är lämpligast?", opts:["1000 mg 2 gånger per dygn","1000 mg 3 gånger per dygn","1500 mg 3 gånger per dygn","1500 mg 2 gånger per dygn"]})`;
  assert.ok(evj(`rules(${sym})`).includes("inledning2"));
  assert.deepEqual(evj(`advice(${sym}).l2`), []);
});
test("ett fynd visas bara under en fråga det kan förklara", () => {
  const { evj } = fresh();
  // negation i stammen förklarar otydlighet, inte en mycket lätt fråga
  const STEM = "Vilket av följande är inte ett symtom vid anemi?";
  const easy = `mk({n:80, counts:[76,2,1,1], rpb:0.05, stem:${JSON.stringify(STEM)}})`;
  assert.ok(evj(`rules(${easy})`).includes("negstam"));
  assert.deepEqual(evj(`advice(${easy}).l2`), []);
  const hard = `mk({rpb:0.05, counts:[28,25,24,23], stem:${JSON.stringify(STEM)}})`;
  const shown = evj(`advice(${hard}).l1`);
  assert.deepEqual(shown.map(a => a.psy), ["hard"]);
  assert.ok(shown[0].form.some(f => f.regel === "negstam"));
});
test("högst två formfynd per observation", () => {
  const { evj } = fresh();
  const many = `mk({n:80, counts:[76,2,1,1], rpb:0.05, stem:"En patient har hjärtsvikt. Vilken behandling är bäst?",
    opts:["Både behandling av hjärtsvikt och samtidigt alltid noggrann uppföljning av patienten; dessutom kontroll","Aldrig a","Endast b","Inga c"]})`;
  assert.ok(evj(`rules(${many})`).length > 3);
  const a = evj(`advice(${many})`);
  assert.ok(a.l1.concat(a.l2).some(x => x.form.length > 0));
  assert.ok(a.l1.concat(a.l2).every(x => (x.form || []).length <= 2));
});
test("förebild: skiljer väl, inget på kortet och utan fynd i formkontrollen; svårigheten är inget krav", () => {
  const { ev } = fresh();
  assert.equal(ev("isForebild(mk({n:90, counts:[65,9,8,8], rpb:0.35}))"), true);
  // en fråga med formfynd ska inte hållas fram som förebild, även om statistiken är bra
  const flawed = `mk({n:90, counts:[65,9,8,8], rpb:0.35, opts:[${JSON.stringify(LONG)},"Hypotyreos","Depression","Sömnapné"]})`;
  assert.equal(ev(`isForebild(${flawed})`), false);
  assert.ok(!ev(`card(${flawed})`).includes("förebild"));
  assert.ok(!ev(`card(${flawed})`).includes("Rätt svar sticker ut."));          // fyndet visas inte: frågan har ingen svaghet att förklara
  // fynd som bara är tips i lathunden hindrar inte (t.ex. parallella alternativ)
  assert.equal(ev(`isForebild(mk({n:90, counts:[65,9,8,8], rpb:0.35, stem:"Vilken dos är lämpligast?", opts:["1000 mg 2 gånger per dygn","1000 mg 3 gånger per dygn","1500 mg 3 gånger per dygn","1500 mg 2 gånger per dygn"]}))`), true);
  assert.equal(ev("isForebild(mk({n:90, counts:[81,3,3,3], rpb:0.35}))"), false);     // bara 9 fel: diskrimineringen är osäker
  assert.equal(ev("isForebild(mk({n:90, counts:[40,20,15,15], rpb:0.35}))"), true);   // 44 % rätt hindrar inte
  assert.equal(ev("isForebild(mk({n:90, counts:[65,9,8,8], rpb:0.15}))"), false);     // skiljer för svagt
  assert.equal(ev("isForebild(mk({n:25, counts:[18,3,2,2], rpb:0.35}))"), false);     // för litet underlag
  assert.equal(ev("isForebild(mk({n:90, counts:[65,9,8,8], rpb:0.35, stem:''}))"), false);   // ingen text att kontrollera
  assert.ok(ev("card(mk({n:90, counts:[65,9,8,8], rpb:0.35}))").includes("utan fynd i formkontrollen"));
});
test("kortet har ingen kopiera-knapp och ingen formkontroll-ruta", () => {
  const { ev } = fresh();
  for (const v of ["mk()", "mk({n:80, counts:[76,2,1,1], rpb:0.05})", "mk({rpb:-0.4, counts:[50,20,15,15]})"])
    assert.ok(!/copyq|formall|Kopiera frågan|Formkontroll och/.test(ev(`card(${v})`)), v);
  assert.equal(ev("typeof questionAsText"), "undefined");
});
test("examinatorns kort har samma formfynd som temarapportens", () => {
  const { ev } = fresh();
  ev("state.mode = 'edu'; state.view = 'final'");
  const html = ev(`card(mk({n:80, counts:[76,2,1,1], rpb:0.05, opts:[${JSON.stringify(LONG)},"Hypotyreos","Depression","Sömnapné"]}))`);
  assert.ok(html.includes("askform") && html.includes("Rätt svar sticker ut.") && !html.includes("formall") && !html.includes("förebild"));
});
test("den exporterade rapporten och en urvalssida har formkontrollen med sig", () => {
  const { ev } = fresh();
  ev(`globalThis.E = temaEmbed(); globalThis.iE = E.views[0].view.findIndex(v => v.pcorr >= 90);
      E.views[0].view[iE].stem = "En 45-årig kvinna söker för trötthet. Vilken är den mest sannolika orsaken?";
      E.views[0].view[iE].opts[E.views[0].view[iE].correctIdx] = ${JSON.stringify(LONG)};`);
  const page = runHtml(ev("buildTemaReport(E)"));
  assert.equal(page.ev("typeof KONTROLL.kor"), "function");
  assert.ok(page.el("#cards").innerHTML.includes("Mycket lätt fråga"));
  assert.ok(page.el("#cards").innerHTML.includes("Rätt svar sticker ut."));
  assert.ok(!page.el("#cards").innerHTML.includes("formall"));
  const child = runHtml(page.ev("buildTemaReport(subsetEmbed(EMBED, [String(EMBED.views[0].view[" + ev("iE") + "].seq)], state.th))"));
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
test("ett alternativ som nästan ingen valde får en förklaring bara när formen ger en", () => {
  const { ev } = fresh();
  const dead = "n:100, rpb:0.3, counts:[70,20,9,1]";
  assert.ok(!ev(`card(mk({${dead}}))`).includes("askform"));
  const html = ev(`card(mk({${dead}, opts:["Järnbrist","Hypotyreos","Depression","Alltid sömnapné"]}))`);
  assert.ok(html.includes("askform") && html.includes("Sällan valda alternativ") && html.includes("«Alltid sömnapné» valdes av 1 % av studenterna."));
  assert.equal(ev("typeof ASK_NEEDS_FORM"), "undefined");
});
