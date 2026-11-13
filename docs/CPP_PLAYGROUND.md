# C++ Playground

Questa è un'estensione dell'app Next.js esistente. Non esiste un endpoint che compila o esegue sorgenti. I PDF e i materiali universitari rimangono in `C:\LM-32`; l'app serve solo schede interattive originali e approvate.

## Percorsi

- `/cpp/playground`: editor libero.
- `/cpp/esercitazioni`: catalogo, derivato dai pacchetti approvati.
- `/cpp/playground/<topic-id>/<exercise-id>`: esercizio stabile, anche dopo un aggiornamento.
- `/<subject>/<chapter>/<topic>#<exercise-id>`: ancora della scheda collegata alla lezione.
- `/cpp/simulazioni`: sole simulazioni C++ registrate e approvate, senza inventare visualizzazioni mancanti.

## Toolchain verificata

YoWASP Clang/LLD **22.0.0-git20542-10**, snapshot LLVM fissato e riproducibile, non etichettato come release stabile. npm lo pubblica il 12 marzo 2026; YoWASP ha migrato i repository da GitHub a Codeberg. Non è garantita una futura frequenza di aggiornamento. L'API ufficiale compone invocazioni reali di Clang e LLD, senza simulare il C++ in JavaScript: https://github.com/YoWASP/clang/blob/develop/npmjs/README.md . La toolchain è stata scelta dopo una prova di compilazione ed esecuzione nel browser. La prima alternativa Wasmer SDK è stata scartata dopo timeout reali; non è una dipendenza dell'app.

Editor: CodeMirror 6, linguaggio C++/Lezer. Runtime del programma: `@bjorn3/browser_wasi_shim` 0.4.2 (WASI preview 1), nessuna capability di rete o directory preaperta. L'editor e le scelte sono accessibili via tastiera e touch; Tab esce dall'editor.

Gli asset sono serviti dallo stesso dominio, senza dipendenze CDN a runtime: **105.495.211 byte circa (100,6 MiB, inclusi wrapper)**; vedere il manifest generato per la misura esatta. Il pacchetto npm compresso è più piccolo, ma la compressione del trasferimento HTTP effettivo dipende dall'hosting. `npm run prebuild`/`predev` copiano gli asset da node_modules in `public/cpp/vendor`, ignorata da Git. Il binario maggiore è circa 72 MiB. Non sono caricati all'apertura delle pagine: Compila/Esegui/Verifica avviano il download. Cache HTTP del browser, soggetta a spazio disponibile ed espulsione; nessuna promessa di funzionamento offline al reload.

Standard selezionabili C++11, 14, 17 e 20; default C++17. Clang supporta le rispettive funzionalità di linguaggio, con i limiti della libc++ e del target WASI forniti. C++23 non è offerto. Le prove includono iostream, vector, algoritmi STL, unique_ptr e concepts C++20. Eccezioni disabilitate (`-fno-exceptions`), niente thread, processi, socket, GUI, librerie native arbitrarie o file locali. Uno schema può dichiarare `local-only` con una motivazione: l'interfaccia offre il download e istruzioni locali, ma l'importazione pubblica automatica viene bloccata finché non è verificabile con questa toolchain. Non si mostrano risultati di esecuzione fittizi.

Licenze: wrapper YoWASP Apache-2.0 (il campo ISC npm è inesatto), LLVM Apache-2.0 con LLVM exception, runtime JS YoWASP ISC, WASI shim MIT/Apache-2.0, CodeMirror/Lezer MIT, libc/WASI con porzioni MIT/BSD/CC0. Testi e avvisi completi in `public/cpp/licenses/`, distribuiti con il sito.

## Isolamento e limiti

Il worker compilatore carica gli asset e conserva solo risorse immutabili tra le compilazioni. Il codice è passato come contenuto di file, con nomi semplici validati e senza opzioni arbitrarie del compilatore. Il worker esecutore è nuovo per ogni esecuzione/test e viene sempre terminato. Il programma dispone soltanto dei descrittori stdin/stdout/stderr; nessuna rete o filesystem del dispositivo. Nessun `eval` viene usato per implementare o simulare C++.

- Sorgente principale: 64 KiB UTF-8; fino a 6 file `.cpp`, `.h`, `.hpp`, 32 KiB ciascuno e 128 KiB complessivi lato worker.
- Modulo generato: massimo 16 MiB; memoria lineare del programma: massimo **64 MiB**, stack 1 MiB, imposto al linker.
- Input: massimo 32 KiB; output stdout+stderr: massimo 64 KiB. Output e diagnostica resi come testo React, mai HTML.
- Compilazione: watchdog 90 secondi, comprensivo di inizializzazione/download. Esecuzione: watchdog 3 secondi per caso, compresa inizializzazione del worker.
- Interrompi/riavvia termina i worker e invalida i binari. Il testo nell'editor rimane disponibile. Ripristina chiede conferma e sostituisce solo il codice iniziale.

Il limite di 64 MiB non copre la memoria complessiva della scheda, del compilatore e del motore del browser. Non è disponibile un limite portabile per l'intera heap del browser. Su iPad il sistema può chiudere una scheda per pressione di memoria: scaricare i file e usare una toolchain locale fidata è l'alternativa. WebKit emulato non sostituisce una prova fisica su ogni modello iPad.

## Verifica e pubblicazione

1. Esportare i quattro file contrattuali e gli asset in `staging/<id>`, come documentato in SKILLS_INTEGRATION.md.
2. Revisionare originalità, riservatezza e soluzione. Gli aiuti e i test aggiuntivi distribuiti al browser non sono segreti.
3. `npm run cpp:verify -- staging/<id>` apre Chromium headless su un server solo loopback che serve gli asset statici. Compila lo starter ed esegue un controllo di terminazione sul primo caso pubblico, poi compila la soluzione di ciascun esercizio con la stessa toolchain del sito, esegue ogni test e scrive `cpp-verification.json` soltanto se tutto passa. Lo starter può dare risposte errate ma deve compilare e terminare. Nessun sorgente è eseguito come programma nativo sul server di verifica.
4. Dopo revisione approvata: `npm run content -- import staging/<id> --approve`. La ricevuta deve corrispondere a identità, revisione, esercizi, sorgenti, file di supporto, soluzioni, standard e test. Modifiche successive invalidano il digest. La ricevuta è evidenza tecnica riproducibile, non una firma crittografica d'autore o un sistema antimanomissione contro chi può modificare il repository.
5. TypeScript, lint, test unitari, build e verifiche browser prima del merge; `npm run cpp:verify -- --all` ripete la verifica reale sui C++ approvati. Per l'ambiente di verifica: `npm exec playwright install chromium` (e WebKit per i test iPad).
6. Branch dedicato → develop → main per la produzione. Il push su main attiva il **deployment Git Vercel esistente**, senza un secondo deploy manuale. La build valida automaticamente schema, approvazione e digest; un pacchetto C++ modificato senza nuova verifica blocca il deploy. URL esistenti e ID non vanno rinominati.

`.github/workflows/quality.yml` ripete in CI compilazioni C++ reali, build, typecheck, lint, unit test e test browser Chromium/WebKit sui branch e sulle pull request, senza credenziali. Il workflow GitHub non modifica main e non effettua un secondo deploy. Il merge per un rilascio va eseguito dopo i controlli; Vercel applica autonomamente il gate di contenuti nella propria build. Non si presume attivata una protezione branch o un Deployment Check Vercel che l'account non ha configurato.

I test verificano casi specifici: "3/3 casi verificati superati" non equivale a una prova universale. Per esercizi RAII i casi input/output non provano da soli proprietà come assenza di leak o stile di ownership: occorre anche revisione del sorgente. La verifica usa uno snapshot, non modifica l'editor e segnala se il testo è cambiato durante i test. La soluzione compare solo su richiesta e non viene copiata automaticamente nell'editor.
