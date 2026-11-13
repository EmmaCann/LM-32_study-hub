import {test,expect} from '@playwright/test';
test('Le quattro scene mantengono moto, pausa, reset e scenari sul sito integrato',async({page})=>{
 await page.goto('/aos/lezione-08/laboratori-container#container');
 const lab=page.locator('#container');await expect(lab).toBeVisible();
 for(const[mode,start]of[['pid',0],['mount',1],['network',2],['cap',0]]as const){
  await lab.getByLabel('Scena container',{exact:true}).selectOption(mode);
  await lab.getByLabel('Passaggio',{exact:true}).fill(String(start));
  await lab.getByRole('button',{name:'Riproduci animazione',exact:true}).click();
  const sample=()=>lab.evaluate(async root=>{const transforms:string[]=[];await new Promise<void>(resolve=>{const begin=performance.now();function frame(now:number){transforms.push(root.querySelector('[data-process],[data-mount-node],[data-container-token]')?.getAttribute('transform')??'');if(now-begin<220)requestAnimationFrame(frame);else resolve();}requestAnimationFrame(frame);});return new Set(transforms).size;});
  expect(await sample(),mode).toBeGreaterThan(3);
  await lab.getByRole('button',{name:'Pausa',exact:true}).click();expect(await sample()).toBe(1);
  await lab.getByRole('button',{name:'Reset',exact:true}).click();await expect(lab.locator('[data-time]')).toHaveAttribute('data-time','0.0000');
  if(mode==='network')for(const scenario of ['down','internet']){await lab.getByLabel('Scenario rete').selectOption(scenario);await expect(lab.locator('[data-time]')).toHaveAttribute('data-time','0.0000');}
 }
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.emulateMedia({reducedMotion:'reduce'});await lab.getByRole('button',{name:'Riproduci animazione',exact:true}).click();await page.waitForTimeout(150);expect(Number(await lab.locator('[data-time]').getAttribute('data-time'))%1).toBe(0);
});
