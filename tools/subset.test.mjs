import test from "node:test"; import assert from "node:assert/strict";
import { loadApp, runHtml } from "./harness.mjs";
import { setupDemoView } from "./fixtures.mjs";
const fresh = () => { const a = loadApp(); setupDemoView(a.ev);
  a.ev(`globalThis.E = temaEmbed();
        globalThis.mcq = E.views[0].view.map(v => String(v.seq));
        globalThis.txt = E.views[0].total.rows.filter(r => !r.isSingle).map(r => String(r.num));
        globalThis.S2 = subsetEmbed(E, [mcq[0], mcq[1]], {easy:85, hard:60, goodDisc:0.2, pass:65});`); return a; };

test("ovalda frågor finns inte kvar någonstans", () => {
  const { ev } = fresh();
  // demons frågetexter är korta och lika ("Exempelfråga 4"), så den ovalda frågan märks med unika texter
  ev(`E.views[0].view[2].stem = "UNIK_OVALD_FRAGETEXT"; E.views[0].view[2].opts[0] = "UNIKT_OVALT_ALTERNATIV";
      E.views[0].total.rows.find(r => String(r.num) === mcq[2]).title = "UNIK_OVALD_TITEL";
      globalThis.S2 = subsetEmbed(E, [mcq[0], mcq[1]], E.th);`);
  assert.ok(ev("JSON.stringify(E)").includes("UNIK_OVALD_FRAGETEXT"));
  for (const where of ["JSON.stringify(S2)", "buildTemaReport(S2)"])
    for (const mark of ["UNIK_OVALD_FRAGETEXT", "UNIKT_OVALT_ALTERNATIV", "UNIK_OVALD_TITEL"]) assert.ok(!ev(where).includes(mark), where + " " + mark);
  assert.equal(ev("S2.views[0].view.length"), 2);
  assert.equal(ev("S2.views[0].total.rows.length"), 2);
  assert.ok(!ev("S2.views[0].total.rows.some(r => String(r.num) === mcq[2])"));
});
test("urvalet bär inga helhetssiffror", () => {
  const { ev, evj } = fresh();
  assert.equal(ev("'passSnapshot' in S2"), false);
  const head = evj("S2.views[0].total.head");
  assert.deepEqual(Object.keys(head).sort(), ["n", "nq"]);
  assert.equal(head.n, ev("E.candCount")); assert.equal(head.nq, 2);
  assert.deepEqual(evj("S2.subset"), { n: 2, of: ev("E.views[0].total.head.nq") });
});
test("urval ur urval behåller ursprungligt antal", () => {
  const { ev, evj } = fresh();
  assert.deepEqual(evj("subsetEmbed(S2, [mcq[1]], S2.th).subset"), { n: 1, of: ev("E.views[0].total.head.nq") });
  assert.equal(ev("subsetEmbed(S2, [mcq[1], mcq[5]], S2.th).subset.n"), 1);   // en fråga som inte finns i urvalet räknas inte
});
test("urval med bara fritextfrågor ger tom kortvy men fungerande sida", () => {
  const { ev } = fresh();
  assert.ok(ev("txt.length") > 0);
  ev("globalThis.ST = subsetEmbed(E, [txt[0]], E.th)");
  assert.equal(ev("ST.views[0].view.length"), 0);
  assert.equal(ev("ST.views[0].total.rows.length"), 1);
  assert.equal(ev("ST.views[0].scored.length"), 1);
  const page = runHtml(ev("buildTemaReport(ST)"));
  assert.equal((page.el("#cards").innerHTML.match(/class="q ftcard/g) || []).length, 1);
  assert.match(page.el("#count").textContent, /Visar 1 av 1 frågor/);
});
test("urvalet bär temarepresentantens gränser", () => {
  const { ev } = fresh();
  assert.equal(ev("S2.th.easy"), 85);
  assert.equal(runHtml(ev("buildTemaReport(S2)")).ev("state.th.easy"), 85);
});
test("urvalet ändrar inte ursprunget", () => {
  const { ev } = fresh();
  const before = ev("JSON.stringify(E)"); ev("subsetEmbed(E, [mcq[0]], E.th)");
  assert.equal(ev("JSON.stringify(E)"), before);
});
test("urvalet bär bara de valda frågornas exkludering och poängkort", () => {
  const { ev, evj } = fresh();
  ev("state.excluded.set(mcq[0], 'Låg kvalitet'); state.excluded.set(mcq[3], 'Tekniskt fel'); rebuildView(); globalThis.E2 = temaEmbed();");
  assert.deepEqual(evj("subsetEmbed(E2, [mcq[0], mcq[1]], E2.th).excluded"), [[ev("mcq[0]"), "Låg kvalitet"]]);
  assert.deepEqual(evj("subsetEmbed(E2, [mcq[0], txt[0]], E2.th).views[0].scored.map(e => e.seq)"), [ev("txt[0]")]);
});
test("urvalssidan visar urvalsraden och ingen godkäntandel", () => {
  const { ev } = fresh();
  const page = runHtml(ev("buildTemaReport(S2)"));
  assert.match(page.el("#subsetline").innerHTML, /Urval: 2 av \d+ frågor/);
  assert.ok(!/passmetric|passSnapshot/.test(ev("buildTemaReport(S2)")));
  page.ev("exportOverview()");
  const tab = page.downloads[page.downloads.length - 1].parts.join("");
  assert.match(tab, /2 frågor/);
  assert.doesNotMatch(tab, /-gränsen|maxpoäng/);
  const full = runHtml(ev("buildTemaReport(E)"));
  assert.equal(full.el("#subsetline").innerHTML, "");
});
test("en exporterad sida kan själv bygga en urvalssida", () => {
  const { ev } = fresh();
  const page = runHtml(ev("buildTemaReport(E)"));
  page.ev("state.sel = new Set([String(EMBED.views[0].view[0].seq), String(EMBED.views[0].view[4].seq)]);");
  const child = runHtml(page.ev("buildTemaReport(subsetEmbed(EMBED, state.sel, state.th))"));
  assert.equal((child.el("#cards").innerHTML.match(/class="q /g) || []).length, 2);
  const grand = runHtml(child.ev("buildTemaReport(subsetEmbed(EMBED, [String(EMBED.views[0].view[0].seq)], state.th))"));
  assert.match(grand.el("#subsetline").innerHTML, /Urval: 1 av \d+ frågor/);
});
test("markera alla visade följer filtret och knappen visar antalet", () => {
  const { ev } = fresh();
  const page = runHtml(ev("buildTemaReport(E)"));
  const all = page.ev("EMBED.views[0].view.length + EMBED.views[0].scored.length");
  assert.equal(page.ev("selVisible().length"), all);
  page.ev("selAllVisible()");
  assert.equal(page.ev("state.sel.size"), all);
  assert.ok(page.el("#sel-save").textContent.includes(`(${page.ev("state.sel.size")})`));
  page.ev("selClear()");
  assert.equal(page.ev("state.sel.size"), 0);
});
test("korten i temarapporten har kryssruta, appens kort har det inte", () => {
  const { ev } = fresh();
  ev("state.mode = 'ask'");
  assert.ok(!ev("card(VIEW[0])").includes("selbox"));
  const page = runHtml(ev("buildTemaReport(E)"));
  assert.ok(page.el("#cards").innerHTML.includes('class="selbox"'));
  const seq = page.ev("EMBED.views[0].scored[0].seq");
  assert.match(page.el("#cards").innerHTML.split(`id="card-${seq}"`)[1], /^[^]*?class="selbox"/);
});
