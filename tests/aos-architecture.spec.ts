import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
const approved=path.resolve('src/content/approved');
const lessons=fs.readdirSync(approved).filter(n=>/^aos-l0[1-6]|^aos-l08/.test(n)).map(n=>{const folder=path.join(approved,n),manifest=JSON.parse(fs.readFileSync(path.join(folder,'manifest.json'),'utf8'));return{route:`/${manifest.subject}/${manifest.chapter.id}/${manifest.slug}`,simulations:JSON.parse(fs.readFileSync(path.join(folder,'simulations.json'),'utf8')) as {id:string;component:string}[]};});
test('Profilo architetturale: tutti i laboratori precedenti, zoom e isolamento disciplinare',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 for(const lesson of lessons){await page.goto(lesson.route);for(const s of lesson.simulations){const lab=page.locator('#'+s.id);await expect(lab).toHaveAttribute('data-design','architecture');const stage=lab.locator('svg.aos-scene');expect(await stage.evaluate(el=>el.getBoundingClientRect().width)).toBeGreaterThanOrEqual(679);const slider=lab.getByLabel('Passaggio',{exact:true});await slider.fill(String(Math.min(4,Number(await slider.getAttribute('max')))));await page.waitForTimeout(900);await expect(lab.locator('.theatre-description')).not.toBeEmpty();await stage.screenshot({path:info.outputPath(s.component+'.png')});}
 }
 const lab=page.locator('#container'),svg=lab.locator('svg.aos-scene'),w=await svg.evaluate(el=>el.getBoundingClientRect().width);await lab.getByRole('button',{name:'Ingrandisci scena',exact:true}).click();expect(await svg.evaluate(el=>el.getBoundingClientRect().width)).toBeGreaterThan(w*1.4);await lab.getByRole('button',{name:'Riduci zoom',exact:true}).click();
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await lab.screenshot({path:info.outputPath('small.png')});
 await page.goto('/aos/lezione-07/laboratori-memoria#memoria');await expect(page.locator('#memoria')).not.toHaveClass(/architectural-player/);await expect(page.locator('#memoria [data-memory-design]')).toHaveAttribute('data-memory-design','3');
 await page.goto('/algoritmi/ordinamento/insertion-merge');await expect(page.locator('h1')).toBeVisible();expect(await page.locator('.architectural-player').count()).toBe(0);
 expect(errors).toEqual([]);
});
