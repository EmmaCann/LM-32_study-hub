# Spazio di studio integrato

Revisione del 17 novembre 2026, branch `feature/study-paths`.
Il lavoro include gli aggiornamenti già pubblicati su main, mantenendo URL,
animazioni e verifiche esistenti. Sviluppo e test in locale; il redesign non è
stato integrato in develop o main.

## Esperienza

- Home con materie, ripresa della lezione e avanzamento.
- Pagina materia con percorso ordinato e ingresso diretto nella lezione.
- `/percorso/<lessonId>`: indice, PDF già aperto, laboratori, codice e verifica.
- I tab lavorano nella stessa pagina e conservano lo stato già aperto.
- Il laboratorio selezionato porta al punto corrispondente della teoria.
- Codice C car/mailbox e compilazione C++ reale riusano i componenti verificati.
- Le attività di comprensione e il salvataggio dei progressi restano attivi.
- Ricerca nei PDF inclusi con accesso diretto alla pagina della lezione.
- `/biblioteca` rimane un alias compatibile verso la lezione: nessuna scelta di file.

I collegamenti condivisibili usano `?view=theory|labs|code|check`, `page` e `lab`.
Gli URL e le ancore dei vecchi laboratori continuano a funzionare.

## Appunti automatici

La proprietaria ha autorizzato la pubblicazione dei nostri appunti rielaborati.
La piattaforma e il repository sono pubblici: nessuna promessa di riservatezza
basata sulla scarsa conoscenza dell'URL. Nessun login introdotto.

Il catalogo contiene 28 tappe e 24 PDF. Ottimizzazione è ancora da preparare;
i tre percorsi di pratica C++ non richiedono un PDF autonomo.
`public/notes` contiene esclusivamente i PDF dichiarati e l'indice di ricerca.
Le copie sono rielaborazioni, senza distribuire slide, trascrizioni o ZIP del docente.

`npm run notes:sync` cerca i nomi dichiarati nel catalogo sotto le sole cartelle
`appunti pronti` di AOS, Algoritmi e C++. Ignora supporto, revisioni e link
simbolici. Le fonti in `C:/LM-32` sono soltanto lette, mai modificate. Una
versione cambiata richiede riferimenti e impronta aggiornati dalla skill autrice,
così non si associano silenziosamente pagine errate alle animazioni.

Predev/prebuild eseguono la sincronizzazione quando la fonte locale esiste.
Su Vercel o su un altro computer si usa la raccolta già inclusa nel progetto.
La build controlla associazioni, numero di pagine, nomi ammessi, impronte SHA-256
e assenza di file estranei. Nessun endpoint legge percorsi arbitrari del computer.

Il browser carica automaticamente l'indice e il PDF della lezione scelta.
Il lettore PDF.js è caricato dinamicamente; il codice C++ carica il compilatore
solo quando si compila. I documenti in memoria sono limitati a quattro;
una pagina PDF viene renderizzata alla volta, con densità pixel massima 2.

## Progressi e verifiche

Nessun backend personale: localStorage conserva risultati, bozze e ultima lezione.
La verifica completa la lezione solo dopo tutte le attività obbligatorie.
Le firme dipendono dalla verifica e, per C++, dal codice e dai test referenziati.
Una modifica invalida il solo risultato interessato. Le risposte non sono segrete
né costituiscono certificazione. Un risultato riguarda i controlli effettuati.

Il backup è disponibile nei dettagli del percorso. Non include copie dei PDF.
Il codice C Linux è verificato rispetto ai campi o ai frammenti previsti, senza
simulare esecuzione Linux. Il C++ continua a essere compilato ed eseguito realmente
nel browser, con i limiti della toolchain documentati in CPP_PLAYGROUND.md.

## Avvio locale

```powershell
cd C:\LM-32_study-hub-study-paths
npm ci
npm run build
npm run start -- --port 3217
```

Aprire `http://127.0.0.1:3217`. Per sviluppare: `npm run dev -- --port 3217`.
Per sincronizzare da un'altra cartella: impostare `STUDY_NOTES_ROOT`.

## Controlli

```powershell
npm run content -- validate
npm run typecheck
npm run lint
npm test
npm run build
npm run test:study
```

I test verificano PDF automatici, riferimenti, comprensione, car, compilazione
C++ reale, ricerca, navigazione e dimensioni desktop/iPad/telefono. WebKit emula
iPad: non equivale a una prova sull'hardware fisico.

Pubblicazione soltanto dopo revisione locale: feature → develop → main,
con deployment Git Vercel da main. Nessun secondo deploy manuale.

## Palette, mappa e lettore — revisione successiva

La palette usa superfici color carta e accenti blu petrolio; i colori delle materie identificano le rispettive pagine. Ogni pagina materia
mostra una mappa ordinata per gruppo e lezione, con i sottoargomenti dichiarati
nelle sezioni del catalogo e collegamenti alla pagina PDF. Gli stati distinguono
le tappe da iniziare, in corso e completate. Il completamento deriva dalle
verifiche esistenti; non si attribuiscono risultati indipendenti ai sottoargomenti.

Il lettore parte da Pagina intera, adattando larghezza e altezza senza ingrandire
oltre la dimensione naturale. Larghezza adatta il documento al contenitore nei
due sensi. Le percentuali manuali vanno dal 10% al 300%, con pulsanti per ridurre
e aumentare. Il contenitore è isolato dalla larghezza intrinseca del canvas,
così una pagina ingrandita non impedisce il successivo restringimento.

## Orario settimanale

La home mostra gli impegni del giorno e la settimana tipo. Le lezioni si
inseriscono e rimuovono manualmente; giorno, ora e titolo sono obbligatori,
l'aula è facoltativa. L'orario si ripete ogni settimana ed è salvato nel browser
del dispositivo, separatamente dai progressi: non è sincronizzato né incluso
nel backup dei progressi. Nessun orario universitario è stato inventato.
