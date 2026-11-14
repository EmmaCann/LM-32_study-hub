# Contratto di integrazione per le future skill — schema 1

Estensione compatibile C++: il formato base resta schema 1. I pacchetti AOS e Algoritmi continuano a usare manifest, simulazioni ed esercizi precedenti. Per il nuovo tipo `cpp` si aggiunge una specifica strutturata e, dopo verifica tecnica, `cpp-verification.json`.

**Per le skill C++ è obbligatorio seguire [CPP_SKILLS_CONTRACT.md](CPP_SKILLS_CONTRACT.md)**: descrive esercizi, file iniziali/supporto, test pubblici e aggiuntivi, suggerimenti, soluzioni, download e ricevuta tecnica. [CPP_PLAYGROUND.md](CPP_PLAYGROUND.md) documenta toolchain e limiti. La pubblicazione resta pubblica senza autenticazione; i PDF completi restano locali.

Le skill `studio-fonti`, `appunti-aos`, `appunti-algoritmi`, `appunti-cpp` non vengono implementate qui. Questo contratto definisce il loro output. I materiali originali restano nelle directory universitarie; la piattaforma non li importa automaticamente.

## Pacchetto

Esportare soltanto gli elaborati da sottoporre a revisione in `C:\LM-32_study-hub\staging\<id>\`:

```text
manifest.json
content.mdx
exercises.json
simulations.json
assets/               facoltativo, soltanto asset dichiarati
```

Non esportare registrazioni, slide sorgenti, trascrizioni o credenziali. Staging, anteprime e backup non sono serviti dall’app, sono ignorati da Git ed esclusi dall’upload Vercel.

## Manifest

```json
{
  "schemaVersion": 1,
  "id": "aos-vm-exit",
  "subject": "aos",
  "chapter": { "id": "virtualizzazione", "title": "Virtualizzazione", "order": 1 },
  "slug": "vm-exit",
  "title": "VM exit: dal guest all’host e ritorno",
  "description": "Un percorso guidato tra guest, KVM e QEMU.",
  "order": 2,
  "demo": false,
  "updated": "2026-11-10",
  "revision": 2,
  "review": {
    "status": "draft",
    "reviewer": "",
    "sources": ["Riferimento bibliografico o URL HTTPS approvato"]
  },
  "assets": ["schema.png"]
}
```

L’esempio mostra un aggiornamento della demo, non va importato senza sostituire il contenuto e revisionarlo. `pdf` è opzionale. Tutti gli altri campi mostrati sono richiesti, salvo `assets`, che può essere vuoto. Gli oggetti sono strict: campi sconosciuti sono rifiutati. L’autorità esatta dello schema è `src/lib/schema.ts`.

- `id`: identità globale e nome della cartella approvata, stabile per tutte le revisioni.
- `subject`: ID presente in `src/content/subjects.json`.
- `chapter.id` e `slug`: segmenti dell’URL `/<subject>/<chapter.id>/<slug>`.
- Gli identificatori iniziano con una lettera minuscola, usano lettere ASCII, cifre e trattini singoli. Niente spazi, slash, accenti o traversal.
- Ordini interi non negativi; revisione intera positiva, da incrementare a ogni aggiornamento; data ISO `YYYY-MM-DD`.
- Gli argomenti dello stesso capitolo devono dichiarare identici titolo e ordine del capitolo.
- Le fonti devono essere approvate e adatte a comparire nel sito; non includere percorsi personali, dati sensibili o informazioni nascoste nelle note.

## Appunti

`content.mdx` ammette Markdown GFM, tabelle, citazioni, liste, link, immagini, formule inline `$...$`, formule a blocco `$$...$$` e blocchi fenced di codice (per esempio `cpp`). **Non ammette JSX, HTML raw, import/export o JavaScript eseguibile.** Espressioni tra graffe restano testo, non vengono valutate.

Usare titoli `##` per le sezioni nell’indice. Gli anchor delle sezioni sono `sezione-1`, `sezione-2`, ecc. Sono posizionali: per collegamenti durevoli dai PDF preferire l’URL dell’argomento o l’ID esplicito di una simulazione; non usare gli anchor numerici se si prevede di riordinare le sezioni.

Riferimenti ad asset: `![Descrizione](assets/schema.png)` oppure `[Scarica](assets/appunti.pdf)`. Usare link inline espliciti. Non usare HTML o componenti React per incorporare contenuti. Gli asset ammessi sono PDF, PNG, JPG/JPEG, WebP e C++; SVG e HTML importati sono esclusi. Diagrammi interattivi SVG vivono esclusivamente nel codice revisionato del registro.

## Simulazioni

`simulations.json` contiene un array, anche vuoto:

```json
[
  {
    "id": "vm-exit-demo",
    "component": "vm-exit",
    "title": "Il percorso di una VM exit",
    "description": "Gestione nel kernel oppure in userspace."
  }
]
```

Componenti disponibili: `vm-exit`, `avl-rotation`. L’argomento e la materia sono derivati dal manifest. Ogni ID deve essere unico all’interno dell’argomento, anche rispetto agli esercizi. Il collegamento stabile è `/<subject>/<chapter>/<slug>#<id>`. Per ora non sono ammessi parametri arbitrari: il controllo del tipo di evento è interno al player VM exit.

Per una nuova simulazione, la skill deve proporre un componente in una modifica di codice separata, mai inserirlo nel pacchetto da eseguire automaticamente. Dopo revisione, aggiungerlo a `src/simulations/registry.tsx` ed estendere l’enum nello schema. Testare controlli avanti/indietro/reset, descrizione di stato, tastiera, ridimensionamento, touch e correttezza didattica. Il player comune stabilisce il modello iniziale; simulazioni più complesse possono estenderlo esplicitamente.

## Esercizi

`exercises.json` è un array:

```json
[
  {
    "id": "domanda-ownership",
    "type": "true-false",
    "title": "Ownership esclusiva",
    "prompt": "std::unique_ptr è copiabile?",
    "options": ["Vero", "Falso"],
    "answer": "Falso",
    "hints": ["La risorsa deve avere un solo proprietario."],
    "solution": "Non è copiabile; l’ownership si può trasferire.",
    "explanation": "La copia produrrebbe due proprietari della stessa risorsa."
  }
]
```

Tipi ammessi: `multiple-choice`, `true-false`, `short`, `programming`, `algorithm`. Per scelta multipla e vero/falso, `options` deve contenere almeno due opzioni e includere `answer`. La UI controlla queste risposte per uguaglianza; le risposte aperte richiedono autovalutazione. `download` opzionale deve riferirsi a un file `.cpp` dichiarato e presente negli asset. Soluzione e spiegazione restano nascoste nell’interfaccia fino all’azione dell’utente. Non sono cifrate né adatte a esami con risposte segrete.

## Validazione, anteprima e approvazione

1. La skill esporta un pacchetto in staging con `review.status: "draft"`.
2. Eseguire `npm.cmd run content -- preview staging/<id>`: controlla schema, componenti, asset, duplicati, coerenza dei capitoli e stabilità degli URL. Produce `.preview/<id>/index.html` apribile localmente, con KaTeX, codice, immagini, elenco simulazioni ed esercizi revisionabili. Non modifica il sito approvato.
3. La proprietaria revisiona appunti, fonti, formule, PDF, codice, esercizi e riferimenti interattivi. Il contenuto del PDF non è analizzato automaticamente: la revisione del file è obbligatoria.
4. Dopo l’approvazione esplicita impostare `review.status: "approved"` e un `review.reviewer` non vuoto.
5. Eseguire `npm.cmd run content -- import staging/<id> --approve`. Senza flag o revisione approvata l’operazione fallisce.
6. Eseguire `npm.cmd run content -- validate`, typecheck, lint, test e build. Il contenuto appare nella prossima build. Nessuna pubblicazione online viene eseguita dallo script.

La validazione rifiuta link simbolici nei file richiesti e negli asset, identificatori o nomi file non sicuri, asset mancanti, componenti sconosciuti, duplicati e cambiamenti di URL durante un aggiornamento. Copia soltanto i quattro file contrattuali e gli asset dichiarati; eventuali file sorgenti extra non vengono importati.

## Aggiornamenti e recupero

Mantenere `id`, `subject`, `chapter.id` e `slug`, incrementare `revision`, aggiornare la data e ripetere la revisione. Il titolo dell’argomento può cambiare senza cambiare URL. Non riutilizzare un ID per una lezione diversa. Per modificare metadati condivisi del capitolo, aggiornare coerentemente tutti i pacchetti interessati in una modifica controllata.

L’import prepara una cartella temporanea `.pending-<id>` e sposta la revisione precedente in `backups/<id>-<timestamp>` prima del cambio. Se il cambio fallisce viene ripristinato il contenuto precedente. Una `.pending-` residua blocca il nuovo import dello stesso argomento: ispezionarla e recuperare manualmente dopo un’interruzione. Non eseguire import concorrenti o import durante una build. I backup non vengono pubblicati né cancellati automaticamente.

Per ripristinare una revisione, copiarla in staging, assegnare una revisione numerica nuova e ripetere il flusso di approvazione; oppure usare Git per ripristinare una modifica versionata, sempre dopo verifica.

## PDF e URL

I PDF completi rimangono esclusivamente nelle cartelle universitarie locali. La pubblicazione di manifest con `pdf` o asset PDF viene ora rifiutata dal validatore pubblico. I campi legacy rimangono nello schema per leggere anteprime locali già esistenti; questo non ne autorizza la pubblicazione. Non esportare copie HTML integrali della teoria. Esportare soltanto istruzioni sintetiche necessarie agli interattivi originali. I collegamenti da inserire nei PDF locali devono usare il dominio HTTPS definitivo e gli ID stabili: `npm.cmd run content -- links https://dominio` include simulazioni ed esercizi. Il generatore rifiuta HTTP, file URL, credenziali e percorsi nella base.



## Estensione laboratori AOS

Componenti revisionati: `aos-flags` (lezione 1), `aos-cpu-cache` (lezione 2), `aos-virtqueue` (lezione 3), `aos-kvm-run` (lezione 4). Identità delle simulazioni stabili nei pacchetti. Parametri scelti nella UI, nessun codice eseguibile nei contenuti. Modelli didattici, non benchmark.


## Utilita complementare: aggiornamento del 12 novembre 2026

Creare e pubblicare ogni complemento utile anche se non essenziale, secondo AGENTS.md e il gate Vercel. Valutare 2D/3D, processi e algoritmi passo passo; riusare componenti verificati. Aggiunti: aos-decode, aos-time, aos-interrupts, aos-addresses, aos-memory-slot. Link HTTPS nei PDF solo dopo verifica online; stato e opportunita nel dossier.

## Override corrente: pubblicazione da main senza Authentication

La proprietaria ha esplicitamente disattivato Authentication il 12 novembre 2026:
non riattivarla ne aggiungere login applicativi. Questa scelta prevale sui precedenti
requisiti generici di pubblicazione privata. Pubblicare soltanto gli interattivi originali
rielaborati, mai fonti, trascrizioni, credenziali o copie PDF/HTML degli appunti.
Merge/aggiornamento e push su main attivano il deploy Git automatico Vercel.
Niente secondo deploy manuale. Verificare test/build, commit effettivamente distribuito,
URL di produzione e ancore dei laboratori; poi inserire link HTTPS nei PDF locali.


## Qualita visiva dei player

Lezione 6: `aos-partition`, `aos-ivshmem`, `aos-ring` e `aos-cache-colors` mostrano
proprietà dei core, payload/notifica, sovrascrittura con indici privati e contesa LLC.
Il cockpit usa polling; doorbell è un'alternativa. Ring e cache usano capacità ridotte
esplicitamente illustrative; nessuna misura hardware o esecuzione delle fonti.

Lezione 5: `aos-elf-loader`, `aos-pit-read` e `aos-vcpu-gaps` aggiungono caricamento,
latch/lettura PIT e pause della vCPU. Modelli deterministici separati dalle scene,
player condiviso; tempi illustrativi, nessun benchmark o sorgente universitario caricato.

Usare scene adatte al meccanismo: oggetti persistenti, movimento interpolato,
collegamenti e proprieta sincronizzati. La sola variazione di numeri/testi non
soddisfa il requisito. Le nove scene AOS mantengono ID, route e schemi esistenti.
La revisione deve includere movimento osservato nel browser, pausa/reset,
zoom/espansione e resa su WebKit/iPad, non soltanto screenshot statici.

## Algoritmi: ordinamenti, lezione del 7 ottobre 2026

Componenti registrati: `algoritmi-insertion` e `algoritmi-merge`, con modelli
deterministici e player React/SVG in `src/simulations/algoritmi-sorting-*`.
Pacchetto `algoritmi-l01-ordinamenti`, percorso `/algoritmi/ordinamento/insertion-merge`,
ancore `insertion-sort` e `merge`. Array modificabili, identità persistenti, spostamenti
interpolati, pseudocodice sincronizzato e controlli touch/tastiera; tempi illustrativi.
La regola comune della skill `animazioni-didattiche` autorizza anche Algoritmi e tutte
le altre materie alla pubblicazione pubblica senza Authentication, come AOS.
Le fonti e i PDF restano locali; pubblicazione via push su main e verifica del deploy Git.


## Profilo grafico AOS approvato — 14 novembre 2026

Solo per AOS: `VisualPlayer design="architecture"` attiva la scena tecnica ampia,
la palette blu notte e i materiali vettoriali di `aos-architecture.css`.
`NodeBox shape="module|chip|memory"` distingue componenti software, chip e memoria.
Il default del player resta `classic`; Algoritmi e C++ conservano il loro stile.
Il riferimento per nuove scene AOS è `aos-memory-scenes.tsx`, approvato nella
lezione 7. Riutilizzare i modelli e preservare geometria didattica, URL e PDF.
Le primitive comuni sono in `aos-architecture-primitives.tsx`. La lezione 8 usa
`aos-container-scenes.tsx`: task persistenti e viste PID, volumi e percorsi,
topologia veth e trasferimenti di privilegi. Il modello dei 19 casi resta separato.

## Laboratorio AOS 8

`aos-container` riusa il player comune con quattro scene: identita PID/UTS, cambio del root mount, veth con scenari UP/DOWN/rotta assente, capability P/E/B. Modelli in `aos-container-model.ts`; `execCaps` descrive il caso ordinario non-root, non tutte le regole Linux. Il solo DROP Bounding non revoca E/P. Nessun comando delle fonti viene eseguito dal laboratorio.
