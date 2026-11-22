// Ett kort överallt (Kajsas beslut 21 och 22 nov 2026): uppmaningar bara före betygssättning, allt annat som
// observation med möjliga orsaker under "Mer om måttet". Lydelserna här är de godkända.
import test from "node:test"; import assert from "node:assert/strict";
import { loadApp } from "./harness.mjs";
const fresh = () => {
  const a = loadApp();
  a.ev(`globalThis.mk = function(over){
    const v = Object.assign({ seq:"1", n:100, sig:0.2, rpb:0.3, correctIdx:0, stem:"",
      opts:["Rätt svar alfa","Distraktor beta","Distraktor gamma","Distraktor delta"],
      counts:[70,10,10,10], optPbis:[0.3,-0.1,-0.1,-0.1], bestDistIdx:-1, bestDistPbis:null,
      slotAmbiguous:false, orphanSlots:[], unmappedPdf:[], tags:[], tagVals:[] }, over||{});
    v.ncorr = v.counts[v.correctIdx]; v.pcorr = v.ncorr / v.n * 100; return v; };
    globalThis.l1 = over => advice(mk(over)).l1; globalThis.l2 = over => advice(mk(over)).l2;
    globalThis.app = (over, mode) => { state.mode = mode || "edu"; state.view = "final"; return card(mk(over)); };`);
  return a;
};
const NEG = "{rpb:-0.4, counts:[50,20,15,15]}";

test("tydligt negativ r ger Dubbelkolla facit, och 'talar starkt för' bara nära gissningsnivå", () => {
  const { evj } = fresh();
  const a = evj(`l1(${NEG})`)[0];
  assert.equal(a.action, "Dubbelkolla facit");
  assert.equal(a.why, "Studenter med hög totalpoäng svarade oftare fel än övriga. Det kan bero på att facit är fel eller att frågan är vilseledande. Kontrollera facit före betygssättningen, och rätta det eller exkludera frågan om felet bekräftas.");
  const b = evj("l1({rpb:-0.4, counts:[28,25,24,23]})")[0];
  assert.equal(b.obs, "Andelen rätt ligger nära gissningsnivå, och studenter med hög totalpoäng svarade oftare fel än övriga. Det talar starkt för att facit är fel eller att frågan är vilseledande.");
});
test("Se över frågan nära gissningsnivå har en lydelse för låg r och en för ej mätbar", () => {
  const { evj } = fresh();
  assert.equal(evj("l1({rpb:0.05, counts:[28,25,24,23]})")[0].why,
    "Andelen rätt ligger nära gissningsnivå, och de som svarade rätt hade inte högre totalpoäng än övriga. Frågan kan vara otydlig, felaktig eller gälla stoff som inte har undervisats. Överväg att exkludera den.");
  assert.equal(evj("l1({rpb:0.5, counts:[4,40,30,26]})")[0].why,
    "Andelen rätt ligger nära gissningsnivå. Diskrimineringen går inte att mäta eftersom bara 4 svarade rätt. Kontrollera frågan och facit före betygssättningen.");
});
test("vanligt felsvar är en observation, med riktningen i ord och aldrig som tecken", () => {
  const { evj } = fresh();
  const o = evj("l2({rpb:0.3, counts:[40,45,8,7], optPbis:[0.3,-0.3,-0.1,-0.1]})").find(x => x.psy === "misconception");
  assert.equal(o.action, "Vanligt felsvar");
  assert.equal(o.why, "Fler valde «Distraktor beta» än rätt svar (45 % mot 40 %). «Distraktor beta» valdes oftare av studenter med lägre totalpoäng.");
  const inom = evj("l2({rpb:0.3, counts:[40,45,8,7], optPbis:[0.3,-0.1,-0.1,-0.1]})").find(x => x.psy === "misconception");
  assert.equal(inom.why, "Fler valde «Distraktor beta» än rätt svar (45 % mot 40 %).");
  const hogre = evj("l2({rpb:0.3, counts:[40,45,8,7], optPbis:[0.3,0.3,-0.1,-0.1]})").find(x => x.psy === "misconception");
  assert.match(hogre.why, /valdes oftare av studenter med högre totalpoäng\.$/);
  assert.match(evj("PSY.misconception"), /Statistiken kan inte skilja orsakerna åt\.$/);
});
test("sällan valda alternativ skrivs ut med andel", () => {
  const { evj } = fresh();
  const o = evj("l2({rpb:0.3, counts:[70,20,9,1]})");
  assert.deepEqual(o.map(x => x.psy), ["distractor-eff"]);
  assert.equal(o[0].action, "Sällan valda alternativ");
  assert.equal(o[0].why, "«Distraktor delta» valdes av 1 % av studenterna.");
  assert.equal(evj("l2({rpb:0.3, counts:[70,26,4,0]})")[0].why, "«Distraktor gamma» valdes av 4 % av studenterna. «Distraktor delta» valdes inte av någon.");
});
test("få svarade rätt: observationen säger hur felen fördelar sig", () => {
  const { evj } = fresh();
  const samlas = evj("l2({rpb:0.25, counts:[40,40,10,10], optPbis:[0.25,0,0,0]})").find(x => x.psy === "few-correct");
  assert.equal(samlas.action, "Få svarade rätt");
  assert.equal(samlas.why, "Felen samlas på «Distraktor beta».");
  assert.equal(evj("l2({rpb:0.25, counts:[40,20,20,20]})").find(x => x.psy === "few-correct").why, "Felen är jämnt spridda över alternativen.");
  assert.match(evj("PSY['few-correct']"), /stoff som undervisningen inte har täckt/);
});
test("mycket lätt fråga får en rad bara när lathundens formkontroll hittar något", () => {
  const { evj } = fresh();
  assert.deepEqual(evj("l2({n:80, counts:[76,2,1,1], rpb:0.05})"), []);
  const o = evj(`l2({n:80, counts:[76,2,1,1], rpb:0.05, stem:"En patient söker för yrsel sedan en vecka. Vilken är den mest sannolika diagnosen?",
    opts:["Ett mycket långt och utförligt rätt svar som sticker ut tydligt från alla de andra alternativen","Kort b","Kort c","Kort d"]})`);
  assert.deepEqual(o.map(x => x.psy), ["easy"]);
  assert.ok(o[0].form.length >= 1 && o[0].form.length <= 2);
  assert.match(evj("PSY.easy"), /känd sedan tidigare/);
});
test("den äldre egna formkontrollen är borta: lathunden är enda källan", () => {
  const { ev } = fresh();
  for (const n of ["cueScan", "cueWords", "TW", "CUE_ABS", "askQuestions", "cardQuestions", "formFor", "ASK_ORDER"]) assert.equal(ev(`typeof ${n}`), "undefined", n);
  assert.ok(!/testwiseness/i.test(ev("advice.toString() + card.toString()")));
});
test("liten grupp ger varken uppmaning eller observation, och kortet säger varför", () => {
  const { evj } = fresh();
  const a = evj("advice(mk({n:19, counts:[10,5,3,1], rpb:0.1}))");
  assert.deepEqual([a.l1, a.l2], [[], []]);
  assert.equal(a.note, "Kortet visar bara mätvärdena eftersom färre än 30 svarade (n=19).");
});
test("examinatorns kort: uppmaning under Att se över, observation under Observationer, orsaker under Mer om måttet", () => {
  const { ev } = fresh();
  const h = ev("app({rpb:-0.4, counts:[30,50,18,2], optPbis:[-0.4,0.1,0,0]})");
  assert.match(h, /Att se över[\s\S]*Dubbelkolla facit[\s\S]*Observationer[\s\S]*Vanligt felsvar[\s\S]*Sällan valda alternativ/);
  assert.match(h, /Mer om måttet/);
  assert.ok(!/Till nästa gång|psykometriken|Att fråga sig|undervisningen kan möta/.test(h));
  assert.equal(ev("app({n:90, counts:[65,9,8,8], rpb:0.35})").includes("advbox"), false);
  assert.equal(ev(`app(${NEG}, "simple")`).includes("advbox"), false);
});
test("temarapportens kort: frågan i stället för uppmaningen, samma observationer", () => {
  const { ev } = fresh();
  ev(`globalThis.tema = over => { state.mode = "ask"; state.view = "final"; return card(mk(over)); };`);
  const h = ev("tema({rpb:-0.4, counts:[30,50,18,2], optPbis:[-0.4,0.1,0,0]})");
  assert.match(h, /Att fråga sig[\s\S]*Stämmer facit\?[\s\S]*Observationer[\s\S]*Vanligt felsvar/);
  assert.ok(!/Dubbelkolla facit|Kontrollera facit|före betygssättningen|exkludera/i.test(h));
  const f = ev("tema({rpb:0.05, counts:[50,30,10,10], bestDistIdx:1, bestDistPbis:0.3, optPbis:[0.05,0.3,0,0]})");
  assert.match(f, /Går alternativet «Distraktor beta» att försvara som rätt eller delvis rätt\?/);
  const g = ev("tema({rpb:0.05, counts:[28,25,24,23]})");
  assert.match(g, /Nära gissningsnivå/);
  assert.ok(!/Se över frågan|Överväg att exkludera/.test(g));
});
test("ett alternativs riktning står i ord, och siffran i verktygstipset", () => {
  const { ev } = fresh();
  const h = ev("app({rpb:0.05, counts:[50,30,10,10], bestDistIdx:1, bestDistPbis:0.3, optPbis:[0.05,0.3,-0.3,0]})");
  assert.match(h, /class="discmark">valdes oftare av studenter med högre totalpoäng</);
  assert.match(h, /title="Valdes oftare av studenter med högre totalpoäng\. r för alternativet \+0,30"/);
  assert.match(h, /title="Valdes oftare av studenter med lägre totalpoäng\. r för alternativet −0,30"/);
  assert.ok(!/starka|svaga|r_pb|<sub>pb/i.test(h));
});
test("tal visas med decimalkomma, och ej mätbar r säger skälet utan värdering", () => {
  const { ev, evj } = fresh();
  assert.match(ev("app({counts:[70,10,10,10], rpb:0.284})"), /70,0 % rätt[\s\S]*r \+0,28/);
  const i = evj("rpbInfo(mk({counts:[97,1,1,1], rpb:0.2}))");
  assert.equal(i.label, "ej mätbar"); assert.equal(i.note, "bara 3 svarade fel");
  assert.equal(i.tip, "Diskrimineringen går inte att mäta eftersom bara 3 svarade fel. (Beräknat värde +0,20, men opålitligt.)");
  assert.match(ev("app({counts:[97,1,1,1], rpb:0.2})"), /ej mätbar \(bara 3 svarade fel\)/);
  const src = ev("rpbInfo.toString() + polyInfo.toString()");
  assert.ok(!/tak ≈|för lätt|för svår|starka|svaga/i.test(src));
});
