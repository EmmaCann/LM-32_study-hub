import {test,expect} from '@playwright/test';
test('i descrittori si spostano con interpolazione; scena espandibile e zoom',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/aos/lezione-03/virtqueue-batching');
 const lab=page.locator('#code-e-notifiche');await lab.getByRole('button',{name:'Avanti',exact:true}).click();
 const positions=await lab.evaluate(async root=>{
  const token=root.querySelector('[data-moving-object="D1"]')!;
  const pos=()=>{const r=token.getBoundingClientRect(),s=root.querySelector('svg.aos-scene')!.getBoundingClientRect();return [r.x-s.x,r.y-s.y];};
  const start=pos();(root.querySelector('button[aria-label="Avanti"]') as HTMLButtonElement).click();
  const samples:number[][]=[];const began=performance.now();
  await new Promise<void>(resolve=>{const sample=()=>{samples.push(pos());if(performance.now()-began<1100)requestAnimationFrame(sample);else resolve();};requestAnimationFrame(sample);});
  return {start,samples,end:pos()};
 });
 const distance=(a:number[],b:number[])=>Math.hypot(a[0]-b[0],a[1]-b[1]);
 expect(distance(positions.start,positions.end)).toBeGreaterThan(10);
 expect(positions.samples.some(p=>distance(p,positions.start)>3&&distance(p,positions.end)>3)).toBeTruthy();
 await lab.getByRole('button',{name:'Espandi scena'}).click();await expect(lab).toHaveClass(/is-expanded/);
 const svg=lab.locator('svg.aos-scene'),before=await svg.boundingBox();await lab.getByRole('button',{name:'Ingrandisci scena'}).click();const after=await svg.boundingBox();expect(after!.width).toBeGreaterThan(before!.width*1.4);
 await lab.press('Escape');await expect(lab).not.toHaveClass(/is-expanded/);
});
test('la lancetta ruota davvero e la pausa arresta il movimento',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/aos/lezione-02/interprete-cache');
 const states=await page.locator('#tempo-virtuale-timer').evaluate(async root=>{
  const wait=(n:number)=>new Promise(r=>setTimeout(r,n));
  const read=()=>{const el=root.querySelector('.timer-hand')!;return {target:el.getAttribute('style'),matrix:getComputedStyle(el).transform};};
  const click=(label:string)=>(root.querySelector(`button[aria-label="${label}"]`) as HTMLButtonElement).click();
  const before=read();click('Riproduci animazione');await wait(480);const moving=read();click('Pausa');await wait(100);const paused=read();await wait(250);const settled=read();click('Reset');await wait(100);return {before,moving,paused,settled,reset:read()};
 });
 expect(states.moving.matrix).not.toBe(states.before.matrix);
 expect(states.paused.target).toBe(states.settled.target);expect(states.paused.matrix).toBe(states.settled.matrix);
 expect(states.reset.matrix).toBe(states.before.matrix);
});
test('movimento ridotto mantiene disponibili i passaggi senza interpolazione',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/aos/lezione-03/virtqueue-batching');const lab=page.locator('#code-e-notifiche');
 expect(await lab.locator('.moving-token').first().evaluate(el=>getComputedStyle(el).transitionDuration)).toBe('0s');
 await lab.getByRole('button',{name:'Avanti',exact:true}).click();await expect(lab.getByRole('button',{name:'Indietro',exact:true})).toBeEnabled();
});
