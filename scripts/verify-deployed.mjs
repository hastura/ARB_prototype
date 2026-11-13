import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const base = process.env.ARB_PREVIEW_URL || 'https://hastura.github.io/ARB_prototype/';
const out = resolve('../tmp/prototype-qa');
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.addInitScript(() => sessionStorage.setItem('arb-welcome', 'seen'));
  const response = await page.goto(`${base}#/preview`);
  assert.equal(response.status(), 200, 'Published Pages URL must return HTTP 200');
  await page.getByRole('heading', { name: 'Eight ways to open a story.', exact: true }).waitFor();
  assert.equal(await page.locator('.variant-tile').count(), 8);
  assert.equal(await page.locator('html').getAttribute('lang'), 'en', 'Fresh visits default to English');
  await page.locator('main img').evaluateAll(async images => {
    await Promise.all(images.map(async image => { image.loading = 'eager'; await image.decode(); }));
  });
  await page.getByRole('button', { name: 'Mobile', exact: true }).click();
  const frame = page.frameLocator('iframe');
  await frame.locator('main h1').waitFor();
  assert.equal(await frame.locator('html').evaluate(() => innerWidth), 390);
  assert.equal(await frame.locator('html').getAttribute('lang'), 'en');
  await page.screenshot({ path: resolve(out, 'deployed-review-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}#/home/E?lang=en`);
  await page.getByRole('button', { name: 'Open menu', exact: true }).click();
  await page.getByRole('dialog').getByRole('link', { name: 'Ebook', exact: true }).click();
  await page.getByRole('heading', { name: 'Ebook', exact: true }).waitFor();
  await page.getByRole('link', { name: 'Discover the story', exact: true }).first().click();
  await page.reload();
  await page.locator('main h1').waitFor();
  assert.match(await page.locator('main h1').innerText(), /The Art of\s+Reflecting/);
  assert.equal(await page.getByText('The excerpt is not available yet.', { exact: true }).count(), 1);
  await page.getByRole('button', { name: 'ID', exact: true }).click();
  await page.getByText('Cuplikan belum tersedia.', { exact: true }).waitFor();
  await page.reload();
  await page.locator('main h1').waitFor();
  assert.equal(await page.locator('html').getAttribute('lang'), 'id');
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await page.getByText('The excerpt is not available yet.', { exact: true }).waitFor();
  assert.equal(await page.locator('html').getAttribute('lang'), 'en');
  await page.screenshot({ path: resolve(out, 'deployed-detail-mobile.png'), fullPage: true });
  const newHeroes = {};
  for (const variant of ['F', 'G', 'H']) {
    await page.goto(`${base}#/home/${variant}?lang=en`);
    await page.locator('.feedback-hero').waitFor();
    assert.match(await page.locator('main h1').innerText(), /Meet them/);
    const media = page.locator('video[data-scroll-video]');
    assert.equal(await media.evaluate(el => el.paused), true);
    assert.equal(await page.locator('[data-motion-toggle], .fb-film-controls').count(), 0);
    assert.deepEqual(await page.locator('[data-character-cinema] article h3, [data-character-native] article[data-native-character] h3').allTextContents(), ['Aksa', 'Rasa', 'Bumi']);
    await page.getByRole('button', { name: 'ID', exact: true }).click();
    await page.getByRole('heading', { name: /Kenali mereka/ }).waitFor();
    assert.equal(await page.locator('html').getAttribute('lang'), 'id');
    newHeroes[variant] = 'passed';
  }
  await page.locator('footer [data-social="instagram"]').click();
  await page.getByRole('dialog', { name: 'Tautan resmi belum tersedia.', exact: true }).waitFor();
  await page.keyboard.press('Escape');
  assert.deepEqual(errors, [], 'Published journeys must have no browser errors');
  console.log(JSON.stringify({ url: base, http: 200, alternatives: 8, newHeroes, dummySocial: 'passed', defaultEnglish: 'passed', languageSwitchAndPersistence: 'passed', desktopHub: 'passed', exactMobileSimulator: 'passed', mobileJourney: 'passed', deepRefresh: 'passed', browserErrors: 0, screenshots: out }));
} finally {
  await browser.close();
}
