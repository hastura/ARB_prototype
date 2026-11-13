import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const sourceMedia = {
  F: /living-room\.mp4$/,
  G: /amber-cinematic\.mp4$/,
  H: /amber-collage\.mp4$/,
};
const languages = {
  en: { home: /Meet them/, about: 'About us', ebook: 'Ebook', reflection: 'Reflection', pending: 'Official link not available yet.' },
  id: { home: /Kenali mereka/, about: 'Tentang kami', ebook: 'Ebook', reflection: 'Renungan', pending: 'Tautan resmi belum tersedia.' },
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('arb-welcome', 'seen'));
});

function browserErrors(page) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  return errors;
}

async function openHome(page, variant, language = 'en') {
  await page.goto(`./#/home/${variant}?lang=${language}`);
  await expect(page.locator('main h1')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', language);
}

async function noOverflow(page) {
  const size = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) }));
  expect(size.content, JSON.stringify(size)).toBeLessThanOrEqual(size.viewport + 1);
}

async function loadedImages(page) {
  const broken = await page.locator('main img').evaluateAll(async images => {
    await Promise.all(images.map(async image => { image.loading = 'eager'; try { await image.decode(); } catch { /* Report URL below. */ } }));
    return images.filter(image => !image.complete || !image.naturalWidth).map(image => image.currentSrc || image.src);
  });
  expect(broken).toEqual([]);
}

test.describe('client feedback is applied to the existing prototype', () => {
  test.use({ reducedMotion: 'reduce' });

  for (const [language, labels] of Object.entries(languages)) {
    test(`${language}: only the short-term navigation is exposed, with no removed brand/disclosure copy`, async ({ page }) => {
      await openHome(page, 'E', language);
      const headerNav = page.locator('.site-header nav');
      await expect(headerNav.getByRole('link')).toHaveText([labels.about, labels.ebook, labels.reflection]);
      await expect(page.locator('.site-header .brand small')).toHaveCount(0);
      await expect(page.locator('body')).not.toContainText(/A SPACE FOR UNDERSTANDING|SEBUAH RUANG UNTUK MEMAHAMI|The story is real\.|The identities are AI\.|Kisahnya nyata\.|Identitasnya AI\./);
      await expect(page.locator('footer')).not.toContainText(/Room for understanding to grow|Part of the world of Mantra Djiwa|Ruang untuk terus memahami|Bagian dari dunia Mantra Djiwa/);
      await expect(headerNav).not.toContainText(/Conversations|Ngobrol|Community|Environmental|Masterpiece/);
      await page.setViewportSize({ width: 390, height: 844 });
      await page.getByRole('button', { name: language === 'en' ? 'Open menu' : 'Buka menu', exact: true }).click();
      const menu = page.getByRole('dialog');
      await expect(menu.locator('nav').getByRole('link')).toHaveText([labels.about, labels.ebook, labels.reflection]);
      await page.keyboard.press('Escape');
      await expect(menu).not.toBeVisible();
    });

    test(`${language}: footer social channels explain missing destinations without invented URLs`, async ({ page }) => {
      await openHome(page, 'E', language);
      for (const channel of ['instagram', 'youtube', 'spotify', 'tiktok']) {
        const trigger = page.locator(`footer [data-social="${channel}"]`);
        await expect(trigger).toBeVisible();
        await expect(trigger).not.toHaveAttribute('href', /^https?:/);
        await trigger.click();
        const dialog = page.getByRole('dialog', { name: labels.pending, exact: true });
        await expect(dialog).toBeVisible();
        await expect(dialog).toContainText(new RegExp(channel === 'instagram' ? 'Instagram' : channel === 'youtube' ? 'YouTube' : channel === 'spotify' ? 'Spotify' : 'TikTok'));
        await expect(dialog.locator('a[href^="http"]')).toHaveCount(0);
        await page.keyboard.press('Escape');
        await expect(dialog).not.toBeVisible();
        await expect(trigger).toBeFocused();
      }
    });
  }

  test('English intro uses the exact client wording and presents the question label before its text', async ({ page }) => {
    await openHome(page, 'E');
    await expect(page.locator('main')).toContainText('Aksa remembers what happened. Rasa listens for the questions beneath it. Bumi recognizes the traces it leaves in the body. As friends, they bring different perspectives and keep learning from every experiences.');
    await expect(page.locator('main')).not.toContainText('keep learning from the same experience');
    const question = page.locator('.question');
    await expect(question).toContainText('A QUESTION TO TAKE WITH YOU');
    expect(await question.evaluate(element => {
      const label = element.querySelector('.eyebrow');
      const text = element.querySelector('p');
      return Boolean(label && text && (label.compareDocumentPosition(text) & Node.DOCUMENT_POSITION_FOLLOWING));
    })).toBe(true);
  });

  test('catalog and detail float the book directly over the web canvas', async ({ page }) => {
    for (const route of ['/ebook', '/ebook/the-art-of-reflecting']) {
      await page.goto(`./#${route}?lang=en`);
      await expect(page.locator('main h1')).toBeVisible();
      const stage = page.locator('[data-book-stage]').first();
      await expect(stage).toBeVisible();
      await expect(stage).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
      await expect(page.locator('.catalog-feature').first()).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    }
  });

  for (const language of ['en', 'id']) {
    test(`${language}: opening the temporary book exposes an honest pending excerpt and closing restores rotation`, async ({ page }) => {
      await page.goto(`./#/ebook?lang=${language}`);
      await expect(page.locator('main h1')).toBeVisible();
      const stage = page.locator('[data-book-stage]').first();
      const open = stage.locator('[data-book-open]');
      const rotate = stage.locator('[data-book-turn]');
      const note = stage.locator('.book-open-note');
      await expect(open).toHaveText(language === 'en' ? 'Open book' : 'Buka buku');
      await expect(open).toHaveAttribute('aria-expanded', 'false');
      await expect(note).not.toBeVisible();
      await open.focus();
      await page.keyboard.press('Enter');
      await expect(open).toHaveAttribute('aria-expanded', 'true');
      await expect(open).toHaveText(language === 'en' ? 'Close book' : 'Tutup buku');
      await expect(note).toBeVisible();
      await expect(note).toContainText(language === 'en' ? 'The excerpt is not available yet.' : 'Cuplikan belum tersedia.');
      await expect(rotate).toBeDisabled();
      await expect(stage.locator('.book-inner')).not.toContainText(/Chapter|Bab\s+\d|Once upon|Pada suatu/);
      await page.keyboard.press('Enter');
      await expect(open).toHaveAttribute('aria-expanded', 'false');
      await expect(note).not.toBeVisible();
      await expect(rotate).toBeEnabled();
      await expect(open).toBeFocused();
    });
  }

  test('review hub exposes all eight alternatives and directly opens each new one', async ({ page }) => {
    await page.goto('./#/preview?lang=en');
    await expect(page.locator('.variant-tile')).toHaveCount(8);
    await expect(page.locator('#variant-select option')).toHaveCount(8);
    for (const width of [1440, 768, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      const cardWidths = await page.locator('.variant-tile').evaluateAll(cards => ({
        reference: cards[3].getBoundingClientRect().width,
        last: cards.at(-1).getBoundingClientRect().width,
      }));
      expect(Math.abs(cardWidths.last - cardWidths.reference), `The final legacy alternative should remain comparable in size at ${width}px`).toBeLessThanOrEqual(1);
      await noOverflow(page);
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    for (const variant of ['F', 'G', 'H']) {
      const thumbnail = page.locator(`.variant-thumbnail[href*="/home/${variant}"]`);
      await expect(thumbnail).toHaveCount(1);
      await thumbnail.click();
      await expect(page).toHaveURL(new RegExp(`#/home/${variant}\\?`));
      await expect(page.locator('.feedback-hero video[data-scroll-video]')).toHaveCount(1);
      await page.goBack();
      await expect(page.locator('.variant-tile')).toHaveCount(8);
    }
  });
});

test.describe('three source-based cinematic alternatives', () => {
  test.use({ reducedMotion: 'reduce' });
  for (const width of [320, 390, 768, 1440]) {
    for (const language of ['en', 'id']) {
      for (const variant of ['F', 'G', 'H']) {
        test(`${variant} ${language} ${width}px: source media, complete copy, static reduced motion and no overflow`, async ({ page }) => {
          const errors = browserErrors(page);
          await page.setViewportSize({ width, height: 1000 });
          await openHome(page, variant, language);
          await expect(page.locator('main h1')).toHaveCount(1);
          await expect(page.locator('main h1')).toHaveText(languages[language].home);
          const video = page.locator('.feedback-hero video[data-scroll-video]');
          await expect(video).toHaveCount(1);
          const media = await video.evaluate(element => ({
            source: element.getAttribute('src') || element.querySelector('source')?.getAttribute('src') || element.dataset.src || '',
            poster: element.poster,
            muted: element.muted,
            paused: element.paused,
            time: element.currentTime,
          }));
          expect(media.source).toMatch(sourceMedia[variant]);
          expect(media.poster).toMatch(/\.webp$/);
          expect(media.muted).toBe(true);
          expect(media.paused).toBe(true);
          await noOverflow(page);
          await loadedImages(page);
          if (width === 390) {
            const stage = page.locator('[data-book-stage]').first();
            const open = stage.locator('[data-book-open]');
            await open.click();
            await expect(open).toHaveAttribute('aria-expanded', 'true');
            await expect(stage.locator('.book-open-note')).toBeVisible();
            const noteGeometry = await stage.evaluate(element => ({
              noteTop: element.querySelector('.book-open-note').getBoundingClientRect().top,
              actionsBottom: element.querySelector('.book-actions').getBoundingClientRect().bottom,
            }));
            expect(noteGeometry.noteTop, 'The pending excerpt must appear below the book actions without colliding with them').toBeGreaterThanOrEqual(noteGeometry.actionsBottom + 4);
            await open.click();
            await expect(open).toHaveAttribute('aria-expanded', 'false');
          }
          await page.locator('footer').scrollIntoViewIfNeeded();
          await noOverflow(page);
          expect(await video.evaluate(element => element.paused)).toBe(true);
          expect(await video.evaluate(element => element.currentTime)).toBeCloseTo(media.time, 1);
          await expect(page.locator('main')).not.toContainText(/The story is real\.|The identities are AI\.|keep learning from the same experience/);
          expect(errors).toEqual([]);
        });
      }
    }
  }

  for (const variant of ['F', 'G', 'H']) {
    test(`${variant}: keyboard book interaction and detail journey remain available`, async ({ page }) => {
      await openHome(page, variant);
      const rotate = page.getByRole('button', { name: 'Rotate book', exact: true }).first();
      await rotate.scrollIntoViewIfNeeded();
      await expect(rotate).toHaveAttribute('aria-pressed', 'false');
      await rotate.focus();
      await page.keyboard.press('Enter');
      await expect(rotate).toHaveAttribute('aria-pressed', 'true');
      await page.keyboard.press('Enter');
      await expect(rotate).toHaveAttribute('aria-pressed', 'false');
      const stage = rotate.locator('xpath=ancestor::*[@data-book-stage]');
      const open = stage.locator('[data-book-open]');
      await open.focus();
      await page.keyboard.press('Enter');
      await expect(open).toHaveAttribute('aria-expanded', 'true');
      await expect(stage.locator('.book-open-note')).toBeVisible();
      await expect(stage.locator('.book-open-note')).toContainText('The excerpt is not available yet.');
      await expect(rotate).toBeDisabled();
      await page.keyboard.press('Enter');
      await expect(open).toHaveAttribute('aria-expanded', 'false');
      await expect(stage.locator('.book-open-note')).not.toBeVisible();
      await expect(rotate).toBeEnabled();
      await page.getByRole('link', { name: 'Discover the story', exact: true }).first().click();
      await expect(page).toHaveURL(/#\/ebook\/the-art-of-reflecting/);
      await expect(page.locator('main h1')).toHaveText(/The Art of\s+Reflecting/);
      expect(new URLSearchParams(page.url().split('?').at(-1)).get('v')).toBe(variant);
    });

    test(`${variant}: automated WCAG A/AA checks`, async ({ page }) => {
      await openHome(page, variant);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      expect(results.violations.map(({ id, impact, nodes }) => ({ id, impact, targets: nodes.map(node => node.target) }))).toEqual([]);
    });
  }
});

test.describe('real scroll-controlled media', () => {
  test.use({ reducedMotion: 'no-preference' });
  for (const variant of ['F', 'G', 'H']) {
    test(`${variant}: desktop scroll seeks a paused source video, pause freezes it and resume catches up`, async ({ page }) => {
      const errors = browserErrors(page);
      await openHome(page, variant);
      const video = page.locator('.feedback-hero video[data-scroll-video]');
      await expect.poll(() => video.evaluate(element => element.duration), { timeout: 15_000 }).toBeGreaterThan(1);
      const pinGeometry = await page.locator('[data-hero-scroll]').evaluate(element => {
        const stage = element.querySelector('.fb-film-stage');
        const spacer = stage.parentElement;
        return {
          top: element.getBoundingClientRect().top + window.scrollY,
          travel: Number.parseFloat(getComputedStyle(spacer).paddingBottom),
          pinned: spacer.classList.contains('pin-spacer'),
        };
      });
      expect(pinGeometry.pinned, 'Desktop scroll media must have an active pin interval').toBe(true);
      expect(pinGeometry.travel).toBeGreaterThan(1000);
      const firstPosition = pinGeometry.top + pinGeometry.travel * 0.2;
      const secondPosition = pinGeometry.top + pinGeometry.travel * 0.55;
      const before = await video.evaluate(element => element.currentTime);
      // The hero height includes GSAP's added pin spacing. Using a fraction of
      // that expanded height can scroll beyond the film's end before pausing.
      // Two interior points in the actual pin interval leave room to catch up.
      await page.evaluate(position => window.scrollTo(0, position), firstPosition);
      await expect.poll(() => video.evaluate(element => element.currentTime), { timeout: 10_000 }).toBeGreaterThan(before + 0.1);
      expect(await video.evaluate(element => element.paused)).toBe(true);
      const toggle = page.locator('[data-motion-toggle]');
      const clickVisibleToggle = async () => {
        await expect(toggle).toBeInViewport({ ratio: 1 });
        const bounds = await toggle.boundingBox();
        expect(bounds).not.toBeNull();
        await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
      };
      await expect(toggle).toHaveAttribute('aria-pressed', 'true');
      await expect(toggle).toHaveText('Pause scroll motion');
      await clickVisibleToggle();
      await expect(toggle).toHaveAttribute('aria-pressed', 'false');
      await expect(toggle).toHaveText('Resume scroll motion');
      await expect.poll(() => video.evaluate(element => element.seeking)).toBe(false);
      const frozen = await video.evaluate(element => element.currentTime);
      await page.evaluate(position => window.scrollTo(0, position), secondPosition);
      const drift = await video.evaluate(async element => {
        const start = performance.now(), initial = element.currentTime;
        let maximum = 0;
        do {
          maximum = Math.max(maximum, Math.abs(element.currentTime - initial));
          await new Promise(requestAnimationFrame);
        } while (performance.now() - start < 400);
        return maximum;
      });
      expect(drift, 'Paused scroll motion must not keep seeking as the reader scrolls').toBeLessThan(0.05);
      await clickVisibleToggle();
      await expect(toggle).toHaveAttribute('aria-pressed', 'true');
      await expect(toggle).toHaveText('Pause scroll motion');
      await expect.poll(() => video.evaluate(element => element.currentTime), { timeout: 10_000 }).toBeGreaterThan(frozen + 0.1);
      await page.getByRole('link', { name: 'Ebook', exact: true }).first().click();
      await expect(page.locator('main h1')).toHaveText('Ebook');
      await expect(page.locator('video[data-scroll-video]')).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'EN', exact: true }).first()).toBeVisible();
      await noOverflow(page);
      expect(errors).toEqual([]);
    });
  }

  test('mobile film playback is a muted opt-in and can be paused', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const errors = browserErrors(page);
    await openHome(page, 'F');
    const video = page.locator('.feedback-hero video[data-scroll-video]');
    const toggle = page.locator('[data-motion-toggle]');
    await expect(toggle).toBeEnabled();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect(toggle).toHaveText('Play film');
    expect(await video.evaluate(element => element.paused)).toBe(true);
    expect(await video.getAttribute('src')).toBeNull();
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(toggle).toHaveText('Pause film');
    await expect.poll(() => video.evaluate(element => element.paused)).toBe(false);
    expect(await video.evaluate(element => element.muted)).toBe(true);
    await expect.poll(() => video.evaluate(element => element.currentTime), { timeout: 10_000 }).toBeGreaterThan(0.15);
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect(toggle).toHaveText('Play film');
    expect(await video.evaluate(element => element.paused)).toBe(true);
    await noOverflow(page);
    expect(errors).toEqual([]);
  });
});
