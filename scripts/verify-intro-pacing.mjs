import assert from 'node:assert/strict';
import { chromium, expect } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const base = process.env.ARB_PREVIEW_URL || 'https://hastura.github.io/ARB_prototype/';
const out = resolve(process.env.ARB_QA_OUTPUT || '../tmp/intro-pacing-v02/live');
const copies = Object.fromEntries(await Promise.all([
  ['en', '../src/copy-en.json'], ['id', '../src/copy-source.json'],
].map(async ([language, path]) => [language, JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'))])));
await mkdir(out, { recursive: true });

const browser = await chromium.launch();
const results = [];
try {
  for (const [width, height] of [[1440, 1000], [390, 844]]) {
    const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'no-preference' });
    await page.addInitScript(() => sessionStorage.setItem('arb-welcome', 'seen'));
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });

    async function open(variant, language = 'en') {
      const url = new URL(base);
      url.hash = `/home/${variant}?lang=${language}`;
      const response = await page.goto(url.href);
      if (response) assert.equal(response.status(), 200);
      await expect(page.locator('body')).toHaveAttribute('data-variant', variant);
      await expect(page.locator('html')).toHaveAttribute('lang', language);
      // A hash change sets html.lang before replacing the previous page. Check
      // actual localized DOM as well, including same-variant language switches.
      await expect(page.locator('main h1')).toHaveText(copies[language]['home.title'].text.replace(/\s+/g, ' '));
      await expect(page.locator(`[data-language="${language}"]`)).toHaveAttribute('aria-pressed', 'true');
      if (variant !== 'H') {
        await expect(page.locator('[data-native-character="rasa"] p')).toHaveText(copies[language]['character.rasa.body'].text);
        await expect(page.locator('[data-character-native]')).toHaveClass(/is-native-scroll/);
      }
      await expect.poll(() => page.locator('.route-veil').evaluate(element => getComputedStyle(element).transform))
        .toMatch(/matrix\(1, 0, 0, 0, 0, 0\)/);
      await page.evaluate(() => document.fonts.ready);
    }

    async function range(stage, offsetHeader) {
      return stage.evaluate((element, offsetHeader) => ({
        start: element.parentElement.getBoundingClientRect().top + scrollY - (offsetHeader ? document.querySelector('.site-header').getBoundingClientRect().height : 0),
        travel: parseFloat(getComputedStyle(element.parentElement).paddingBottom),
        width: element.clientWidth,
      }), offsetHeader);
    }

    async function wheelProbe(locator, geometry, progress, settle) {
      await page.evaluate(({ geometry, progress }) => scrollTo(0, geometry.start + geometry.travel * progress), { geometry, progress });
      let actual = await page.evaluate(geometry => (scrollY - geometry.start) / geometry.travel, geometry);
      await settle(actual);
      const initial = await locator.evaluate(element => element.getBoundingClientRect().left);
      const beforeScroll = await page.evaluate(() => scrollY);
      const started = Date.now();
      await page.mouse.move(width / 2, height / 2);
      await page.mouse.wheel(0, 120);
      await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(beforeScroll + 100);
      actual = await page.evaluate(geometry => (scrollY - geometry.start) / geometry.travel, geometry);
      await settle(actual);
      const final = await locator.evaluate(element => element.getBoundingClientRect().left);
      const afterScroll = await page.evaluate(() => scrollY);
      await page.mouse.wheel(0, -120);
      await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(afterScroll - 100);
      actual = await page.evaluate(geometry => (scrollY - geometry.start) / geometry.travel, geometry);
      await settle(actual);
      const reversed = await locator.evaluate(element => element.getBoundingClientRect().left);
      const measurement = {
        forwardPixels: final - initial,
        reversePixels: reversed - final,
        returnError: Math.abs(reversed - initial),
        elapsedMs: Date.now() - started,
      };
      assert.ok(measurement.forwardPixels < 0, 'Forward wheel input must move the measured art to the left');
      assert.ok(measurement.reversePixels > 0, 'Reverse wheel input must move the art back to the right');
      assert.ok(measurement.returnError < 1, `Reverse input must restore the starting position: ${JSON.stringify(measurement)}`);
      return measurement;
    }

    async function nativeState(language = 'en') {
      const section = page.locator('[data-character-native]');
      await expect(section.locator('[data-native-character="rasa"] p')).toHaveText(copies[language]['character.rasa.body'].text);
      const broken = await section.locator('img').evaluateAll(async images => {
        await Promise.all(images.map(async image => { image.loading = 'eager'; try { await image.decode(); } catch { /* Report below. */ } }));
        return images.filter(image => !image.complete || !image.naturalWidth).map(image => image.currentSrc || image.src);
      });
      assert.deepEqual(broken, []);
      const geometry = await range(section.locator('[data-character-native-stage]'), true);
      const probes = JSON.parse(await section.getAttribute('data-native-motion-probes'));
      const stops = JSON.parse(await section.getAttribute('data-native-stops'));
      const settle = progress => expect.poll(() => section.evaluate((element, target) => Math.abs(Number(element.dataset.nativeProgress) - target), progress), { timeout: 10000 }).toBeLessThan(.0002);
      return { section, geometry, probes, stops, settle };
    }

    async function captureDetail(state, language) {
      const { section, geometry, stops, settle } = state;
      await page.evaluate(({ geometry, progress }) => scrollTo(0, geometry.start + geometry.travel * progress), { geometry, progress: stops.rasa });
      await settle(stops.rasa);
      await expect(section).toHaveAttribute('data-native-active', 'rasa');
      const paragraph = section.locator('[data-native-character="rasa"] p');
      await expect(paragraph).toHaveText(copies[language]['character.rasa.body'].text);
      await expect(paragraph).toBeInViewport({ ratio: 1 });
      await expect.poll(() => paragraph.evaluate(element => {
        let opacity = 1;
        for (let current = element; current; current = current.parentElement) opacity *= Number(getComputedStyle(current).opacity);
        return opacity;
      })).toBeGreaterThan(.95);
      await page.screenshot({ path: resolve(out, `G-${width}-${language}-rasa-detail.png`) });
      return { language, body: await paragraph.innerText() };
    }

    await open('H');
    // ScrollTrigger bypasses numeric scrub during its initial 500ms startup.
    await page.waitForTimeout(600);
    const referenceTrack = page.locator('[data-character-track]');
    const referenceRange = await range(page.locator('[data-character-stage]'), false);
    const settleReference = progress => expect.poll(() => referenceTrack.evaluate((element, target) => Math.abs(element.getBoundingClientRect().left - target), -2 * referenceRange.width * progress), { timeout: 10000 }).toBeLessThan(.5);
    const reference = await wheelProbe(referenceTrack, referenceRange, .3, settleReference);
    assert.ok(Math.abs(reference.forwardPixels) > width * .03, 'H reference probe must actually move');

    const cases = [];
    let localizedDetail;
    for (const variant of ['A', 'B', 'F', 'G']) {
      await open(variant);
      const state = await nativeState();
      const { section, geometry, probes, settle } = state;
      assert.deepEqual(Object.keys(probes), ['pan', 'transition']);
      const firstChapter = section.locator('[data-native-character="aksa"]');
      const pan = await wheelProbe(firstChapter.locator('[data-native-figure="2"]'), geometry, probes.pan, settle);
      const transition = await wheelProbe(firstChapter, geometry, probes.transition, settle);
      const ratioToH = {
        pan: Math.abs(pan.forwardPixels / reference.forwardPixels),
        transition: Math.abs(transition.forwardPixels / reference.forwardPixels),
      };
      for (const [phase, ratio] of Object.entries(ratioToH)) {
        assert.ok(ratio > .2 && ratio <= 1.5, `${variant}/${width} ${phase} must move calmly relative to H: ${ratio}`);
      }
      const overflow = await page.evaluate(() => Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) - document.documentElement.clientWidth);
      assert.ok(overflow <= 1, `${variant}/${width} must not overflow horizontally: ${overflow}`);
      cases.push({ variant, travel: geometry.travel, pan, transition, ratioToH });
      if (variant === 'G') {
        await page.screenshot({ path: resolve(out, `G-${width}-transition.png`) });
        await captureDetail(state, 'en');
      }
    }
    if (width === 390) {
      await open('G', 'id');
      localizedDetail = await captureDetail(await nativeState('id'), 'id');
    }
    assert.deepEqual(errors, []);
    results.push({ width, height, reference: { travel: referenceRange.travel, ...reference }, cases, localizedDetail, browserErrors: errors.length });
    await page.close();
  }
  await writeFile(resolve(out, 'comparison.json'), JSON.stringify({ verifiedAt: new Date().toISOString(), base, results }, null, 2));
  console.log(JSON.stringify(results.map(result => ({
    width: result.width,
    referencePixels: result.reference.forwardPixels,
    cases: result.cases.map(entry => ({ variant: entry.variant, travel: entry.travel, ratioToH: entry.ratioToH, panReturnError: entry.pan.returnError, transitionReturnError: entry.transition.returnError })),
    localizedDetail: result.localizedDetail,
    browserErrors: result.browserErrors,
  })), null, 2));
} finally {
  await browser.close();
}
