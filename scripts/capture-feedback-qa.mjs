import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
const out=resolve('../tmp/hero-pacing-v01/browser');
await mkdir(out,{recursive:true});
const browser=await chromium.launch();
const mediaKeys={F:'living-room',G:'amber-cinematic',H:'amber-collage'};
async function ready(page,variant){
  await expect(page.locator('body')).toHaveAttribute('data-variant',variant);
  await expect(page.locator('video[data-scroll-video]')).toHaveAttribute('data-media-key',mediaKeys[variant]);
  await expect.poll(()=>page.locator('.route-veil').evaluate(el=>getComputedStyle(el).transform)).toMatch(/matrix\(1, 0, 0, 0, 0, 0\)/);
}
try {
  const page=await browser.newPage({reducedMotion:'reduce',viewport:{width:1440,height:1000}});
  await page.addInitScript(()=>sessionStorage.setItem('arb-welcome','seen'));
  for(const width of [1440,768,390]) {
    await page.setViewportSize({width,height:1000});
    for(const variant of ['F','G','H']) {
      await page.goto(`http://127.0.0.1:4173/#/home/${variant}?lang=en`);
      await page.locator('main h1').waitFor();
      await ready(page,variant);
      await page.locator('main img').evaluateAll(async imgs=>Promise.all(imgs.map(async img=>{img.loading='eager';try{await img.decode();}catch{}})));
      await page.screenshot({path:resolve(out,`${variant}-${width}.png`),fullPage:true});
    }
  }
  await page.setViewportSize({width:1440,height:1000});
  for(const [name,route] of [['E-feedback','/home/E'],['catalog-F','/ebook?v=F'],['detail-G','/ebook/the-art-of-reflecting?v=G'],['hub','/preview']]){
    await page.goto(`http://127.0.0.1:4173/#${route}${route.includes('?')?'&':'?'}lang=en`);
    await page.locator('main h1').waitFor();
    await page.locator('main img').evaluateAll(async imgs=>Promise.all(imgs.map(async img=>{img.loading='eager';try{await img.decode();}catch{}})));
    await page.screenshot({path:resolve(out,`${name}.png`),fullPage:true});
  }
  await page.emulateMedia({reducedMotion:'no-preference'});
  for(const variant of ['F','G','H']){
    await page.goto(`http://127.0.0.1:4173/#/home/${variant}?lang=en`);
    await ready(page,variant);
    const video=page.locator('video[data-scroll-video]');
    await expect.poll(()=>video.evaluate(el=>Number.isFinite(el.duration)),{timeout:15000}).toBe(true);
    const range=await page.locator('[data-hero-scroll]').evaluate(el=>({top:el.getBoundingClientRect().top+scrollY,travel:parseFloat(getComputedStyle(el.querySelector('.fb-film-stage').parentElement).paddingBottom)}));
    await page.evaluate(g=>scrollTo(0,g.top+g.travel*.4),range);
    await expect.poll(()=>video.evaluate(el=>el.currentTime),{timeout:15000}).toBeGreaterThan(8);
    await expect.poll(()=>video.evaluate(el=>el.seeking),{timeout:15000}).toBe(false);
    await page.screenshot({path:resolve(out,`${variant}-motion-middle.png`)});
    const native=page.locator('[data-character-native]');
    if(await native.count()){
      const stops=JSON.parse(await native.getAttribute('data-native-stops'));
      const g=await native.locator('[data-character-native-stage]').evaluate(el=>({start:el.parentElement.getBoundingClientRect().top+scrollY-document.querySelector('.site-header').getBoundingClientRect().height,travel:parseFloat(getComputedStyle(el.parentElement).paddingBottom)}));
      for(const key of ['aksa','rasa','bumi','ensemble']){
        await page.evaluate(({g,p})=>scrollTo(0,g.start+g.travel*p),{g,p:stops[key]});
        await expect.poll(()=>native.evaluate((el,p)=>Math.abs(Number(el.dataset.nativeProgress)-p),stops[key])).toBeLessThan(.002);
        await page.screenshot({path:resolve(out,`${variant}-${key}-native-desktop.png`)});
      }
      continue;
    }
    const cinema=page.locator('[data-character-stage]');
    const geometry=await cinema.evaluate(el=>({top:el.getBoundingClientRect().top+scrollY,travel:parseFloat(getComputedStyle(el.parentElement).paddingBottom)}));
    for(const [fraction,key] of [[0,'aksa'],[.5,'rasa'],[1,'bumi']]){
      await page.evaluate(({g,f})=>scrollTo(0,g.top+g.travel*f),{g:geometry,f:fraction});
      await expect.poll(()=>page.locator(`[data-character="${key}"]`).evaluate(el=>Math.abs(el.getBoundingClientRect().left))).toBeLessThan(2);
      await page.screenshot({path:resolve(out,`${variant}-${key}-desktop.png`)});
    }
  }
  console.log(`Captured feedback QA: ${out}`);
} finally {await browser.close();}
