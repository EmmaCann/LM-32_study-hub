import { test, expect } from '@playwright/test';
import { getTopics } from '../src/lib/content';
const topic = getTopics().find((t) => t.manifest.id === 'cpp-esercitazioni-guidate')!;
test.setTimeout(180000);
test('C++ navigazione, download e layout responsive', async ({ page, request }, testInfo) => {
  await page.goto('/cpp');
  await page
    .getByRole('navigation', { name: 'C++', exact: true })
    .getByRole('link', { name: 'Esercitazioni', exact: true })
    .click();
  await expect(page.getByRole('heading', { name: 'Esercitazioni C++', exact: true })).toBeVisible();
  await page.locator('.resource-card').filter({ hasText: 'Somma di due interi' }).click();
  await expect(page).toHaveURL(/\/cpp\/playground\/cpp-esercitazioni-guidate\/somma-interi$/);
  await expect(page.locator('.cm-content')).toContainText('TODO');
  const asset = await request.get('/assets/cpp-esercitazioni-guidate/somma.cpp');
  expect(asset.status()).toBe(200);
  expect(await asset.text()).toContain('#include <iostream>');
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.screenshot({ path: testInfo.outputPath('cpp-desktop.png'), fullPage: true });
  for (const width of [768, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBeTruthy();
  }
  await page.screenshot({ path: testInfo.outputPath('cpp-mobile.png'), fullPage: true });
});
test('C++ reale: stdin, stdout, stderr, errori, timeout, interruzione e limiti', async ({
  page,
}) => {
  const downloaded: string[] = [];
  page.on('request', (r) => {
    if (r.url().includes('llvm.core.wasm')) downloaded.push(r.url());
  });
  await page.goto('/cpp/playground');
  await expect(page.getByRole('heading', { name: 'C++ Playground', exact: true })).toBeVisible();
  expect(downloaded).toHaveLength(0);
  const editor = page.locator('.cm-content');
  const status = page.getByRole('status');
  await editor.fill(
    '#include <iostream>\nint main(){int a,b;std::cin>>a>>b;std::cout<<a+b<<"\\n";std::cerr<<"nota\\n";}',
  );
  await page.getByLabel('Input standard (stdin)', { exact: true }).fill('3 8\n');
  await page.getByRole('button', { name: 'Compila', exact: true }).click();
  await expect(status).toContainText('Compilazione riuscita', { timeout: 120000 });
  expect(downloaded.length).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Esegui', exact: true }).click();
  await expect(page.getByTestId('cpp-stdout')).toHaveText('11\n');
  await expect(page.getByTestId('cpp-stderr')).toHaveText('nota\n');
  await editor.fill('int main( {');
  await page.getByRole('button', { name: 'Compila', exact: true }).click();
  await expect(status).toContainText('Compilazione non riuscita', { timeout: 30000 });
  await expect(page.getByTestId('cpp-diagnostics')).toContainText('error:');
  await editor.fill('int main(){for(;;){}}');
  await page.getByRole('button', { name: 'Esegui', exact: true }).click();
  await expect(status).toContainText('timeout', { timeout: 30000 });
  await expect(editor).toContainText('for(;;)');
  await page.getByRole('button', { name: 'Esegui', exact: true }).click();
  await expect(status).toContainText('Esecuzione in corso');
  await page.getByRole('button', { name: 'Interrompi / riavvia ambiente', exact: true }).click();
  await expect(status).toContainText('interrotto');
  await expect(editor).toContainText('for(;;)');
  await editor.fill('#include <iostream>\nint main(){for(;;)std::cout<<"0123456789";}');
  await page.getByRole('button', { name: 'Esegui', exact: true }).click();
  await expect(page.getByTestId('cpp-stderr')).toContainText('Limite output', { timeout: 120000 });
  await editor.fill(
    '#include <cstdlib>\n#include <iostream>\nint main(){auto p=std::malloc(128*1024*1024);std::cout<<(p?"allocato":"limitato");std::free(p);}',
  );
  await page.getByRole('button', { name: 'Esegui', exact: true }).click();
  await expect(page.getByTestId('cpp-stdout')).toHaveText('limitato', { timeout: 30000 });
  await page.getByLabel('Standard C++', { exact: true }).selectOption('c++20');
  await editor.fill(
    '#include <concepts>\n#include <iostream>\ntemplate<std::integral T> T doppio(T x){return x+x;}\nint main(){std::cout<<doppio(8);}',
  );
  await page.getByRole('button', { name: 'Esegui', exact: true }).click();
  await expect(page.getByTestId('cpp-stdout')).toHaveText('16', { timeout: 30000 });
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Scarica .cpp', exact: true }).click();
  expect((await download).suggestedFilename()).toBe('main.cpp');
});
for (const exercise of topic.exercises) {
  test(`C++ verifica reale, aiuti e soluzione: ${exercise.id}`, async ({ page }) => {
    await page.goto(`/cpp/playground/${topic.manifest.id}/${exercise.id}`);
    const editor = page.locator('.cm-content');
    await expect(editor).toContainText('TODO');
    await expect(page.locator('.cpp-solution')).toHaveCount(0);
    const before = await editor.innerText();
    await page.getByRole('button', { name: 'Verifica esercizio', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('casi verificati superati', {
      timeout: 120000,
    });
    await expect(page.getByRole('status')).not.toContainText('3/3');
    expect(await editor.innerText()).toBe(before);
    await page.getByRole('button', { name: /Suggerimento 1/ }).click();
    await expect(page.getByText(`Indizio 1: ${exercise.hints[0]}`, { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Mostra soluzione', exact: true }).click();
    await expect(page.locator('.cpp-solution')).toContainText(exercise.solution.trim());
    expect(await editor.innerText()).toBe(before);
    await editor.fill(exercise.solution);
    await page.getByRole('button', { name: 'Verifica esercizio', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('3/3 casi verificati superati', {
      timeout: 30000,
    });
    await expect(page.getByTestId('cpp-test-result')).toHaveCount(3);
    await page.setViewportSize({ width: 768, height: 1024 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBeTruthy();
    await page.setViewportSize({ width: 390, height: 844 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBeTruthy();
  });
}
