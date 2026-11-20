// Essä- och flersvarsfrågorna: ett kort per fråga (medel, diskriminering, poängfördelning) på samma sida som
// flervalsfrågorna, i appen och i temarapporten.
import test from "node:test"; import assert from "node:assert/strict";
import { loadApp, runHtml } from "./harness.mjs";
import { setupDemoView } from "./fixtures.mjs";
const fresh = () => { const a = loadApp(); setupDemoView(a.ev);
  a.ev(`globalThis.E = temaEmbed(); globalThis.SC = E.views[0].scored; globalThis.ESS = SC.filter(e => e.typ === "text");
        globalThis.me = over => Object.assign({ seq:"70", num:"70", typ:"text", title:"A1.1", max:4, n:100, mean:2.6, pct:65, r:0.32,
          info:{cls:"rpb-good", value:"r +0.32", label:"mycket god", tip:""}, dist:[{pts:0,count:10},{pts:2,count:40},{pts:4,count:50}],
          tagVals:[], excluded:false, reason:"" }, over||{});`); return a; };
const onlyType = (page, t) => page.ev(`clearFilters(); toggleFacet('typ','${t}');`);

test("ett kort per essä- och flersvarsfråga, med bara sammanräknade tal", () => {
  const { ev, evj } = fresh();
  assert.equal(ev("ESS.length"), ev("state.json.qMeta.filter(q => q.type === 'text' && q.max > 0).length"));
  assert.equal(ev("SC.filter(e => e.typ === 'multi').length"), ev("state.json.qMeta.filter(q => q.type === 'multi' && q.max > 0).length"));
  const e = evj("ESS[0]");
  for (const k of ["seq","num","typ","title","max","n","mean","pct","r","info","dist","tagVals","excluded"]) assert.ok(k in e, k);
  assert.ok(Math.abs(e.pct - e.mean / e.max * 100) < 1e-9);
  assert.equal(e.dist.reduce((s, d) => s + d.count, 0), e.n);
  assert.ok(!/cohort|candMeta|scores/.test(ev("JSON.stringify(SC)")));
  assert.ok(ev("SC.every(e => state.json.qMeta.find(q => String(q.num) === e.seq).type === e.typ)"));
});
test("essäkortet visar medel, diskriminering och poängfördelning", () => {
  const { ev } = fresh();
  const html = ev("scoreCard(me())");
  assert.ok(html.includes(">Essä<"));
  assert.match(html, /medel 2[,.]6 av 4/);
  assert.ok(html.includes("65 %"));
  assert.ok(html.includes("r +0.32"));
  assert.equal((html.match(/class="ftrow"/g) || []).length, 3);
  assert.ok(!html.includes("askbox"));
  assert.ok(ev("scoreCard(me({typ:'multi'}))").includes(">Flersvar<"));
});
test("poäng som inte följer resten av tentan ger en fråga om bedömningsmallen, eller om facit för flersvar", () => {
  const { ev, evj } = fresh();
  assert.deepEqual(evj("scoreQuestions(me({r:-0.25})).map(q => q.key)"), ["mall"]);
  assert.equal(evj("scoreQuestions(me({r:-0.25}))[0].text"), "Poängen på frågan följer inte resten av tentan. Bedömer mallen det ni avsåg att pröva?");
  assert.equal(evj("scoreQuestions(me({r:-0.25, typ:'multi'}))[0].text"), "Poängen på frågan följer inte resten av tentan. Stämmer facit och poängregeln?");
  assert.deepEqual(evj("scoreQuestions(me({r:0.05}))"), []);
  assert.deepEqual(evj("scoreQuestions(me({r:-0.25, n:12}))"), []);                 // för litet underlag
  assert.deepEqual(evj("scoreQuestions(me({r:-0.25, excluded:true}))"), []);
  assert.ok(ev("scoreCard(me({r:-0.25, info:{cls:'rpb-bad', value:'r -0.25', label:'negativ', tip:''}}))").includes("Att fråga sig"));
});
test("flersvarsfrågans förklaring pekar på facit, inte på bedömningsmallen", () => {
  const { ev } = fresh();
  const tip = t => ev(`polyInfo(Array.from({length:40}, (_, i) => i % 3), -0.4, 2, '${t}').tip`);
  assert.match(tip("multi"), /facit och poängregeln/);
  assert.match(tip("text"), /bedömningsmatrisen/);
});
test("essäfrågor som nästan alla fick full poäng på sammanfattas en gång", () => {
  const { ev, evj } = fresh();
  const list = "[me({seq:'1', pct:95, mean:3.8}), me({seq:'2', pct:92, mean:3.68}), me({seq:'3'}), me({seq:'4', typ:'multi', pct:99})]";
  const r = evj(`scorePatterns(${list})`);
  assert.equal(r.length, 1);
  assert.equal(r[0].key, "elatt");
  assert.equal(r[0].head, "2 av 3 essäfrågor hade ett medel på minst 90 % av maxpoängen.");
  assert.equal(r[0].ask, "Är det väntat för de här målen, eller skiljer bedömningsmallen för lite mellan svaren?");
  assert.deepEqual(r[0].seqs, ["1", "2"]);
  ev("setThreshold('easy', 96)");
  assert.deepEqual(evj(`scorePatterns(${list})`), []);
  assert.deepEqual(evj("scorePatterns([me({seq:'1', pct:95, n:8})])"), []);
});
test("essäfrågor märks inte som förebilder", () => {
  // formkontrollen går inte att köra på en essäfråga, och en förebild utan den kontrollen förvirrar (Kajsa 20 nov 2026)
  const { ev } = fresh();
  assert.ok(!/förebild/i.test(ev("scoreCard(me())")));
});
test("essäkorten i den exporterade rapporten", () => {
  const { ev } = fresh();
  const page = runHtml(ev("buildTemaReport(E)"));
  onlyType(page, "text");
  const n = page.ev("EMBED.views[0].scored.filter(e => e.typ === 'text').length");
  assert.equal((page.el("#cards").innerHTML.match(/ftcard/g) || []).length, n);
  assert.ok(page.el("#cards").innerHTML.includes('class="selbox"'));
  assert.ok(!page.el("#cards").innerHTML.includes('card-exclude'));            // bara examinatorn exkluderar
  assert.equal(page.el("#goodlist").innerHTML, "");                            // ingen förebild bland essäfrågorna
  assert.equal(page.ev("selVisible().length"), n);
  // sök på frågenummer
  const first = page.ev("String(EMBED.views[0].scored.find(e => e.typ === 'text').num)");
  page.ev(`document.querySelector("#search").value = ${JSON.stringify(first)}; applyFilters();`);
  assert.ok(page.ev("selVisible().length") >= 1 && page.ev("selVisible().length") < n);
});
test("mönsterfiltret fungerar för essäfrågorna", () => {
  const { ev } = fresh();
  ev("ESS[0].pct = 95; ESS[1].pct = 93;");
  const page = runHtml(ev("buildTemaReport(E)"));
  assert.match(page.el("#patterns").innerHTML, /essäfrågor hade ett medel på minst 90 %/);
  const k = page.ev("scorePatterns(EMBED.views[0].scored)[0].seqs.length");
  page.ev("togglePattern('elatt')");
  assert.equal(page.ev("selVisible().length"), k);
  page.ev("togglePattern('elatt')");
  assert.equal(page.ev("selVisible().length"), page.ev("EMBED.views[0].view.length + EMBED.views[0].scored.length"));
});
test("urval: valda essäfrågor följer med, och ovalda gör det inte", () => {
  const { ev, evj } = fresh();
  const mcq = "String(E.views[0].view[0].seq)";
  const withEssay = `subsetEmbed(E, [${mcq}, ESS[0].seq, ESS[1].seq], E.th)`;
  assert.equal(ev(`${withEssay}.views[0].scored.length`), 2);
  assert.deepEqual(evj(`${withEssay}.subset`), { n: 3, of: ev("E.views[0].total.head.nq") });
  assert.equal(ev(`subsetEmbed(E, [${mcq}], E.th).views[0].scored.length`), 0);
  const child = runHtml(ev(`buildTemaReport(${withEssay})`));
  assert.equal((child.el("#cards").innerHTML.match(/ftcard/g) || []).length, 2);
  const grand = runHtml(child.ev("buildTemaReport(subsetEmbed(EMBED, [EMBED.views[0].scored[0].seq], state.th))"));
  assert.match(grand.el("#subsetline").innerHTML, /Urval: 1 av \d+ frågor/);
});
test("Excel-raderna för essäfrågorna", () => {
  const { ev } = fresh();
  const page = runHtml(ev("buildTemaReport(E)"));
  onlyType(page, "text");
  const aoa = page.evj("xExportRows().aoa");
  assert.deepEqual(aoa[0].slice(0, 7), ["#", "Fråga", "Typ", "Max", "Andel rätt eller medel av max (%)", "Diskriminering (r)", "Tolkning"]);
  assert.equal(aoa.length - 1, page.ev("EMBED.views[0].scored.filter(e => e.typ === 'text').length"));
  assert.ok(aoa.slice(1).every(r => r[2] === "Essä"));
  assert.doesNotMatch(JSON.stringify(aoa), /undefined/);
});
test("en tenta utan essäfrågor har inga essäkort och ingen Essä i filtret", () => {
  const { ev } = fresh();
  ev("state.json.qMeta.forEach(q => { if (q.type === 'text') q.type = 'multi'; })");
  const page = runHtml(ev("buildTemaReport(temaEmbed())"));
  assert.equal(page.ev("EMBED.views[0].scored.filter(e => e.typ === 'text').length"), 0);
  assert.doesNotMatch(page.el("#tagbar").innerHTML, /data-val="text"/);
});
