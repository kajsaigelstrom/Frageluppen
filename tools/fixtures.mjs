// Syntetiska testdata, byggda i sandboxen ur verktygets demoläge. Inga riktiga tentadata.
// setupDirty(ev) lägger globalen `dirty` i sandboxen: demotentan i Inspera-format, påklistrad med
// alla slags känsliga fält som en riktig export innehåller (påhittade värden).
export const SENSITIVE = ["RATTARE_X","gradingTeacher","FRITEXT_HEMLIG","extraTimeMins","startTime","endTime",
  "finalGradeDate","sourcedId","K-777","interactionAlternative","nyttFalt","lineItem","incidentTimeMins",
  "userAssessment","questionId","durationSeconds","dateLastModified"];

export function setupDirty(ev) {
  ev(`globalThis.makeDirty = function(){
    const d = demoToInspera(DEMO_DATA.DEMO);
    d.lineItemSourcedId = 1; d.ext_inspera_nyttFalt = "X"; d.ext_inspera_assessmentRunExternalId = "EXT-1";
    d.ext_inspera_candidates.forEach((c,i)=>{ const r=c.result;
      Object.assign(r,{ sourcedId:991+i, ext_inspera_userAssessmentSetupId:5, ext_inspera_userAssessmentId:6,
        dateLastModified:"2026-01-01T10:00:00Z", ext_inspera_startTime:"2026-01-01T08:00:00Z",
        ext_inspera_endTime:"2026-01-01T12:00:00Z", ext_inspera_extraTimeMins:30, ext_inspera_incidentTimeMins:0,
        ext_inspera_candidateId:"K-777-"+i, ext_inspera_attendance:true, lineItem:{sourcedId:1,type:"lineItem"},
        student:{sourcedId:4242+i,type:"user"}, ext_inspera_finalGradeDate:"2026-01-20T10:00:00Z",
        ext_inspera_finalGrade:"G" });
      r.ext_inspera_questions.forEach(q=>{
        q.ext_inspera_questionId = 77; q.ext_inspera_questionContentItemId = 78; q.ext_inspera_questionWeight = 1;
        q.ext_inspera_durationSeconds = 120;
        (q.ext_inspera_manualScores||[]).forEach(m=>{ m.ext_inspera_gradingTeacherName="RATTARE_X"; m.ext_inspera_gradingTeacherId=55; });
        const rs = q.ext_inspera_candidateResponses || (q.ext_inspera_candidateResponses=[]);
        rs.forEach(x=>{ x.ext_inspera_interactionAlternative = 3; });
        if(!rs.length) rs.push({ext_inspera_response:"FRITEXT_HEMLIG lång text som studenten skrev"});
      });
    });
    return d;
  }; globalThis.dirty = makeDirty();`);
}

/** Ställer appen som efter "Visa exempel" i vyn Slutrapport MCQ och lägger korten i globalen `VIEW`. */
export function setupDemoView(ev) {
  ev(`state.json = parseJSON([demoToInspera(DEMO_DATA.DEMO)]); state.pdfMcqs = DEMO_DATA.PDF;
      state.tags = parseTagsRows(DEMO_DATA.TAGS); state.view = "final"; state.mode = "edu"; state.excluded = new Map();
      globalThis.rebuildView = function(){
        state.disc = computeDiscrimination(state.json, {criterion:"whole", excluded:state.excluded});
        state.optDisc = computeOptDisc(state.json, {criterion:"whole", excluded:state.excluded});
        state.vm = buildView(); globalThis.VIEW = state.vm.view; return VIEW; };
      rebuildView();`);
}
/** Utfallet per fråga som gränserna påverkar – används för att visa att standardgränserna inte ändrar något. */
export const SNAPSHOT_EXPR = `({
  cards: VIEW.map(v => { const a = advice(v); return { seq:String(v.seq), l1:a.l1.map(x=>x.psy), l2:a.l2.map(x=>x.psy),
    rpbLabel: rpbInfo(v).label, exemplary: isExemplary(v), html: card(v) }; }),
  pass: passMetric(new Set()) })`;
