# LM·32 Study Hub

Piattaforma personale per studiare Ingegneria Informatica: appunti, formule, codice, simulazioni ed esercizi. Funziona in locale senza account, database o servizi cloud. Il catalogo degli appunti approvati parte vuoto: le materie sono pronte ad accogliere i contenuti reali quando saranno generati e revisionati.

Il progetto risiede in `C:\LM-32_study-hub`, nel repository già collegato a GitHub. Le directory universitarie originali in `C:\LM-32` non vengono lette dall’applicazione, copiate o pubblicate.

## Avvio locale

Richiede Node.js 22.13 o successivo compatibile e npm. Le versioni effettive delle dipendenze sono fissate in `package.json` e `package-lock.json`.

```powershell
cd C:\LM-32_study-hub
npm.cmd ci
npm.cmd run dev
```

Aprire **http://127.0.0.1:3000**. Il server ascolta solo sulla macchina locale. In PowerShell si usa `npm.cmd` per evitare problemi con l’execution policy degli script `.ps1`.

Per la versione di produzione locale:

```powershell
npm.cmd run build
npm.cmd run start
```

Per vedere il sito da iPad sulla stessa rete fidata è possibile avviare esplicitamente `npm.cmd exec next dev -- --hostname 0.0.0.0` e visitare l’IP LAN del PC. Questa modalità espone il server alla rete locale: usarla solo per il test e interromperla al termine. Il normale comando `dev` resta limitato a loopback.

## Stack e scelte

- Next.js 16 App Router, React 19, TypeScript strict.
- Tailwind CSS 4 e CSS dedicato, icone Lucide, temi chiaro/scuro con preferenza locale.
- Markdown strutturato in `content.mdx`, `react-markdown`, GFM, KaTeX e Shiki.
- Simulazioni React/SVG tramite registro esplicito; nessuna esecuzione di componenti importati dai contenuti.
- Zod per schemi versionati, script locali per staging, anteprima e importazione.
- Node test runner e Playwright con Chromium e WebKit.

Il file `.mdx` usa deliberatamente un **sottoinsieme sicuro di MDX: Markdown e formule, senza JSX, import/export o valutazione di espressioni JavaScript**. Le simulazioni si dichiarano in `simulations.json`; per aggiungere un nuovo componente serve una revisione del codice applicativo. Non si compilano documenti importati come programmi.

## Funzionalità

Dashboard con conteggi ricavati dai contenuti; quattro materie; navigazione materia/capitolo/argomento; breadcrumb e indice; ricerca su materie, capitoli, titoli delle sezioni, testo, simulazioni ed esercizi. La ricerca e il tema funzionano nel browser, senza servizi esterni. Non sono presenti indicatori di avanzamento inventati.

Il registro contiene componenti pronti per VM exit e rotazione AVL, ma non sono pubblicati finché un argomento approvato non li dichiara. Gli esercizi supportano scelta multipla, vero/falso, risposta breve, programmazione e problemi algoritmici. Le risposte aperte si confrontano autonomamente con la soluzione; non viene simulata una correzione automatica. Le soluzioni sono nascoste nell’interfaccia, non segrete nel bundle.

## Struttura

```text
src/app/                    route, pagine e stile
src/components/             interfaccia, appunti, esercizi e ricerca
src/simulations/registry.tsx componenti interattivi ammessi
src/lib/                    schema, loader, URL e validazione
src/content/subjects.json   configurazione delle materie
src/content/approved/       soli pacchetti approvati
scripts/                    validazione, anteprima e importazione
staging/                    nuovi pacchetti non pubblicati (ignorati da Git)
backups/                    revisioni precedenti locali (ignorate da Git)
.preview/                   anteprime HTML locali (ignorate da Git)
tests/                      unit test e test browser
docs/SKILLS_INTEGRATION.md   contratto per le future skill
```

## Nuove materie e capitoli

Aggiungere una voce a `src/content/subjects.json` con `id` stabile, `title`, `short`, `description`, `color` (`violet`, `teal`, `amber`, `blue`) e `icon` (`cpu`, `network`, `code`, `chart`). Aggiungere poi pacchetti della nuova materia: le route sono generate automaticamente alla build. Per un capitolo nuovo basta dichiarare lo stesso oggetto `chapter` in tutti i suoi argomenti. Gli ID pubblicati e gli slug non devono cambiare.

## Importare e revisionare appunti

```powershell
npm.cmd run content -- validate
npm.cmd run content -- preview staging/nuovo-argomento
# Aprire il percorso .preview/.../index.html stampato dal comando.
# Dopo revisione, impostare review.status=approved e review.reviewer.
npm.cmd run content -- import staging/nuovo-argomento --approve
npm.cmd run build
```

`preview` valida e genera una pagina HTML locale con formule e codice; non modifica i contenuti approvati. Le simulazioni sono descritte nell’anteprima, non eseguite. Per esaminare interattivamente un componente nuovo, svilupparlo e testarlo prima nel registro. L’import richiede approvazione esplicita e salva la revisione precedente in `backups/`. Nessun comando effettua deployment. Il contratto completo e le regole di aggiornamento sono in [SKILLS_INTEGRATION.md](docs/SKILLS_INTEGRATION.md).

## PDF e Notes+

Un pacchetto può includere un PDF in `assets/`, dichiararlo in `manifest.assets` e indicarlo con `manifest.pdf`. La pagina offre il pulsante **Apri PDF**. Gli asset sono serviti da una route controllata, non copiati in `public`. Solo file dichiarati nei pacchetti approvati sono accessibili.

La generazione dei PDF didattici è affidata alle future skill. Per costruire i link HTTPS da inserire in un PDF:

```powershell
npm.cmd run content -- links https://DOMINIO-DEFINITIVO
```

Sostituire il dominio e usare gli URL stampati; `src/lib/schema.ts` espone `stableUrl` per le pipeline. `SITE_URL` in `.env.example` documenta il valore da usare per l’integrazione, ma l’applicazione non richiede variabili per avviarsi. Nessun link generato punta a Windows o a cartelle iPad. La procedura dettagliata è in [PDF_WORKFLOW.md](docs/PDF_WORKFLOW.md). Il comportamento dei link in Notes+ va verificato sul dispositivo reale.

## Controlli

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run build
npm.cmd exec playwright install chromium webkit
npm.cmd run test:e2e
npm.cmd audit
```

Playwright avvia il server di produzione locale oppure riutilizza quello esistente su porta 3000. Verifica route, link, 404, controlli delle simulazioni, esercizi, ricerca, codice, formule, download, tema e overflow ai breakpoint principali. WebKit emula iPad: non sostituisce Safari e Notes+ sul dispositivo fisico. Per aggiornamenti delle librerie verificare nuovamente gli override transitive di KaTeX e minimatch, introdotti per risolvere gli avvisi dell’audit senza retrocedere le librerie principali.

## Pubblicazione privata su Vercel — procedura manuale

Nessun deployment o collegamento di account è stato effettuato. Non è presente un’autenticazione applicativa: un deployment senza protezione Vercel sarebbe accessibile a chiunque. `noindex` non è una protezione di accesso.

1. Dopo autorizzazione, usare un repository GitHub **privato** e creare il progetto Vercel senza distribuire ancora appunti personali. Selezionare Next.js, installazione `npm ci`, build `npm run build`. Non collegare la cartella madre dei materiali.
2. Nella configurazione del progetto aprire **Security → Deployment Protection** (in alcune viste **Settings → Deployment Protection**), attivare **Vercel Authentication** e scegliere **All Deployments** prima di caricare contenuti personali. Verificare che non esistano eccezioni, link condivisi o bypass attivi non necessari.
3. Pubblicare inizialmente soltanto questi esempi, poi verificare sia il dominio di produzione sia ogni dominio personalizzato e URL del deployment. **Standard Protection non è sufficiente** per la produzione.
4. In navigazione anonima, senza sessione Vercel, visitare homepage e un URL diretto di un argomento dopo la prima importazione. Tutte le richieste devono incontrare la protezione Vercel. Verificare anche gli asset PDF approvati.
5. Autenticarsi come proprietaria: controllare accesso, apertura/download PDF e assenza di credenziali nel repository. Provare di nuovo da un browser non autenticato.
6. Su Safari iPad, autenticarsi, aprire un argomento, ruotare il dispositivo, provare entrambe le simulazioni e aprire il PDF in Notes+. Toccare nel PDF un link diretto alla simulazione e verificare autenticazione e ancoraggio.
7. Solo dopo esito positivo importare appunti personali approvati. Le impostazioni di Deployment Protection si gestiscono in Vercel: non sono attivate da `next.config.ts` o da un file di autenticazione fittizio.

Documentazione verificata il 10 novembre 2026: [Vercel Authentication](https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/vercel-authentication), [Deployment Protection](https://vercel.com/docs/deployment-protection), [annuncio del 9 settembre 2026](https://vercel.com/changelog/protect-production-deployments-for-free-on-every-plan). L’annuncio più recente indica All Deployments disponibile senza sovrapprezzo su ogni piano; verificare comunque le opzioni effettive nell’account al momento della pubblicazione.

Riferimenti tecnici: [Next.js](https://nextjs.org/docs/app/getting-started/installation), [react-markdown](https://github.com/remarkjs/react-markdown), [Shiki](https://shiki.style/guide/install), [KVM API](https://docs.kernel.org/virt/kvm/api.html).
