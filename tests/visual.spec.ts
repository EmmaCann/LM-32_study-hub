import { test, expect } from '@playwright/test';
test('ispezione visuale e assenza di errori client', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: /Il tuo studio,/ })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('dashboard-desktop.png'), fullPage: true });
  await page.getByRole('button', { name: 'Tema scuro', exact: true }).click();
  await page.screenshot({ path: testInfo.outputPath('dashboard-dark.png'), fullPage: true });
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('/algoritmi', { waitUntil: 'networkidle' });
  await page.screenshot({ path: testInfo.outputPath('avl-ipad.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.screenshot({ path: testInfo.outputPath('dashboard-mobile.png'), fullPage: true });
  expect(errors).toEqual([]);
});
