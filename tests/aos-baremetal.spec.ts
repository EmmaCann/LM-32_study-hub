import { test, expect } from '@playwright/test';
const route = '/aos/lezione-05/firmware-tempo';
test('lezione 5: copia interpolata, PIT vivo con latch e pausa vCPU', async ({ page }, info) => {
  const output = info.outputPath('screens');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 1680, height: 1100 });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(route);
  const loader = page.locator('#elf-in-memoria');
  const motion = await loader.evaluate(async (root) => {
    const token = root.querySelector('[data-moving-object=".text"]')!;
    const pos = () => token.getBoundingClientRect().x;
    const next = () =>
      (root.querySelector('button[aria-label="Avanti"]') as HTMLButtonElement).click();
    next();
    await new Promise((r) => setTimeout(r, 50));
    const start = pos();
    next();
    const samples: number[] = [];
    const begin = performance.now();
    await new Promise<void>((resolve) => {
      const tick = () => {
        samples.push(pos());
        if (performance.now() - begin < 1100) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
    return { start, end: pos(), samples };
  });
  expect(motion.end - motion.start).toBeGreaterThan(50);
  expect(motion.samples.some((x) => x > motion.start + 5 && x < motion.end - 5)).toBeTruthy();
  await loader.screenshot({ path: `${output}/hub-loader-${info.project.name}.png` });
  const pit = page.locator('#lettura-pit');
  await pit.scrollIntoViewIfNeeded();
  const hand = pit.locator('[data-pit-hand]');
  const initialHand = await hand.getAttribute('style');
  await pit.getByRole('button', { name: 'Riproduci animazione', exact: true }).click();
  await expect(hand).not.toHaveAttribute('style', initialHand!);
  await pit.getByRole('button', { name: 'Pausa', exact: true }).click();
  const pausedHand = await hand.getAttribute('style');
  await page.waitForTimeout(180);
  await expect(hand).toHaveAttribute('style', pausedHand!);
  await pit.locator('input[type=range]').fill('3');
  await page.waitForTimeout(950);
  await pit.screenshot({ path: `${output}/hub-pit-${info.project.name}.png` });
  const gaps = page.locator('#pause-vcpu');
  await gaps.locator('input[type=range]').fill('6');
  await page.waitForTimeout(950);
  await gaps.screenshot({ path: `${output}/hub-gap-${info.project.name}.png` });
  await gaps.getByRole('combobox', { name: 'Durata pausa' }).selectOption('80');
  await gaps.locator('input[type=range]').fill('8');
  await expect(gaps.locator('.theatre-description')).toContainText('26.07');
  await pit.getByRole('combobox', { name: 'Gestore PIT' }).selectOption('tcg');
  await expect(pit.locator('svg.aos-scene')).toContainText('PROCESSO QEMU');
  expect(errors).toEqual([]);
});
test('lezione 5: touch, schermo piccolo e movimento ridotto', async ({ page }, info) => {
  const output = info.outputPath('screens');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(route);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
  ).toBeTruthy();
  for (const id of ['elf-in-memoria', 'lettura-pit', 'pause-vcpu']) {
    const lab = page.locator('#' + id);
    await lab.getByRole('button', { name: 'Avanti', exact: true }).click();
    await expect(lab.getByRole('button', { name: 'Indietro', exact: true })).toBeEnabled();
    await lab.screenshot({ path: `${output}/hub-${id}-mobile-${info.project.name}.png` });
    await lab.getByRole('button', { name: 'Reset', exact: true }).click();
    await expect(lab.getByRole('button', { name: 'Indietro', exact: true })).toBeDisabled();
  }
});
