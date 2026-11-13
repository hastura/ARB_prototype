import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const alternatives = ['A', 'B', 'F', 'G'];
const keys = ['aksa', 'rasa', 'bumi'];
const characterNames = ['Aksa', 'Rasa', 'Bumi'];
const oldCharacterFilm = /character-intro-v01\/character-introduction\.mp4/;

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('arb-welcome', 'seen'));
});

function captureErrors(page) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  return errors;
}

async function open(page, alternative, language = 'en') {
  await page.goto(`./#/home/${alternative}?lang=${language}`);
  await expect(page.locator('body')).toHaveAttribute('data-variant', alternative);
  await expect(page.locator('html')).toHaveAttribute('lang', language);
  await expect(page.locator('main h1')).toBeVisible();
}

async function noOverflow(page) {
  const geometry = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, width: Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) }));
  expect(geometry.width, JSON.stringify(geometry)).toBeLessThanOrEqual(geometry.viewport + 1);
}

async function completeNativeCopy(page) {
  const section = page.locator('[data-character-native]');
  const articles = section.locator('article[data-native-character]');
  await expect(articles).toHaveCount(3);
  await expect(articles.locator('h3')).toHaveText(characterNames);
  for (const key of keys) {
    const article = section.locator(`[data-native-character="${key}"]`);
    await expect(article.locator('p')).toContainText(new RegExp(key, 'i'));
    await expect(article.locator('[data-native-figure]')).toHaveCount(4);
    const sources = await article.locator('[data-native-figure] img').evaluateAll(images => images.map(image => image.getAttribute('src')));
    expect(sources).toHaveLength(4);
    for (let pose = 0; pose < 4; pose++) expect(sources.some(source => source.endsWith(`assets/character-native-v01/${key}-pose-${pose}.webp`))).toBe(true);
  }
  const broken = await articles.locator('img').evaluateAll(async images => {
    await Promise.all(images.map(async image => { image.loading = 'eager'; try { await image.decode(); } catch { /* Report below. */ } }));
    return images.filter(image => !image.complete || !image.naturalWidth).map(image => image.currentSrc || image.src);
  });
  expect(broken).toEqual([]);
  await expect(section.locator('video')).toHaveCount(0);
}

async function pinRange(page) {
  return page.locator('[data-character-native-stage]').evaluate(stage => {
    const spacer = stage.parentElement;
    return {
      start: spacer.getBoundingClientRect().top + scrollY - document.querySelector('.site-header').getBoundingClientRect().height,
      travel: parseFloat(getComputedStyle(spacer).paddingBottom),
      pinned: spacer.classList.contains('pin-spacer'),
    };
  });
}

async function stopsFor(page) {
  const stops = JSON.parse(await page.locator('[data-character-native]').getAttribute('data-native-stops'));
  expect(Object.keys(stops)).toEqual(['aksa', 'rasa', 'bumi', 'ensemble']);
  expect(stops.aksa).toBeGreaterThan(0);
  expect(stops.ensemble).toBeLessThanOrEqual(1);
  expect(stops.aksa).toBeLessThan(stops.rasa);
  expect(stops.rasa).toBeLessThan(stops.bumi);
  return stops;
}

async function scrollToProgress(page, range, progress) {
  await page.evaluate(({ range, progress }) => scrollTo(0, range.start + range.travel * progress), { range, progress });
  await expect.poll(() => page.locator('[data-character-native]').evaluate((element, target) => Math.abs(Number(element.dataset.nativeProgress) - target), progress), { timeout: 10000 }).toBeLessThan(.008);
}

async function readableDetail(page, key) {
  const article = page.locator(`[data-native-character="${key}"]`);
  const copy = article.locator('[data-native-copy]');
  await expect(copy).toBeInViewport({ ratio: 1 });
  await expect(article.locator('p')).toBeInViewport({ ratio: 1 });
  const opacity = await copy.evaluate(element => {
    let value = 1;
    for (let current = element; current; current = current.parentElement) value *= Number(getComputedStyle(current).opacity);
    return value;
  });
  expect(opacity, `${key} detail must actually be visible, not only have an offscreen/transparent DOM box`).toBeGreaterThan(.95);
  const bounds = await copy.boundingBox();
  const foreground = await article.locator('[data-native-figure="2"]').evaluate(element => {
    const box = element.getBoundingClientRect();
    let left = Math.max(0, box.left), top = Math.max(0, box.top), right = Math.min(innerWidth, box.right), bottom = Math.min(innerHeight, box.bottom);
    for (let ancestor = element.parentElement; ancestor; ancestor = ancestor.parentElement) {
      const style = getComputedStyle(ancestor), clip = ancestor.getBoundingClientRect();
      if (/(hidden|clip|scroll|auto)/.test(style.overflowX)) { left = Math.max(left, clip.left); right = Math.min(right, clip.right); }
      if (/(hidden|clip|scroll|auto)/.test(style.overflowY)) { top = Math.max(top, clip.top); bottom = Math.min(bottom, clip.bottom); }
    }
    return { x: left, y: top, width: Math.max(0, right - left), height: Math.max(0, bottom - top) };
  });
  const intersects = foreground.width > 0 && foreground.height > 0 && bounds.x < foreground.x + foreground.width && bounds.x + bounds.width > foreground.x && bounds.y < foreground.y + foreground.height && bounds.y + bounds.height > foreground.y;
  expect(intersects, `${key} body copy must remain separate from the foreground portrait`).toBe(false);
}

async function frameFitsViewport(locator) {
  const geometry = await locator.evaluate(element => {
    const box = element.getBoundingClientRect();
    return { left: box.left, top: box.top, right: box.right, bottom: box.bottom, width: document.documentElement.clientWidth, height: innerHeight };
  });
  expect(geometry.left, JSON.stringify(geometry)).toBeGreaterThanOrEqual(-1);
  expect(geometry.top, JSON.stringify(geometry)).toBeGreaterThanOrEqual(-1);
  expect(geometry.right, JSON.stringify(geometry)).toBeLessThanOrEqual(geometry.width + 1);
  expect(geometry.bottom, JSON.stringify(geometry)).toBeLessThanOrEqual(geometry.height + 1);
}

test.describe('code-built character introduction, reduced motion and scope', () => {
  test.use({ reducedMotion: 'reduce' });
  for (const alternative of alternatives) {
    for (const language of ['en', 'id']) {
      for (const width of [390, 1440]) {
        test(`${alternative} ${language} ${width}px: native poses and complete localized copy remain readable without motion`, async ({ page }) => {
          await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
          const errors = captureErrors(page);
          const requests = [];
          page.on('request', request => { if (oldCharacterFilm.test(request.url())) requests.push(request.url()); });
          await open(page, alternative, language);
          const section = page.locator('[data-character-native]');
          await expect(section).toHaveCount(1);
          await expect(section).toHaveAttribute('id', 'karakter');
          expect(await section.locator('[data-character-native-stage]').evaluate(element => element.parentElement.classList.contains('pin-spacer'))).toBe(false);
          await completeNativeCopy(page);
          for (const key of keys) {
            const article = section.locator(`[data-native-character="${key}"]`);
            await article.locator('h3').evaluate(element => scrollTo({ top: element.getBoundingClientRect().top + scrollY - document.querySelector('.site-header').getBoundingClientRect().height - 24, behavior: 'instant' }));
            await expect(article.locator('h3')).toBeInViewport({ ratio: 1 });
            await expect(article.locator('p')).toBeInViewport({ ratio: 1 });
            expect(await article.locator('[data-native-figure] img').evaluateAll(images => images.some(image => getComputedStyle(image.parentElement).display !== 'none' && image.getBoundingClientRect().height > 0))).toBe(true);
          }
          await noOverflow(page);
          expect(requests, 'The previous character MP4 must not load in the native introduction').toEqual([]);
          expect(errors).toEqual([]);
        });
      }
    }
  }

  test('C, D, E and H retain their existing character introductions', async ({ page }) => {
    for (const alternative of ['C', 'D', 'E', 'H']) {
      await open(page, alternative);
      await expect(page.locator('[data-character-native], [data-character-video-cinema]')).toHaveCount(0);
      const names = alternative === 'H' ? page.locator('[data-character-cinema] article h3') : page.locator('.characters .character-card h3');
      await expect(names).toHaveText(characterNames);
    }
  });

  for (const alternative of ['A', 'B']) {
    test(`${alternative}: native introduction retains automated WCAG A/AA checks`, async ({ page }) => {
      await open(page, alternative);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      expect(results.violations.map(({ id, impact, nodes }) => ({ id, impact, targets: nodes.map(node => node.target) }))).toEqual([]);
    });
  }
});

test.describe('code-built character introduction, eased scroll', () => {
  test.use({ reducedMotion: 'no-preference' });
  for (const alternative of alternatives) {
    for (const width of [1440, 390]) {
      test(`${alternative} ${width}px: figures interpolate smoothly, reverse through characters, and clean up on navigation`, async ({ page }) => {
        await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
        const errors = captureErrors(page);
        const requests = [];
        page.on('request', request => { if (oldCharacterFilm.test(request.url())) requests.push(request.url()); });
        await open(page, alternative);
        await completeNativeCopy(page);
        const section = page.locator('[data-character-native]');
        const range = await pinRange(page);
        const stops = await stopsFor(page);
        expect(range.pinned).toBe(true);
        expect(range.travel).toBeGreaterThan(2000);
        await scrollToProgress(page, range, stops.aksa);
        await expect(section).toHaveAttribute('data-native-active', 'aksa');
        await readableDetail(page, 'aksa');
        const samples = await section.evaluate(async (element, { range, target }) => {
          const values = [];
          const started = performance.now();
          scrollTo(0, range.start + range.travel * target);
          do {
            await new Promise(requestAnimationFrame);
            values.push(Number(element.dataset.nativeProgress));
          } while (performance.now() - started < 300);
          return values;
        }, { range, target: stops.bumi });
        expect(samples.some(value => value > stops.aksa + .01 && value < stops.bumi - .01), 'A large scroll step must render intermediate eased positions instead of jumping to its final frame').toBe(true);
        await expect.poll(() => section.evaluate((element, target) => Math.abs(Number(element.dataset.nativeProgress) - target), stops.bumi), { timeout: 10000 }).toBeLessThan(.008);
        await expect(section).toHaveAttribute('data-native-active', 'bumi');
        await readableDetail(page, 'bumi');
        await scrollToProgress(page, range, stops.rasa);
        await expect(section).toHaveAttribute('data-native-active', 'rasa');
        await readableDetail(page, 'rasa');
        await scrollToProgress(page, range, stops.aksa);
        await expect(section).toHaveAttribute('data-native-active', 'aksa');
        await scrollToProgress(page, range, stops.ensemble);
        await expect(section).toHaveAttribute('data-native-active', 'ensemble');
        await frameFitsViewport(section.locator('[data-native-ensemble]'));
        await noOverflow(page);
        if (width === 390) {
          await page.getByRole('button', { name: 'Open menu', exact: true }).click();
          await page.getByRole('dialog').getByRole('link', { name: 'Ebook', exact: true }).click();
        } else await page.getByRole('link', { name: 'Ebook', exact: true }).first().click();
        await expect(page.locator('main h1')).toHaveText('Ebook');
        await expect(page.locator('[data-character-native]')).toHaveCount(0);
        await expect(page.locator('.pin-spacer')).toHaveCount(0);
        expect(requests).toEqual([]);
        expect(errors).toEqual([]);
      });
    }
  }

  test('short landscape keeps native character names and copy unobstructed and restores review controls after leaving', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await open(page, 'G');
    const range = await pinRange(page);
    const stops = await stopsFor(page);
    await scrollToProgress(page, range, stops.bumi);
    await readableDetail(page, 'bumi');
    await scrollToProgress(page, range, stops.ensemble);
    const ensemble = page.locator('[data-native-ensemble]');
    await frameFitsViewport(ensemble);
    const names = ensemble.locator('.native-ensemble-person>span');
    await expect(names).toHaveText(characterNames);
    for (const name of await names.all()) await frameFitsViewport(name);
    const caption = ensemble.locator('.native-ensemble-caption');
    if (await caption.isVisible()) {
      const captionBox = await caption.boundingBox();
      for (const name of await names.all()) {
        const box = await name.boundingBox();
        expect(box.x < captionBox.x + captionBox.width && box.x + box.width > captionBox.x && box.y < captionBox.y + captionBox.height && box.y + box.height > captionBox.y, 'The ensemble caption must not overlap character names in short landscape').toBe(false);
      }
    }
    await expect(page.locator('.review-dock')).not.toBeVisible();
    await page.getByRole('button', { name: 'Open menu', exact: true }).click();
    await page.getByRole('dialog').getByRole('link', { name: 'Ebook', exact: true }).click();
    await expect(page.locator('main h1')).toHaveText('Ebook');
    await expect(page.locator('.review-dock')).toBeVisible();
    await expect(page.locator('.pin-spacer')).toHaveCount(0);
  });

  test('height-only changes on a touch viewport retain the existing eased pin', async ({ browser }) => {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'no-preference' });
    try {
      await page.addInitScript(() => sessionStorage.setItem('arb-welcome', 'seen'));
      await open(page, 'A');
      expect(await page.evaluate(() => matchMedia('(hover: none) and (pointer: coarse)').matches)).toBe(true);
      const range = await pinRange(page), stops = await stopsFor(page);
      await scrollToProgress(page, range, stops.rasa);
      await page.locator('[data-character-native-stage]').evaluate(el => { window.nativePinBeforeResize = el.parentElement; });
      await page.setViewportSize({ width: 390, height: 900 });
      await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 300)));
      expect(await page.locator('[data-character-native-stage]').evaluate(el => el.parentElement === window.nativePinBeforeResize)).toBe(true);
      await expect(page.locator('[data-character-native]')).toHaveAttribute('data-native-active', 'rasa');
      await readableDetail(page, 'rasa');
    } finally { await page.close(); }
  });

  test('viewport and live motion-preference changes rebuild native motion without losing readable descriptions', async ({ page }) => {
    const errors = captureErrors(page);
    await open(page, 'G');
    let range = await pinRange(page);
    let stops = await stopsFor(page);
    await scrollToProgress(page, range, stops.rasa);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect(await page.locator('[data-character-native-stage]').evaluate(element => element.parentElement.classList.contains('pin-spacer'))).toBe(false);
    await completeNativeCopy(page);
    for (const key of keys) await expect(page.locator(`[data-native-character="${key}"] p`)).toContainText(new RegExp(key, 'i'));
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    range = await pinRange(page); stops = await stopsFor(page);
    expect(range.pinned).toBe(true);
    await scrollToProgress(page, range, stops.rasa);
    await expect(page.locator('[data-character-native]')).toHaveAttribute('data-native-active', 'rasa');
    await readableDetail(page, 'rasa');
    await expect(page.locator('[data-character-native] video')).toHaveCount(0);
    await noOverflow(page);
    expect(errors).toEqual([]);
  });
});
