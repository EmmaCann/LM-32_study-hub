import { test, expect } from '@playwright/test';

test('orario settimanale: aggiunta, persistenza e rimozione', async ({ page }) => {
  await page.goto('/');
  const schedule = page.getByRole('region', { name: 'Orario settimanale' });
  await expect(schedule.getByRole('heading', { name: 'Il tuo orario' })).toBeVisible();
  await schedule.getByRole('button', { name: 'Aggiungi lezione' }).click();
  await schedule.getByLabel('Lezione', { exact: true }).fill('Sistemi operativi');
  await schedule.getByLabel('Giorno').selectOption('0');
  await schedule.getByLabel('Ora', { exact: true }).fill('10:30');
  await schedule.getByLabel('Aula o luogo', { exact: false }).fill('Aula 2');
  await schedule.getByRole('button', { name: 'Salva', exact: true }).click();
  await expect(schedule.locator('.schedule-week')).toContainText('Sistemi operativi');
  await expect(schedule.locator('.schedule-week')).toContainText('10:30');
  await page.reload();
  await expect(schedule.locator('.schedule-week')).toContainText('Aula 2');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBeTruthy();
  await schedule.getByRole('button', { name: /Elimina Sistemi operativi/ }).click();
  await page.reload();
  await expect(schedule.locator('.schedule-week')).not.toContainText('Sistemi operativi');
});
