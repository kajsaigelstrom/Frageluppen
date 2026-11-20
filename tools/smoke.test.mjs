import test from "node:test"; import assert from "node:assert/strict";
import { loadApp, fingerprint } from "./harness.mjs";
test("appen laddas och demodatan går att räkna", () => {
  const { ev } = loadApp();
  assert.equal(ev("VERSION"), "3.24.1");
  const n = ev("parseJSON([demoToInspera(DEMO_DATA.DEMO)]).candCount");
  assert.ok(n > 20);
  const fp = fingerprint(ev, "parseJSON([demoToInspera(DEMO_DATA.DEMO)])");
  assert.equal(JSON.parse(fp).candCount, n);
});
