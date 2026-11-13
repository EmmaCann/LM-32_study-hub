import {test,expect} from '@playwright/test';
const route='/aos/lezione-06/partizioni-e-comunicazione';
const output='C:/LM-32/.aos-cache/lessons/Lezione-06/supporto';
test('lezione6: proprietà dei core, payload fermo, ring e cache',async({page},info)=>{
 await page.setViewportSize({width:1680,height:1100});await page.emulateMedia({reducedMotion:'no-preference'});
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(route);
 const lab=page.locator('#celle-e-core');
 const motion=await lab.evaluate(async root=>{
  const token=root.querySelector('[data-moving-object="Core 1"]')!;
  const read=()=>{const m=new DOMMatrix(getComputedStyle(token).transform);return [m.m41,m.m42];};
  const next=()=> (root.querySelector('button[aria-label="Avanti"]') as HTMLButtonElement).click();
  next();await new Promise(r=>setTimeout(r,50));const start=read();next();
  const samples:number[][]=[];const begin=performance.now();await new Promise<void>(resolve=>{const frame=()=>{samples.push(read());if(performance.now()-begin<1050)requestAnimationFrame(frame);else resolve();};requestAnimationFrame(frame);});
  return {start,end:read(),samples};
 });
 const dist=(a:number[],b:number[])=>Math.hypot(a[0]-b[0],a[1]-b[1]);
 expect(dist(motion.start,motion.end)).toBeGreaterThan(100);expect(motion.samples.some(p=>dist(p,motion.start)>5&&dist(p,motion.end)>5)).toBeTruthy();
 await lab.locator('input[type=range]').fill('7');await page.waitForTimeout(950);await lab.screenshot({path:`${output}/hub-partition-${info.project.name}.png`});
 await expect(lab.locator('.theatre-description')).toContainText('bloccato');
 const shared=page.locator('#dati-e-doorbell');await shared.getByRole('combobox',{name:'Notifica'}).selectOption('false');await shared.locator('input[type=range]').fill('3');await page.waitForTimeout(950);
 const payload=await shared.locator('[data-moving-object="payload"]').getAttribute('style');await shared.locator('input[type=range]').fill('4');await page.waitForTimeout(950);expect(await shared.locator('[data-moving-object="payload"]').getAttribute('style')).toBe(payload);
 await shared.screenshot({path:`${output}/hub-doorbell-${info.project.name}.png`});
 const ring=page.locator('#ring-e-lettori');await ring.locator('input[type=range]').fill('10');await page.waitForTimeout(950);await expect(ring.locator('.theatre-description')).toContainText('2 frame');await ring.screenshot({path:`${output}/hub-ring-${info.project.name}.png`});
 const cache=page.locator('#colori-cache');await cache.getByRole('combobox',{name:'Cache',exact:true}).selectOption('false');await cache.locator('input[type=range]').fill('4');await page.waitForTimeout(950);await expect(cache.locator('.theatre-description')).toContainText('espelle C1');await cache.screenshot({path:`${output}/hub-cache-${info.project.name}.png`});
 expect(errors).toEqual([]);
});
test('lezione6: telefono, reset e pausa del lavoro cluster',async({page},info)=>{
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});await page.goto(route);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBeTruthy();
 for(const id of ['celle-e-core','dati-e-doorbell','ring-e-lettori','colori-cache']){
  const lab=page.locator('#'+id);await lab.getByRole('button',{name:'Avanti',exact:true}).click();await lab.screenshot({path:`${output}/hub-${id}-mobile-${info.project.name}.png`});
  await lab.getByRole('button',{name:'Reset',exact:true}).click();await expect(lab.getByRole('button',{name:'Indietro',exact:true})).toBeDisabled();
 }
 await page.emulateMedia({reducedMotion:'no-preference'});const lab=page.locator('#celle-e-core');await lab.locator('input[type=range]').fill('4');
 const clock=await lab.evaluate(async root=>{const wait=(n:number)=>new Promise(r=>setTimeout(r,n));const read=()=>root.querySelector('[data-cluster-wheel]')!.getAttribute('style');const click=(name:string)=>(root.querySelector(`button[aria-label="${name}"]`) as HTMLButtonElement).click();const before=read();click('Riproduci animazione');await wait(350);const moving=read();click('Pausa');await wait(80);const stopped=read();await wait(180);return {before,moving,stopped,end:read()};});
 expect(clock.before).not.toBe(clock.moving);expect(clock.stopped).toBe(clock.end);
});
