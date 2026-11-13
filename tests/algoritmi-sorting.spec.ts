import {test,expect} from '@playwright/test';
const route='/algoritmi/ordinamento/insertion-merge';
test('sorting scenes move persistent objects, pause, reset, preserve ties and fit small screens',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(route);
  const insertion=page.locator('#insertion-sort'),merge=page.locator('#merge');
  await expect(insertion).toBeVisible();await expect(merge).toBeAttached();
  async function samples(scene:typeof insertion,id:string){return scene.evaluate(async(root,id)=>{
    const values:string[]=[];const start=performance.now();
    await new Promise<void>(resolve=>{const frame=(now:number)=>{values.push(root.querySelector(`[data-item="${id}"]`)!.getAttribute('transform')!);if(now-start<250)requestAnimationFrame(frame);else resolve();};requestAnimationFrame(frame);});
    return values;
  },id);}
  for(const [scene,id]of [[insertion,'a1'],[merge,'r0']]as const){
    if(id==='r0')await scene.getByRole('button',{name:'Avanti',exact:true}).click();
    await scene.getByRole('button',{name:'Riproduci animazione',exact:true}).click();
    expect(new Set(await samples(scene,id)).size).toBeGreaterThan(3);
    await scene.getByRole('button',{name:'Pausa',exact:true}).click();
    expect(new Set(await samples(scene,id)).size).toBe(1);
    await scene.getByRole('button',{name:'Ricomincia',exact:true}).click();
    await expect(scene).toHaveAttribute('data-time','0.0000');
    await scene.focus();await page.keyboard.press('ArrowRight');await expect(scene).toHaveAttribute('data-time','1.0000');
    await scene.getByRole('button',{name:'Indietro',exact:true}).click();await expect(scene).toHaveAttribute('data-time','0.0000');
  }
  await merge.getByLabel('Prima sequenza',{exact:true}).fill('1,2');await merge.getByLabel('Parte destra',{exact:true}).fill('1,2');await merge.getByRole('button',{name:'Applica input',exact:true}).click();
  await merge.getByRole('button',{name:'Avanti',exact:true}).click();await expect(merge.locator('.alg-inspector')).toContainText('Parità');
  await merge.getByLabel('Prima sequenza',{exact:true}).fill('2,1');await merge.getByRole('button',{name:'Applica input',exact:true}).click();await expect(merge.getByRole('alert')).toContainText('ordinate');
  await page.setViewportSize({width:390,height:844});
  for(const scene of [insertion,merge]){
    expect(await scene.locator('.alg-inspector').evaluate(n=>n.getBoundingClientRect().width<=n.parentElement!.clientWidth+1)).toBe(true);
    expect(await scene.locator('.alg-inspector p').evaluate(n=>n.scrollWidth<=n.clientWidth+1)).toBe(true);
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await page.emulateMedia({reducedMotion:'reduce'});await insertion.getByRole('button',{name:'Riproduci animazione',exact:true}).click();
  await expect.poll(async()=>Number(await insertion.getAttribute('data-time'))%1).toBe(0);
  await insertion.getByRole('button',{name:'Pausa',exact:true}).click();
  await insertion.getByRole('button',{name:'Espandi scena',exact:true}).click();await expect(insertion).toHaveClass(/alg-expanded/);
  await page.keyboard.press('Escape');await expect(insertion).not.toHaveClass(/alg-expanded/);
  expect(errors).toEqual([]);
});
