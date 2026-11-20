import test from "node:test"; import assert from "node:assert/strict";
import { loadApp, fingerprint } from "./harness.mjs";
test("appen laddas och demodatan går att räkna", () => {
  const { ev } = loadApp();
  assert.match(ev("VERSION"), /^\d+\.\d+\.\d+$/);
  const n = ev("parseJSON([demoToInspera(DEMO_DATA.DEMO)]).candCount");
  assert.ok(n > 20);
  const fp = fingerprint(ev, "parseJSON([demoToInspera(DEMO_DATA.DEMO)])");
  assert.equal(JSON.parse(fp).candCount, n);
});
