import assert from 'node:assert/strict';
import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const base = process.env.ARB_PREVIEW_URL || 'https://hastura.github.io/ARB_prototype/';
const out = resolve('../tmp/character-native-v01/live');
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const results = [];
try {
  for (const [width, height, language] of [[1440, 1000, 'en'], [390, 844, 'id']]) {
    const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'no-preference' });
    await page.addInitScript(() => sessionStorage.setItem('arb-welcome', 'seen'));
    const errors = [];
    const characterMovies = [];
    page.on('request', request => { if (/character-intro-v01\/character-introduction\.mp4/.test(request.url())) characterMovies.push(request.url()); });
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    for (const variant of ['A', 'B', 'F', 'G', 'H']) {
      const response = await page.goto(`${base}#/home/${variant}?lang=${language}`);
      if (response) assert.equal(response.status(), 200); // Hash-only navigation has no HTTP response.
      await expect(page.locator('body')).toHaveAttribute('data-variant', variant);
      await expect(page.locator('html')).toHaveAttribute('lang', language);
      await expect.poll(() => page.locator('.route-veil').evaluate(el => getComputedStyle(el).transform)).toMatch(/matrix\(1, 0, 0, 0, 0, 0\)/);
      let media = {};
      if ('FGH'.includes(variant)) {
        await expect(page.locator('.welcome, [data-motion-toggle], .fb-film-controls')).toHaveCount(0);
        const visual = await page.locator('.fb-film-visual').boundingBox();
        assert.ok(Math.abs(visual.x) < 1 && Math.abs(visual.y) < 1);
        assert.equal(visual.width, width);
        assert.equal(visual.height, height);
        const video = page.locator('video[data-scroll-video]');
        await expect.poll(() => video.evaluate(el => el.duration), { timeout: 30000 }).toBeGreaterThan(40);
        const filmTravel = await page.locator('.fb-film-stage').evaluate(el => parseFloat(getComputedStyle(el.parentElement).paddingBottom));
        await page.evaluate(y => scrollTo(0, y), filmTravel * .6);
        await expect.poll(() => video.evaluate(el => el.currentTime), { timeout: 30000 }).toBeGreaterThan(25);
        await page.evaluate(y => scrollTo(0, y), filmTravel * .2);
        await expect.poll(() => video.evaluate(el => el.currentTime), { timeout: 30000 }).toBeLessThan(18);
        media = await video.evaluate(el => ({ time: el.currentTime, duration: el.duration, decoded: el.getVideoPlaybackQuality().totalVideoFrames, paused: el.paused, muted: el.muted }));
        assert.ok(media.paused && media.muted && media.decoded > 0);
        await page.screenshot({ path: resolve(out, `${variant}-${width}-film.png`) });
      }
      const native = page.locator('[data-character-native]');
      if (await native.count()) {
        await expect(native.locator('video')).toHaveCount(0);
        const stops = JSON.parse(await native.getAttribute('data-native-stops'));
        const g = await native.locator('[data-character-native-stage]').evaluate(el => ({ start: el.parentElement.getBoundingClientRect().top + scrollY - document.querySelector('.site-header').getBoundingClientRect().height, travel: parseFloat(getComputedStyle(el.parentElement).paddingBottom) }));
        for (const key of ['aksa', 'rasa', 'bumi', 'rasa', 'aksa', 'ensemble']) {
          await page.evaluate(({ g, p }) => scrollTo(0, g.start + g.travel * p), { g, p: stops[key] });
          await expect.poll(() => native.evaluate((el, target) => Math.abs(Number(el.dataset.nativeProgress) - target), stops[key]), { timeout: 10000 }).toBeLessThan(.002);
          await expect(native).toHaveAttribute('data-native-active', key);
          if (key !== 'ensemble') await expect(native.locator(`[data-native-character="${key}"] [data-native-copy]`)).toBeInViewport({ ratio: .999 });
          await page.screenshot({ path: resolve(out, `${variant}-${width}-${key}-native.png`) });
        }
        await expect(native.locator('article[data-native-character] h3')).toHaveText(['Aksa', 'Rasa', 'Bumi']);
        assert.ok(await native.locator('img').evaluateAll(images => images.every(img => img.complete && img.naturalWidth > 0)));
        results.push({ variant, width, height, language, nativeCharacterIntro: true, easedForwardReverse: true, ...media });
        continue;
      }
      const section = page.locator('[data-character-cinema]');
      const geometry = await section.locator('[data-character-stage]').evaluate(el => ({ top: el.getBoundingClientRect().top + scrollY, travel: parseFloat(getComputedStyle(el.parentElement).paddingBottom) }));
      for (const [fraction, key] of [[0, 'aksa'], [.5, 'rasa'], [1, 'bumi']]) {
        await page.evaluate(({ geometry, fraction }) => scrollTo(0, geometry.top + geometry.travel * fraction), { geometry, fraction });
        await expect(section).toHaveAttribute('data-character-active', key);
        await expect.poll(() => section.locator(`[data-character="${key}"]`).evaluate(el => Math.abs(el.getBoundingClientRect().x))).toBeLessThan(2);
        await expect(section.locator(`[data-character="${key}"] .cinema-copy`)).toBeInViewport({ ratio: 1 });
      }
      await page.screenshot({ path: resolve(out, `${variant}-${width}-bumi.png`) });
      results.push({ variant, width, height, language, fullscreen: true, forwardBackwardSeek: true, characters: ['aksa', 'rasa', 'bumi'], ...media });
    }
    assert.deepEqual(errors, []);
    assert.deepEqual(characterMovies, [], 'Native introductions must not request the character MP4');
    await page.close();
  }
  await writeFile(resolve(out, 'verification.json'), JSON.stringify({ url: base, verifiedAt: new Date().toISOString(), browserErrors: 0, results }, null, 2));
  console.log(JSON.stringify({ url: base, checks: results.length, fullscreenHeroes: 'passed', directScrollBothDirections: 'passed', nativeCodeABFG: 'passed', retainedPortraitCinemaH: 'passed', desktopMobileENID: 'passed', browserErrors: 0 }));
} finally { await browser.close(); }
