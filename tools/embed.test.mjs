// Inbäddad visning (Teams-appens förhandsvisning m.fl.): sidan säger att knapparna inte fungerar där.
import test from "node:test"; import assert from "node:assert/strict";
import { loadApp, appSource } from "./harness.mjs";
test("sidan känner av när den visas inbäddad", () => {
  const { ev } = loadApp();
  assert.equal(ev("isEmbedded()"), false);
  ev("window.top = {}");
  assert.equal(ev("isEmbedded()"), true);
});
test("varningen visas i verktyget och följer med i temarapporten", () => {
  const { ev } = loadApp();
  assert.match(ev("EMBED_NOTE"), /Öppna filen i webbläsaren/);
  const fns = ev("temaFns().map(f => f.name)");
  assert.ok(fns.includes("embeddedNote") && fns.includes("isEmbedded"));
  assert.ok(ev("temaConsts()").includes("EMBED_NOTE"));
  const src = appSource();
  assert.match(src, /\nembeddedNote\(\);\nwireHelp\(\);/);                    // huvudsidan
  assert.match(src, /function xExportInit\(\)\{\n  embeddedNote\(\);/);        // temarapporten
});
