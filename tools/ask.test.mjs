import test from "node:test"; import assert from "node:assert/strict";
import { loadApp } from "./harness.mjs";
const fresh = () => {
  const a = loadApp();
  a.ev(`globalThis.mk = function(over){
    const v = Object.assign({ seq:"1", n:100, sig:0.2, rpb:0.3, correctIdx:0,
      opts:["Rätt svar alfa","Distraktor beta","Distraktor gamma","Distraktor delta"],
      counts:[70,10,10,10], optPbis:[0.3,-0.1,-0.1,-0.1], bestDistIdx:-1, bestDistPbis:null,
      slotAmbiguous:false, orphanSlots:[] }, over||{});
    v.ncorr = v.counts[v.correctIdx]; v.pcorr = v.ncorr / v.n * 100; return v; };
    globalThis.keys = over => askQuestions(mk(over)).map(q => q.key);`);
  return a;
};

test("negativ diskriminering ger facitfrågan först", () => {
  const { ev, evj } = fresh();
  const qs = evj("askQuestions(mk({rpb:-0.4, counts:[50,20,15,15]}))");
  assert.equal(qs[0].key, "facit");
  assert.equal(qs[0].text, "Stämmer facit? Kan frågan läsas på ett sätt som gör ett annat svar rätt?");
});
test("distraktor som starka studenter valde ger försvarsfrågan med alternativet utskrivet", () => {
  const { evj } = fresh();
  const qs = evj("askQuestions(mk({rpb:0.05, counts:[50,30,10,10], bestDistIdx:1, bestDistPbis:0.3}))");
  assert.equal(qs[0].key, "forsvar");
  assert.equal(qs[0].text, "Går alternativet «Distraktor beta» att försvara som rätt eller delvis rätt?");
});
test("nära gissningsnivå utan diskriminering ger tydlighetsfrågan", () => {
  const { evj } = fresh();
  assert.deepEqual(evj("keys({rpb:0.05, counts:[28,25,24,23]})"), ["tydlig"]);
  assert.equal(evj("askQuestions(mk({rpb:0.05, counts:[28,25,24,23]}))[0].text"), "Var det tydligt vad som efterfrågades?");
});
test("högst två frågor, i fast ordning", () => {
  const { evj } = fresh();
  // negativ diskriminering + populär distraktor bland svaga + ett alternativ nästan ingen valde = tre villkor
  assert.deepEqual(evj("advice(mk({rpb:-0.4, counts:[30,50,18,2]})).l1.concat(advice(mk({rpb:-0.4, counts:[30,50,18,2]})).l2).map(a=>a.psy)"),
    ["rpb-neg","misconception","distractor-eff"]);
  assert.deepEqual(evj("keys({rpb:-0.4, counts:[30,50,18,2]})"), ["facit","undervisning"]);
});
test("populär distraktor bland svagare studenter ger undervisningsfrågan", () => {
  const { evj } = fresh();
  const qs = evj("askQuestions(mk({rpb:0.3, counts:[40,45,8,7]}))");
  assert.equal(qs[0].key, "undervisning");
  assert.equal(qs[0].text, "Är det här en missuppfattning som undervisningen kan möta?");
});
test("alternativ som nästan ingen valde ger distraktorfrågan", () => {
  const { evj } = fresh();
  const qs = evj("askQuestions(mk({rpb:0.3, counts:[70,20,9,1]}))");
  assert.deepEqual(qs.map(q => q.key), ["distraktor"]);
  assert.equal(qs[0].text, "Var alternativet ett rimligt svar för en student som inte kan området?");
});
test("mycket lätt fråga ger nivåfrågan", () => {
  const { evj } = fresh();
  const qs = evj("askQuestions(mk({n:80, counts:[76,2,1,1], rpb:0.05}))");
  assert.deepEqual(qs.map(q => q.key), ["latt"]);
  assert.equal(qs[0].text, "Nästan alla svarade rätt. Är det väntat för det här målet, eller prövar frågan något enklare än ni avsåg?");
});
test("ledtråd och lätt ger bara ledtrådsfrågan, med iakttagelsen", () => {
  const { evj } = fresh();
  const qs = evj(`askQuestions(mk({n:80, counts:[76,2,1,1], rpb:0.05,
    opts:["Ett mycket långt och utförligt rätt svar som sticker ut tydligt från de andra","Kort b","Kort c","Kort d"]}))`);
  assert.deepEqual(qs.map(q => q.key), ["ledtrad"]);
  assert.equal(qs[0].text, "Finns det något i formuleringen som pekar ut svaret, eller prövar frågan något enklare än ni avsåg?");
  assert.match(qs[0].fact, /längsta/);
});
test("liten grupp ger inga frågor", () => {
  const { evj } = fresh();
  assert.deepEqual(evj("keys({n:3, counts:[3,0,0,0], rpb:null})"), []);
  assert.deepEqual(evj("keys({n:19, counts:[19,0,0,0], rpb:null})"), []);
});
test("exkluderad fråga ger inga frågor", () => {
  const { ev, evj } = fresh();
  ev("state.excluded.set('9','Tekniskt fel')");
  assert.deepEqual(evj("keys({seq:'9', rpb:-0.4, counts:[50,20,15,15]})"), []);
});
test("lätt-gränsen följer inställningen", () => {
  const { ev, evj } = fresh();
  assert.deepEqual(evj("keys({n:80, counts:[68,4,4,4]})"), []);
  ev("setThreshold('easy', 80)");
  assert.deepEqual(evj("keys({n:80, counts:[68,4,4,4]})"), ["latt"]);
});
test("nivåraden går att stänga av", () => {
  const { ev, evj } = fresh();
  ev("ASK_ORDER.splice(ASK_ORDER.indexOf('latt'), 1)");
  assert.deepEqual(evj("keys({n:80, counts:[76,2,1,1], rpb:0.05})"), []);
});
test("bra fråga ger inga frågor", () => {
  const { evj } = fresh();
  assert.deepEqual(evj("keys({n:90, counts:[65,9,8,8], rpb:0.35})"), []);
});
test("alla lydelser finns för alla nycklar i ordningen", () => {
  const { evj } = fresh();
  assert.deepEqual(evj("ASK_ORDER"), ["facit","forsvar","tydlig","undervisning","ledtrad","distraktor","latt"]);
  for (const k of evj("ASK_ORDER")) assert.ok(evj(`ASK_TEXT[${JSON.stringify(k)}]`).length > 10, k);
});
