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
    '/ottimizzazione',
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
    '/aos/virtualizzazione',
    '/algoritmi/alberi',
    '/cpp/gestione-memoria',
    '/aos/virtualizzazione/qemu-kvm',
    '/aos/virtualizzazione/vm-exit',
    '/algoritmi/alberi/alberi-avl',
    '/algoritmi/alberi/rotazioni-avl',
    '/cpp/gestione-memoria/raii',
    '/cpp/gestione-memoria/smart-pointer',
    '/non-esiste',
    '/aos/virtualizzazione/inesistente',
    '/staging/private',
    '/materiali/file.pdf',
    '/trascrizioni%20audio/test',
    '/assets/cpp-unique-ptr/secret.pdf',
  ])
    expect((await request.get(url)).status()).toBe(404);
});
test('catalogo vuoto, placeholder delle materie e ricerca senza contenuti', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Il tuo studio' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Materie' })).toBeVisible();
  await expect(page.locator('.subject-card')).toHaveCount(4);
  await expect(page.locator('.list-row')).toHaveCount(0);
  await expect(page.locator('.practice-links a')).toHaveCount(0);
  await page.goto('/ricerca');
  await page.getByRole('textbox').fill('un argomento');
  await expect(page.getByRole('status')).toContainText('0 risultati');
});
test('breakpoint desktop, iPad, mobile e tema persistente', async ({ page }) => {
  for (const [width, height] of [
    [1440, 1000],
    [1024, 768],
    [768, 1024],
    [390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    for (const route of ['/', '/aos', '/algoritmi', '/cpp', '/ottimizzazione']) {
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
      await page.getByRole('button', { name: 'Chiudi menu' }).click();
    }
    for (const [name, theme] of [
      ['Tema scuro', 'dark'],
      ['Tema chiaro', 'light'],
    ]) {
      await page.getByRole('button', { name, exact: true }).click();
      await expect(page.getByRole('button', { name, exact: true })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      await page.reload();
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    }
  }
});
