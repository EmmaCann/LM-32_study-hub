import { test, expect } from '@playwright/test';
import { getCurriculum } from '../src/lib/study-content';
import { getTopics } from '../src/lib/content';
const lessons = getCurriculum();
function fixturePdf(text = 'Virtqueue e payload: teoria locale originale per il test.') {
  const stream = `BT /F1 18 Tf 45 740 Td (${text}) Tj ET`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (const [i, obj] of objects.entries()) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  }
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 6\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((n) => String(n).padStart(10, '0') + ' 00000 n \n')
    .join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf);
}
test('percorso: errori, frammento C, completamento persistente e backup senza PDF', async ({
  page,
}, testInfo) => {
  await page.goto('/percorso/aos-lezione-01');
  const section = page.locator('.study-activity');
  await section.nth(0).getByLabel('Vero', { exact: true }).check();
  await section.nth(0).getByRole('button', { name: 'Verifica attività' }).click();
  await expect(section.nth(0).getByRole('status')).toContainText('Da rivedere');
  await expect(page.getByRole('heading', { name: 'Lezione completata', exact: true })).toHaveCount(
    0,
  );
  await section.nth(0).getByLabel('Falso', { exact: true }).check();
  await section.nth(0).getByRole('button', { name: 'Verifica attività' }).click();
  await section.nth(1).getByLabel('KVM', { exact: true }).check();
  await section.nth(1).getByRole('button', { name: 'Verifica attività' }).click();
  const editor = section.nth(2).locator('.cm-content');
  await editor.fill('virtual_if = flags;');
  await section.nth(2).getByRole('button', { name: 'Verifica attività' }).click();
  await expect(section.nth(2).getByRole('status')).toContainText('Da rivedere');
  await editor.fill('virtual_if=(flags >> 9) & 1u; // verificato');
  await section.nth(2).getByRole('button', { name: 'Verifica attività' }).click();
  await expect(
    page.getByRole('heading', { name: 'Lezione completata', exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Lezione completata', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.cm-content')).toContainText('verificato');
  await page.goto('/aos');
  await expect(page.locator('.study-step').first()).toContainText('Completata');
  await page.goto('/percorso');
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Esporta progressi', exact: true }).click();
  const download = await downloadEvent;
  const path = await download.path();
  expect(path).toBeTruthy();
  const fs = await import('node:fs/promises');
  const backup = JSON.parse(await fs.readFile(path!, 'utf8'));
  expect(Object.keys(backup.passed)).toHaveLength(3);
  expect(backup).not.toHaveProperty('pdfs');
  await page.evaluate(() => localStorage.removeItem('lm32-study-progress-v1'));
  await page.reload();
  await page.getByLabel('Importa backup progressi').setInputFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await expect(page.getByRole('button', { name: 'Unisci ai progressi attuali' })).toBeVisible();
  await page.getByRole('button', { name: 'Unisci ai progressi attuali' }).click();
  await expect(page.locator('.study-step').first()).toContainText('Completata');
  await page.getByLabel('Importa backup progressi').setInputFiles({
    name: 'rotto.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"schemaVersion":55}'),
  });
  await expect(
    page.getByText('Backup non valido o troppo grande.', { exact: false }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBeTruthy();
  await page.screenshot({ path: testInfo.outputPath('roadmap-mobile.png'), fullPage: false });
});
test('PDF: indicizzazione e ricerca locali, lettore, riferimento da riconfermare e rimozione', async ({
  page,
}, testInfo) => {
  const posts: string[] = [];
  page.on('request', (r) => {
    if (!['GET', 'HEAD'].includes(r.method())) posts.push(r.url());
  });
  await page.goto('/biblioteca');
  await expect(page.getByLabel('Seleziona PDF locali')).toBeEnabled();
  await page.getByLabel('Seleziona PDF locali').setInputFiles({
    name: 'Appunti_AOS_Lezione-03.pdf',
    mimeType: 'application/pdf',
    buffer: fixturePdf(),
  });
  await expect(
    page.getByText('1 pagine indicizzate sul dispositivo.', { exact: false }),
  ).toBeVisible({ timeout: 60000 });
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Pagina 1 di 1' })).toBeVisible();
  await page.getByLabel('Cerca nei PDF', { exact: true }).fill('virtqueue');
  await expect(page.locator('.study-search-result')).toHaveCount(1);
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Rimuovi Appunti_AOS_Lezione-03.pdf' }),
  ).toBeVisible();
  await page.goto('/ricerca');
  await page.getByLabel('Cerca in tutti i contenuti').fill('virtqueue');
  await page.getByLabel('Filtra ricerca per tipo').selectOption('PDF locale');
  await expect(page.locator('.list-row')).toHaveCount(1);
  await page.locator('.list-row').click();
  await expect(page.getByLabel('Pagina PDF')).toHaveValue('1');
  await page.goto('/aos/lezione-03/virtqueue-batching');
  if (await page.getByRole('heading', { name: '404', exact: true }).count())
    throw new Error('URL del laboratorio cambiato');
  const theory = page.locator('.study-theory').first();
  await theory.getByRole('button', { name: /Apri la teoria/ }).click();
  await expect(theory.getByText('Versione PDF diversa', { exact: false })).toBeVisible();
  await theory.getByText('Correggi il riferimento per il tuo PDF', { exact: true }).click();
  await theory.getByLabel('Pagina riferimento teoria').fill('1');
  await theory.getByRole('button', { name: 'Conferma riferimento su questo dispositivo' }).click();
  await expect(theory.getByText('Versione PDF diversa', { exact: false })).toHaveCount(0);
  await page.setViewportSize({ width: 768, height: 1024 });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBeTruthy();
  await page.screenshot({ path: testInfo.outputPath('theory-ipad.png'), fullPage: false });
  await theory
    .locator('.study-theory-pane')
    .screenshot({ path: testInfo.outputPath('theory-panel.png') });
  await theory.getByRole('button', { name: 'Animazione', exact: true }).click();
  await expect(theory.locator('.study-animation')).toBeVisible();
  await expect(theory.locator('.study-theory-pane')).toBeHidden();
  await theory.getByRole('button', { name: 'Teoria', exact: true }).click();
  await expect(theory.locator('.study-theory-pane')).toBeVisible();
  expect(posts).toEqual([]);
  await page.goto('/biblioteca');
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Rimuovi Appunti_AOS_Lezione-03.pdf' }).click();
  await expect(page.getByText('Nessun PDF collegato.', { exact: false })).toBeVisible();
});
test('PDF assente o illeggibile, senza testo e annullamento esplicito', async ({ page }) => {
  await page.goto('/aos/lezione-01/flags-virtuali');
  await page.getByRole('button', { name: /Apri la teoria/ }).click();
  await expect(page.getByRole('link', { name: 'Collega il documento', exact: true })).toBeVisible();
  await page.goto('/biblioteca');
  await expect(page.getByLabel('Seleziona PDF locali')).toBeEnabled();
  await page.getByLabel('Seleziona PDF locali').setInputFiles({
    name: 'rotto.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('non un PDF'),
  });
  await expect(page.getByRole('status').filter({ hasText: /invalid pdf/i })).toBeVisible({
    timeout: 30000,
  });
  await expect(page.getByText('Nessun PDF collegato.', { exact: false })).toBeVisible();
  await page
    .getByLabel('Seleziona PDF locali')
    .setInputFiles({ name: 'vuoto.pdf', mimeType: 'application/pdf', buffer: fixturePdf('') });
  await expect(page.getByText('PDF senza testo ricercabile.', { exact: false })).toBeVisible({
    timeout: 30000,
  });
  await page.getByLabel('Cerca nei PDF', { exact: true }).fill('inesistente');
  await expect(page.locator('.study-search-result')).toHaveCount(0);
  // A delayed local worker makes cancellation deterministic, without an external endpoint.
  await page.reload();
  await expect(page.getByLabel('Seleziona PDF locali')).toBeEnabled();
  await page.route('**/pdf/pdf.worker.min.mjs', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    await route.continue();
  });
  page.once('dialog', (d) => d.accept());
  await page.getByLabel('Seleziona PDF locali').setInputFiles({
    name: 'annulla.pdf',
    mimeType: 'application/pdf',
    buffer: fixturePdf('Altro documento locale'),
  });
  await page.getByRole('button', { name: 'Annulla indicizzazione', exact: true }).click();
  await expect(page.getByText('Indicizzazione annullata.', { exact: false })).toBeVisible({
    timeout: 30000,
  });
});
test('storage non disponibile: avviso, progresso in sessione e PDF senza upload', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = function () {
      throw new DOMException('quota', 'QuotaExceededError');
    };
    Object.defineProperty(window, 'indexedDB', {
      get() {
        throw new DOMException('bloccato', 'SecurityError');
      },
    });
  });
  await page.goto('/percorso/aos-lezione-01');
  await page.locator('.study-activity').first().getByLabel('Falso', { exact: true }).check();
  await page
    .locator('.study-activity')
    .first()
    .getByRole('button', { name: 'Verifica attività' })
    .click();
  await expect(page.locator('.study-activity').first()).toContainText('Superata');
  await page
    .getByRole('navigation', { name: 'Navigazione principale' })
    .getByRole('link', { name: 'Percorso di studio', exact: true })
    .click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Spazio locale non disponibile' }).first(),
  ).toBeVisible();
  await page.goto('/biblioteca');
  await expect(page.getByText('Archivio PDF non disponibile:', { exact: false })).toBeVisible();
  await page
    .getByLabel('Seleziona PDF locali')
    .setInputFiles({ name: 'locale.pdf', mimeType: 'application/pdf', buffer: fixturePdf() });
  await expect(page.getByText('Impossibile conservare il PDF', { exact: false })).toBeVisible({
    timeout: 30000,
  });
  await expect(page.locator('canvas')).toBeVisible();
});
test('C++ reale: superamento collegato al percorso e bozza ripristinata', async ({ page }) => {
  const lesson = lessons.find((l) => l.id === 'cpp-lezione-01')!;
  const activity = lesson.activities.find((a) => a.type === 'cpp')!;
  if (activity.type !== 'cpp') throw new Error();
  const exercise = getTopics()
    .find((t) => t.manifest.id === activity.topicId)!
    .exercises.find((e) => e.id === activity.exerciseId)!;
  await page.goto(`/cpp/playground/${activity.topicId}/${activity.exerciseId}`);
  await expect(page.locator('.cm-content')).toBeVisible();
  await page.locator('.cm-content').fill(exercise.solution);
  await page.getByRole('button', { name: 'Verifica esercizio', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Esercizio superato', exact: true })).toBeVisible({
    timeout: 110000,
  });
  await page.reload();
  await expect(page.locator('.cm-content')).toHaveText(exercise.solution.trim(), {
    useInnerText: true,
  });
  await page.getByRole('link', { name: 'Torna alla verifica della lezione', exact: true }).click();
  await expect(page.locator(`#${activity.id}`)).toContainText('Superata');
  await expect(page.getByRole('heading', { name: 'Lezione completata', exact: true })).toHaveCount(
    0,
  );
});
