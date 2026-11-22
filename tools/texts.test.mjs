// Texterna ur tre läsares perspektiv: kurssamordnaren, examinatorn (före och efter rättning) och temagruppens
// representant. Samma sak ska heta samma sak överallt, och ingen ska få en uppmaning som hen inte kan följa.
import test from "node:test"; import assert from "node:assert/strict"; import fs from "node:fs";
import { loadApp, runHtml, INDEX } from "./harness.mjs";
import { setupDemoView } from "./fixtures.mjs";
const SRC = fs.readFileSync(INDEX, "utf8");
const STATIC = SRC.split("<script>")[0];
const tema = () => { const a = loadApp(); setupDemoView(a.ev); return { ...a, html: a.ev("buildTemaReport(temaEmbed())") }; };

test("samma ord för samma sak i hela verktyget", () => {
  for (const [bad, why] of [
    ["att åtgärda", "korten och filtret säger 'att se över'"],
    ["utesluta frågan", "knappen heter Exkludera"], ["utesluta den", "knappen heter Exkludera"],
    ["MCQ-delsumman", "heter poängen på flervalsdelen"],
    ["betygsättning", "stavas betygssättning"],
    ["fel nyckel", "heter facit"], ["kontrollera nyckel", "heter facit"],
    ["kandidater", "heter studenter i all text som visas"], ["kandidatsvar", "heter studenters svar"],
    ["JSON-läge", "examinatorn har aldrig sett någon JSON-fil"],
    ["MCQ i PDF", "examinatorn har aldrig sett någon PDF"],
  ]) {
    const visible = SRC.split("\n").filter(l => !/^\s*(\/\/|\/\*|\*)/.test(l) && l.split(/\s\/\/\s/)[0].includes(bad));
    assert.deepEqual(visible.map(l => l.trim().slice(0, 90)), [], `${bad}: ${why}`);
  }
});
test("sidhuvudet säger inte att verktyget bara gäller flervalsfrågor", () => {
  assert.ok(!/<h1>[^<]*MCQ-analys/.test(STATIC));
});
test("steg 1 har inga inställningar, och säger vad PDF och taggfil ger", () => {
  const { ev, el } = loadApp();
  ev("setPrep(true)");
  assert.equal(el("#settings-open").classList.contains("hidden"), true);
  assert.match(STATIC, /id="d-pdf"[\s\S]*?Ger frågetexterna/);            // vad varje fil ger står vid filrutan
  assert.match(STATIC, /id="d-tags"[\s\S]*?per tema/);
  ev("setPrep(false)");
  assert.equal(el("#settings-open").classList.contains("hidden"), false);
  assert.match(STATIC, /id="prep-note"[^>]*>[\s\S]*?<b>en datafil<\/b>[\s\S]*?två gånger[\s\S]*?nya filer från Inspera/);
  assert.throws(() => ev("prepReceipt({jsonObjs:[buildPackage({jsonObjs:[demoToInspera(DEMO_DATA.DEMO)], pdfMcqs:null, tagRows:null})], pdfMcqs:null, tagRows:null})"),
    /redan en datafil/);
});
test("i steg 2 och 3 uppmanas ingen att ladda upp en PDF", () => {
  const { ev, el } = loadApp();
  ev("setPrep(false); loadSynthetic(); state.pdfMcqs = null; setStep('report');");
  const note = el("#pdfnote").innerHTML;
  assert.match(note, /ny datafil[\s\S]*steg 1/);
  assert.ok(!/Ladda upp/.test(note));
});
test("vyn före betygssättning talar om flervalsdelen, och säger varför", () => {
  const { ev, el } = loadApp();
  ev("setPrep(false); loadSynthetic(); setStep('triage');");
  const hint = el("#modehint").textContent;
  assert.match(hint, /poängen på flervalsdelen/);
  assert.match(hint, /essäfrågorna inte är rättade/);
  assert.ok(!/fritext|trasiga/.test(hint));
  assert.match(el("#modeseg").innerHTML, /Att se över/);
  assert.match(ev("rpbInfo({n:100, ncorr:60, rpb:0.25, bestDistIdx:-1, bestDistPbis:null}).tip"), /studentens poäng på flervalsdelen/);
});
test("hjälpen i appen förklarar alla frågetyper, förbehållet om målrelaterat prov och slumpen", () => {
  const h = loadApp().ev("HELP_HTML");
  assert.match(h, /Essä- och flersvarsfrågor/);
  assert.match(h, /På ett målrelaterat\s+prov är det inget fel i sig/);
  assert.match(h, /Med många frågor uppstår enstaka varningar av slump\. En varning är ett\s+skäl att läsa frågan, inte ett bevis på att den är fel\./);
  assert.ok(!/starka|svaga|r<sub>pb|Distraktorfärger|gör sitt jobb|överväg omskrivning|medelsvåra/.test(h));
  assert.ok(!/fliken Examinator/.test(h));
});
test("temarapportens hjälp talar till mottagaren", () => {
  const h = loadApp().ev("HELP_TEMA_HTML");
  assert.ok(!h.includes("taggfilen"), "mottagaren har aldrig sett någon taggfil");
  assert.ok(!h.includes("godkäntandel"), "ingen godkäntandel finns i rapporten");
  assert.match(h, /distraktor[\s\S]{0,40}felaktigt svarsalternativ|felaktigt svarsalternativ[\s\S]{0,40}distraktor/i);
  assert.ok(!/starka|svaga|r<sub>pb|Färgerna på alternativen|Att fråga sig<\/summary>/.test(h));
  assert.match(h, /På ett målrelaterat\s+prov är det inget fel i sig/);
  assert.match(h, /frågetexterna och rätt svar/);
  assert.match(h, /poängfördelning/);
  assert.match(h, /Med observation/);
});
test("temarapporten räknar studenter, inte kandidater", () => {
  const { html } = tema();
  const page = runHtml(html);
  assert.match(page.el("#fileline").textContent, /studenter/);
  assert.ok(!/kandidat/i.test(page.el("#fileline").textContent + page.el("#cards").innerHTML));
});
test("examinatorns PDF är borta ur sidan och ur hjälpen", () => {
  for (const gone of ['id="exp-pdf"', "PDF (examinatorns)", "arbetsunderlag", "exportPdf"]) assert.ok(!SRC.includes(gone), gone);
});
