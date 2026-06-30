# MCQ-analys för Inspera-tentor

Ett webbverktyg för att analysera resultaten från flervalstentor (MCQ) exporterade
från Inspera. Verktyget visar svarsfördelning per alternativ, andel rätt och
**diskriminering** – hur väl varje fråga skiljer starka från svaga studenter – som
stöd för att bedöma frågekvalitet, hitta frågor att rätta om eller exkludera, och
för att visualisera hela tentan i betygskollegiet.

> **Status:** under utveckling. Verktyget fungerar men kan innehålla fel – dubbelkolla
> viktiga slutsatser. Återkoppling och buggrapporter välkomnas (se Kontakt nedan).

## Demo

En körbar version ligger på GitHub Pages:
**https://ANVÄNDARNAMN.github.io/REPONAMN/**
*(ersätt med din faktiska adress när Pages är aktiverat — se nedan)*

Verktyget körs helt i webbläsaren. Vill du visa det utan riktiga studentdata,
använd en avidentifierad/syntetisk exempeltenta (se `examples/` om sådan finns).

## Vad det gör

- Läser tentans **PDF** + ett eller flera **JSON-resultat** från Inspera, samt en
  valfri **Excel-fil** med teman/taggar per fråga.
- Per fråga: andel som valde varje svarsalternativ, andel rätt, och punkt-biseriell
  diskriminering (item–total-korrelation). Distraktoranalys med färgkodning av hur
  effektiva felaktiga alternativ är.
- Tre rapportvyer knutna till rättningsflödet:
  - **Preliminär MCQ** – före rättning, diskriminering mot MCQ-delen.
  - **Slutrapport MCQ** – efter rättning, diskriminering mot hela tentan.
  - **Totalrapport** – hela tentan inklusive fritext och flersvar, för betygskollegiet.
- Filtrering på tema/tagg, sortering, exkludering av frågor, och export till
  **Excel/CSV/PDF** samt en fristående **interaktiv HTML**-fil att dela.

## Integritet

Allt bearbetas lokalt i din webbläsare. Inga data laddas upp till någon server.
Den delbara HTML-exporten bakar **endast in aggregat** (antal per alternativ, n,
diskriminering, teman) – aldrig kandidatsvar eller rådata på individnivå.

## Använda verktyget

1. Öppna `index.html` (eller demolänken).
2. Ladda upp tentans PDF, JSON-resultatet/-en och (valfritt) tagg-Excel.
3. Växla mellan vyerna, filtrera på tema, exportera vid behov.

Verktyget är desktop-orienterat.

## Teknik

- **En enda fil** (`index.html`) – ren HTML/CSS/JS, ingen byggprocess.
- Beroenden hämtas från CDN: `pdf.js` (läsa PDF) och `SheetJS/xlsx` (läsa/skriva
  Excel). För helt offline-bruk kan biblioteken läggas lokalt bredvid filen och
  `src`/`workerSrc` pekas om (se kommentar högst upp i `index.html`).
- Den exporterade interaktiva HTML-filen är fristående och kräver inget CDN för att
  *visas* (xlsx-nedladdning därifrån hämtar SheetJS vid klick, med CSV som reserv offline).

## Köra som demo (GitHub Pages)

1. Lägg upp repot publikt på GitHub.
2. Settings → Pages → välj branch `main`, mapp `/ (root)`.
3. Efter någon minut nås verktyget på `https://ANVÄNDARNAMN.github.io/REPONAMN/`.

## Bakgrund och författarskap

Verktyget är utvecklat av **Kajsa Igelström** för analys av läkarprogrammets
MCQ-tentor. Den pedagogiska och psykometriska designen – valet av mått
(diskriminering, distraktoreffektivitet), arbetsflödet kring preliminär/slut/total-rapport
och betygskollegiet, samt återkopplingen till frågekonstruktörer – är författarens.
Implementeringen har tagits fram med AI-assisterad kodning (Claude), under författarens
specifikation, granskning och beslut om vad som är korrekt.

## Licens

MIT – se [LICENSE](LICENSE). Fri att använda, ändra och dela, så länge
upphovsrättsnotisen följer med.

## Kontakt

Kajsa Igelström – för buggar och förslag.
