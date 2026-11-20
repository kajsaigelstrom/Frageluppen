import test from "node:test"; import assert from "node:assert/strict"; import crypto from "node:crypto";
import { loadApp } from "./harness.mjs";
import { setupDemoView, SNAPSHOT_EXPR } from "./fixtures.mjs";
import baseline from "./fixtures/baseline-demo.mjs";
const fresh = () => { const a = loadApp(); setupDemoView(a.ev); return a; };
const snapshot = evj => { const s = evj(SNAPSHOT_EXPR); for (const c of s.cards) c.html = crypto.createHash("sha1").update(c.html).digest("hex"); return s; };

test("standardgränserna ger exakt samma utfall som förut", () => {
  const { ev, evj } = fresh();
  assert.deepEqual(evj("TH_DEFAULT"), { easy: 90, hard: 60, goodDisc: 0.2, pass: 65 });
  assert.deepEqual(evj("state.th"), evj("TH_DEFAULT"));
  assert.deepEqual(snapshot(evj), baseline);
});
test("sänkt gräns för Lätt flyttar märkningen", () => {
  const { ev, evj } = fresh();
  const seq = evj("VIEW.find(v => v.pcorr >= 80 && v.pcorr < 90).seq");
  const html = `card(VIEW.find(v => String(v.seq) === ${JSON.stringify(String(seq))}))`;
  assert.ok(!ev(html).includes("badge easy"));
  assert.equal(ev("setThreshold('easy', 80)"), true);
  assert.ok(ev(html).includes("badge easy"));
});
test("höjd gräns för Svår flyttar märkningen", () => {
  const { ev, evj } = fresh();
  const seq = evj("VIEW.find(v => v.pcorr >= 60 && v.pcorr < 70).seq");
  const html = `card(VIEW.find(v => String(v.seq) === ${JSON.stringify(String(seq))}))`;
  assert.ok(!ev(html).includes("badge hard"));
  assert.equal(ev("setThreshold('hard', 70)"), true);
  assert.ok(ev(html).includes("badge hard"));
});
test("gränsen för god diskriminering styr etiketten", () => {
  const { ev } = fresh();
  assert.equal(ev("rpbInfo({n:100, ncorr:50, rpb:0.22}).label"), "god");
  assert.equal(ev("setThreshold('goodDisc', 0.25)"), true);
  assert.equal(ev("rpbInfo({n:100, ncorr:50, rpb:0.22}).label"), "acceptabel");
});
test("godkäntgränsen styr godkäntandelen", () => {
  const { ev, evj } = fresh();
  const before = evj("passMetric(new Set())");
  assert.equal(ev("setThreshold('pass', 50)"), true);
  const after = evj("passMetric(new Set())");
  assert.equal(after.thr, 50); assert.ok(after.pass > before.pass);
});
test("ogiltiga värden avvisas", () => {
  const { ev, evj } = fresh();
  for (const [k, v] of [["easy",""],["easy","abc"],["easy",69],["easy",101],["hard",71],["hard",29],["goodDisc",0.5],
                        ["goodDisc",0.05],["pass",49],["okand",5],["easy",null],["easy",NaN],["easy","  "]])
    assert.equal(ev(`setThreshold(${JSON.stringify(k)}, ${typeof v === "number" && isNaN(v) ? "NaN" : JSON.stringify(v)})`), false, `${k}=${v}`);
  assert.deepEqual(evj("state.th"), evj("TH_DEFAULT"));
});
test("Svår kan inte sättas lika med eller över Lätt", () => {
  const { ev } = fresh();
  assert.equal(ev("setThreshold('easy', 70)"), true);
  assert.equal(ev("setThreshold('hard', 70)"), false);
  assert.equal(ev("state.th.hard"), 60);
  assert.equal(ev("setThreshold('hard', 69)"), true);
  assert.equal(ev("setThreshold('easy', 100)"), true);
  assert.equal(ev("setThreshold('hard', 70)"), true);
  assert.equal(ev("setThreshold('easy', 70)"), false);
});
test("decimalkomma godtas", () => {
  const { ev } = fresh();
  assert.equal(ev("setThreshold('goodDisc','0,25')"), true);
  assert.equal(ev("state.th.goodDisc"), 0.25);
  assert.equal(ev("setThreshold('easy','85')"), true);
  assert.equal(ev("state.th.easy"), 85);
});
test("thresholdsCustom och resetThresholds", () => {
  const { ev, evj } = fresh();
  assert.equal(ev("thresholdsCustom()"), false);
  ev("setThreshold('easy', 85)");
  assert.equal(ev("thresholdsCustom()"), true);
  assert.match(ev("thresholdsText()"), /Lätt från 85 %.*Svår under 60 %.*God diskriminering från 0,20/);
  ev("resetThresholds()");
  assert.equal(ev("thresholdsCustom()"), false);
  assert.deepEqual(evj("state.th"), evj("TH_DEFAULT"));
  assert.equal(ev("state.th === TH_DEFAULT"), false);
});
