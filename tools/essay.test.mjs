// Essäfrågorna i temarapporten: egen flik med ett kort per fråga (medel, diskriminering, poängfördelning).
import test from "node:test"; import assert from "node:assert/strict";
import { loadApp, runHtml } from "./harness.mjs";
import { setupDemoView } from "./fixtures.mjs";
const fresh = () => { const a = loadApp(); setupDemoView(a.ev);
  a.ev(`globalThis.E = temaEmbed(); globalThis.ESS = E.views.find(v => v.layout === "essay").essays;
        globalThis.me = over => Object.assign({ seq:"70", num:"70", title:"A1.1", max:4, n:100, mean:2.6, pct:65, r:0.32,
          info:{cls:"rpb-good", value:"r +0.32", label:"mycket god", tip:""}, dist:[{pts:0,count:10},{pts:2,count:40},{pts:4,count:50}],
          tagVals:[], excluded:false, reason:"" }, over||{});`); return a; };
const goEssay = page => page.ev("state.viewIdx = EMBED.views.findIndex(v=>v.layout==='essay'); state.mode='edu'; state.patternKey=null; state.patternSeqs=null; xExportTabs(); xExportRender();");

test("essäfliken har ett kort per essäfråga, med bara sammanräknade tal", () => {
  const { ev, evj } = fresh();
  const nText = ev("state.json.qMeta.filter(q => q.type === 'text' && q.max > 0).length");
  assert.equal(ev("ESS.length"), nText);
  const e = evj("ESS[0]");
  for (const k of ["seq","num","title","max","n","mean","pct","r","info","dist","tagVals","excluded"]) assert.ok(k in e, k);
  assert.ok(Math.abs(e.pct - e.mean / e.max * 100) < 1e-9);
  assert.equal(e.dist.reduce((s, d) => s + d.count, 0), e.n);
  assert.ok(!/cohort|candMeta|scores/.test(ev("JSON.stringify(ESS)")));
  assert.equal(evj("E.views.find(v => v.layout === 'essay').label"), "Essäfrågor");
});
test("flersvarsfrågor räknas inte som essäfrågor", () => {
  const { ev } = fresh();
  assert.equal(ev("ESS.filter(e => state.json.qMeta.find(q => String(q.num) === e.seq).type !== 'text').length"), 0);
});
test("essäkortet visar medel, diskriminering och poängfördelning", () => {
  const { ev } = fresh();
  const html = ev("essayCard(me())");
  assert.ok(html.includes("Essä"));
  assert.match(html, /medel 2[,.]6 av 4/);
  assert.ok(html.includes("65 %"));
  assert.ok(html.includes("r +0.32"));
  assert.equal((html.match(/class="ftrow"/g) || []).length, 3);
  assert.ok(!html.includes("askbox"));
});
test("poäng som inte följer resten av tentan ger en fråga om bedömningsmallen", () => {
  const { ev, evj } = fresh();
  assert.deepEqual(evj("essayQuestions(me({r:-0.25})).map(q => q.key)"), ["mall"]);
  assert.equal(evj("essayQuestions(me({r:-0.25}))[0].text"), "Poängen på frågan följer inte resten av tentan. Bedömer mallen det ni avsåg att pröva?");
  assert.deepEqual(evj("essayQuestions(me({r:0.05}))"), []);
  assert.deepEqual(evj("essayQuestions(me({r:-0.25, n:12}))"), []);                 // för litet underlag
  assert.deepEqual(evj("essayQuestions(me({r:-0.25, excluded:true}))"), []);
  assert.ok(ev("essayCard(me({r:-0.25, info:{cls:'rpb-bad', value:'r -0.25', label:'negativ', tip:''}}))").includes("Att fråga sig"));
});
test("essäfrågor som nästan alla fick full poäng på sammanfattas en gång", () => {
  const { ev, evj } = fresh();
  const list = "[me({seq:'1', pct:95, mean:3.8}), me({seq:'2', pct:92, mean:3.68}), me({seq:'3'})]";
  const r = evj(`essayPatterns(${list})`);
  assert.equal(r.length, 1);
  assert.equal(r[0].key, "elatt");
  assert.equal(r[0].head, "2 av 3 essäfrågor hade ett medel på minst 90 % av maxpoängen.");
  assert.equal(r[0].ask, "Är det väntat för de här målen, eller skiljer bedömningsmallen för lite mellan svaren?");
  assert.deepEqual(r[0].seqs, ["1", "2"]);
  ev("setThreshold('easy', 96)");
  assert.deepEqual(evj(`essayPatterns(${list})`), []);
  assert.deepEqual(evj("essayPatterns([me({seq:'1', pct:95, n:8})])"), []);
});
test("essäfrågor märks inte som förebilder", () => {
  // formkontrollen går inte att köra på en essäfråga, och en förebild utan den kontrollen förvirrar (Kajsa 20 nov 2026)
  const { ev } = fresh();
  assert.equal(ev("typeof isEssayForebild"), "undefined");
  assert.ok(!/förebild/i.test(ev("essayCard(me())")));
});
test("essäfliken i den exporterade rapporten", () => {
  const { ev } = fresh();
  const page = runHtml(ev("buildTemaReport(E)"));
  goEssay(page);
  const n = page.ev("EMBED.views.find(v=>v.layout==='essay').essays.length");
  assert.equal((page.el("#cards").innerHTML.match(/ftcard/g) || []).length, n);
  assert.ok(page.el("#cards").innerHTML.includes('class="selbox"'));
  assert.equal(page.el("#totalreport").innerHTML, "");
  assert.equal(page.el("#goodlist").innerHTML, "");
  assert.ok(!/förebild/i.test(page.el("#summary").innerHTML));
  for (const sel of ["#cardctrls", "#results .legend", "#results .modebar"]) assert.equal(page.el(sel).classList.contains("hidden"), true, sel);
  assert.match(page.el("#count").textContent, new RegExp(`Visar ${n} av ${n} essäfrågor`));
  assert.equal(page.ev("selVisible().length"), n);
  // sök på frågenummer
  const first = page.ev("String(EMBED.views.find(v=>v.layout==='essay').essays[0].num)");
  page.ev(`document.querySelector("#search").value = ${JSON.stringify(first)}; applyFilters();`);
  assert.ok(page.ev("selVisible().length") >= 1 && page.ev("selVisible().length") < n);
});
test("mönsterfiltret fungerar i essäfliken", () => {
  const { ev } = fresh();
  ev("ESS[0].pct = 95; ESS[1].pct = 93;");
  const page = runHtml(ev("buildTemaReport(E)"));
  goEssay(page);
  assert.match(page.el("#patterns").innerHTML, /essäfrågor hade ett medel på minst 90 %/);
  const k = page.ev("essayPatterns(EMBED.views.find(v=>v.layout==='essay').essays)[0].seqs.length");
  page.ev("togglePattern('elatt')");
  assert.equal(page.ev("selVisible().length"), k);
  page.ev("togglePattern('elatt')");
  assert.equal(page.ev("selVisible().length"), page.ev("EMBED.views.find(v=>v.layout==='essay').essays.length"));
});
test("Totalrapporten upprepar inte poängfördelningen när essäfliken finns", () => {
  const { ev } = fresh();
  const page = runHtml(ev("buildTemaReport(E)"));
  page.ev("state.viewIdx = EMBED.views.findIndex(v=>v.layout==='total'); xExportTabs(); xExportRender();");
  assert.ok(page.el("#totalreport").innerHTML.includes("totaltable"));
  assert.ok(!page.el("#totalreport").innerHTML.includes("poängfördelning"));
});
test("urval: valda essäfrågor följer med, och fliken försvinner när ingen är vald", () => {
  const { ev, evj } = fresh();
  const mcq = "String(E.views[0].view[0].seq)";
  const withEssay = `subsetEmbed(E, [${mcq}, ESS[0].seq, ESS[1].seq], E.th)`;
  assert.equal(ev(`${withEssay}.views.find(v => v.layout === 'essay').essays.length`), 2);
  assert.deepEqual(evj(`${withEssay}.subset`), { n: 3, of: ev("E.views.find(v=>v.layout==='total').total.head.nq") });
  assert.deepEqual(evj(`subsetEmbed(E, [${mcq}], E.th).views.map(v => v.layout)`), ["mcq", "total"]);
  const child = runHtml(ev(`buildTemaReport(${withEssay})`));
  goEssay(child);
  assert.equal((child.el("#cards").innerHTML.match(/ftcard/g) || []).length, 2);
  const grand = runHtml(child.ev("buildTemaReport(subsetEmbed(EMBED, [EMBED.views.find(v=>v.layout==='essay').essays[0].seq], state.th))"));
  assert.match(grand.el("#subsetline").innerHTML, /Urval: 1 av \d+ frågor/);
});
test("Excel-raderna för essäfliken", () => {
  const { ev } = fresh();
  const page = runHtml(ev("buildTemaReport(E)"));
  goEssay(page);
  const aoa = page.evj("xExportRows().aoa");
  assert.deepEqual(aoa[0].slice(0, 7), ["#", "Fråga", "Max", "Medel", "Medel %", "Diskriminering (r)", "Tolkning"]);
  assert.equal(aoa.length - 1, page.ev("EMBED.views.find(v=>v.layout==='essay').essays.length"));
  assert.doesNotMatch(JSON.stringify(aoa), /undefined/);
});
test("en tenta utan essäfrågor får ingen essäflik", () => {
  const { ev, evj } = fresh();
  ev("state.json.qMeta.forEach(q => { if (q.type === 'text') q.type = 'multi'; })");
  assert.deepEqual(evj("temaEmbed().views.map(v => v.id)"), ["final-mcq", "total"]);
});
