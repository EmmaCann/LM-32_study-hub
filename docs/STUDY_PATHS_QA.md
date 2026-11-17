# Verifica locale — 17 novembre 2026

Branch `feature/study-paths`, worktree `C:/LM-32_study-hub-study-paths`.
Include gli aggiornamenti pubblicati su main fino a `686f707`, tramite merge
locale `9658bda`. Nessun push, merge del redesign su develop/main o deployment.

## Controlli tecnici

- Validazione: 28 pacchetti approvati, 28 tappe, 24 appunti PDF associati.
- Test automatici Node: 75/75 passati, inclusi integrità e schema degli appunti.
- Build di produzione, TypeScript ed ESLint passati.
- Suite browser completa: 76 scenari su Chromium e WebKit/iPad, 75 passati.
  Il caso responsive WebKit cambiava documento mentre Next precaricava i link,
  producendo errori di annullamento delle richieste. Il test ora attende la fine
  delle richieste prima della navigazione successiva, senza filtrare gli errori.
- Ripetizione finale dei flussi aggiornati: 12/12 passati su entrambi i browser,
  incluso il caso responsive. Tutti gli scenari risultano verificati.
- Due test AOS preesistenti ora scrivono gli screenshot in test-results; i test
  del timer usano pulsanti reali e attendono la rotazione nel viewport, invece
  di attivare controlli fuori schermo tramite DOM.

## Flussi del nuovo spazio di studio

- Apertura automatica del PDF selezionando materia e lezione, senza file picker.
- Indice con salto alla pagina e cambio lezione, URL compatibili.
- Ricerca nel testo dei PDF con accesso diretto alla pagina della lezione.
- Car: completamento dei campi C errato/corretto, animazione originale,
  avanzamento, teoria affiancata a pagina 8, apertura/chiusura della teoria.
- C++ nella lezione: compilazione e verifica reali, attività registrata,
  bozza salvata, ritorno alla verifica senza completare tutta la lezione.
- Comprensione: risposta errata/corretta, frammento C, completamento solo dopo
  tutte le attività, reload, esportazione progressi e backup invalido.
- Home, pagine materia, sidebar, temi e assenza di overflow a 1440/768/390 px.
- Ispezione visiva di home, car con PDF renderizzato e lettore in WebKit/iPad.

## Documenti e limiti

La proprietaria ha autorizzato la pubblicazione dei nostri appunti rielaborati.
La raccolta include 24 PDF, circa 10,4 MiB, provenienti esclusivamente dalle
cartelle `appunti pronti` e dichiarati nel catalogo. SHA-256, pagine, associazioni
e assenza di file estranei sono controllati durante la build. Il sincronizzatore
legge le fonti in `C:/LM-32`, senza modificarle. Nessuna slide, trascrizione o
ZIP originale viene incluso. I PDF pubblicati sono accessibili senza login.

WebKit emula un iPad: nessuna prova su hardware fisico. I frammenti C Linux sono
controlli dichiarati del sorgente/campi, non esecuzioni Linux. C++ continua a
usare Clang/YoWASP nel browser; non è stato introdotto un esecutore server.
Ottimizzazione è ancora da preparare. Bozze e progressi restano nel browser;
nessuna sincronizzazione personale tra dispositivi è stata introdotta.

## Revisione

Anteprima locale: `http://127.0.0.1:3217`.
Il redesign rimane locale per la revisione. Il rilascio seguirà l'ordine
feature → develop → main → deployment Git Vercel.

## Revisione palette, adattamento PDF e mappa materia

- Build di produzione, TypeScript e lint passati.
- Eseguiti 46 scenari browser relativi a navigazione, laboratori integrati,
  comprensione, C++, ricerca, temi, mappe e lettore su Chromium e WebKit/iPad.
  44 passati nella prima esecuzione; due nuovi test PDF usavano un selettore
  ambiguo tra menu zoom e pulsanti. Selettore reso esatto.
- Ripetizione finale dei sei nuovi scenari: 6/6 passati sulla build finale.
- PDF: pagina intera iniziale entro il contenitore, 50% → 25% tramite Riduci,
  Aumenta, Larghezza, restringimento a 390 px e riallargamento a 1440 px.
- Mappa: tutte le tappe AOS presenti, sottoargomenti collegati alle pagine,
  avanzamento parziale distinto dal completamento, colore diverso dopo tutte
  le firme richieste e persistenza dopo reload.
- Palette e mappe delle quattro materie senza overflow a 1440/768/390 px.
- Ispezione visiva di home chiara/scura, mappa AOS e PDF adattato. Risoluzione
  bitmap limitata a 12 milioni di pixel e 8192 px per lato per gli zoom elevati.

Il lavoro resta su feature/study-paths e nell'anteprima locale; nessun rilascio.
