import {test,expect} from '@playwright/test';
test('Gli esperimenti mostrano i contrasti e mantengono movimento, pausa e reset',async({page},testInfo)=>{
 await page.goto('/aos/lezione-08/laboratori-container#container');const lab=page.locator('#container');await page.emulateMedia({reducedMotion:'no-preference'});await expect(lab.locator('[data-container-design]')).toHaveAttribute('data-container-design','3');const nav=lab.getByRole('navigation',{name:'Architetture container'});await nav.getByRole('button',{name:'Cambio della radice'}).click();await expect(lab.getByLabel('Scena container',{exact:true})).toHaveValue('mount');
 for(const[mode,start]of [['pid',0],['mount',0],['network',1],['cap',2]]as const){
  await lab.getByLabel('Scena container',{exact:true}).selectOption(mode);await lab.getByLabel('Passaggio',{exact:true}).fill(String(start));await lab.getByRole('button',{name:'Riproduci animazione',exact:true}).click();
  const sample=(duration=1200)=>lab.evaluate(async(root,duration)=>{const positions:string[]=[];await new Promise<void>(resolve=>{const begin=performance.now();function frame(t:number){positions.push(root.querySelector('[data-experiment-probe]')?.getAttribute('transform')??'');if(t-begin<duration)requestAnimationFrame(frame);else resolve();}requestAnimationFrame(frame);});return new Set(positions).size;},duration);
  expect(await sample()).toBeGreaterThan(3);await lab.getByRole('button',{name:'Pausa',exact:true}).click();expect(await sample(300)).toBe(1);
  await lab.getByRole('button',{name:'Reset',exact:true}).click();await expect(lab.locator('[data-time]')).toHaveAttribute('data-time','0.0000');
 }

 for(const mode of ['pid','mount','network','cap']){await lab.getByLabel('Scena container',{exact:true}).selectOption(mode);const choices=await lab.getByLabel('Esperimento container').locator('option').evaluateAll(es=>es.map(e=>(e as HTMLOptionElement).value));for(const choice of choices){await lab.getByLabel('Esperimento container').selectOption(choice);for(const path of mode==='mount'?['/etc/passwd','/oldroot/etc/passwd']:['']){if(path)await lab.getByLabel('Percorso da risolvere').selectOption(path);await lab.getByLabel('Passaggio',{exact:true}).fill('5');await expect(lab.locator('[data-experiment-result]')).not.toBeEmpty();if(mode==='mount'&&path.startsWith('/oldroot')&&choice!=='pivot')await expect(lab.locator('[data-experiment-result]')).toContainText('ENOENT');if(mode==='cap')await expect(lab.locator('[data-experiment-result]')).toContainText(['apply','drop'].includes(choice)?'consentito':'denied');}}}
 await lab.getByLabel('Esperimento container').selectOption('flag');await lab.getByLabel('Passaggio',{exact:true}).fill('5');await expect(lab.locator('[data-experiment-result]')).toContainText('denied');
 await lab.getByLabel('Esperimento container').selectOption('apply');await lab.getByLabel('Passaggio',{exact:true}).fill('5');await expect(lab.locator('[data-experiment-result]')).toContainText('consentito');
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 expect(await lab.locator('.theatre-viewport').evaluate(el=>el.scrollWidth>el.clientWidth)).toBe(true);
 await lab.screenshot({path:testInfo.outputPath('small.png')});
 await page.emulateMedia({reducedMotion:'reduce'});await lab.getByRole('button',{name:'Prova configurazione'}).click();await page.waitForTimeout(120);expect(Number(await lab.locator('[data-time]').getAttribute('data-time'))%1).toBe(0);
});
