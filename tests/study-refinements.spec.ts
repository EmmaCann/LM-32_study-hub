import { test, expect } from '@playwright/test';
import { getCurriculum } from '../src/lib/study-content';
import { activityKey } from '../src/lib/study-schema';

test('PDF: pagina intera, riduzione reale e adattamento nei due sensi', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/percorso/aos-lezione-01');
  const viewer = page.locator('.desk-panel:not([hidden]) .study-pdf-viewer');
  const canvas = viewer.locator('canvas');
  await expect(viewer.getByRole('status')).toContainText('Pagina 1 di 15');
  await expect(viewer.getByLabel('Zoom PDF', { exact: true })).toHaveValue('page');
  expect(
    await canvas.evaluate(
      (node) =>
        node.clientWidth <= node.parentElement!.clientWidth &&
        node.clientHeight <= node.parentElement!.clientHeight,
    ),
  ).toBeTruthy();
  await viewer.getByLabel('Zoom PDF', { exact: true }).selectOption('0.5');
  await expect.poll(() => canvas.evaluate((node) => node.clientWidth)).toBeGreaterThan(290);
  const half = await canvas.evaluate((node) => node.clientWidth);
  await viewer.getByRole('button', { name: 'Riduci zoom PDF', exact: true }).click();
  await expect(viewer.getByLabel('Zoom PDF', { exact: true })).toHaveValue('0.25');
  await expect.poll(() => canvas.evaluate((node) => node.clientWidth)).toBeLessThan(half * 0.6);
  await viewer.getByRole('button', { name: 'Aumenta zoom PDF', exact: true }).click();
  await expect(viewer.getByLabel('Zoom PDF', { exact: true })).toHaveValue('0.5');
  await viewer.getByLabel('Zoom PDF', { exact: true }).selectOption('width');
  await expect
    .poll(() =>
      canvas.evaluate((node) =>
        Math.abs(node.clientWidth - (node.parentElement!.clientWidth - 24)),
      ),
    )
    .toBeLessThan(3);
  const wide = await canvas.evaluate((node) => node.clientWidth);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => canvas.evaluate((node) => node.clientWidth)).toBeLessThan(wide);
  await expect
    .poll(() => canvas.evaluate((node) => node.clientWidth <= node.parentElement!.clientWidth))
    .toBeTruthy();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect.poll(() => canvas.evaluate((node) => node.clientWidth)).toBeGreaterThan(500);
  await viewer.getByLabel('Zoom PDF', { exact: true }).selectOption('page');
  await expect
    .poll(() =>
      canvas.evaluate(
        (node) =>
          node.clientWidth <= node.parentElement!.clientWidth &&
          node.clientHeight <= node.parentElement!.clientHeight,
      ),
    )
    .toBeTruthy();
});

test('mappa: gerarchia, link alle pagine e colore solo dopo tutte le verifiche', async ({
  page,
}) => {
  const lessons = getCurriculum().filter((lesson) => lesson.subject === 'aos');
  const lesson = lessons[0];
  await page.goto('/aos');
  const map = page.getByRole('region', { name: 'Mappa del percorso' });
  await expect(map.locator('.map-stop')).toHaveCount(lessons.length);
  const node = map.locator(`[data-lesson="${lesson.id}"]`);
  await expect(node).toHaveAttribute('data-state', 'pending');
  const first = lesson.sections[0];
  await expect(node.locator('.map-branches a').first()).toHaveAttribute(
    'href',
    `/percorso/${lesson.id}?view=theory&page=${first.page}`,
  );
  const passed = Object.fromEntries(
    lesson.activities
      .filter((activity) => activity.required)
      .map((activity) => [
        activityKey(lesson.id, activity.id),
        { signature: activity.signature, passedAt: new Date().toISOString() },
      ]),
  );
  await page.evaluate((entry) => {
    localStorage.setItem(
      'lm32-study-progress-v1',
      JSON.stringify({
        schemaVersion: 1,
        passed: Object.fromEntries([entry]),
        drafts: {},
        visited: {},
      }),
    );
    window.dispatchEvent(new StorageEvent('storage', { key: 'lm32-study-progress-v1' }));
  }, Object.entries(passed)[0]);
  await expect(node).toHaveAttribute('data-state', 'current');
  await page.evaluate(
    ({ passed }) => {
      localStorage.setItem(
        'lm32-study-progress-v1',
        JSON.stringify({ schemaVersion: 1, passed, drafts: {}, visited: {} }),
      );
      window.dispatchEvent(new StorageEvent('storage', { key: 'lm32-study-progress-v1' }));
    },
    { passed },
  );
  await expect(node).toHaveAttribute('data-state', 'complete');
  const completeColor = await node
    .locator('.map-node')
    .evaluate((element) => getComputedStyle(element).backgroundColor);
  const otherColor = await map
    .locator('[data-state="pending"] .map-node')
    .first()
    .evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(completeColor).not.toBe(otherColor);
  await page.reload();
  await expect(node).toHaveAttribute('data-state', 'complete');
  await node.locator('.map-branches a').first().click();
  await expect(page).toHaveURL(new RegExp(`/${lesson.id}\\?view=theory&page=${first.page}`));
  await expect(
    page.locator('.desk-panel:not([hidden])').getByLabel('Pagina PDF', { exact: true }),
  ).toHaveValue(String(first.page));
});

test('palette e mappe responsive nelle quattro materie', async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Tema chiaro', exact: true }).click();
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(237, 232, 220)');
  await page.screenshot({ path: info.outputPath('palette-light.png'), fullPage: true });
  await page.getByRole('button', { name: 'Tema scuro', exact: true }).click();
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(22, 39, 49)');
  await page.screenshot({ path: info.outputPath('palette-dark.png'), fullPage: true });
  for (const subject of ['aos', 'algoritmi', 'cpp', 'ottimizzazione']) {
    await page.goto(`/${subject}`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('region', { name: 'Mappa del percorso' })).toBeVisible();
    for (const width of [1440, 768, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      ).toBeTruthy();
    }
  }
});
