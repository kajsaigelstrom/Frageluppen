# CLAUDE.md – arbetsregler för det här repot

Detta är **Frågeluppen**, ett pedagogiskt verktyg som analyserar MCQ-tentaresultat
från Inspera. Läs den här filen innan du gör ändringar.

## Status och backlog (utanför repot)
Projektets **läge, backlog och beslut** ligger i Kajsas arbetsanteckningar:
`~/Documents/worksituation/teaching/frageluppen.md`. Läs den filen vid sessionsstart,
och **uppdatera den vid sessionens slut** (ny version, vad som byggdes, vad som återstår).
Repot innehåller kod och historik — inte planering.

## Struktur
- Hela verktyget är **en enda fil**: `index.html` (HTML + CSS + JS i samma fil,
  ingen byggprocess, inget ramverk). Lägg inte till en byggkedja utan att bli ombedd.
- Beroenden hämtas från CDN: `pdf.js` (PDF) och `SheetJS/xlsx` (Excel).

## Integritet (viktigast)
- **Inga tentadata får checkas in.** `.gitignore` blockerar `*.json/*.xlsx/*.pdf/*.csv`.
  Riktiga studentresultat hör aldrig hemma i repot.
- Den delbara HTML-**exporten får bara innehålla aggregat** (antal per alternativ, n,
  diskriminering, teman). Aldrig kandidatsvar eller rådata på individnivå. Bryt inte
  det löftet när du ändrar exportlogiken.

## Versionering
- `VERSION`-konstanten högst upp i `index.html` ska matcha senaste Git-taggen.
- MAJOR = omarbetning, MINOR = ny funktion, PATCH = fix. Bumpa `VERSION` och `UPDATED`
  och sätt en matchande tagg (t.ex. `v3.19.0`) vid släpp.

## Verifiering före "klart"
- Miljön är ofta offline; CDN-biblioteken (pdf.js/xlsx) laddas då inte. Räkna med det.
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
- **Tre rapportvyer**, knutna till rättningsflödet: Preliminär MCQ (kriterium = MCQ-delen,
  före rättning), Slutrapport MCQ (kriterium = hela tentan, efter rättning), Totalrapport
  (hela tentan inkl. fritext/flersvar). Diskriminering = punkt-biseriell / item–total.
- **Två användargrupper:** examinatorer (laddar upp, utvärderar, exporterar) och
  temaansvariga (får den interaktiva HTML-exporten – alla funktioner *utom* uppladdning).

## Språk och ton
- Gränssnittet är på **svenska**. Behåll svensk text i UI och i exporten.
- Verktyget är desktop-orienterat.

## Stil för ändringar
- Diagnostisera grundorsaken före åtgärd. Gör minsta möjliga, väl avgränsade ändring.
- Behåll den befintliga kodstilen och de förklarande kommentarerna.
