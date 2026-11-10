import { test, expect } from '@playwright/test';
test('route, link interni, contenuti approvati e 404', async ({ page, request }) => {
  const urls = [
    '/',
    '/materie',
    '/argomenti',
    '/simulazioni',
    '/esercizi',
    '/ricerca',
    '/aos',
    '/algoritmi',
    '/cpp',
    '/ottimizzazione',
    '/aos/virtualizzazione',
    '/algoritmi/alberi',
    '/cpp/gestione-memoria',
    '/aos/virtualizzazione/qemu-kvm',
    '/aos/virtualizzazione/vm-exit',
    '/algoritmi/alberi/alberi-avl',
    '/algoritmi/alberi/rotazioni-avl',
    '/cpp/gestione-memoria/raii',
    '/cpp/gestione-memoria/smart-pointer',
  ];
  for (const url of urls) {
    const response = await page.goto(url);
    expect(response?.status(), url).toBe(200);
    await expect(page.locator('main h1')).toBeVisible();
    const links = await page
      .locator('main a[href^="/"]')
      .evaluateAll((nodes) => nodes.map((n) => (n as HTMLAnchorElement).getAttribute('href')!));
    for (const href of new Set(links)) {
      const response = await request.get(href.split('#')[0]);
      expect(response.status(), href).toBe(200);
    }
  }
  for (const url of [
    '/non-esiste',
    '/aos/virtualizzazione/inesistente',
    '/staging/private',
    '/materiali/file.pdf',
    '/trascrizioni%20audio/test',
    '/assets/cpp-unique-ptr/secret.pdf',
  ])
    expect((await request.get(url)).status()).toBe(404);
});
test('VM exit: percorsi distinti, controlli e riproduzione', async ({ page }) => {
  await page.goto('/aos/virtualizzazione/vm-exit#vm-exit-demo');
  const player = page.locator('#vm-exit-demo');
  await expect(player.getByRole('button', { name: 'Passo precedente' })).toBeDisabled();
  for (let i = 0; i < 3; i++)
    await player.getByRole('button', { name: 'Passo successivo' }).click();
  await expect(player.locator('.step-description')).toContainText('QEMU emula');
  await player.getByRole('combobox').selectOption('kernel');
  for (let i = 0; i < 3; i++)
    await player.getByRole('button', { name: 'Passo successivo' }).click();
  await expect(player.locator('.step-description')).toContainText('senza coinvolgere QEMU');
  await player.getByRole('button', { name: 'Riavvia' }).click();
  await player.getByRole('button', { name: 'Riproduci', exact: true }).click();
  await expect(player.locator('.badge')).not.toHaveText('1 / 5', { timeout: 5000 });
  await player.getByRole('button', { name: 'Pausa', exact: true }).click();
  const state = await player.locator('.badge').textContent();
  await page.waitForTimeout(2200);
  await expect(player.locator('.badge')).toHaveText(state!);
});
test('AVL, formule, risposte e soluzioni progressive', async ({ page }) => {
  await page.goto('/algoritmi/alberi/rotazioni-avl');
  expect(await page.locator('.katex').count()).toBeGreaterThan(0);
  const player = page.locator('#avl-demo');
  for (let i = 0; i < 4; i++)
    await player.getByRole('button', { name: 'Passo successivo' }).click();
  await expect(player.getByRole('img')).toHaveAttribute(
    'aria-label',
    'Albero bilanciato con radice 20',
  );
  await expect(player.getByRole('button', { name: 'Passo successivo' })).toBeDisabled();
  const exercise = page.locator('#avl-esercizio');
  await expect(exercise.locator('.solution')).toHaveCount(0);
  await exercise.getByLabel('30', { exact: true }).check();
  await exercise.getByRole('button', { name: 'Verifica risposta' }).click();
  await expect(exercise.getByRole('status')).toContainText('Non ancora');
  await exercise.getByLabel('20', { exact: true }).check();
  await exercise.getByRole('button', { name: 'Verifica risposta' }).click();
  await expect(exercise.getByRole('status')).toContainText('Corretto');
  await exercise.getByRole('button', { name: /Suggerimento/ }).click();
  await expect(exercise.locator('.callout')).toHaveCount(1);
  await exercise.getByRole('button', { name: 'Mostra soluzione' }).click();
  await expect(exercise.locator('.solution')).toBeVisible();
});
test('C++, download e ricerca', async ({ page, request }) => {
  await page.goto('/cpp/gestione-memoria/smart-pointer');
  await expect(page.locator('.shiki')).toBeVisible();
  const file = await request.get('/assets/cpp-unique-ptr/ownership.cpp');
  expect(file.status()).toBe(200);
  expect(file.headers()['content-disposition']).toContain('attachment');
  expect(await file.text()).toContain('#include <memory>');
  await page.goto('/ricerca');
  await page.getByRole('textbox').fill('ownership');
  await expect(page.getByRole('status')).not.toHaveText('0 risultati');
  await page.getByRole('textbox').fill('zzinesistentezz');
  await expect(page.getByRole('status')).toHaveText('0 risultati');
});
test('breakpoint desktop, iPad, mobile e tema persistente', async ({ page }) => {
  for (const [width, height] of [
    [1440, 1000],
    [1024, 768],
    [768, 1024],
    [390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    for (const route of [
      '/',
      '/algoritmi/alberi/rotazioni-avl',
      '/cpp/gestione-memoria/smart-pointer',
    ]) {
      await page.goto(route);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `${route} ${width}`,
      ).toBeTruthy();
    }
    await page.goto('/');
    if (width < 700) {
      await page.getByRole('button', { name: 'Apri navigazione' }).click();
      await expect(page.getByRole('navigation', { name: 'Navigazione principale' })).toBeVisible();
    }
    await page.getByRole('button', { name: 'Cambia tema' }).click();
    const theme = await page.locator('html').getAttribute('data-theme');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme!);
  }
});
