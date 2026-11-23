// Ladok-listan över registrerade studenter (Kajsa 23 nov 2026): uppdelningen i studenter registrerade på kursen
// innevarande termin och övriga finns inte i Inspera. Den kommer ur en lista från Ladok där kolumnen AidCode är
// Insperas kandidatnummer. Bara den kolumnen läses, och i datafilen står bara ja eller nej per student.
import test from "node:test"; import assert from "node:assert/strict";
import { loadApp } from "./harness.mjs";
import { setupDirty } from "./fixtures.mjs";

const CSV = ids => "﻿" + ['"Personal identity number";"Name";"AidCode";"Examination points";"Grade";"Examination date"',
  ...ids.map((id, i) => `"19990101-${1000 + i}";"Efternamn; Semikolon, Förnamn ""Q""";"${id}";"70.00";"G";"2026-06-01"`)].join("\r\n") + "\r\n";

const withList = async pick => { const a = loadApp(); setupDirty(a.ev);
  a.ev(`globalThis.A1 = makeDirty(); globalThis.IDS = A1.ext_inspera_candidates.map(c => String(c.result.ext_inspera_candidateId));`);
  const ids = a.evj("IDS"), chosen = pick(ids);
  a.set("LIST", CSV(chosen));
  a.ev(`globalThis.CODES = parseRegList(LIST, "lista.csv").codes;
        globalThis.PK = JSON.parse(JSON.stringify(buildPackage({jsonObjs:[A1], pdfMcqs:DEMO_DATA.PDF, tagRows:DEMO_DATA.TAGS, regCodes:CODES})));
        setPrep(false);`);
  await a.ev("loadDataFile(JSON.stringify(PK), 'datafil.json', {saved:true})"); a.ev("setStep('report')");
  return { a, ids, chosen }; };

test("listan läses med citattecken, semikolon i namn och BOM, och bara koderna kommer ut", () => {
  const a = loadApp();
  a.set("LIST", CSV(["1583", "1038", " 1577 ", "", "1038"]));
  const r = a.evj('parseRegList(LIST, "l.csv")');
  assert.deepEqual(r.codes, ["1583", "1038", "1577"]);
  assert.equal(r.rows, 5); assert.equal(r.empty, 1);
  assert.ok(!/1999|Efternamn/.test(JSON.stringify(r)));
});
test("en fil utan kolumnen AidCode ger ett begripligt fel", () => {
  const a = loadApp();
  assert.throws(() => a.ev('parseRegList("\\"Personal identity number\\";\\"Name\\";\\"Grade\\"\\n\\"1\\";\\"A\\";\\"G\\"", "fel.csv")'), /ingen kolumn som heter AidCode/);
});
test("datafilen får bara ja eller nej per student: ingen kod, inget namn och inget personnummer", async () => {
  const { a, ids, chosen } = await withList(ids => ids.filter((_, i) => i % 3 === 0));
  const cands = a.evj("PK.data[0].ext_inspera_candidates.map(c => c.result)");
  assert.deepEqual(cands.map(c => c.fl_registered), ids.map(id => chosen.includes(id)));
  assert.deepEqual(cands.map(c => c.ext_inspera_candidateId), ids.map((_, i) => String(i + 1)));    // löpnummer som förut
  const text = a.ev("JSON.stringify(PK)");
  assert.ok(!/19990101|Efternamn|Personal identity|AidCode/.test(text));
  assert.deepEqual(a.evj("state.json.reg"), ids.map(id => chosen.includes(id)));
});
test("utan lista finns inget fält, och raderna i Tentamensstatistiken fylls i för hand", async () => {
  const a = loadApp(); setupDirty(a.ev);
  a.ev(`globalThis.PK = JSON.parse(JSON.stringify(buildPackage({jsonObjs:[makeDirty()], pdfMcqs:null, tagRows:null}))); setPrep(false);`);
  assert.ok(!/fl_registered/.test(a.ev("JSON.stringify(PK)")));
  await a.ev("loadDataFile(JSON.stringify(PK), 'd.json', {saved:true})"); a.ev("setStep('report')");
  assert.equal(a.ev("state.json.reg"), null);
  assert.equal(a.ev("statsData().reg"), null);
  const row = a.evj("statsSheets(statsData())[0].aoa").find(r => /^Registrerade innevarande/.test(r[0]));
  assert.match(row[2], /Fylls i för hand/);
  assert.equal(a.ev("bokslutText(statsData(), 'ordinarie')"), "");
  assert.equal(a.el("#exp-bokslut").disabled, true);
});
test("uppdelningen summerar till hela tentan, i statistiken och i Excel-raderna", async () => {
  const { a } = await withList(ids => ids.filter((_, i) => i % 3 === 0));
  const d = a.evj("statsData()"), s = d.reg;
  assert.equal(s.reg.n + s.oth.n, d.students.length);
  assert.equal(s.reg.g + s.oth.g, d.students.filter(x => x.g).length);
  assert.equal(s.reg.n, d.students.filter(x => x.reg).length);
  const rows = a.evj("statsSheets(statsData())[0].aoa").map(r => r.map(c => (c && typeof c === "object") ? c.v : c));
  const r1 = rows.find(r => /^Registrerade innevarande/.test(r[0])), r2 = rows.find(r => /^Registrerade tidigare/.test(r[0]));
  assert.deepEqual(r1.slice(1, 3), [s.reg.g, s.reg.n - s.reg.g]);
  assert.deepEqual(r2.slice(1, 3), [s.oth.g, s.oth.n - s.oth.g]);
  // Raden per student har ingen kolumn om registrering: uppgiften finns bara som summor.
  assert.ok(!a.evj("statsSheets(statsData())[1].aoa[0]").some(h => /regist/i.test(String(h))));
});
test("kursbokslutstexten följer mallen, och valet mellan ordinarie och omtentamen byter bara inledningen", async () => {
  const { a } = await withList(ids => ids.filter((_, i) => i % 3 === 0));
  const s = a.evj("statsData().reg"), pc = (x, y) => Math.round(x / y * 100);
  const t = a.ev("bokslutText(statsData(), 'ordinarie')");
  assert.equal(t, `Ordinarie tentamen skrevs av ${s.all.n} studenter, ${s.reg.n} av dessa var registrerade på kursen. `
    + `Av ${s.all.g} godkända (${pc(s.all.g, s.all.n)}%) tillhörde ${s.reg.g} ${s.reg.g === 1 ? "student" : "studenter"} innevarande termin. `
    + `Därmed klarade ${pc(s.reg.g, s.reg.n)}% av studenterna registrerade på kursen tentan, medan ${pc(s.oth.g, s.oth.n)}% av övriga klarade tentamen.`);
  assert.equal(a.ev("bokslutText(statsData(), 'omtenta')"), t.replace("Ordinarie tentamen", "Omtentamen"));
});
test("texten följer G-gränsen", async () => {
  const { a } = await withList(ids => ids);
  const g0 = a.ev("statsData().reg.all.g");
  a.ev("state.th.pass = 100");
  assert.ok(a.ev("statsData().reg.all.g") < g0);
  assert.match(a.ev("bokslutText(statsData(), 'ordinarie')"), /^Ordinarie tentamen skrevs av \d+ studenter, \d+ av dessa/);
  assert.ok(!/medan/.test(a.ev("bokslutText(statsData(), 'ordinarie')")));          // alla är registrerade: ingen grupp övriga
});
test("knappen Kursbokslutstext öppnar rutan i steg 3 och är avstängd utan lista", async () => {
  const { a } = await withList(ids => ids.filter((_, i) => i % 2 === 0));
  assert.equal(a.el("#exp-bokslut").disabled, false);
  a.el("#exp-bokslut").listeners.click.forEach(f => f({}));
  assert.match(a.el("#bokslut").innerHTML, /Text till kursbokslutet/);
  assert.match(a.el("#bokslut").innerHTML, /Ordinarie tentamen skrevs av/);
  a.ev("setStep('triage')");
  assert.equal(a.el("#exp-bokslut").classList.contains("hidden"), true);
});
test("kvittot säger hur listan passade, och en lista utan träffar används inte", () => {
  const a = loadApp(); setupDirty(a.ev);
  a.ev("globalThis.A1 = makeDirty(); globalThis.IDS = A1.ext_inspera_candidates.map(c => String(c.result.ext_inspera_candidateId));");
  const fit = a.evj("regFit([A1], [IDS[0], IDS[1], 'finns-inte'])");
  assert.deepEqual({ listed: fit.listed, hit: fit.hit, miss: fit.miss, reg: fit.reg, used: fit.used }, { listed: 3, hit: 2, miss: 1, reg: 2, used: true });
  assert.match(a.ev("regNote(regFit([A1], [IDS[0], IDS[1], 'finns-inte']))"), /1 av Ladok-listans 3 koder finns inte bland tentans studenter/);
  assert.equal(a.ev("regNote(regFit([A1], IDS))"), "");
  // Koder som saknas bland studenterna följer med som antal, så att steg 3 och Excel kan varna.
  a.ev("globalThis.PM = buildPackage({jsonObjs:[A1], pdfMcqs:null, tagRows:null, regCodes:[IDS[0], 'finns-inte']})");
  assert.deepEqual(a.evj("PM.regList"), { listed: 2, miss: 1 });
  assert.ok(!/finns-inte/.test(a.ev("JSON.stringify(PM)")));
  assert.match(a.ev("regNote(regFit([A1], ['x', 'y']))"), /listan används inte/);
  assert.ok(!/fl_registered/.test(a.ev("JSON.stringify(buildPackage({jsonObjs:[A1], pdfMcqs:null, tagRows:null, regCodes:['x','y']}))")));
  assert.equal(a.evj("prepReceipt({jsonObjs:[A1], pdfMcqs:null, tagRows:null, regCodes:[IDS[0]]})").reg.reg, 1);
  assert.equal(a.evj("prepReceipt({jsonObjs:[A1], pdfMcqs:null, tagRows:null})").reg, null);
});
