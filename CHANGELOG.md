# Ändringslogg

Versionerna följer MAJOR.MINOR.PATCH. `VERSION`-konstanten högst upp i `index.html`
ska alltid matcha den senaste Git-taggen.

Loggen börjar vid 3.13.0 (utgångsläget när repot skapades). Tidigare historik finns
inte dokumenterad här.

## 3.34.0
- **Uppdelning i studenter registrerade innevarande termin och övriga.** Steg 1 har en fjärde, valfri filruta för
  en lista från Ladok (CSV) med kolumnen AidCode, som är samma nummer som Insperas kandidatnummer. Bara den
  kolumnen läses. I datafilen står bara ja eller nej per student. Kvittot säger hur många av listans koder som
  finns bland tentans studenter.
- **Kursbokslutstext** i steg 3: en färdig text efter kursbokslutets mall, med val mellan ordinarie tentamen och
  omtentamen. Följer G-gränsen och exkluderingarna.
- **Tentamensstatistiken** fyller i raderna om registrerade innevarande termin och tidigare terminer (antal G,
  antal U, andel G) när Ladok-listan är med.
- **Formkontrollen synkad med MCQ-lathunden 1.1.1:** bokstavspar räknas som samlingsalternativ bara när alternativet
  är själva kombinationen, alternativbokstav skalas inte bort ur "E. coli" eller "2.5 mg", ojämn form jämför inte
  bokstav mot siffra, och "är inte korrekt" i stammen hittas som påståendeform.

## 3.33.0
- **Varning när sidan visas inbäddad**, till exempel i Teams-appens förhandsvisning. Där stoppas nya fönster,
  nedladdningar och utskrift utan felmeddelande, så knapparna gör ingenting. Sidan säger nu det högst upp och
  hänvisar till webbläsaren. Gäller både verktyget och den exporterade temarapporten.

## 3.32.8
- Formkontrollen synkad med MCQ-lathunden 1.0: negation i vinjetten är inte längre en regel, och stammar som
  "Vad stämmer bäst …" räknas som påståendeform.

## 3.32.7
- Ett formfynd som bara var en citerad fras ur stammen skrivs nu ut som en mening: "Stammen har formuleringen
  «Vilket påstående»."

## 3.32.6
- **Formfynden har egna eftertolkande lydelser** (Kajsas beslut 23 nov 2026). Lathundens rubriker, råd och
  motiveringar är skrivna för den som konstruerar en fråga. Efter rättningen sa de hur frågan skulle göras om,
  förutsatte regler som kursen inte har beslutat, påstod något om målen och nämnde former som frågan inte hade.
  Korten visar nu en iakttagelse om frågans form och hur den kan hänga ihop med mönstret i svaren, till exempel
  "Frågan ber studenten välja det påstående som stämmer. Varje påstående bedöms då för sig, och frågan kan
  pröva om studenten känner igen ett faktum." Utfällningen "Ur MCQ-lathunden" med råden är borta, och en
  källrad står kvar.
- Ett fynd pekar ut alternativet med dess text i stället för "distraktor 2", eftersom kortet sorterar
  alternativen efter andel. Flera fynd av samma regel slås ihop till en rad.
- Hjälpen nämner inte längre vem som gör vilket steg i Linköping.

## 3.32.5
- **Hjälpen är omskriven med ett ämne per avsnitt** (Kajsa 23 nov 2026). Den hade vuxit fram i lager, så att
  samma sak stod på flera ställen och gamla formuleringar låg kvar. Verktygets hjälp har nu ett avsnitt per steg,
  sedan måtten, uppmaningar och observationer, frågetyperna, formkontrollen, filtret, exporterna, kommentarer
  och exkluderingar, inställningar och vad filerna innehåller. Hjälpen öppnar på avsnittet för aktuellt steg.
- Temarapportens hjälp har samma uppställning, utan det som bara gäller verktyget. Det som är gemensamt
  (måtten, frågetyperna, formkontrollen, filtret) står en gång i källan, så att texterna inte glider isär.

## 3.32.4
- **Alla formfynd som passar mönstret visas** (Kajsas beslut 22 nov 2026). Gränsen på två per observation är
  borta: den klippte bort fynd som fanns, och valde de två som stod först i lathundens ordning.
- **Steg 2 säger att statistiken är preliminär** och kan ändras när allt är rättat: i vyn, i exporten
  Problemfrågor och i hjälpen. En fråga kan pekas ut i steg 2 men inte i steg 3, eller tvärtom.

## 3.32.3
Vilka formfynd ur MCQ-lathunden som visas som möjlig förklaring (Kajsas beslut 22 nov 2026).
- **"Stammen bär inte frågan" visas inte längre på något kort.** Regeln hör hemma när frågan skrivs. Den
  hindrar fortfarande att en fråga blir förebild.
- **Påståendeformen visas som möjlig förklaring till en mycket lätt fråga**, eftersom den ofta prövar
  ange-nivå. Den visas inte längre under "Se över frågan" eller "Dubbelkolla facit".
- En formregel visas en gång per observation, också när den slår på flera alternativ.

## 3.32.2
- **Översiktstabellen gav essäfrågor etiketten "god"**, fast korten inte gör det. Tabellen tappade uppgiften
  om att etiketten inte gäller essä- och flersvarsfrågor. Nu säger tabellen och kortet samma sak, och
  maxpoängen skrivs med decimalkomma. Hittat när skärmbilderna i README togs om.
- Nya skärmbilder i README, tagna på den syntetiska tentan.
- Den syntetiska tentan i `tools/` har rimligare poäng för essä- och flersvarsfrågorna (r 0,1–0,6 i stället för
  0,8–0,9), och skärmbilderna är tagna på den. Verktyget självt är oförändrat.

## 3.32.1
Två rättningar i kvittot i steg 1, efter prov på en T1-tenta (22 nov 2026).
- **Flervalsfrågor och flersvarsfrågor räknas var för sig**, till exempel "47 flervalsfrågor och 5
  flersvarsfrågor lästa ur PDF:en". Förut kallades alla frågor med svarsalternativ flervalsfrågor.
- **En PDF som inte hör till resultaten ger en varning också när den saknar tentans namn i sidhuvudet.**
  Kontrollen ser på innehållet: om frågornas nummer finns i resultaten, och om studenternas valda svar känns
  igen bland PDF:ens alternativ.

## 3.32.0
- **En fjärde frågetyp, Övrig** (Kajsas beslut 22 nov 2026, efter prov på en T1-tenta): automaträttade frågor
  som varken är flervals- eller flersvarsfrågor, till exempel markera i en bild, välja i löptext eller para
  ihop. Förut räknades de som essäfrågor. De har eget kort ("Övrig, automaträttad"), eget filterval och egen
  uppgift i filraden. Vid tydligt negativ diskriminering gäller uppmaningen facit och poängregeln, inte
  bedömningsmallen. De räknas i hela tentans reliabilitet men inte i essädelen. Frågetexten läses inte.
  Typen känns igen på att frågan saknar valrutor, har autopoäng och att färre än hälften av studenterna har
  manuell poäng.

## 3.31.1
Efter prov på en T1-tenta (22 nov 2026).
- **Utan tentans PDF körs ingen formkontroll och ingen fråga märks som förebild.** Platshållaren för
  frågetexten räknades förut som en riktig frågetext, så att formfynd och förebilder kunde visas utan att
  frågan hade lästs.
- Två texter sa "hela rapporten" i stället för "steg 3".

## 3.31.0
Femte och sista etappen efter genomgången: tillgänglighet och städning (Kajsas beslut 21 nov 2026).
- **Filterknapparna är riktiga knappar** och nås med tangentbord. Fokus står kvar på knappen efter ett val, och
  knappar har synlig fokusmarkering.
- **Etiketterna har kontrast minst 4,5:** utan etikett, ej mätbar, osäker och Lätt är mörkade.
- **I diagrammet är G en fylld punkt och U en ofylld ring**, så att de skiljs åt utan färg.
- **Stapelns värdeord är borta** ("effektiv", "mindre effektiv"), i linje med färgförklaringen.
- **Städning utan ändrat beteende:** spärren för orättad tenta (`showGate`) är borttagen, kontrollraden och
  lyssnarna för kommentarer finns en gång och delas med temarapporten, och `CLAUDE.md` och `README.md`
  beskriver dagens verktyg.

## 3.30.0
Fjärde etappen efter genomgången: reliabilitet (Kajsas beslut 21 nov 2026).
- **Cronbachs alfa för hela tentan, flervalsdelen och essädelen**, med medeldiskrimineringen per del bredvid,
  som inte beror på antalet frågor. Exkluderade frågor räknas inte. Frågor i samma fall räknas som fristående,
  och det står vid essädelen.
- **Tentamensstatistikens flik Sammanfattning** har de tre värdena, mätfelet i poäng för hela tentan och antalet
  studenter inom ett mätfel från G-gränsen.
- **Temarapporten** visar alfa för de tre delarna överst, utan mätfel och antal nära gränsen. En sida med ett
  urval av frågor säger att värdena gäller hela tentan.
- **Vid G-fältet** står "godkänd från X p" i stället för "= X p".

## 3.29.0
Tredje etappen efter genomgången: flödet mellan stegen och exporterna (Kajsas beslut 21 nov 2026).
- **Filraden syns i alla tre stegen** så snart filer är inlästa, och säger "Datafilen är inte sparad" med länken
  Spara tills den är sparad. Filerna följer med när man byter steg.
- **Steg 2 och 3 är gråa tills filer finns.** En sparad datafil väljs i steg 1, under filrutorna, och sidan står
  kvar där tills ett steg väljs. Knappen "Gå vidare till steg 2" är ersatt av valen "2 Hitta problemfrågor" och
  "3 Skapa rapporter" bredvid spara-knappen. Steg 3 är grått med skälet utskrivet när rättningen inte är klar.
- **Kvittot i steg 1** säger om essäfrågorna är rättade och hur många frågor taggfilen matchade.
- **Den gula rutan i steg 1** är tre korta punkter.
- **Exportknapparna säger formatet:** Problemfrågor (PDF), Temarapport (interaktiv), Temarapport (PDF),
  Översiktstabell (PDF), Tentamensstatistik (Excel), Diagram (PDF). De som heter PDF öppnas för utskrift i
  stället för att sparas som HTML. Går fönstret inte att öppna sparas sidan som fil.
- **Antalet frågor står på knappen** när ett filter är valt, för de exporter som följer filtret.
- **Temarapporten har knappen "Spara sidan med kommentarer"**, som alltid syns.
- **Verktyget frågar innan kommentarer och egna exkluderingar försvinner** när en ny fil läses in, och varnar
  när sidan stängs.
- **Hjälpen öppnar på avsnittet för aktuellt steg** och beskriver lägena, G-gränsen och kontrollen mot Insperas
  betyg. Vyn i steg 3 heter "Alla frågor". Översiktstabellen har decimalkomma.

## 3.28.0
Andra etappen efter genomgången: ett kort överallt, och essäfrågornas återkoppling (Kajsas beslut 21 och 22 nov 2026).
- **Uppmaningar finns bara där ett beslut ska fattas före betygssättning:** "Dubbelkolla facit" och "Se över
  frågan". "Se över frågan" har en lydelse för låg r och en för ej mätbar r. "Talar starkt för" sägs bara när
  frågan både ligger nära gissningsnivå och har tydligt negativ r.
- **Allt annat är observationer**, med möjliga orsaker under "Mer om måttet": Vanligt felsvar (förut "Ta upp i
  undervisningen"), Sällan valda alternativ (förut "Förbättra svarsalternativen"), Mycket lätt fråga och Få
  svarade rätt (förut "Se över svårighetsgraden"). Rubriken "Till nästa gång" är borta.
- **Samma kort hos examinatorn och i temarapporten.** Temarapporten visar samma observationer, och ställer
  frågorna "Stämmer facit?" och "Går «X» att försvara?" i stället för uppmaningen. De fem övriga frågorna under
  "Att fråga sig" är borta. Läget heter "Med observationer" och filtervalet "Med observation" på båda ställena.
  Mönsterraderna överst finns nu också i steg 3, och förebilder märks ut även där.
- **MCQ-lathunden är enda källan för formfynd.** Verktygets egen ledtrådssökning och checklistan "Kan det vara
  testwiseness?" är borttagna.
- **Ett alternativs riktning står i ord**, aldrig som tecken: "valdes oftare av studenter med högre/lägre
  totalpoäng". Siffran står i verktygstipset. Orden starka och svaga studenter används inte längre.
- **Ej mätbar diskriminering säger skälet på kortet**, till exempel "ej mätbar (bara 3 svarade fel)". "Tak ≈",
  "(för lätt)" och "(för svår)" är borta ur tipsen.
- **Essäkort:** inga brickor Lätt/Svår, aldrig etiketten "god", och en enda uppmaning (vid tydligt negativ r):
  "Kontrollera bedömningsmallen och rättningen före betygssättningen." Raden om lätta essäfrågor har möjliga
  orsaker i stället för en fråga.
- **Text:** decimalkomma och "r" i stället för "r_pb" på korten. Färgförklaringen säger "Distraktor ≥ 5 %",
  "Distraktor < 5 %", "Distraktor 0 %". Hjälpen har förbehållet om målrelaterat prov och meningen om att
  enstaka varningar väntas av slump; stycket om distraktorfärger är struket.

## 3.27.0
Första etappen efter genomgången 21 nov 2026: räknereglerna. Texterna på korten följer i nästa etapp.
- **En gräns för litet underlag.** Under 30 svar visas bara mätvärden, utan etiketter, observationer
  eller uppmaningar. Förut bedömdes svårighet och distraktorer redan från 20. Undantaget är "ingen
  svarade rätt", som ger "Dubbelkolla facit" oavsett antal.
- **Blankt svar räknas som fel överallt.** Andel rätt och svarsfördelning räknas på alla som fick
  frågan, och kortet har en egen rad "Inget svar". Förut räknades andel rätt bara på dem som valde
  ett alternativ, medan diskrimineringen mot hela tentan räknade blankt som 0 poäng.
- **Etiketterna för diskriminering är "god" från 0,30 och "låg" under 0,10**, utan etikett
  däremellan. "Mycket god" och "acceptabel" finns inte längre. Gränsen för god är justerbar
  (0,20–0,50) och styr etiketten, filtret och förebilden. Filtret har valen Negativ, Låg, Mellan,
  God och Ej mätbar.
- **Essä- och flersvarsfrågor följer samma regel som flervalsfrågor.** Den mindre gruppen är de
  studenter som inte fick det vanligaste poängtalet: under 5 är diskrimineringen ej mätbar, 5–9
  osäker, och "negativ" sägs först från 10 och när r ligger under −2/√n. Förut var gränsen fast
  −0,10 utan krav på spridning.
- **"Se över frågan" nära gissningsnivå** utlöses när r ligger under 2/√n eller inte går att mäta,
  i stället för under den fasta gränsen 0,20.
- **Sällan valda alternativ bedöms bara när felen räcker** för att alla distraktorer ska kunna nå
  5 % (minst 15 % fel med fyra alternativ). Annars följde flaggan av frågans svårighet.
- **Förebild** kräver god diskriminering över brusgränsen 2/√n och att kortet varken har
  observation eller uppmaning. Kravet på 50–85 % rätt är borta: svårighet är inget
  kvalitetskriterium. Förebild finns nu som filterval även hos examinatorn, och valet "Stark
  diskriminering" är borttaget.
- **Taggar slås upp på ett sätt** för kort, tabeller och statistik: frågenumret först, sedan
  frågans namn ur resultatfilen, sist PDF:ens kod.
- **Översiktstabellen har samma etikett som kortet** för varje flervalsfråga.

## 3.26.0
- **En sida i stället för tre flikar.** Hela rapporten efter rättningen är en enda sida med
  kort för alla frågetyper i tentans ordning: flervalsfrågor (MCQ), essäfrågor och, nytt,
  flersvarsfrågor. Frågetyp väljs i filtret. Flikarna Slutrapport MCQ, Essäfrågor och
  Totalrapport finns inte längre, varken hos examinatorn eller i temarapporten. Tabellen över
  alla frågor är i stället exporten **Översiktstabell**: en fristående sida utan skript, med en
  rad per fråga, att skriva ut eller skicka vidare. Den följer filtret och har bara
  sammanräknade tal. Examinatorn exkluderar essä- och flersvarsfrågor med knappen på kortet,
  precis som flervalsfrågorna. Ett flersvarskort visar poängfördelningen och, när poängen inte
  följer resten av tentan, frågan "Stämmer facit och poängregeln?" (för essäfrågor gäller
  bedömningsmallen). Mönsterraderna säger "MCQ-frågor" och "essäfrågor" så att de inte blandas
  ihop. Excel och CSV ur temarapporten har en rad per synlig fråga med kolumnen Typ.
- **Efter oberoende genomgång av kod, användarupplevelse och pedagogik (21 nov):** exkludering
  slår igenom i diskrimineringen även när Inspera kodar frågenumren som tal. En fråga som ingen
  fick rätt på pekas ut ("Dubbelkolla facit") och kallas inte längre "för få svar". En trasig
  fil lämnar inga gamla resultat kvar, och filter följer inte med till nästa fil. Steg 1 visar
  inga varningar från förra analysen och låser inte steg 3. Temarapporten och Översiktstabellen
  säger vilken tenta de gäller, urvalsetiketten i temarapporten har aldrig appens åtgärdsord, och
  utskriften behåller färgerna och får rubrik även via Temarapport (PDF). I Tentamensstatistiken
  räknas procenten vid antal G och U om när G-gränsen ändras. En fråga som är exkluderad i Inspera
  har ingen orsakslista. Död kod och 57 oanvända stilregler är borttagna.
- **Kodstädning utan ändrat beteende.** Död kod och oanvända fält, element och stilregler är
  borttagna (filen är drygt 200 rader kortare). G-gränsen och godkäntregeln räknas på ett ställe
  (`gLimit`, `gPassed`), och korten för flervalsfrågor och för essä- och flersvarsfrågor delar
  hjälpare för exkludering, urvalsruta och märkning. Interna namn följer stegen i stället för de
  tidigare rollerna, och kommentarerna beskriver verktyget som det är nu. Kortens och exporternas
  utdata jämfördes tecken för tecken mot versionen före städningen: inga skillnader.
- **Tre steg i stället för rollvalet.** Raden överst har 1 Förbered filer, 2 Hitta problemfrågor
  och 3 Skapa rapporter, och ersätter både "Jag är Kurssamordnare/Examinator" och mellansteget
  "Vad vill du göra?". Med en fil öppen byter man steg med ett klick. Steg 3 kräver färdig
  rättning och säger det. Filen från steg 1 heter nu **datafilen** (`datafil_….html`), och
  texterna säger inte längre vem som gör vad; hjälpen nämner Linköpings uppdelning som exempel.
  Adressen följer steget (`#forbered`, `#problemfragor`, `#rapporter`), och de äldre adresserna
  fungerar. **Från steg 1 går man direkt vidare** till steg 2 och 3 med filerna som är valda,
  utan att spara och välja datafilen igen; filerna ligger kvar om man går tillbaka. Datafilen
  sparas bara när någon annan ska göra steg 2 och 3, och är nu en ren datafil
  (`datafil_….json`) som väljs i verktyget, så att det finns en enda väg in. Äldre datafiler i
  HTML-format går fortfarande att öppna och välja.
- **Temarapporten är renodlad.** Den följer examinatorns filter: med till exempel ett tema valt
  innehåller rapporten bara de frågorna och säger vilket filter det var. Den skapas som interaktiv
  sida (**Temarapport**) eller för utskrift (**Temarapport (PDF)**). Kommentarer kan skrivas även i
  temarapporten och följer med när en sida sparas eller skrivs ut; det står inte vem som skrev.
  Förklaringen av måttet är en utfällning på kortet (**Mer om måttet**) i stället för ett eget
  läge, och en öppnad utfällning följer med i utskriften. Urvalet och exporterna står på raden
  överst. Förebildslistan ovanför korten är borta (förebilderna finns i filtret och på kortet),
  liksom Excel och CSV (kvar är Översiktstabell och Skriv ut / PDF).
- **Kontroll mot Insperas egen uträkning.** Insperas slutbetyg och totalpoäng per student följer
  nu med i filen till examinatorn (datumet för betyget gör det inte). I hela rapporten jämför
  verktyget sin totalpoäng och sitt betyg med Insperas, student för student, och varnar med antal
  när de skiljer sig. Varningen räknas om när en fråga exkluderas eller G-gränsen ändras.
  Tentamensstatistiken har Insperas slutpoäng och betyg bredvid verktygets.
- **Kommentarer på frågor.** Varje kort har "Lägg till kommentar". Kommentaren följer med till
  betygskollegiet och till temagrupperna, där den står som "Kommentar från examinatorn" och inte
  kan ändras. Kommentarerna finns bara så länge filen är öppen.
- **Problemfrågor**, ny export före betygssättning: en fristående sida till betygskollegiet med
  frågorna att se över, exkluderade frågor och frågor med kommentar.
- **Tentamensstatistik** ersätter den gamla Excel-exporten. Arbetsboken har samma flikar som
  kurssamordnarnas mall (Sammanfattning, Resultat per sektion, Resultat per fall), räknar utan
  exkluderade frågor. G-gränsen anges i procent, ändras direkt på rapportsidan (65 % som standard) och står i en cell som går att ändra; poänggränsen och betygen räknas ur procenten. **Diagram** ger en sida med
  poängfördelningen och slutpoäng per student och studieort. Studieorten läses ur resultatfilernas
  namn och följer med i filen till examinatorn. Studenterna har löpnummer, aldrig Insperas id.
- **Hela rapporten är renodlad.** Lägena heter **Med råd** och **Bara mätvärden**. Listan över
  starkt diskriminerande frågor ovanför korten är borta; de väljs i stället med **Stark
  diskriminering** under Att titta på i filtret. Kort utan råd har ingen ruta, och det gröna
  "Inga anmärkningar" är borttaget. Exporterna står samlade på rubrikraden: Temarapport,
  Översiktstabell och Excel. **PDF (examinatorns) är borttagen**: återkopplingen går till
  temagrupperna, genom Temarapporten.
- **Exkluderingar följer med från Inspera.** En fråga som är viktad till 0 % i Inspera känns igen
  i exporten och räknas som exkluderad när filen öppnas, med orsaken "Viktad till 0 % i Inspera".
  En rad överst säger vilka frågor det gäller. Har inte alla studenter vikten 0 på frågan visas
  en varning om att det ser ut som ett fel i Inspera, och frågan räknas då inte som exkluderad. En exkludering som bara görs i verktyget säger på
  kortet att frågan också ska vägas ner i Inspera. Vikten följer med i filen till examinatorn;
  filer skapade med äldre versioner saknar den.
- **Ny layout i alla tre vyerna.** När en fil är vald blir sidhuvudet en smal rad: namnet,
  tentan med antal studenter och frågor (i hela rapporten också exkluderade frågor och
  maxpoäng), Byt fil, Inställningar och Hjälp. Den ersätter det stora sidhuvudet, filrutan,
  statusraden och sifferrutan. Varningar står på en egen rad under, bara när de finns. Vyns rubrik
  och lägesknapparna står på samma rad, med en enda förklaring under, och före betygssättning
  visar knapparna antal ("Att se över · 3"). Temarapporten har samma skelett. Tentans namn är
  det som resultatfilerna har gemensamt, inte den första ortens. Raden om att verktyget är under
  utveckling står i sidfoten.
- **Vyn före betygssättning är renodlad.** Den öppnar på frågorna **att se över**, alltså dem som
  statistiken pekar ut (tecken på fel i facit, eller mycket svåra frågor som inte skiljer mellan
  studenter), plus exkluderade frågor så att en exkludering går att ångra. **Alla flervalsfrågor**
  ger en reducerad överblick: kort med mätvärden och alternativ, och ruta bara där något ska ses
  över. Inget filter i vyn, bara sök och sortering, och sökrutan hittar vilken fråga som helst.
  Råden "till nästa gång" visas inte före betygssättning, varken på korten eller i examinatorns
  PDF. Pekar statistiken inte ut någon fråga står det, och vid för få svar visas alla frågor.
  Rutan överst visar bara antal studenter och frågor, så att man ser att filen lästs rätt.
  Listan som upprepade frågorna att se över ovanför korten är borttagen, liksom medelandelen
  rätt i alla vyer och i temarapporten.
- **Textgenomgång ur tre läsares perspektiv** (kurssamordnaren, examinatorn före och efter
  rättning, temagruppens representant). Samma sak heter nu samma sak: "att se över" (inte "att
  åtgärda"), "exkludera" (inte "utesluta"), "facit" (inte "nyckel"), "studenter" (inte
  "kandidater"), "poängen på flervalsdelen" (inte "MCQ-delsumman"), "essä" och "flersvar" (inte
  "fritext" och "flerval"). Kurssamordnaren får veta att filen görs två gånger med nya filer från
  Inspera och vad PDF och taggfil ger examinatorn, och ser inte längre Inställningar. Examinatorn
  uppmanas inte längre att ladda upp en PDF som hen inte har, och PDF (examinatorns) beskrivs
  överallt som eget arbetsunderlag. Temarapportens hjälp förklarar distraktor, starka och svaga
  studenter och "Fråga på kortet", nämner inte taggfil eller godkäntandel, och säger att
  rapporten innehåller frågetexterna och rätt svar. Sidhuvudet säger "frågeanalys" i stället för
  "MCQ-analys". Kortens utfall är oförändrat (kontrollerat mot sparat utgångsläge).
- **Temarapport ersätter den interaktiva HTML-exporten.** Rapporten till temagrupperna
  innehåller bara frågorna efter rättning och ingen triage:
  inga åtgärdsrutor, ingen åtgärdslista och inga uppmaningar i etiketter eller verktygstips.
  Där svaren följer ett mönster står i stället en ruta **Att fråga sig** med högst två frågor
  till den som skrev uppgiften. Mönstren hittas med samma villkor och trösklar som
  rådgivningen i appen. Nytt är att en mycket lätt fråga får frågan om den prövar något
  enklare än avsett. Överst står att statistiken inte säger något om en frågas nivå mot
  kursplanen. Knappen är inaktiv tills tentan är färdigrättad. Excel/CSV ur rapporten har
  kolumnen "Att fråga sig" i stället för "Flaggor" (som tidigare skrev "undefined").
- **Urval och egen sida.** I temarapporten kan frågor bockas för på korten och sparas som en ny fristående sida med bara dem. "Markera alla visade"
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
- **Examinatorns flöde i två steg.** Under fliken Examinator finns en enda filruta, där filen
  från kurssamordnaren väljs (den går också att öppna med ett dubbelklick). Sedan väljer
  examinatorn mellan **Hitta problemfrågor före betygssättning** (en egen vy med bara
  flervalsfrågorna att se över, exkludering på kortet) och **Se hela
  rapporten** (alla frågor efter rättning, med Temarapport, Översiktstabell och Excel; kräver
  färdig rättning).
  De tre filrutorna för Insperas filer finns bara hos kurssamordnaren.
- **Filterraden.** En rad knappar per grupp: tema (ur taggfilen), frågetyp, svårighet,
  diskriminering och "att titta på" (fråga på kortet eller att se över, förebild, exkluderad).
  Flera val i samma grupp breddar urvalet, val i olika grupper smalnar av det, och varje knapp
  visar hur många frågor ett klick ger. Valda filter står på en egen rad och tas bort med ✕.
  Samma rad finns i examinatorns vyer och i temarapporten. Mönstersammanfattningen, förebildslistan, åtgärdslistan, "Markera alla
  visade" och Excel/CSV följer filtret. Frågetyperna heter nu MCQ, Flersvar och Essä i tabellen.
  Svårighetsgruppen heter Lätt, Medel och Svår, och förebilder beskrivs som medelsvåra, så att
  texten inte antyder att en viss svårighetsgrad är ett mål i sig.
- **Den inbyggda exempeltentan ("Visa exempel") är borttagen.** Den syntetiska tentan finns kvar
  hos testerna. Verktygets fil blev omkring 45 kB mindre, och därmed även filen till examinatorn.
- **Godkäntstatistiken visas inte längre i vyerna eller i temarapporten** (panelen "Nått
  65 %-gränsen" och godkäntgränsen under Inställningar). Den är tänkt som en egen export
  senare. Exkludering görs på korten, för alla frågetyper.
- **Kurssamordnaren är landningsstället, och lämnar en fil som examinatorn bara öppnar.**
  Högst upp i filpanelen väljs **Kurssamordnare** eller **Examinator**, och sidan öppnar hos
  kurssamordnaren. I stället för ett paket som examinatorn måste ladda upp sparar
  kurssamordnaren **examinatorns fil**: hela verktyget med den minimerade tentan inbäddad.
  Examinatorn dubbelklickar och hamnar direkt i analysen, med triage och exkludering före
  rättningen och temarapporten efter. Adressen följer ingången (`#samordnare`, `#examinator`).
  Tentapaket i JSON-format från 3.25.0 går fortfarande att släppa i rutan för resultat.
- **Formkontrollen ur MCQ-lathunden, där den är en trolig förklaring.** När en flervalsfråga
  har en svaghet i statistiken prövas den mot lathundens mekaniska kontroll. Ett fynd visas
  bara när det kan förklara svagheten, med lathundens råd, motivering och källa i en
  utfällning. Frågor utan svaghet prövas inte, och regler som i lathunden bara är tips
  används inte (de slår också på välbyggda frågor, till exempel parallella alternativ).
- **Mönster i frågorna.** Två saker som gäller flera frågor på samma sätt står en gång överst,
  med antal och knappen "Visa frågorna": mycket lätta frågor (med nivåfrågan) och frågor där
  ett alternativ valdes av nästan ingen. Raden säger hur många av dem som har en möjlig
  förklaring i formen. Sammanfattningen följer temafiltret och gäller urvalet på en
  urvalssida. Korten har en ruta bara när något gäller just den frågan. På en riktig tenta
  med 39 flervalsfrågor: 11 kort med ruta (5 med en fråga, 6 med en formförklaring).
- **Förebilder.** Listan över starkt diskriminerande frågor i temarapporten ersätts av
  flervalsfrågor som var medelsvåra (50–85 % rätt), skilde väl, inte har någon fråga på
  kortet och inte ger några fynd i formkontrollen. Kontrollen körs därför även på tänkbara
  förebilder. Essäfrågor märks inte som förebilder, eftersom formen inte går att kontrollera.
- **Essäfrågor får egna kort**, ett per fråga: medelpoäng av max,
  item–total-korrelation mot resten av tentan och poängfördelning. När poängen inte följer
  resten av tentan står en fråga om bedömningsmallen på kortet, och essäfrågor med ett medel
  över gränsen för "Lätt" sammanfattas en gång överst. Kryssrutor, temafilter, urvalssida och
  Excel/CSV fungerar som för flervalsfrågorna.
- **Essäfrågornas text läses ur tentans PDF** (allt mellan frågerubriken och svarsrutan, även
  över sidbrytning) och visas på essäkorten. Texten följer med i kurssamordnarens fil. På en
  riktig tenta lästes 30 av 30 essäfrågor, och flervalsfrågornas inläsning är oförändrad.
- **Buggfix:** fritextfrågornas poängfördelning följde aldrig med i den delade rapporten när den
  skapades från kortvyn (listan var tom vid exporten). Nu räknas den alltid om.
- **Licens:** koden MIT som förut, texterna CC BY 4.0 (står i README).
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
