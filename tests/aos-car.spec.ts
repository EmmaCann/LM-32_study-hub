import {test,expect} from '@playwright/test';
test('Car: scene, contrasti, movimento e catalogo simulazioni',async({page},info)=>{
 await page.goto('/simulazioni');await page.locator('a[href="/aos/lezione-09/car-container#car"]').click();
 const lab=page.locator('#car');await expect(lab).toBeVisible();await page.emulateMedia({reducedMotion:'no-preference'});
 for(const [label,mode,start]of [['Rete e misure','network',2],['Integrità del radar','replacement',1],['Budget e deadline','budget',0],['Costruisci il container','bootstrap',0]]as const){
  await lab.getByRole('button',{name:label,exact:true}).click();await expect(lab.locator('[data-car-scene]')).toHaveAttribute('data-car-scene',mode);
  await lab.getByLabel('Passaggio',{exact:true}).fill(String(start));await lab.getByRole('button',{name:'Riproduci animazione',exact:true}).click();
  const sample=(duration:number)=>lab.evaluate(async(root,d)=>{const seen=new Set<string>();await new Promise<void>(resolve=>{let start=0;function frame(t:number){if(!start)start=t;seen.add(root.querySelector('[data-experiment-probe]')?.getAttribute('transform')??'');if(t-start<d)requestAnimationFrame(frame);else resolve();}requestAnimationFrame(frame);});return seen.size;},duration);
  expect(await sample(1200)).toBeGreaterThan(3);await lab.getByRole('button',{name:'Pausa',exact:true}).click();expect(await sample(300)).toBe(1);
  await lab.screenshot({path:info.outputPath(`${mode}-intermedio.png`)});
  await lab.getByLabel('Passaggio',{exact:true}).fill('5');await expect(lab.locator('[data-car-result="final"]')).not.toBeEmpty();
  await lab.getByRole('button',{name:'Reset',exact:true}).click();await expect(lab.locator('[data-time]')).toHaveAttribute('data-time','0.0000');
 }
 await lab.getByRole('button',{name:'Rete e misure',exact:true}).click();await lab.getByLabel('Passaggio',{exact:true}).fill('5');await expect(lab.locator('[data-car-result]')).toContainText('RIFIUTATO');
 await lab.getByLabel('Isolamento car').selectOption('false');await lab.getByLabel('Passaggio',{exact:true}).fill('5');await expect(lab.locator('[data-car-result]')).toContainText('BRAKE');
 await lab.getByLabel('Sorgente car').selectOption('false');await lab.getByLabel('Passaggio',{exact:true}).fill('5');await expect(lab.locator('[data-car-result]')).toContainText('WARNING');
 await lab.getByRole('button',{name:'Integrità del radar',exact:true}).click();await lab.getByLabel('Passaggio',{exact:true}).fill('5');await expect(lab.locator('[data-car-result]')).toContainText('SOSTITUITO');
 await lab.getByLabel('Isolamento car').selectOption('true');await lab.getByLabel('Passaggio',{exact:true}).fill('5');await expect(lab.locator('[data-car-result]')).toContainText('ORIGINALE');
 await lab.getByRole('button',{name:'Budget e deadline',exact:true}).click();await lab.getByLabel('Attesa car').fill('5');await lab.getByLabel('Passaggio',{exact:true}).fill('5');await expect(lab.locator('[data-car-result]')).toContainText('DEADLINE MISS');
 await lab.getByLabel('Attesa car').fill('4');await lab.getByLabel('Passaggio',{exact:true}).fill('5');await expect(lab.locator('[data-car-result]')).toContainText('entro deadline');
 await lab.getByRole('button',{name:'Costruisci il container',exact:true}).click();await lab.getByLabel('Ordine rete').selectOption('false');await lab.getByLabel('Passaggio',{exact:true}).fill('5');await expect(lab.locator('[data-car-result]')).toContainText('ERRORE');
 await lab.getByLabel('Ordine rete').selectOption('true');await lab.getByLabel('Ordine cgroup').selectOption('false');await lab.getByLabel('Passaggio',{exact:true}).fill('5');await expect(lab.locator('[data-car-result]')).toContainText('VISTA ERRATA');
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await lab.screenshot({path:info.outputPath('small.png')});
 await page.emulateMedia({reducedMotion:'reduce'});await lab.getByRole('button',{name:'Prova configurazione'}).click();await page.waitForTimeout(150);expect(Number(await lab.locator('[data-time]').getAttribute('data-time'))%1).toBe(0);
});
