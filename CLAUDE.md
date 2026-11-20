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
  Node-sandbox (`tools/harness.mjs`) mot syntetisk data ur demoläget och fångar även syntaxfel.
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
- **Tre rapportvyer**, knutna till rättningsflödet: Preliminär MCQ (kriterium = MCQ-delen,
  före rättning), Slutrapport MCQ (kriterium = hela tentan, efter rättning), Totalrapport
  (hela tentan inkl. fritext/flersvar). Diskriminering = punkt-biseriell / item–total.
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
