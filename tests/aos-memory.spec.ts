import {test,expect} from '@playwright/test';
test('Le sei scene mantengono moto, pausa, reset e scenari sul sito integrato',async({page})=>{
 await page.goto('/aos/lezione-07/laboratori-memoria#memoria');
 const lab=page.locator('#memoria');await expect(lab).toBeVisible();
 for(const[mode,start]of[['shootdown',0],['buddy',0],['walk',1],['balloon',2],['ksm',0],['latency',0]]as const){
  await lab.getByLabel('Scena memoria',{exact:true}).selectOption(mode);
  await lab.getByLabel('Passaggio',{exact:true}).fill(String(start));
  await lab.getByRole('button',{name:'Riproduci animazione',exact:true}).click();
  const sample=()=>lab.evaluate(async root=>{const transforms:string[]=[];await new Promise<void>(resolve=>{const begin=performance.now();function frame(now:number){transforms.push(root.querySelector('[data-memory-token],[data-block]')?.getAttribute('transform')??'');if(now-begin<220)requestAnimationFrame(frame);else resolve();}requestAnimationFrame(frame);});return new Set(transforms).size;});
  expect(await sample(),mode).toBeGreaterThan(3);
  await lab.getByRole('button',{name:'Pausa',exact:true}).click();expect(await sample()).toBe(1);
  await lab.getByRole('button',{name:'Reset',exact:true}).click();await expect(lab.locator('[data-time]')).toHaveAttribute('data-time','0.0000');
  if(['buddy','walk','latency'].includes(mode)){await lab.getByLabel('Scenario memoria').selectOption('alternativo');await expect(lab.locator('[data-time]')).toHaveAttribute('data-time','0.0000');}
 }
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.emulateMedia({reducedMotion:'reduce'});await lab.getByRole('button',{name:'Riproduci animazione',exact:true}).click();await page.waitForTimeout(150);expect(Number(await lab.locator('[data-time]').getAttribute('data-time'))%1).toBe(0);
});
