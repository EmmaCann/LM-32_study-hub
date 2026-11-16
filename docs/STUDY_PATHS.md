# Percorsi di studio e biblioteca privata

## Avvio e confini

Branch `feature/study-paths`, worktree `C:\LM-32_study-hub-study-paths`.
Sviluppo e controlli locali, senza push o deployment. Le cartelle universitarie
non vengono modificate. La base include solo il lavoro già committato su main;
i contenuti in lavorazione negli altri worktree non vengono copiati.

```powershell
cd C:\LM-32_study-hub-study-paths
npm ci
npm run build
npm run start -- --port 3217
```

Aprire `http://localhost:3217`. Per sviluppare: `npm run dev -- --port 3217`.
Le API Web Crypto usate per riconoscere i PDF richiedono localhost oppure HTTPS.
I test WebKit emulano iPad; una prova su hardware iPad reale resta un controllo
manuale distinto e richiede un'origine HTTPS per tutte le funzionalità.

## Navigazione

- `/`: ripresa personale e avanzamento delle materie.
- `/percorso`: roadmap delle quattro materie e gestione backup.
- `/percorso/<lessonId>`: obiettivi, sezioni PDF, laboratori e verifica finale.
- `/biblioteca`: selezione dei PDF locali, ricerca per pagina e lettore.
- `/ricerca`: ricerca unificata, con filtri per materia e tipo.
- `/aos/playground`: frammenti C da completare, senza esecuzione Linux.
- URL e ancore preesistenti conservati, compreso `/cpp/playground`.

Il catalogo iniziale include le lezioni numerate con appunti revisionati
disponibili alla preparazione del branch, la pratica C++ già esistente e una
tappa esplicitamente da preparare per Ottimizzazione. Non pretende di inventare
un programma completo del semestre. I laboratori AOS/Algoritmi ancora non
committati negli altri worktree andranno associati quando saranno integrati.

## Progressi

Nessun account e nessun backend. `localStorage` conserva risultati, bozze e
ultima lezione (`lm32-study-progress-v1`); lo schema dei backup è strict e
versionato. Non usare i progressi come certificazione o sistema anti-cheating:
sono personali e modificabili dal proprietario del browser.

Una lezione è completata solo quando tutte le attività obbligatorie hanno una
ricevuta con la firma attuale. La firma SHA-256 dipende dal contenuto
dell'attività; per C++ comprende anche l'esercizio referenziato e i suoi test.
Cambiare la verifica invalida quel risultato, conservando lo storico precedente
nel backup fino a una nuova verifica. Le sezioni teoriche possono risultare
consultate; il superamento riguarda la verifica della lezione nel suo insieme.

I risultati attestano i controlli superati. Non provano correttezza universale,
lettura effettiva o comprensione di ogni singola sezione. Aprire una soluzione
non registra un risultato. Una nuova risposta errata non cancella un precedente
superamento della stessa verifica. Le bozze C/C++ sono salvate separatamente.

Importazione JSON con anteprima: unione dei record più recenti oppure
sostituzione esplicita. Nessun file PDF, testo estratto o associazione documentale
è nel backup dei progressi. LocalStorage disabilitato o pieno: avviso e stato in
memoria esportabile. Cancellare i dati del browser elimina il salvataggio locale.

## PDF esclusivamente locali

PDF.js `6.5.438`, licenza Apache-2.0, fissato nel lockfile. Worker, font, CMap e
risorse WASM sono serviti dalla stessa origine e preparati da predev/prebuild;
il motore è caricato dinamicamente. Nessuna CDN o API remota per i documenti.

IndexedDB (`lm32-private-pdfs-v1`) conserva Blob, testo estratto per pagina e
riferimenti corretti dall'utente. Limiti per documento: 50 MiB, 500 pagine,
5 milioni di caratteri indicizzati. È renderizzata una pagina alla volta,
con densità pixel massima 2, zoom e testo accessibile separato.

La selezione avviene tramite File API, compatibile anche con l'app File di iPad;
nessun percorso Windows viene inviato al browser o al sito. Il nome suggerisce
una lezione; il contenuto è riconosciuto tramite SHA-256. Un PDF differente
mostra i riferimenti come da riconfermare. L'utente può correggere pagina e
sezione sul proprio dispositivo, senza alterare il catalogo pubblico.

PDF scansionati: consultabili, senza OCR o falsa ricerca. File illeggibili,
protetti, limiti superati e annullamento hanno messaggi espliciti. Se IndexedDB
non funziona, il documento rimane disponibile nella sessione con avviso.
I PDF vanno selezionati su ogni dispositivo e le risorse locali possono essere
eliminate dal browser. Nessun PDF o indice privato finisce in Git o nella build.

## C AOS

Solo frammenti C, con contesto fornito e alternative accettate esplicite.
Il confronto usa token C: spazi e commenti fuori dai letterali non contano;
operatori, stringhe, valori e argomenti diversi contano. Input non tokenizzabile
è rifiutato. Nessun `eval`, compilatore simulato, syscall o processo Linux.

Il feedback dice “Frammento verificato rispetto ai requisiti”. Alternative
semanticamente valide ma non elencate possono essere rifiutate: il messaggio
lo chiarisce. I contesti sono esempi originali minimi, non copie degli ZIP del
docente e non implementazioni complete dei laboratori Linux.

## Controlli

```powershell
npm run study:content -- validate
npm run typecheck
npm run lint
npm test
npm run build
npm run test:study
```

`test:study` usa un server dedicato sulla porta 3217, Chromium e WebKit/iPad.
I PDF di prova sono generati dai test con testo originale minimo: nessun
materiale universitario tra le fixture. I test controllano anche che durante
importazione, ricerca e lettura non siano effettuate richieste POST.

La pubblicazione non fa parte di questo branch: prima revisione locale, poi
eventuale integrazione con develop e main con autorizzazione separata.
