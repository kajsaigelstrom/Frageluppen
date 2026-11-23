# CLAUDE.md – arbetsregler för det här repot

Detta är **Frågeluppen**, ett pedagogiskt verktyg som analyserar MCQ-tentaresultat
från Inspera. Läs den här filen innan du gör ändringar.

## Status och backlog (utanför repot)
Projektets **läge, backlog och beslut** ligger i Kajsas lokala arbetsanteckningar,
utanför repot (modulen `frageluppen.md` i hennes arbetsytemapp). Läs den filen vid
sessionsstart, och **uppdatera den vid sessionens slut** (ny version, vad som byggdes,
vad som återstår). Repot innehåller kod och historik — inte planering.

## Struktur
- Hela verktyget är **en enda fil**: `index.html` (HTML + CSS + JS i samma fil,
  ingen byggprocess, inget ramverk). Lägg inte till en byggkedja utan att bli ombedd.
- Beroenden hämtas från CDN: `pdf.js` (PDF) och `SheetJS/xlsx` (Excel).

## Integritet (viktigast)
- **Inga tentadata får checkas in.** `.gitignore` blockerar `*.json/*.xlsx/*.pdf/*.csv`.
  Riktiga studentresultat hör aldrig hemma i repot.
- **Tentapaketet byggs med vitlista** (`minimizeInspera`): bara de fält som räknas upp där
  följer med. Lägg aldrig till ett fält utan att det behövs för statistiken, och bygg aldrig
  paketet genom att kopiera ett objekt och ta bort fält i efterhand. Paketet är minimerat,
  inte anonymt.
- **Temarapporten, Problemfrågor och Översiktstabellen får bara innehålla aggregat** (antal per
  alternativ, n, diskriminering, teman). Aldrig kandidatsvar eller rådata på individnivå. Bryt
  inte det löftet när du ändrar exportlogiken. `tools/compare-local.mjs` kontrollerar det mot
  riktiga exporter som ligger lokalt och aldrig checkas in.

## Versionering
- `VERSION`-konstanten högst upp i `index.html` ska matcha senaste Git-taggen.
- MAJOR = omarbetning, MINOR = ny funktion, PATCH = fix. Bumpa `VERSION` och `UPDATED`
  och sätt en matchande tagg (t.ex. `v3.19.0`) vid släpp.

## Verifiering före "klart"
- Miljön är ofta offline; CDN-biblioteken (pdf.js/xlsx) laddas då inte. Räkna med det.
- Kör testerna efter varje ändring: `node --test tools/*.test.mjs`. De kör verktygets logik i en
  Node-sandbox (`tools/harness.mjs`) mot en syntetisk tenta (`tools/fixtures/syntetisk-tenta.js`)
  och fångar även syntaxfel. Verktyget har ingen inbyggd exempeltenta längre.
- Validera JS-syntax efter varje ändring (t.ex. extrahera det stora `<script>` och kör
  `node --check`).
- Verifiera beteende headless innan något anses klart. Den **exporterade** filen har
  inga CDN-beroenden för att *visas* och kan därför laddas i Chromium/Playwright och
  testas (flikväxling, filter, export). Kärnlogik (parsning, diskriminering, tagg-
  uppslag, export) kan köras i en Node-sandbox mot avidentifierad/syntetisk indata.
- Föredra att verifiera mot verkliga format, men aldrig mot data som får checkas in.

## Domänlogik att inte gå sönder

### Inläsning och koppling
- **Tagg-uppslag sker på ett ställe**, `tagValsFor`: frågans **positionsnummer** först (Inspera
  `questionNumber` = PDF:ens marginalnummer = Excel-kolumnen `Nr`), sedan frågans namn ur
  resultatfilen, sist PDF:ens kod. Kort, tabeller och statistik använder samma funktion.
- **Alternativens ordning slumpas per kandidat.** `ext_inspera_interactionAlternative` ger ett
  positionsnummer som är stabilt per alternativ men som **inte** följer PDF-utskriftens ordning
  (mätt på VT26-omtentan: 26 träffar av 127 = ren slumpnivå). Det går alltså inte att koppla
  svar till PDF-alternativ via positionen – **texten + elimination är enda vägen**. Utrett och
  förkastat 2026-08-17; föreslå inte positionsbaserad koppling igen.
- **Ett ledigt PDF-alternativ är inte samma sak som en kopplingsmiss.** Slots byggs bara av
  faktiskt valda alternativ, så ett alternativ som ingen valde saknar slot. Blev ingen slot
  över är fördelningen fullständig och raden har noll svar (visas som 0 %). Flagga "ej kopplad"
  bara när minst en svars-slot inte kunde knytas till en rad.
- **Blankt svar räknas som fel överallt** (`parseJSON`): andel rätt och svarsfördelning räknas på
  alla som fick frågan, och kortet har raden "Inget svar".

### Stegen och filerna
- **Tre steg, inga roller** (Kajsas beslut 21 nov 2026): 1 Förbered filer (`state.prep`,
  `setPrep`), 2 Hitta problemfrågor (`state.step==="triage"`, vyn `pre-mcq`, r mot flervalsdelen)
  och 3 Skapa rapporter (`"report"`, vyn `final`, r mot hela tentan). Adressen följer steget
  (`#forbered`, `#problemfragor`, `#rapporter`). Texterna säger aldrig vem som gör vad, utom i
  hjälpen där Linköpings uppdelning nämns som exempel.
- **Steg 2 och 3 är gråa tills filer finns** (`filesReady`, `renderStepBar`). Filer kommer in i
  steg 1 på två sätt: Insperas filer i de tre filrutorna, eller en sparad datafil i rutan under.
  Verktyget väljer aldrig steg åt användaren: en datafil som väljs i steg 1 lämnar sidan kvar där
  (`loadDataFile` med `stay`), och valen "2 Hitta problemfrågor" och "3 Skapa rapporter" står
  bredvid spara-knappen. Steg 3 är grått med skälet utskrivet när rättningen inte är klar
  (`gradeState`), och `render` visar steg 2 om steg 3 ändå skulle ritas för en orättad tenta.
- **Filraden syns i alla steg** (`renderFileLine`) och säger om datafilen är sparad
  (`state.dataSaved`, `#filesave`). Den är beviset på att filerna följer med mellan stegen.
- **En väg in för datan:** från steg 1 går `goStep` vidare genom samma `buildPackage` som en
  sparad datafil. Råfilerna ligger kvar i `state.prepFiles`/`prepPdf`/`prepTags`, och
  `state.prepDirty` säger att analysen ska räknas om. Datafilen sparas som ren JSON;
  `buildExaminerFile` och den inbäddade läsningen finns kvar bara för äldre HTML-filer.
- **Kvittot i steg 1** (`prepReceipt`, `prepAnalysis`, `receiptFacts`) visar aldrig resultat, bara
  vad som lästes: antal studenter, om essäfrågorna är rättade och hur många frågor taggfilen
  matchade.
- **Eget arbete skyddas** (`hasWork`): verktyget frågar innan kommentarer och egna exkluderingar
  försvinner, och varnar när sidan stängs.

### Reglerna på korten
- **Princip (Kajsas beslut 21 nov 2026): verktyget ger examinatorn underlag, inte beslut.**
  Uppmaningar finns bara där ett beslut ska fattas före betygssättning: "Dubbelkolla facit" och
  "Se över frågan" (`advice().l1`), och för essä "Kontrollera bedömningsmallen och rättningen"
  (`scoreQuestions`). Allt annat är observationer (`advice().l2`): en rad om vad som syns i
  svaren, med möjliga orsaker under "Mer om måttet" (`PSY`). Ingen exkluderingsregel byggs in.
  Lydelserna är godkända av Kajsa: ändra dem inte utan att visa henne.
- **Ett kort överallt.** Examinatorn och temarapporten har samma kort och samma observationer.
  Temarapporten visar aldrig uppmaningar: den ställer frågorna i `ASK_TEXT` ("Stämmer facit?",
  "Går «X» att försvara?") eller visar bara observationsdelen (`obs` utan `todo`).
- **Steg 2 är preliminärt.** Där räknas r mot flervalsdelen, så en fråga kan pekas ut i steg 2 men
  inte i steg 3, eller tvärtom. Vyn, exporten Problemfrågor och hjälpen säger det.
- **En gräns för litet underlag**, `MIN_N` = 30: under den visas bara mätvärden. Undantaget är
  "ingen svarade rätt", som ger "Dubbelkolla facit" oavsett antal.
- **Diskrimineringen heter "god" från `state.th.goodDisc` (0,30) och "låg" under `R_LOW` (0,10)**,
  utan etikett däremellan (`discLabel`). Under 5 i den mindre gruppen är den ej mätbar, 5–9
  osäker, och kortet säger skälet. Essä- och flersvarsfrågor får aldrig etiketten "god" och inga
  brickor Lätt/Svår (Kajsas beslut 22 nov 2026); deras mindre grupp är de studenter som inte
  fick det vanligaste poängtalet (`scoreMinority`).
- **Ett alternativs riktning skrivs i ord, aldrig som tecken:** "valdes oftare av studenter med
  högre/lägre totalpoäng". Siffran står i verktygstipset. Orden starka och svaga används inte.
- **Tal visas med decimalkomma** (`dk`, `rFmt`), och måttet heter "r".
- **Sällan valda alternativ** bedöms bara när andelen fel räcker för att alla distraktorer ska
  kunna nå 5 %. Svårighet är inget kvalitetskriterium.
- **Förebild** (`isForebild`): mätbar och god diskriminering över brusgränsen 2/√n, varken
  uppmaning eller observation på kortet, och inga formfynd utöver lathundens tips.
- **Formkontrollen kommer ur MCQ-lathunden och är enda källan för formfynd.** Avsnitten
  `LATHUND-KONTROLL` och `LATHUND-REGLER` i `index.html` skrivs av
  `node tools/sync-lathund.mjs <lathundens mapp>` och ändras aldrig för hand. Med `LATHUND_DIR`
  satt jämför testerna mot lathunden. Ett fynd visas bara där det kan förklara ett mönster
  (`FORM_EXPLAINS`, `formPick`), och då visas alla som passar, en gång per regel. Påståendeformen
  förklarar bara en mycket lätt fråga. "Stammen bär inte frågan" visas aldrig men hindrar förebild.
  Bygg ingen egen ledtrådssökning.
- **Korten visar aldrig lathundens egna texter.** Lathundens rubriker, råd och motiveringar är skrivna
  för den som konstruerar en fråga. Efter rättningen visas bara de eftertolkande lydelserna i
  `FORM_EFTER`: en iakttagelse om formen och hur den KAN hänga ihop med mönstret. Aldrig råd, aldrig
  något om målen (verktyget känner inte till dem), och bara det som faktiskt hittades (Kajsas beslut
  23 nov 2026). Lydelserna är godkända av Kajsa. En ny regel i `FORM_EXPLAINS` kräver en rad i
  `FORM_EFTER`, och ett test kontrollerar det.
- **Det som gäller flera frågor står en gång överst** ("Mönster i de här frågorna",
  `patternSummary`, `scorePatterns`), i steg 3 och i temarapporten.
- **Statistiken säger inget om en frågas nivå mot kursplanen.** Verktyget bedömer aldrig
  taxonomisk nivå.

### Vyer, filter och exporter
- **Steg 3 är EN sida med kort för alla frågetyper**: MCQ-korten ur `state.vm.view`, essä- och
  flersvarskorten ur `state.scored` (`scoredItems`, `scoreCard`), blandade av `pageItems`. Lägg
  inte tillbaka flikar per frågetyp.
- **Fyra frågetyper** (`qMeta[].type`, bestäms i `parseJSON` ur svarsformen, eftersom exporten saknar
  typfält): `single` (MCQ), `multi` (flersvar), `text` (essä, manuellt rättad) och `auto` (övrig:
  automaträttad utan valrutor, till exempel markera i bild eller välja i löptext; Kajsas beslut
  22 nov 2026). `auto` = ingen valruta, autopoäng hos någon, och manuell poäng hos färre än hälften.
  En orättad essäfråga har ingen autopoäng och förblir `text`. `auto` får uppmaningen om facit och
  poängregeln, räknas inte i essädelen och har ingen frågetext.
- **Kontrollraden** (sök, sortering, filter, mönster, färgförklaring) finns en gång,
  `controlsHtml`, och delas med temarapporten. Detsamma gäller `wireComments`.
- **Filterraden** (`FACETS`, `filterGroups`, `buildTagbar`) består av riktiga knappar med
  `aria-pressed`. Synlighetsfunktionerna (`currentView`, `scoredVisible`, `pageItems`) filtrerar
  med `tagPass` + `facetPass`. Diskrimineringsgruppen tas ur den etikett som visas (`discBucket`).
- **Exportknapparna säger formatet.** De som heter (PDF) går genom `printHtml`: sidan öppnas för
  utskrift och har inget eget skript. Med ett filter valt står antalet frågor på knappen
  (`renderExportLabels`).
- **Temarapporten måste kunna bygga sig själv** (urvalssidan skapas inne i den exporterade
  filen). En funktion eller konstant som rapporten använder måste stå i `temaFns()`
  respektive `temaConsts()`. Testet "en exporterad sida kan själv bygga en urvalssida" fångar missar.
- **Reliabilitet** (`reliability`, `alphaOf`): Cronbachs alfa för hela tentan, flervalsdelen och
  essädelen, med medeldiskrimineringen bredvid. Frågor i samma fall räknas som fristående
  (`REL_CAVEAT`). Mätfel och antal nära G-gränsen står bara i Tentamensstatistiken.
- **G-regeln** (gränsen nedåt, studentens poäng uppåt) står på ett ställe, `gLimit` och `gPassed`.
  Ingen godkäntstatistik i vyerna eller i temarapporten.
- **Gränserna i `state.th` är justerbara** och ändrar bara märkningar och vilka kort som får en
  observation, aldrig mätvärdena.
- **Tillgänglighet:** etiketternas kontrast är minst 4,5 (testas i `tools/a11y.test.mjs`), och
  diagrammet skiljer G och U med form, inte bara färg.

## Språk och ton
- Gränssnittet är på **svenska**. Behåll svensk text i UI och i exporten.
- Verktyget är desktop-orienterat.

## Stil för ändringar
- Diagnostisera grundorsaken före åtgärd. Gör minsta möjliga, väl avgränsade ändring.
- Behåll den befintliga kodstilen och de förklarande kommentarerna.
