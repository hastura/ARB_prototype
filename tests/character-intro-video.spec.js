import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const alternatives = ['A', 'B', 'F', 'G'];
const characterNames = ['Aksa', 'Rasa', 'Bumi'];
const sourcePattern = /assets\/character-intro-v01\/character-introduction\.mp4$/;

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

async function copiesAreReadable(page) {
  const articles = page.locator('[data-character-video-cinema] article[data-character-copy]');
  await expect(articles).toHaveCount(3);
  await expect(articles.locator('h3')).toHaveText(characterNames);
  for (const key of ['aksa', 'rasa', 'bumi']) {
    const article = page.locator(`[data-character-copy="${key}"]`);
    await expect(article.locator('p')).toContainText(new RegExp(key, 'i'));
    await expect(article.locator('p')).not.toHaveText('');
  }
  await expect(articles.locator('img')).toHaveCount(3);
  const broken = await articles.locator('img').evaluateAll(async images => {
    await Promise.all(images.map(async image => { image.loading = 'eager'; try { await image.decode(); } catch { /* Report below. */ } }));
    return images.filter(image => !image.complete || !image.naturalWidth).map(image => image.currentSrc || image.src);
  });
  expect(broken).toEqual([]);
}

async function pinRange(page) {
  return page.locator('[data-character-video-stage]').evaluate(stage => {
    const spacer = stage.parentElement;
    return {
      start: spacer.getBoundingClientRect().top + scrollY - document.querySelector('.site-header').getBoundingClientRect().height,
      travel: parseFloat(getComputedStyle(spacer).paddingBottom),
      pinned: spacer.classList.contains('pin-spacer'),
    };
  });
}

test.describe('supplied character film, reduced motion and scope', () => {
  test.use({ reducedMotion: 'reduce' });
  for (const alternative of alternatives) {
    for (const language of ['en', 'id']) {
      for (const width of [390, 1440]) {
        test(`${alternative} ${language} ${width}px: exact film mapping, static fallback and complete character copy`, async ({ page }) => {
          await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
          const errors = captureErrors(page);
          await open(page, alternative, language);
          const section = page.locator('[data-character-video-cinema]');
          await expect(section).toHaveCount(1);
          await expect(section).toHaveAttribute('id', 'karakter');
          const video = section.locator('video[data-character-video]');
          await expect(video).toHaveCount(1);
          await expect(video).toHaveAttribute('data-src', sourcePattern);
          await expect(video).not.toHaveAttribute('src');
          expect(await video.evaluate(element => element.paused && element.muted && !element.controls)).toBe(true);
          expect(await video.evaluate(element => element.poster)).toMatch(/assets\/character-intro-v01\/.+\.webp$/);
          await expect(section.locator('[data-character-video-stage] button')).toHaveCount(0);
          await copiesAreReadable(page);
          for (const key of ['aksa', 'rasa', 'bumi']) {
            const article = section.locator(`[data-character-copy="${key}"]`);
            await article.evaluate(element => scrollTo({ top: element.getBoundingClientRect().top + scrollY - document.querySelector('.site-header').getBoundingClientRect().height - 24, behavior: 'instant' }));
            await expect(article.locator('h3')).toBeInViewport({ ratio: 1 });
            await expect(article.locator('p')).toBeInViewport({ ratio: 1 });
          }
          await noOverflow(page);
          expect(errors).toEqual([]);
        });
      }
    }
  }

  test('C, D, E and H retain their existing character introductions', async ({ page }) => {
    for (const alternative of ['C', 'D', 'E', 'H']) {
      await open(page, alternative);
      await expect(page.locator('[data-character-video-cinema], video[data-character-video]')).toHaveCount(0);
      const names = alternative === 'H' ? page.locator('[data-character-cinema] article h3') : page.locator('.characters .character-card h3');
      await expect(names).toHaveText(characterNames);
    }
  });

  for (const alternative of ['A', 'B']) {
    test(`${alternative}: new film introduction retains automated WCAG A/AA checks`, async ({ page }) => {
      await open(page, alternative);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      expect(results.violations.map(({ id, impact, nodes }) => ({ id, impact, targets: nodes.map(node => node.target) }))).toEqual([]);
    });
  }
});

test.describe('supplied character film, actual scroll transport', () => {
  test.use({ reducedMotion: 'no-preference' });
  for (const alternative of alternatives) {
    for (const width of [1440, 390]) {
      test(`${alternative} ${width}px: scrolling seeks the supplied paused film forward and backward and cleans up on navigation`, async ({ page }) => {
        await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
        const errors = captureErrors(page);
        await open(page, alternative);
        const video = page.locator('video[data-character-video]');
        const oldVideo = await video.elementHandle();
        await expect(page.locator('[data-character-video-stage] button')).toHaveCount(0);
        const range = await pinRange(page);
        expect(range.pinned).toBe(true);
        expect(range.travel).toBeGreaterThan(1000);
        await page.evaluate(range => scrollTo(0, range.start + range.travel * .2), range);
        await expect.poll(() => video.evaluate(element => element.duration), { timeout: 15000 }).toBeGreaterThan(1);
        await expect(video).toHaveAttribute('src', sourcePattern);
        const duration = await video.evaluate(element => element.duration);
        await page.evaluate(range => scrollTo(0, range.start + range.travel * .75), range);
        await expect.poll(() => video.evaluate(element => element.currentTime), { timeout: 10000 }).toBeGreaterThan(duration * .55);
        await expect.poll(() => video.evaluate(element => element.seeking)).toBe(false);
        const later = await video.evaluate(element => element.currentTime);
        await page.evaluate(range => scrollTo(0, range.start + range.travel * .2), range);
        await expect.poll(() => video.evaluate(element => element.currentTime), { timeout: 10000 }).toBeLessThan(later - duration * .2);
        expect(await video.evaluate(element => element.paused && element.muted && !element.controls)).toBe(true);
        expect(await video.evaluate(element => element.getVideoPlaybackQuality().totalVideoFrames)).toBeGreaterThan(0);
        await noOverflow(page);
        if (width === 390) {
          await page.getByRole('button', { name: 'Open menu', exact: true }).click();
          await page.getByRole('dialog').getByRole('link', { name: 'Ebook', exact: true }).click();
        } else await page.getByRole('link', { name: 'Ebook', exact: true }).first().click();
        await expect(page.locator('main h1')).toHaveText('Ebook');
        await expect(page.locator('[data-character-video-cinema], video[data-character-video]')).toHaveCount(0);
        expect(await oldVideo.evaluate(element => element.paused && !element.getAttribute('src'))).toBe(true);
        expect(errors).toEqual([]);
      });
    }
  }

  test('short landscape keeps embedded film names unobstructed and restores review controls after leaving', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await open(page, 'G');
    const video = page.locator('[data-character-video]');
    const range = await pinRange(page);
    await page.evaluate(range => scrollTo(0, range.start + range.travel * .96), range);
    await expect.poll(() => video.evaluate(element => element.currentTime), { timeout: 15000 }).toBeGreaterThan(37);
    await expect(page.locator('.review-dock')).not.toBeVisible();
    await expect(page.locator('.character-video-cue')).not.toBeVisible();
    await expect(page.locator('.character-video-visual')).toBeInViewport({ ratio: 1 });
    await page.getByRole('button', { name: 'Open menu', exact: true }).click();
    await page.getByRole('dialog').getByRole('link', { name: 'Ebook', exact: true }).click();
    await expect(page.locator('main h1')).toHaveText('Ebook');
    await expect(page.locator('.review-dock')).toBeVisible();
    await expect(page.locator('body')).not.toHaveClass(/character-video-in-view/);
  });

  test('viewport and live motion-preference changes unload/rebuild the character film without losing descriptions', async ({ page }) => {
    const errors = captureErrors(page);
    await open(page, 'G');
    const section = page.locator('[data-character-video-cinema]');
    const video = section.locator('video[data-character-video]');
    let range = await pinRange(page);
    await page.evaluate(range => scrollTo(0, range.start + range.travel * .5), range);
    await expect.poll(() => video.evaluate(element => element.duration), { timeout: 15000 }).toBeGreaterThan(1);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(video).not.toHaveAttribute('src');
    expect(await section.locator('[data-character-video-stage]').evaluate(element => element.parentElement.classList.contains('pin-spacer'))).toBe(false);
    await copiesAreReadable(page);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    range = await pinRange(page);
    expect(range.pinned).toBe(true);
    await page.evaluate(range => scrollTo(0, range.start + range.travel * .5), range);
    await expect.poll(() => video.evaluate(element => element.duration), { timeout: 15000 }).toBeGreaterThan(1);
    expect(await video.evaluate(element => element.paused && element.muted)).toBe(true);
    await noOverflow(page);
    expect(errors).toEqual([]);
  });
});
