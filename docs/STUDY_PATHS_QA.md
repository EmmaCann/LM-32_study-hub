# Verifica locale — 16 novembre 2026

Branch: `feature/study-paths`. Base: develop allineato ai due fix heap già
committati su main. Nessun push, merge su develop/main o deployment.

## Risultati

| Controllo | Esito |
| --- | --- |
| Validazione contenuti e percorso | 13 pacchetti esistenti, 19 tappe, 156 sezioni, 55 attività |
| TypeScript | Passato, anche durante la build finale |
| ESLint | Passato; risorse vendor PDF.js escluse come la toolchain C++ |
| Test automatici | 50/50 passati |
| Build di produzione locale | Passata, 66 pagine generate |
| Suite browser completa | 68 scenari eseguiti su Chromium e WebKit/iPad |
| Ripetizione finale dei flussi aggiornati | 14/14 passati |
| CLI catalogo | Preview valida, import senza approvazione rifiutato, import approvato e validazione riusciti in copia isolata |

Nel passaggio completo 66 scenari sono passati; due controllavano ancora il
titolo e le schede della vecchia home. Le asserzioni sono state aggiornate alla
nuova home, poi la ripetizione finale ha incluso entrambi i casi, l'ispezione
visiva e tutti i nuovi flussi (14 scenari, tutti passati). Le modifiche finali
alla ripresa dello studio sono coperte anche dal test automatico dedicato.

## Flussi effettivamente verificati

- Navigazione, URL esistenti, link, 404, sidebar chiusa/aperta e temi persistenti.
- Laboratori AOS e Algoritmi: controlli, reset, animazioni, scene e ridimensionamento.
- C++ reale: input/output, stderr, errore di compilazione, timeout, interruzione,
  limiti, test positivi e negativi, aiuti, soluzione, download, navigazione.
- C++ nel percorso: superamento reale registrato, bozza conservata al reload,
  ritorno alla verifica senza completare prematuramente l'intera lezione.
- Quiz errati/corretti e frammento C errato/corretto, completamento solo dopo
  tutte le attività, persistenza, esportazione/importazione e backup invalido.
- Riconoscimento PDF, indicizzazione, ricerca locale/unificata, apertura della
  pagina, rendering, persistenza dopo reload e rimozione.
- Teoria dall'animazione, versione differente segnalata, correzione locale del
  riferimento e cambio di vista Animazione/Teoria su layout iPad.
- PDF assente, file non valido, documento senza testo e annullamento.
- LocalStorage/IndexedDB bloccati: messaggi, progresso o documento in sessione.
- Nessun POST durante selezione, ricerca e lettura dei documenti di prova.
- Assenza di overflow orizzontale su layout desktop, iPad e telefono.

Corretto un problema rilevato su WebKit: la serializzazione del File-backed Blob
in IndexedDB non era affidabile. Il salvataggio usa ora ArrayBuffer, ricostruendo
il Blob alla lettura; persistenza e riferimenti sono stati riprovati con successo.

## Limiti e revisione ancora necessari

- iPad verificato tramite WebKit e profilo iPad; nessuna prova su hardware fisico.
- I PDF dei test sono documenti originali minimi generati dal test, senza fonti
  universitarie. Nessun PDF o ZIP è entrato nel repository o nella build.
- I frammenti C sono controlli espliciti del sorgente, non esecuzioni Linux.
- PDF senza testo: nessun OCR. I file devono essere selezionati su ogni dispositivo.
- Ottimizzazione è una tappa da preparare; i laboratori ancora non committati
  negli altri worktree non sono stati copiati o modificati.
- Prima di un eventuale rilascio: revisione dell'esperienza locale e successiva
  decisione di integrazione con develop/main. Il sito pubblico resta invariato.
