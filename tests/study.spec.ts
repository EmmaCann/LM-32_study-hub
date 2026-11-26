import { test, expect } from '@playwright/test';
import { getTopics } from '../src/lib/content';

test('lezione: PDF automatico, indice e cambio lezione senza caricamenti manuali', async ({
  page,
  request,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/percorso/aos-lezione-01');
  await expect(page.locator('.desk-panel:not([hidden]) canvas')).toBeVisible({ timeout: 30000 });
  await expect(
    page.locator('.desk-panel:not([hidden])').getByLabel('Pagina PDF', { exact: true }),
  ).toHaveValue('1');
  await expect(page.locator('.lesson-desk input[type=file]')).toHaveCount(0);
  const source = await request.get('/notes/aos-lezione-01-appunti.pdf');
  expect(source.status()).toBe(200);
  expect(source.headers()['content-type']).toContain('application/pdf');
  const index = await request.get('/notes/index.json');
  expect((await index.json()).documents).toHaveLength(26);
  if (testInfo.project.name === 'webkit-ipad')
    await page.getByRole('button', { name: 'Indice della lezione', exact: true }).click();
  await page
    .locator('.desk-outline-scroll')
    .getByRole('button', { name: /POPF e soluzioni/ })
    .click();
  await expect(
    page.locator('.desk-panel:not([hidden])').getByLabel('Pagina PDF', { exact: true }),
  ).toHaveValue('11');
  await page.getByLabel('Cambia lezione', { exact: true }).selectOption('aos-lezione-12');
  await expect(page).toHaveURL(/aos-lezione-12$/);
  await expect(page.locator('.desk-panel:not([hidden]) canvas')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Lezione 12 - Driver mailbox', exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath('lesson-workspace.png'), fullPage: false });
});

test('comprensione conservata: errori, frammento C, completamento, persistenza e backup', async ({
  page,
}) => {
  await page.goto('/percorso/aos-lezione-01?view=check');
  const section = page.locator('.study-activity');
  await section.nth(0).getByLabel('Vero', { exact: true }).check();
  await section.nth(0).getByRole('button', { name: 'Verifica attività' }).click();
  await expect(section.nth(0).getByRole('status')).toContainText('Da rivedere');
  await section.nth(0).getByLabel('Falso', { exact: true }).check();
  await section.nth(0).getByRole('button', { name: 'Verifica attività' }).click();
  await section.nth(1).getByLabel('KVM', { exact: true }).check();
  await section.nth(1).getByRole('button', { name: 'Verifica attività' }).click();
  await section.nth(2).locator('.cm-content').fill('virtual_if=(flags >> 9) & 1u;');
  await section.nth(2).getByRole('button', { name: 'Verifica attività' }).click();
  await expect(
    page.getByRole('heading', { name: 'Lezione completata', exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Lezione completata', exact: true }),
  ).toBeVisible();
  await page.goto('/percorso');
  await page.getByText('Gestisci backup e progressi', { exact: true }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Esporta progressi', exact: true }).click();
  const file = await download;
  expect(await file.path()).toBeTruthy();
  await page.getByLabel('Importa backup progressi').setInputFiles({
    name: 'invalido.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"schemaVersion":50}'),
  });
  await expect(
    page.getByText('Backup non valido o troppo grande.', { exact: false }),
  ).toBeVisible();
});

test('car: codice e animazione nella lezione, teoria caricata al punto giusto', async ({
  page,
}, testInfo) => {
  await page.goto('/percorso/aos-lezioni-09-10?view=code');
  const completion = page.locator('#car-clone');
  await expect(completion.getByLabel('Namespace PID', { exact: true })).toBeEnabled();
  await completion.getByRole('button', { name: 'Correggi i campi', exact: true }).click();
  await expect(completion.getByRole('status')).toContainText('0/3 campi corretti');
  await completion.getByLabel('Namespace PID', { exact: true }).fill('CLONE_NEWPID');
  await completion.getByLabel('Namespace mount', { exact: true }).fill('CLONE_NEWNS');
  await completion.getByLabel('Segnale al padre', { exact: true }).fill('SIGCHLD');
  await completion.getByRole('button', { name: 'Correggi i campi', exact: true }).click();
  await expect(completion.getByRole('status')).toContainText('3/3 campi corretti');
  await page.locator('.desk-tabs button').filter({ hasText: 'Laboratori' }).click();
  await expect(page.locator('.desk-live-lab .aos-lab')).toBeVisible();
  await expect(page.locator('.desk-context canvas')).toBeVisible({ timeout: 30000 });
  await expect(page.locator('.desk-context').getByLabel('Pagina PDF', { exact: true })).toHaveValue(
    '8',
  );
  await page.locator('.desk-live-lab button[aria-label="Avanti"]').click();
  await expect(page.locator('.desk-live-lab button[aria-label="Indietro"]')).toBeEnabled();
  await page.getByRole('button', { name: 'Nascondi teoria affiancata', exact: true }).click();
  await expect(page.locator('.desk-context')).toHaveCount(0);
  await page.getByRole('button', { name: 'Mostra teoria affiancata', exact: true }).click();
  await expect(page.locator('.desk-context canvas')).toBeVisible();
  expect(page.url()).toContain('/percorso/aos-lezioni-09-10');
  await expect(page.locator('.desk-context').getByRole('status')).toContainText('Pagina 8 di');
  await page.screenshot({ path: testInfo.outputPath('car-integrated.png'), fullPage: false });
});

test('C++ reale integrato: soluzione verificata, bozza salvata e attività registrata', async ({
  page,
}) => {
  const topic = getTopics().find((t) => t.manifest.id === 'cpp-l01-tipi-memoria')!;
  const exercise = topic.exercises[0];
  await page.goto('/percorso/cpp-lezione-01?view=code');
  await expect(page.locator('.desk-code .cm-content')).toBeVisible();
  await page.locator('.desk-code .cm-content').fill(exercise.solution);
  await page.getByRole('button', { name: 'Verifica esercizio', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Esercizio superato', exact: true })).toBeVisible({
    timeout: 110000,
  });
  await page.locator('.desk-tabs button').filter({ hasText: 'Verifica' }).click();
  await expect(page.locator(`#${exercise.id}`)).toContainText('Superata');
  await expect(page.getByRole('heading', { name: 'Lezione completata', exact: true })).toHaveCount(
    0,
  );
  await page.reload();
  await page.locator('.desk-tabs button').filter({ hasText: 'Codice' }).click();
  await expect(page.locator('.desk-code .cm-content')).toContainText('void aumenta');
});

test('ricerca negli appunti inclusi: dal concetto alla pagina, nessuna selezione di file', async ({
  page,
}) => {
  await page.goto('/ricerca');
  await page.getByLabel('Cerca in tutti i contenuti').fill('POPF');
  await page.getByLabel('Filtra ricerca per tipo').selectOption('PDF');
  await page.getByLabel('Filtra ricerca per materia').selectOption('aos');
  await expect(page.locator('.list-row').first()).toBeVisible();
  await page.locator('.list-row').first().click();
  await expect(page).toHaveURL(/\/percorso\/aos-/);
  await expect(page.locator('.desk-panel:not([hidden]) canvas')).toBeVisible();
  await expect(page.locator('.lesson-desk input[type=file]')).toHaveCount(0);
});

test('home, tema e spazi di studio responsive: desktop, iPad e telefono', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 1080 });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: 'Il mio studio' })).toBeVisible();
  await expect(page.locator('.portal-course')).toHaveCount(4);
  await page.screenshot({ path: testInfo.outputPath('portal-desktop.png'), fullPage: true });
  await page.getByRole('button', { name: 'Tema scuro', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.screenshot({ path: testInfo.outputPath('portal-dark.png'), fullPage: false });
  for (const width of [768, 390]) {
    await page.setViewportSize({ width, height: 1024 });
    for (const route of [
      '/',
      '/aos',
      '/percorso/aos-lezione-01',
      '/percorso/cpp-lezione-01?view=code',
    ]) {
      await page.goto(route);
      // Let Next prefetch finish before the next full-document navigation.
      // WebKit reports canceled document fetches as access-control page errors.
      await page.waitForLoadState('networkidle');
      if (route === '/percorso/aos-lezione-01')
        await expect(page.locator('.desk-panel:not([hidden]) canvas')).toBeVisible();
      else if (route.includes('view=code'))
        await expect(page.locator('.desk-code .cm-content')).toBeVisible();
      else await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `${route} ${width}`,
      ).toBeTruthy();
    }
  }
  await page.goto('/percorso/aos-lezione-01');
  await expect(page.locator('.desk-panel:not([hidden]) canvas')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('lesson-mobile.png'), fullPage: false });
  expect(errors).toEqual([]);
});

test('nuove lezioni AOS: appunti, sequenza IRQ e confronto delle deadline', async ({ page }) => {
  for (const lesson of [13, 14]) {
    await page.goto(`/percorso/aos-lezione-${lesson}`);
    await expect(page.locator('.desk-panel:not([hidden]) canvas')).toBeVisible({ timeout: 30000 });
    if (lesson === 14) {
      await expect(page.getByRole('heading', { name: /Lezione 1-2 Real-time/ })).toBeVisible();
      const index = await page.request.get('/notes/index.json');
      expect(
        (await index.json()).documents.find(
          (entry: { lessonId: string }) => entry.lessonId === 'aos-lezione-14',
        ).pages,
      ).toHaveLength(8);
    }
    await page.locator('.desk-tabs button').filter({ hasText: 'Laboratori' }).click();
    const lab = page.getByRole('region', { name: 'Laboratori della lezione' });

    if (lesson === 13) {
      const next = lab.getByRole('button', { name: 'Avanza' });
      await next.click();
      await expect(
        lab.getByRole('heading', { name: 'Il sensore segnala una misura pronta' }),
      ).toBeVisible();
      await lab.getByRole('button', { name: 'Ricomincia' }).click();
      await expect(lab.getByRole('button', { name: 'Indietro' })).toBeDisabled();
    } else {
      await expect(lab.getByText(/τ₁ rispetta la deadline/)).toBeVisible();
      await lab.getByRole('button', { name: 'Velocità doppia' }).click();
      await expect(lab.getByText(/τ₁ manca la deadline/)).toBeVisible();
      await expect(lab.getByText(/Completa a t = 10,5/)).toBeVisible();
    }
  }
});
