// Hämtar den mekaniska kontrollen ur MCQ-lathunden och lägger in den, oförändrad, i index.html.
//
//   node tools/sync-lathund.mjs <mappen med lathundens kontroll.js, innehall.js och logik.js>
//   node tools/sync-lathund.mjs <mapp> --check     (ändrar inget; avslutar med fel om något skiljer sig)
//
// Två märkta avsnitt i index.html skrivs om:
//   LATHUND-KONTROLL  = kontroll.js ordagrant (regelkoden)
//   LATHUND-REGLER    = rubrik, råd, varför och källa per regel, uppslagna ur innehall.js
// MCQ-lathunden är källan. Ändra aldrig avsnitten för hand – ändra i lathunden och kör skriptet.
import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module";
import { INDEX } from "./harness.mjs";

export function build(dir) {
  const require = createRequire(import.meta.url);
  const I = require(path.resolve(dir, "innehall.js"));
  const L = require(path.resolve(dir, "logik.js"));
  const kod = fs.readFileSync(path.join(dir, "kontroll.js"), "utf8").replace(/\s+$/, "");
  const NIVA = 2, regler = {};
  for (const [id, r] of Object.entries(I.kontroll.regler)) {
    let rad = null;
    if (r.rad) { const s = I.steg.find(x => x.id === r.rad.steg); rad = s && s.rad.find(x => x.id === r.rad.id); }
    const v = rad ? L.perNiva(rad.varfor, NIVA) : null;
    regler[id] = {
      prio: r.prio,
      rubrik: r.rubrik || (rad && L.perNiva(rad.rubrik, NIVA)) || "",
      text: r.text || (rad && L.perNiva(rad.text, NIVA)) || "",
      varfor: (v && v.logik) || "", ref: (v && v.ref) || "",
      belagg: (rad && L.perNiva(rad.belagg, NIVA)) || "",
    };
  }
  const meta = { version: I.meta.version, datum: I.meta.datum, licens: I.meta.licens, upphov: I.meta.upphov };
  return { kod, regler, meta };
}
const region = (name, body) => `/* <${name}> */\n${body}\n/* </${name}> */`;
export function apply(html, { kod, regler, meta }) {
  const swap = (h, name, body) => {
    const re = new RegExp(`/\\* <${name}> \\*/[\\s\\S]*?/\\* </${name}> \\*/`);
    if (!re.test(h)) throw new Error("Hittar inte avsnittet " + name + " i index.html");
    return h.replace(re, () => region(name, body));
  };
  html = swap(html, "LATHUND-KONTROLL", kod);
  html = swap(html, "LATHUND-REGLER", `const FORM_META = ${JSON.stringify(meta)};\nconst FORM_REGLER = ${JSON.stringify(regler, null, 1)};`);
  return html;
}
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("sync-lathund.mjs")) {
  const dir = process.argv[2], check = process.argv.includes("--check");
  if (!dir) { console.error("Ange mappen med MCQ-lathundens filer."); process.exit(2); }
  const before = fs.readFileSync(INDEX, "utf8"), after = apply(before, build(dir));
  if (before === after) console.log("Frågeluppen har samma kontroll som MCQ-lathunden.");
  else if (check) { console.log("SKILJER SIG: kör skriptet utan --check för att hämta lathundens version."); process.exit(1); }
  else { fs.writeFileSync(INDEX, after); console.log("index.html uppdaterad från MCQ-lathunden."); }
}
