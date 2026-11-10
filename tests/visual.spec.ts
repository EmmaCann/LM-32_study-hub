import { test, expect } from '@playwright/test';
test('ispezione visuale e assenza di errori client', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Spazio alle tue idee.' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('dashboard-desktop.png'), fullPage: true });
  await page.getByRole('button', { name: 'Cambia tema' }).click();
  await page.screenshot({ path: testInfo.outputPath('dashboard-dark.png'), fullPage: true });
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('/algoritmi/alberi/rotazioni-avl');
  await page.screenshot({ path: testInfo.outputPath('avl-ipad.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.screenshot({ path: testInfo.outputPath('dashboard-mobile.png'), fullPage: true });
  expect(errors).toEqual([]);
});
