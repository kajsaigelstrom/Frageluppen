# Ändringslogg

Versionerna följer MAJOR.MINOR.PATCH. `VERSION`-konstanten högst upp i `index.html`
ska alltid matcha den senaste Git-taggen.

Loggen börjar vid 3.13.0 (utgångsläget när repot skapades). Tidigare historik finns
inte dokumenterad här.

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
