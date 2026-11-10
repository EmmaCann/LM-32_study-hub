# Contratto PDF / Notes+

Questa versione supporta apertura di PDF approvati e generazione/validazione dei link; non produce automaticamente i PDF degli appunti.

## Prova locale con un PDF di test

1. Copiare un pacchetto dimostrativo da `src/content/approved/<id>` a `staging/<id>`.
2. Inserire **un PDF di prova non personale** in `staging/<id>/assets/appunti.pdf`. Non copiare slide o PDF universitari originali.
3. Aggiungere `appunti.pdf` a `manifest.assets`, impostare `manifest.pdf: "appunti.pdf"`, incrementare `revision` e impostare la revisione a draft.
4. Eseguire `npm.cmd run content -- preview staging/<id>` e revisionare il PDF separatamente.
5. Dopo approvazione, impostare reviewer/status ed eseguire l’import con `--approve`. Ricostruire e avviare l’app: il pulsante **Apri PDF** deve aprire il documento tramite `/assets/<id>/appunti.pdf`.

## Link nel documento finale

Eseguire `npm.cmd run content -- links https://dominio-definitivo` e incorporare gli URL come annotazioni link HTTPS nel PDF usando la futura pipeline. Esempi di destinazioni, sostituendo il dominio:

```text
https://dominio-definitivo/aos/virtualizzazione/vm-exit#vm-exit-demo
https://dominio-definitivo/algoritmi/alberi/rotazioni-avl#avl-demo
```

Non inserire `localhost`, IP LAN, percorsi `C:\...` o collegamenti relativi alla memoria iPad nel PDF definitivo. Quando il contenuto viene aggiornato gli ID della lezione e della simulazione devono rimanere invariati.

## Verifica manuale su iPad

- Dopo deployment autorizzato e protetto, aprire il PDF dalla piattaforma con Safari autenticato.
- Importarlo in Notes+, toccare ciascun link e verificare che apra Safari sulla lezione e sull’ancoraggio corretti.
- Ripetere senza sessione Vercel: prima del contenuto deve apparire l’autenticazione. Verificare che il ritorno dopo il login conservi la destinazione e l’ancoraggio; se l’app elimina il frammento, usare anche un link all’argomento e l’indice di pagina.
- Testare orientamento verticale/orizzontale, apertura del PDF, zoom, ritorno a Notes+ e link dopo un aggiornamento della lezione.

La compatibilità specifica di Notes+ e il flusso di autenticazione tra app non sono stati verificati su un iPad fisico. Un file PDF già scaricato resta sul dispositivo: la protezione Vercel controlla i download dal sito, non revoca copie locali.
