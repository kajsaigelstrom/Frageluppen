// Kommentarer på frågor och exporten Problemfrågor (Kajsa 21 nov 2026). Examinatorn skriver en kommentar på kortet;
// den följer med till betygskollegiet (Problemfrågor, före betygssättning) och till temagrupperna (Temarapporten).
import test from "node:test"; import assert from "node:assert/strict"; import fs from "node:fs";
import { loadApp, runHtml, INDEX } from "./harness.mjs";
const STATIC = fs.readFileSync(INDEX, "utf8").split("<script>")[0];
const at = step => { const a = loadApp(); a.ev(`setPrep(false); loadSynthetic(); collapseUpload(); setStep('${step}');`); return a; };
const fire = (a, type, cls, seq, value) => a.ev(`document.querySelector("#cards").listeners[${JSON.stringify(type)}]
  .forEach(f => f({ target: { closest: s => s === ${JSON.stringify(cls)} ? { dataset: { qnum: ${JSON.stringify(String(seq))} }, value: ${JSON.stringify(value || "")} } : null } }))`);
const part = (a, seq) => a.el("#cards").innerHTML.split(`id="card-${seq}"`)[1].split('class="q ')[0];
const last = a => { const b = a.downloads[a.downloads.length - 1]; return b ? b.parts.join("") : ""; };

test("varje kort har Lägg till kommentar, och texten sparas på frågan", () => {
  const a = at("triage");
  const seq = a.ev("String(state.vm.view.find(v => v.advice.l1.length).seq)");
  assert.match(part(a, seq), /class="card-comment[^>]*>Lägg till kommentar</);
  fire(a, "click", ".card-comment", seq);
  assert.match(part(a, seq), /<textarea class="card-cmt"/);
  fire(a, "input", ".card-cmt", seq, "Två alternativ går att försvara <här>.");
  assert.equal(a.ev(`state.comments.get(${JSON.stringify(seq)})`), "Två alternativ går att försvara <här>.");
  a.ev("render()");
  assert.match(part(a, seq), /Två alternativ går att försvara &lt;här&gt;\./);     // texten står kvar och är oskadliggjord
  fire(a, "input", ".card-cmt", seq, "   ");
  assert.equal(a.ev(`state.comments.has(${JSON.stringify(seq)})`), false);          // tom kommentar tas bort
});
test("essä- och flersvarskort kan också kommenteras, i hela rapporten", () => {
  const a = at("report");
  const seq = a.ev("state.scored[0].seq");
  assert.match(part(a, seq), /class="card-comment/);
  fire(a, "input", ".card-cmt", seq, "Bedömningsmallen bör ses över.");
  a.ev("render()");
  assert.match(part(a, seq), /Bedömningsmallen bör ses över\./);
});
test("Problemfrågor finns bara före betygssättning och är en fristående sida till betygskollegiet", () => {
  assert.match(STATIC, /class="exports"[\s\S]*id="exp-problems"/);
  const r = at("report");
  assert.equal(r.el("#exp-problems").classList.contains("hidden"), true);
  const a = at("triage");
  assert.equal(a.el("#exp-problems").classList.contains("hidden"), false);
  const flagged = a.evj("state.vm.view.filter(v => v.advice.l1.length).map(v => String(v.seq))");
  const plain = a.ev("String(state.vm.view.find(v => !v.advice.l1.length).seq)");
  const excl = a.ev("String(state.vm.view.filter(v => !v.advice.l1.length)[1].seq)");
  const none = a.ev("String(state.vm.view.filter(v => !v.advice.l1.length)[2].seq)");
  a.ev(`state.comments.set('${plain}', 'Fråga från en student, värd att diskutera.'); state.excluded.set('${excl}', 'Tekniskt fel'); render();`);
  (a.el("#exp-problems").listeners.click || []).forEach(f => f({}));
  const doc = last(a);
  assert.match(doc, /<h1>Problemfrågor före betygssättning<\/h1>/);
  const ids = [...doc.matchAll(/id="card-([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(ids.sort(), flagged.concat([plain, excl]).sort());        // utpekade, kommenterade och exkluderade
  assert.ok(!ids.includes(none));
  assert.match(doc, /class="cmthead">Kommentar<[\s\S]*Fråga från en student, värd att diskutera\./);
  assert.ok(!/Kommentar från/.test(doc));                                  // det står inte vem som skrev
  assert.match(doc, /Exkluderad ur tentan/);
  assert.match(doc, /poängen på flervalsdelen/);
  assert.match(doc, new RegExp(`${a.ev("state.json.candCount")} studenter`));
  assert.ok(!/<script|<textarea|<select|card-exclude|card-reinclude|card-comment|Gäller bara här/.test(doc));
  assert.equal(a.ev("!!state.exporting"), false);
});
test("kommentaren följer med till temarapporten", () => {
  const a = at("report");
  const mcq = a.ev("String(state.vm.view[0].seq)"), ess = a.ev("state.scored[0].seq");
  a.ev(`state.comments.set('${mcq}', 'Se över distraktor C.'); state.comments.set('${ess}', 'Mallen gav få mellanpoäng.'); render();`);
  assert.deepEqual(a.evj("temaEmbed().comments").map(c => c[0]).sort(), [mcq, ess].sort());
  const page = runHtml(a.ev("buildTemaReport(temaEmbed())"));
  const html = page.el("#cards").innerHTML;
  assert.match(html, /Se över distraktor C\./);
  assert.match(html, /Mallen gav få mellanpoäng\./);
  const sub = page.evj(`subsetEmbed(EMBED, [${JSON.stringify(mcq)}], state.th).comments`);
  assert.deepEqual(sub, [[mcq, "Se över distraktor C."]]);                    // en ovald frågas kommentar följer inte med
});
test("en ny fil börjar utan kommentarer", async () => {
  const a = at("triage");
  a.ev("state.comments.set('1', 'x')");
  a.ev("globalThis.F = buildExaminerFile(JSON.parse(JSON.stringify(buildPackage({jsonObjs:[demoToInspera(DEMO_DATA.DEMO)], pdfMcqs:DEMO_DATA.PDF, tagRows:null}))))");
  await a.ev("loadDataFile(F, 'f.html')");
  assert.equal(a.ev("state.comments.size"), 0);
});
