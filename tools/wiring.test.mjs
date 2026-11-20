// Fångar knappar som finns i sidan men inte är kopplade till något. Övriga tester anropar funktionerna
// direkt och märker därför inte om en klickkoppling har fallit bort.
import test from "node:test"; import assert from "node:assert/strict"; import fs from "node:fs";
import { loadApp, INDEX } from "./harness.mjs";

test("varje knapp i sidan har en klickkoppling", () => {
  const html = fs.readFileSync(INDEX, "utf8").split("<script>")[0];          // sidans statiska del
  const ids = [...html.matchAll(/<button[^>]*\bid="([^"]+)"/g)].map(m => m[1]);
  assert.ok(ids.length >= 10, "hittade för få knappar: " + ids.join(", "));
  const { el } = loadApp();
  const unwired = ids.filter(id => !((el("#" + id).listeners.click || []).length));
  assert.deepEqual(unwired, []);
});
test("klick på Spara examinatorns fil ger en fil", async () => {
  const { ev, el, downloads } = loadApp();
  ev("state.prepDemo = true");
  const handlers = el("#prep-save").listeners.click || [];
  assert.equal(handlers.length, 1);
  await handlers[0]({});
  assert.equal(downloads.length, 1);
  assert.match(downloads[0].parts[0], /^<!DOCTYPE html>/);
});
test("klick på Ändra filer öppnar filpanelen igen", () => {
  const { ev, el } = loadApp();
  ev("collapseUpload()");
  assert.equal(el("#uploadfull").classList.contains("hidden"), true);
  (el("#reopen").listeners.click || []).forEach(f => f({}));
  assert.equal(el("#uploadfull").classList.contains("hidden"), false);
});
