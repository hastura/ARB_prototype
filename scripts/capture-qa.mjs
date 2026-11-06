import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
const out=resolve('../tmp/prototype-qa');
await mkdir(out,{recursive:true});
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
await page.addInitScript(()=>sessionStorage.setItem('arb-welcome','seen'));
for(const [key,route] of [['home-e','/home/E'],['home-a','/home/A'],['home-b','/home/B'],['home-c','/home/C'],['home-d','/home/D'],['ebook','/ebook'],['detail','/ebook/the-art-of-reflecting'],['review','/preview']]){
  await page.goto(`http://127.0.0.1:4173/#${route}`);
  await page.locator('main h1').waitFor();
  await page.locator('main img').evaluateAll(async imgs=>{await Promise.all(imgs.map(async img=>{img.loading='eager';try{await img.decode();}catch{}}));});
  await page.screenshot({path:resolve(out,`${key}-desktop.png`),fullPage:true});
}
await page.setViewportSize({width:390,height:844});
for(const [key,route] of [['home-e','/home/E'],['ebook','/ebook'],['review','/preview']]){
  await page.goto(`http://127.0.0.1:4173/#${route}`);
  await page.locator('main h1').waitFor();
  await page.locator('main img').evaluateAll(async imgs=>{await Promise.all(imgs.map(async img=>{img.loading='eager';try{await img.decode();}catch{}}));});
  await page.screenshot({path:resolve(out,`${key}-mobile.png`),fullPage:true});
}
await page.setViewportSize({width:768,height:1024});
await page.goto('http://127.0.0.1:4173/#/home/E');
await page.locator('main h1').waitFor();
await page.screenshot({path:resolve(out,'home-e-tablet.png'),fullPage:false});
await browser.close();
console.log(`Saved visual QA screens: ${out}`);
