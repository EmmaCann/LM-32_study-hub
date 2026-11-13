# PDF locali e collegamenti a Study Hub

Gli appunti teorici completi rimangono in PDF nelle cartelle universitarie di `C:\LM-32`. Study Hub è pubblico, senza autenticazione, e serve soltanto contenuti interattivi originali e istruzioni sintetiche. Non caricare PDF, slide annotate, trascrizioni, ZIP originali o copie HTML integrali della teoria.

Il validatore rifiuta manifest approvati con `pdf` o asset PDF. I campi legacy rimangono leggibili in un'anteprima locale per compatibilità, ma non autorizzano un import pubblico. La piattaforma non genera, copia o modifica i PDF universitari automaticamente.

## Link nel documento locale

Eseguire `npm.cmd run content -- links https://lm32-study-hub.vercel.app` per ottenere URL di schede, simulazioni ed esercizi. Le future skill possono inserire annotazioni link HTTPS nei PDF locali soltanto dopo verifica del relativo deploy.

Esempi:

```text
https://lm32-study-hub.vercel.app/<materia>/<capitolo>/<argomento>#<id-simulazione>
https://lm32-study-hub.vercel.app/<materia>/<capitolo>/<argomento>#<id-esercizio>
https://lm32-study-hub.vercel.app/cpp/playground/<topic-id>/<exercise-id>
```

Non inserire localhost, IP LAN, percorsi Windows o link relativi alla memoria iPad nei PDF definitivi. Mantenere ID e URL quando si aggiornano le attività. L'import rifiuta modifiche all'URL dell'argomento e rimozioni/rinomine di esercizi o simulazioni già pubblicati.

## Verifica su iPad

Aprire il PDF locale in Notes+ o nell'app abituale; toccare ogni link e controllare destinazione, ancora ed esercizio. Provare verticale/orizzontale, ritorno al PDF e collegamenti dopo un aggiornamento. Il sito non richiede login. Il Playground carica la toolchain soltanto quando viene richiesta una compilazione; richiede memoria e può essere chiuso dal sistema su dispositivi con poche risorse. Download .cpp e ambiente locale fidato sono l'alternativa per feature non supportate.

Le prove WebKit/iPad emulate non equivalgono alla verifica fisica di Notes+ o di ogni modello iPad. La generazione e la modifica dei PDF restano attività delle skill universitarie autorizzate separatamente.
