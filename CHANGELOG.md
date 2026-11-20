# Ändringslogg

Versionerna följer MAJOR.MINOR.PATCH. `VERSION`-konstanten högst upp i `index.html`
ska alltid matcha den senaste Git-taggen.

Loggen börjar vid 3.13.0 (utgångsläget när repot skapades). Tidigare historik finns
inte dokumenterad här.

## 3.26.0
- **Temarapport ersätter den interaktiva HTML-exporten.** Rapporten till temagrupperna
  innehåller bara vyerna efter rättning (Slutrapport MCQ och Totalrapport) och ingen triage:
  inga åtgärdsrutor, ingen åtgärdslista och inga uppmaningar i etiketter eller verktygstips.
  Där svaren följer ett mönster står i stället en ruta **Att fråga sig** med högst två frågor
  till den som skrev uppgiften. Mönstren hittas med samma villkor och trösklar som
  rådgivningen i appen. Nytt är att en mycket lätt fråga får frågan om den prövar något
  enklare än avsett. Överst står att statistiken inte säger något om en frågas nivå mot
  kursplanen. Knappen är inaktiv tills tentan är färdigrättad. Excel/CSV ur rapporten har
  kolumnen "Att fråga sig" i stället för "Flaggor" (som tidigare skrev "undefined").
- **Urval och egen sida.** I temarapporten kan frågor bockas för, på korten och i
  Totalrapporten, och sparas som en ny fristående sida med bara dem. "Markera alla visade"
  väljer ett helt tema efter filtrering. Urvalssidan visar "Urval: N av M frågor", saknar
  godkäntandel och andra siffror för hela tentan, och kan själv delas upp igen.
- **Justerbara gränser.** Under "Inställningar" (dold tills man klickar) kan gränserna för
  Lätt (90 %), Svår (60 %), god diskriminering (0,20) och godkänt (65 %) ändras.
  Märkningsgränserna ändrar bara etiketter och vilka kort som får en kommentar.
  Godkäntgränsen finns bara i appen. Avvikelse från standard visas överst på sidan, och
  temarapporten och urvalssidan bär med sig gränserna. Med standardvärdena är allt utfall
  oförändrat (kontrollerat mot sparat utgångsläge).
- **Efter oberoende granskning, före släpp:** ett klick på en rad i listan över starkt
  diskriminerande frågor kunde växla temarapporten till appens åtgärdsvy när kortet var
  bortfiltrerat (nu stannar den i rapportens eget läge). Godkäntgränsen i en temarapport kan
  inte längre återställas av läsaren, eftersom godkäntandelen är räknad med examinatorns
  gräns. En fil som inte är JSON, eller ett strukturellt trasigt paket, ger ett svenskt
  felmeddelande. Löpnumren i ett paket löper över alla resultatfiler i stället för att börja
  om per ort. Ett pakets PDF ger inte längre en falsk varning om fel filpar när nästa tenta
  öppnas. "Tillbaka till analysen" visar resultaten igen. Uppmaningar riktade till
  examinatorn syns inte i temarapporten.
- **Kurssamordnaren är landningsstället, och lämnar en fil som examinatorn bara öppnar.**
  Högst upp i filpanelen väljs **Kurssamordnare** eller **Examinator**, och sidan öppnar hos
  kurssamordnaren. I stället för ett paket som examinatorn måste ladda upp sparar
  kurssamordnaren **examinatorns fil**: hela verktyget med den minimerade tentan inbäddad.
  Examinatorn dubbelklickar och hamnar direkt i analysen, med triage och exkludering före
  rättningen och temarapporten efter. Filen visar överst att den har en rad per student och
  inte ska skickas vidare. Adressen följer ingången (`#samordnare`, `#examinator`).
  Tentapaket i JSON-format från 3.25.0 går fortfarande att släppa i rutan för resultat.
- **Formkontrollen ur MCQ-lathunden i temarapporten.** Lathundens mekaniska kontroll (längd,
  ordeko, inledning, led, tvådelad form, negation, påståendeform, samlingsalternativ m.m.) körs
  på varje flervalsfråga. Ett fynd visas under en fråga i "Att fråga sig" bara när det kan
  förklara mönstret i svaren, med lathundens råd, motivering och källa i en utfällning. Hela
  kontrollen för en fråga finns hopfälld längst ned på kortet, tillsammans med knappen
  **Kopiera frågan** (i lathundens fältordning). Frågan om ett alternativ som nästan ingen
  valde visas nu bara när formkontrollen hittar en möjlig förklaring; på en riktig tenta med
  39 flervalsfrågor gick antalet kort med ruta från 36 till 28.
- **Förebilder.** Listan över starkt diskriminerande frågor i temarapporten ersätts av frågor
  som fungerar som förebild, med samma kriterier som MCQ-lathundens goda exempel: 50–85 %
  rätt, god diskriminering, inga formfynd och inget mönster som ger en fråga på kortet.
- **`tools/sync-lathund.mjs`** hämtar regelkoden och rådtexterna oförändrade ur MCQ-lathunden.
  Lathunden är källan; avsnitten i `index.html` ändras aldrig för hand.
- **PDF-exporten heter nu "PDF (examinatorns)"** och är orörd i övrigt. Den innehåller
  åtgärdsförslagen och är inte tänkt för utskick till lärare.

## 3.25.0
- **Tentapaket och läget "Förbered tentan".** Kurssamordnaren kan nu förbereda tentan åt
  examinatorn: släpp resultatfilerna från Inspera, tentans PDF och taggfilen om den finns,
  och spara **en** fil. Resultatdatan minimeras med en vitlista – bara frågenummer,
  frågetitel, maxpoäng, poäng och valt flervalsalternativ följer med. Fritextsvar,
  rättarnamn, tider, extratid, betyg och alla Inspera-id tas bort, och kandidatnumren
  ersätts av löpnummer. Examinatorn släpper paketet i den vanliga rutan för resultat; en
  egen PDF eller taggfil som laddas samtidigt gäller före paketets. Ett paket kan inte
  kombineras med råfiler, och tillfälleskontrollens varning följer med i paketet.
  Paketet är minimerat, inte anonymt, och hanteras som tentamaterial. Vägen med råfiler
  är oförändrad. Kontrollerat mot riktiga exporter: identisk statistik, inget läcker.
- **Tester i `tools/`.** Verktygets logik körs i en Node-sandbox mot syntetisk data ur
  demoläget (`node --test tools/*.test.mjs`). `tools/compare-local.mjs` jämför råfiler
  mot paket lokalt utan att skriva ut data.

## 3.24.1
- **Buggfix (demo → riktiga filer):** att klicka "Visa exempel" och därefter ladda upp
  riktiga filer blandade demons tillstånd med de riktiga: taggfil-stubben kraschade
  beräkningen ("state.tagsFile.arrayBuffer is not a function"), och demons syntetiska
  PDF-kortdata låg kvar och skulle ha matchats mot den riktiga JSON:en. Nu släpps demons
  taggar och PDF-data när riktiga filer beräknas (JSON-läge tills en riktig PDF laddas).
  Relevant för nya användare, som ofta provar demon först.

## 3.24.0
- **JSON-läge: MCQ-korten fungerar nu utan tentans PDF.** Utan PDF spärrades Preliminär
  MCQ och Slutrapport MCQ tidigare helt; nu byggs korten direkt ur svarsdatan (alternativ-
  texterna som Inspera sparar för valda alternativ), med identisk statistik: fördelning,
  andel rätt, r_pb per alternativ, facit och automatiska flaggor. Läget är tydligt märkt
  som degraderat, i appen, på varje kort och i HTML-exporten: frågetexterna finns inte i
  JSON-exporten, alternativ som **ingen** valde finns inte alls (och kan därmed varken
  visas eller flaggas som ineffektiva distraktorer, så distraktoranalysen blir mildare än
  med PDF), och alternativen står i svarsordning i stället för tentans ordning. Alternativ
  utan text (specialtecken) hanteras av samma orphan-logik som i PDF-läget. Syftet är
  sänkt tröskel vid spridning: en examinator med bara en resultat-JSON kan prova verktyget
  direkt, och rekommenderas sedan ladda PDF:en för fullständiga kort.

## 3.23.0
- **Ny kontroll: PDF och JSON från olika tentatillfällen upptäcks redan vid uppladdning.**
  Fel filpar (t.ex. ordinarie-tentans JSON mot omtentans PDF) gav tidigare bara sena,
  svårtolkade symptom – "N single-best-frågor kunde inte läsas ur PDF:en" och många
  omatchade alternativ – som såg ut som ett läsfel i PDF:en. Nu läses testnamnet ur
  PDF:ens sidhuvud (admin-utskriftens "ÅÅÅÅ-MM-DD HH:MM <testnamn>") och jämförs med
  JSON:ens `ext_inspera_assessmentRunTitle`: kurskod (t.ex. 8LPG10) och datum (både
  ISO-format och ÅÅMMDD i namnet) måste stämma överens, annars visas en varning med
  båda namnen utskrivna. Kontrollen är medvetet tyst när uppgift saknas: äldre
  utskriftsformat utan sidhuvud (t.ex. T5 VT26), namn utan datum och demoläget
  jämförs inte alls – hellre ingen varning än falsklarm. Ingen siffra eller
  beräkning påverkas.

## 3.22.2
- **Buggfix (falsk "ej kopplad"-flagga):** ett svarsalternativ som *ingen* valde flaggades som
  okopplat – i exporterna med texten "specialtecken – ej kopplad" – i stället för att visas som
  0 %. Orsak: alternativens uppsättning byggdes enbart av de alternativ som faktiskt valdes, så
  ett alternativ utan svar saknade slot och blev "ledigt". Nu gäller: om varje svar kunde kopplas
  till en rad (inga överblivna slots) är fördelningen fullständig, och ett ledigt alternativ har
  helt enkelt noll svar. Flaggan visas bara när kopplingen verkligen är okänd.
  På VT26:s omtenta (n=20, 44 MCQ) föll 49 felaktiga flaggor bort; ingen siffra i övrigt ändrades.
- Orsaksetiketten för genuint okopplade alternativ är nu gemensam för kort, Excel-, PDF- och
  HTML-export (`unmapReason`): "specialtecken – ej kopplad" bara när de överblivna alternativens
  text saknas i exporten, annars "matchade ej svarsdata" (oftast fel/avvikande PDF inläst).
  Tidigare påstod Excel- och PDF-exporten alltid specialtecken.

## 3.22.1
- Robusthet: sidan laddar och "Visa exempel" fungerar även om pdf.js/xlsx-CDN:erna är
  blockerade (t.ex. på ett låst institutionsnät). Endast PDF-/Excel-inläsning kräver dem.

## 3.22.0
- Inbyggt demoläge: en "Visa exempel"-knapp laddar en **syntetisk exempeltenta** direkt i
  appen – alla vyer, filter och exporter fungerar. Datan är en simulerad kohort som återger
  en riktig tentas svårighet, distraktormönster och diskriminering, men innehåller inga
  riktiga kandidatsvar, inga identifierare och ingen frågetext (allt neutraliserat till
  Fråga N / Alternativ A–D). Låter verktyget visas publikt utan studentdata.

## 3.21.0
- Inbyggda hjälpsidor: en "? Hjälp"-knapp öppnar en guide (läsa resultaten, de tre
  vyerna, skapa och dela rapporten) i **både appen och den delade HTML-exporten**.
  Gemensam textkälla, inga externa beroenden.

## 3.20.0
- Verktyget fick namnet **Frågeluppen**. Sidhuvud, fliktitel och dokumentation uppdaterade.

## 3.19.0
- Excel-export (.xlsx) i den **interaktiva HTML-exporten**: hämtar SheetJS från CDN
  vid klick och faller automatiskt tillbaka på CSV om biblioteket inte kan laddas
  (t.ex. offline). CSV och xlsx bygger på samma rader och följer aktivt filter.

## 3.18.1
- Totalrapportens Excel-knapp följer aktivt tema-/taggfilter (alla tre flikar:
  Frågeöversikt, Studentöversikt, Rådata). Filnamnet märks med valt tema.

## 3.18.0
- Vy 3 (Totalrapport): sökrutan borttagen (saknade funktion där) och frånkopplad i
  renderingen; tema-chipsen kvar. Ny Excel-knapp i totalrapporten.

## 3.17.1
- Tog bort den otydliga kryssrutan "Bara filtrerade" från exportraden. Excel-exporten
  i appen omfattar alltid hela tentan.

## 3.17.0
- Nytt sidhuvud: rubrik "MCQ-analys för Inspera-tentor", underrubrik som förklarar
  variablerna, syftet i beskrivningen, samt en "under utveckling"-markering med
  kontakt för återkoppling. Endast i appen, inte i exporten.

## 3.16.0
- Nedladdningsknappar i den exporterade filen: CSV (BOM + semikolon, öppnas i Excel)
  och Skriv ut/PDF (webbläsarens utskrift med utskriftslayout). Följer aktivt filter.

## 3.15.0
- Den interaktiva HTML-exporten innehåller nu **alla rapportvyer** (Preliminär MCQ,
  Slutrapport MCQ, Totalrapport) med flikar, i stället för bara den aktiva vyn.
  Endast aggregat bakas in. App och export delar samma informationsarkitektur.

## 3.14.1
- **Buggfix (taggmappning):** taggar lästes från fel fråga när Excels frågekolumn
  innehöll mänskliga etiketter (t.ex. "55a)", "56") som krockade med positionsnummer.
  Uppslagningen matchar nu på positionsnumret (Nr) först; etikettkolumnen är reserv.

## 3.14.0
- Omarbetad informationsarkitektur: en sammanhållen kontrollrad (sök, taggar, sortering,
  export), tydligare hierarki mellan rapportflikar och visningsläge, samt visuell
  hierarki i sammanfattningen.

## 3.13.0
- Utgångsläge när repot skapades.
