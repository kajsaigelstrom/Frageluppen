// Lokal slutkontroll mot RIKTIGA Inspera-exporter. Körs bara på den egna datorn:
//
//   node tools/compare-local.mjs <resultat1.json> [<resultat2.json> …]
//
// Bygger ett tentapaket i minnet ur råfilerna och kontrollerar att
//   1. statistiken blir identisk oavsett om tentan läses som råfiler eller som paket,
//   2. paketet inte innehåller något av det som ska bort,
//   3. temarapporten bara innehåller sammanräknade resultat.
// Skriver ALDRIG ut data – bara utfallet och, vid fel, vilken sorts uppgift det gäller.
// Skapar inga filer. Riktiga exporter får aldrig checkas in (se .gitignore).
import fs from "node:fs";
import { loadApp, fingerprint } from "./harness.mjs";

const files = process.argv.slice(2);
if (!files.length) { console.error("Ange minst en resultatfil."); process.exit(2); }
const raw = files.map(f => JSON.parse(fs.readFileSync(f, "utf8")));

const { ev, set } = loadApp();
set("RAW", raw);
ev("globalThis.PKG = JSON.parse(JSON.stringify(buildPackage({jsonObjs: RAW, pdfMcqs: null, tagRows: null})))");

let ok = true;
// 1. samma siffror
const a = JSON.parse(fingerprint(ev, "parseJSON(RAW)"));
const b = JSON.parse(fingerprint(ev, "parseJSON(resolveInputs([PKG], {}).jsonObjs)"));
const diff = Object.keys(a).filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k]));
if (diff.length) { ok = false; console.log("AVVIKER: " + diff.join(", ")); } else console.log("IDENTISKT");

// 2. inget läcker
const pkgText = ev("JSON.stringify(PKG)");
const leaks = [];
const KEYS = ["gradingTeacher", "extraTimeMins", "incidentTimeMins", "startTime", "endTime", "finalGrade", "sourcedId",
  "interactionAlternative", "userAssessment", "questionId", "questionContentItemId", "durationSeconds",
  "dateLastModified", "lineItem", "attendance", "assessmentRunExternalId"];
for (const k of KEYS) if (pkgText.includes(k)) leaks.push("fältnamn " + k);
const teachers = new Set(), candIds = new Set(); let longest = "";
for (const d of raw) for (const c of (d.ext_inspera_candidates || d.candidates || [])) {
  const r = c.result || c;
  if (r.ext_inspera_candidateId != null) candIds.add(String(r.ext_inspera_candidateId));
  for (const q of (r.ext_inspera_questions || [])) {
    for (const m of (q.ext_inspera_manualScores || [])) if (m && m.ext_inspera_gradingTeacherName) teachers.add(String(m.ext_inspera_gradingTeacherName));
    for (const x of (q.ext_inspera_candidateResponses || [])) {
      const isChoice = typeof x.ext_inspera_response === "string" && x.ext_inspera_response.startsWith("simpleChoice_");
      if (!isChoice) for (const v of Object.values(x)) if (typeof v === "string" && v.length > longest.length) longest = v;
    }
  }
}
for (const t of teachers) if (t.length >= 4 && pkgText.includes(t)) { leaks.push("ett rättarnamn"); break; }
if (longest.length >= 40 && pkgText.includes(JSON.stringify(longest.slice(0, 40)).slice(1, -1))) leaks.push("ett fritextsvar");
const ids = ev("PKG.data.flatMap(d => d.ext_inspera_candidates.map(c => c.result.ext_inspera_candidateId))");
if (ids.some((id, i) => !/^\d+$/.test(id)) ) leaks.push("kandidatnummer (inte löpnummer)");
if (leaks.length) { ok = false; console.log("LÄCKER: " + leaks.join(", ")); } else console.log("INGET LÄCKER");
// 2b. examinatorns fil bär exakt paketet och inget annat från råfilerna
{
  const file = ev("buildExaminerFile(PKG)");
  const open = '<script type="application/json" id="fl-data">';
  const block = file.split(open)[1]?.split("</scr" + "ipt>")[0] ?? "";
  const same = block && JSON.stringify(JSON.parse(block)) === pkgText;
  let extra = false;
  for (const t of teachers) if (t.length >= 4 && file.includes(t)) extra = true;
  if (longest.length >= 40 && file.includes(longest.slice(0, 40))) extra = true;
  if (!same || extra) { ok = false; console.log("EXAMINATORNS FIL AVVIKER" + (extra ? ": innehåller ett rättarnamn eller fritextsvar" : ": datablocket är inte paketet")); }
  else console.log("EXAMINATORNS FIL: BARA PAKETET");
}
// 3. temarapporten innehåller bara aggregat
ev(`state.json = parseJSON(RAW); state.pdfMcqs = null; state.synthMcqs = synthMcqsFromJson(state.json);
    state.tags = null; state.excluded = new Map(); globalThis.TEMA = temaEmbed();`);
if (ev("TEMA === null")) console.log("TEMARAPPORT: hoppas över (tentan är inte färdigrättad)");
else {
  const t = ev("JSON.stringify(TEMA)"), tl = [];
  for (const k of KEYS.concat(["cohortScores", "candMeta", "mcqSlot", "optData", "candidateId", "manualScore"])) if (t.includes(k)) tl.push("fältnamn " + k);
  for (const name of teachers) if (name.length >= 4 && t.includes(name)) { tl.push("ett rättarnamn"); break; }
  if (longest.length >= 40 && t.includes(JSON.stringify(longest.slice(0, 40)).slice(1, -1))) tl.push("ett fritextsvar");
  if (tl.length) { ok = false; console.log("TEMARAPPORT LÄCKER: " + tl.join(", ")); } else console.log("TEMARAPPORT: BARA AGGREGAT");
}
console.log(`(${files.length} fil(er), ${a.candCount} kandidater, ${teachers.size} rättare och ${longest.length ? "fritextsvar" : "inga fritextsvar"} fanns i råfilerna)`);
process.exit(ok ? 0 : 1);
