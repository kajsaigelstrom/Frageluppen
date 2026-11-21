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
- Den delbara HTML-**exporten får bara innehålla aggregat** (antal per alternativ, n,
  diskriminering, teman). Aldrig kandidatsvar eller rådata på individnivå. Bryt inte
  det löftet när du ändrar exportlogiken.

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
- **Tagg-uppslag:** matcha på frågans **positionsnummer** (Inspera `questionNumber` =
  PDF:ens marginalnummer = Excel-kolumnen `Nr`) först. Etikettkolumnen (`Fråga`/`Namn`)
  är reserv och kan innehålla mänskliga etiketter som krockar med positionsnummer.
- **Alternativens ordning slumpas per kandidat.** `ext_inspera_interactionAlternative` ger ett
  positionsnummer som är stabilt per alternativ men som **inte** följer PDF-utskriftens ordning
  (mätt på VT26-omtentan: 26 träffar av 127 = ren slumpnivå). Det går alltså inte att koppla
  svar till PDF-alternativ via positionen – **texten + elimination är enda vägen**. Utrett och
  förkastat 2026-08-17; föreslå inte positionsbaserad koppling igen.
- **Ett ledigt PDF-alternativ är inte samma sak som en kopplingsmiss.** Slots byggs bara av
  faktiskt valda alternativ, så ett alternativ som ingen valde saknar slot. Blev ingen slot
  över är fördelningen fullständig och raden har noll svar (visas som 0 %). Flagga "ej kopplad"
  bara när minst en svars-slot inte kunde knytas till en rad.
- **Två vyer**, knutna till rättningsflödet: Preliminär MCQ (kriterium = MCQ-delen, före
  rättning) och Hela rapporten (`id: "final"`, `layout: "all"`, kriterium = hela tentan, efter
  rättning). Hela rapporten är EN sida med kort för alla frågetyper (Kajsas beslut 20 nov 2026):
  MCQ-korten ur `state.vm.view`, essä- och flersvarskorten ur `state.scored` (`scoredItems`,
  `scoreCard`), blandade och sorterade av `pageItems`. Lägg inte tillbaka flikar per frågetyp.
  Tabellen över alla frågor är exporten Översiktstabell (`overviewPayload`, `overviewHtml`,
  `exportOverview`), en fristående sida utan skript. Diskriminering = punkt-biseriell / item–total.
- **Tre steg i stället för roller** (Kajsas beslut 21 nov 2026): 1 Förbered filer (`state.prep`,
  `setPrep`), 2 Hitta problemfrågor (`state.step==="triage"`) och 3 Skapa rapporter (`"report"`).
  Stegraden (`#role-prep`, `#step-triage`, `#step-report`, `renderStepBar`, `goStep`) ligger utanför
  filpanelen och syns alltid. Adressen följer steget (`#forbered`, `#problemfragor`, `#rapporter`;
  de äldre `#samordnare` och `#examinator` fungerar). Texterna säger aldrig vem som gör vad, utom
  i hjälpen där Linköpings uppdelning nämns som exempel. Filen mellan steg 1 och de andra heter
  analysfilen (`analysfil_<stämpel>.html`, `extractEmbedded`, `loadExaminerFile`) och är enda vägen:
  de tre filrutorna för Insperas filer finns bara i steg 1 – lägg inte tillbaka en råfilsväg.
  Inget mellansteg: `setStep("choose")` visar det steg som är valt (`state.want`).
- **Ingen godkäntstatistik i vyerna eller i temarapporten** (Kajsas beslut 20 nov 2026). Den
  ska bli en egen export. `passMetric` finns kvar för det, men ritas inte.
- **Examinatorns fil** (`buildExaminerFile`): kurssamordnaren sparar hela verktyget med
  tentapaketet inbäddat som ett JSON-block i `<head>` (`id="fl-data"`). Filen öppnar direkt i
  analysen. Den byggs ur `PRISTINE_HTML`, sidans källa fångad innan något lästs in – ändra
  aldrig det till en avläsning av sidan i efterhand, då kan inläst data följa med. Källtexten
  får inte själv innehålla datablockets tagg som en sammanhängande sträng. Filen har en rad
  per student och är blockerad i `.gitignore`.
- **Kurssamordnaren** kan förbereda tentan (läget "Förbered tentan"): ser bara ett kvitto,
  aldrig resultat, och sparar ett tentapaket som examinatorn öppnar i rutan för resultat.
  Examinatorns egen PDF eller taggfil gäller före paketets.
- **Tre roller:** kurssamordnaren (förbereder tentapaketet), examinatorn (laddar upp, flaggar,
  exkluderar, exporterar) och temagrupperna (får temarapporten).
- **Temarapporten visar frågor, aldrig åtgärder.** Den innehåller bara vyerna efter rättning,
  ingen triage, inga åtgärdsrutor och inga uppmaningar i etiketter eller verktygstips
  (`neutralInfo`). Mönstren hittas med samma villkor som `advice()` men formuleras som frågor
  (`askQuestions`, lydelserna i `ASK_TEXT`). Statistiken säger inget om en frågas nivå mot
  kursplanen – verktyget bedömer aldrig taxonomisk nivå. Lägg inte tillbaka åtgärdsspråk.
- **Formkontrollen kommer ur MCQ-lathunden** och underhålls där. Avsnitten `LATHUND-KONTROLL`
  och `LATHUND-REGLER` i `index.html` skrivs av `node tools/sync-lathund.mjs <lathundens mapp>`
  och ändras aldrig för hand. Med `LATHUND_DIR` satt jämför testerna mot lathunden. Lathundens
  regelkod har MIT-licens som resten av repot; texterna (råd, motiveringar, hjälptexter) har
  CC BY 4.0.
- **Formkontrollen körs bara på frågor med en svaghet i statistiken, och ett fynd visas bara där
  det är en trolig förklaring** (`FORM_EXPLAINS`, Kajsas beslut 20 nov 2026). Inga formfynd
  på frågor som fungerar, inga rader per formregel, ingen "hela kontrollen"-ruta. Regler med
  prio `tips` i lathunden används inte (undantag: bästa-svar-markören vid försvarbar
  distraktor). Lathundens råd är det enda undantaget från "aldrig åtgärder" i temarapporten,
  och bara i utfällningen "Ur MCQ-lathunden". Appens egna vyer använder `cueScan` och är orörda.
- **Essä- och flersvarsfrågorna** (typ `text` och `multi`) har kort på samma sida som MCQ
  (`scoreCard`, `scoreQuestions`: bedömningsmallen för essä, facit och poängregeln för flersvar).
  Bara sammanräknade tal. Inga förebilder och ingen formkontroll för essäfrågor. Frågetexten
  läses ur PDF:en med `parseEssayLines` (ren funktion, testas med påhittade rader): allt
  mellan rubriken vid vänstermarginalen och raden "Skriv ditt svar här". Den ligger som
  `pdfMcqs.essays` och i paketet som `pdf.essays`.
- **Förebilder kräver en ren formkontroll** (inga fynd utöver lathundens tips). Håll aldrig fram
  en fråga som förebild utan att den har gått igenom kontrollen.
- **Filterraden** (`FACETS`, `filterGroups`, `buildTagbar`) är en och samma i appen och i
  temarapporten. Synlighetsfunktionerna (`currentView` för MCQ, `scoredVisible` för essä och
  flersvar, `pageItems` för båda) filtrerar med `tagPass` + `facetPass`; `{noFacets:true}` ger
  underlaget för räkningen. Diskrimineringsgruppen tas ur den etikett som visas (`discBucket`),
  så att filter och kort aldrig säger olika saker.
- **Sammanfattning före kort.** En regel vars budskap är detsamma för varje fråga den träffar
  (mycket lätt, alternativ som nästan ingen valde) hör hemma i
  "Mönster i frågorna" (`patternSummary`, `ASK_SUMMARY`), inte på korten. Korten
  (`cardQuestions`) bär bara det som måste läsas i frågans eget innehåll.
- **Temarapporten måste kunna bygga sig själv** (urvalssidan skapas inne i den exporterade
  filen). En funktion eller konstant som rapporten använder måste därför stå i `temaFns()`
  respektive `temaConsts()`. Testet "en exporterad sida kan själv bygga en urvalssida" fångar missar.
- **Gränserna i `state.th` är justerbara** och ändrar bara märkningar och vilka kort som får en
  kommentar. Minsta underlag (`MIN_N_DIST`, n ≥ 30) ligger fast.

## Språk och ton
- Gränssnittet är på **svenska**. Behåll svensk text i UI och i exporten.
- Verktyget är desktop-orienterat.

## Stil för ändringar
- Diagnostisera grundorsaken före åtgärd. Gör minsta möjliga, väl avgränsade ändring.
- Behåll den befintliga kodstilen och de förklarande kommentarerna.
