# Contratto skill C++ — estensione compatibile dello schema 1

Usare il pacchetto esistente: manifest.json, content.mdx, exercises.json, simulations.json e asset dichiarati. La gerarchia è materia `cpp` → capitolo del manifest → argomento → ID stabile dell'esercizio. Non creare pagine React per ogni esercizio. Catalogo e route sono derivati dai dati.

`content.mdx` contiene soltanto istruzioni sintetiche per l'interattivo originale: nessuna copia HTML integrale della teoria. I PDF restano in C:\LM-32 e non vengono copiati. Il validatore rifiuta PDF tra gli asset pubblici o nel campo legacy pdf. I vecchi schemi rimangono leggibili per anteprime locali.

## Esempio exercises.json

```json
[
  {
    "id": "somma-interi",
    "type": "cpp",
    "title": "Somma di due interi",
    "prompt": "Leggi due interi e stampa la somma.",
    "hints": ["Leggi da std::cin.", "Somma e scrivi su std::cout."],
    "solution": "#include <iostream>\nint main(){ long long a,b; std::cin>>a>>b; /* Somma nel tipo corretto. */ std::cout<<a+b<<\"\\n\"; }\n",
    "explanation": "I test controllano soltanto i casi dichiarati.",
    "download": "somma.cpp",
    "cpp": {
      "difficulty": "base",
      "tags": ["stdin", "stdout", "interi"],
      "standard": "c++17",
      "starterCode": "#include <iostream>\nint main(){ /* TODO */ }\n",
      "files": [],
      "tests": [
        { "id": "positivo", "title": "Valori positivi", "visibility": "public", "stdin": "2 5\n", "stdout": "7\n", "stderr": "", "exitCode": 0, "comparison": "trim" },
        { "id": "negativo", "title": "Valori con segno", "visibility": "additional", "stdin": "-2 5\n", "stdout": "3\n", "stderr": "", "exitCode": 0, "comparison": "trim" }
      ],
      "referenceLesson": { "title": "Fondamenti C++", "url": "/cpp/fondamenti/esercitazioni-guidate" },
      "execution": "browser"
    }
  }
]
```

`download` richiede somma.cpp in assets/ e in manifest.assets. È facoltativo: l'editor permette comunque di scaricare il codice corrente. Non includere copie della soluzione negli asset iniziali.

## Campi e vincoli

- `type: cpp` richiede `cpp`; i vecchi tipi restano invariati. `answer` può essere omesso per C++; soluzione e spiegazione restano separate. Gli oggetti sono strict: campi extra non dichiarati vengono rifiutati.
- `difficulty`: base, intermedio, avanzato. `tags`: da 1 a 12 etichette. `standard`: c++11, c++14, c++17 o c++20.
- `starterCode`: programma completo con main, max 65.536 caratteri nello schema e 64 KiB UTF-8 nel worker. La verifica non lo sovrascrive.
- `files`: da 0 a 6 oggetti `{name, content}`. Nomi ASCII semplici .cpp/.h/.hpp, niente directory, duplicati o main.cpp. Max 32.768 caratteri ciascuno, 128 KiB complessivi lato worker. Gli ulteriori .cpp vengono compilati e linkati, gli header sono disponibili agli include. Non sono file del dispositivo e non concedono accesso al filesystem nativo.
- `tests`: da 1 a 20 con ID unici e almeno un caso public. Ogni test ha stdin completo e stdout atteso; stderr predefinito vuoto, exitCode predefinito 0. `comparison: exact` confronta esattamente; trim normalizza CRLF e rimuove whitespace ai bordi; tokens confronta la sequenza di token separati da whitespace. Il metodo vale per stdout e stderr. Trap, timeout e stderr inatteso non passano.
- `visibility: additional` indica un caso aggiuntivo, non un test segreto. I risultati sono ispezionabili durante la verifica; tutti i dati sono comunque scaricati dal browser.
- `hints`: indizi progressivi. `solution`: solo codice C++ compilabile con commenti didattici. `explanation`: testo separato. La soluzione appare soltanto su richiesta e non sostituisce l'editor.
- `referenceLesson`: title richiesto, url facoltativo HTTPS o route interna. Vietati file:// e percorsi Windows. Il titolo permette di riconoscere la lezione nel PDF locale; il link può puntare alla sua scheda interattiva.
- `execution: browser` è il default. local-only richiede `limitation`: l'interfaccia espone download e istruzioni locali, ma il gate di importazione pubblica automatica lo rifiuta. Non inventare risultati per feature non supportate. Eccezioni, thread, rete, GUI e dipendenze native richiedono una progettazione diversa.

## Revisione, verifica e importazione

1. Esportare in staging/<id>, con review.status draft. La proprietaria revisiona originalità, fonti, riservatezza, codice e soluzione. I test automatici non possono accertare copyright o riservatezza. Niente PDF, slide, trascrizioni, ZIP o copie HTML della teoria.
2. `npm.cmd run content -- preview staging/<id>`: l'anteprima mostra sorgente iniziale, file di supporto, tutti i test e soluzione per la revisione, come testo non eseguibile.
3. `npm.cmd run cpp:verify -- staging/<id>`: compila il codice iniziale e controlla che termini sul primo caso pubblico (può dare una risposta non corretta); poi compila realmente la soluzione e la esegue contro tutti i test in Chromium con la stessa toolchain/browser runtime del sito. Serve `npm.cmd exec playwright install chromium`. Scrive cpp-verification.json, con starterChecked true, solo se tutto passa. `npm.cmd run cpp:verify -- --all` ripete il controllo su tutti gli approvati. Starter intenzionalmente non compilabili o non terminanti richiedono un formato didattico diverso e non passano questo gate.
4. Dopo revisione esplicita, review.status approved e reviewer non vuoto; `npm.cmd run content -- import staging/<id> --approve`. La ricevuta viene copiata nel pacchetto approvato. Il digest SHA-256 lega ID, capitolo, slug, revisione, esercizi, standard, codice, file, aiuti, soluzioni e test. Cambiamenti successivi invalidano la ricevuta e bloccano import/build. Non scrivere ricevute manualmente per aggirare il controllo: sono evidenza riproducibile, non firme d'autore o protezione da un manutentore ostile.
5. TypeScript, lint, test e build prima del merge. Per modifiche a editor/toolchain eseguire anche i test browser. La build di produzione ripete sempre validazione di schema, review e digest.
6. Branch dedicato → develop → main per il rilascio. Il push su main attiva il deployment Git automatico Vercel già collegato, senza login o deploy manuale parallelo. Nessun PDF o materiale sorgente viene pubblicato da questo flusso.

## URL e risultati

Pagina stabile: `/cpp/playground/<manifest.id>/<exercise.id>`. La scheda `/<subject>/<chapter>/<slug>#<exercise.id>` rimane valida e collega al Playground. Non cambiare ID o URL tra revisioni; incrementare revision. `npm run content -- links https://dominio` include anche le ancore degli esercizi.

La verifica mostra «N/M casi verificati superati», mai una correttezza universale. RAII, complessità, stile e proprietà non osservabili dall'output richiedono revisione del codice. Soluzioni e test distribuiti su un sito pubblico non devono contenere informazioni segrete.

Toolchain, licenze, dimensioni, limiti, iPad e alternativa locale: [CPP_PLAYGROUND.md](CPP_PLAYGROUND.md). Esempio reale completo: src/content/approved/cpp-esercitazioni-guidate/.
