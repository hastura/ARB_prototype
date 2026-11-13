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
          await expect(page.locator('[data-motion-toggle], .fb-film-controls')).toHaveCount(0);
          await expect(video).not.toHaveAttribute('src');
          const characterSection = page.locator(variant === 'H' ? '[data-character-cinema]' : '[data-character-video-cinema]');
          const characters = characterSection.locator('article');
          await expect(characters).toHaveCount(3);
          await expect(characters.locator('h3')).toHaveText(['Aksa', 'Rasa', 'Bumi']);
          if (variant === 'H') await expect(characterSection).not.toHaveClass(/is-cinematic/);
          for (const key of ['aksa', 'rasa', 'bumi']) {
            await expect(characterSection.locator(`[${variant === 'H' ? 'data-character' : 'data-character-copy'}="${key}"] p`)).toContainText(key === 'aksa' ? 'Aksa' : key === 'rasa' ? 'Rasa' : 'Bumi');
          }
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

test.describe('immersive scroll cinema', () => {
  test.use({ reducedMotion: 'no-preference' });
  test('a fresh cinematic visit opens directly into scroll without a welcome gate', async ({ browser }) => {
    const fresh = await browser.newPage({ reducedMotion: 'no-preference', viewport: { width: 1440, height: 1000 } });
    try {
      await fresh.goto('./#/home/F?lang=en');
      await expect(fresh.locator('[data-feedback-home]')).toHaveAttribute('data-motion-mode', 'scroll');
      await expect(fresh.locator('.welcome, [data-motion-toggle]')).toHaveCount(0);
      expect(await fresh.locator('#app').evaluate(el => el.inert)).toBe(false);
      expect(await fresh.locator('.fb-film-visual').evaluate(el => el.getBoundingClientRect().top)).toBe(0);
    } finally { await fresh.close(); }
  });
  for (const width of [1440, 390]) {
    for (const variant of ['F', 'G', 'H']) {
      test(`${variant} ${width}px: edge-to-edge hero seeks forward and backward directly from scroll`, async ({ page }) => {
        await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
        const errors = browserErrors(page);
        await openHome(page, variant);
        await expect(page.locator('[data-motion-toggle], .fb-film-controls')).toHaveCount(0);
        const video = page.locator('video[data-scroll-video]');
        await expect.poll(() => video.evaluate(el => el.duration), { timeout: 15000 }).toBeGreaterThan(40);
        const visual = page.locator('.fb-film-visual');
        const bounds = await visual.boundingBox();
        expect(bounds.x).toBeCloseTo(0, 0);
        expect(bounds.y).toBeCloseTo(0, 0);
        expect(bounds.width).toBe(width);
        expect(bounds.height).toBe(width === 390 ? 844 : 1000);
        await expect(video).toHaveCSS('object-fit', 'cover');
        const pin = await page.locator('[data-hero-scroll]').evaluate(el => ({ top: el.getBoundingClientRect().top + scrollY, travel: parseFloat(getComputedStyle(el.querySelector('.fb-film-stage').parentElement).paddingBottom) }));
        expect(pin.top).toBeCloseTo(0, 0);
        expect(pin.travel).toBeGreaterThan(1000);
        await page.evaluate(p => scrollTo(0, p.travel * .65), pin);
        await expect.poll(() => video.evaluate(el => el.currentTime), { timeout: 10000 }).toBeGreaterThan(25);
        await expect.poll(() => video.evaluate(el => el.seeking)).toBe(false);
        const later = await video.evaluate(el => el.currentTime);
        await page.evaluate(p => scrollTo(0, p.travel * .2), pin);
        await expect.poll(() => video.evaluate(el => el.currentTime), { timeout: 10000 }).toBeLessThan(later - 5);
        expect(await video.evaluate(el => el.paused && el.muted)).toBe(true);
        const corner = await visual.boundingBox();
        expect(corner.y).toBeCloseTo(0, 0);
        await noOverflow(page);
        if (width === 390) {
          await page.getByRole('button', { name: 'Open menu', exact: true }).click();
          await page.getByRole('dialog').getByRole('link', { name: 'Ebook', exact: true }).click();
        } else await page.getByRole('link', { name: 'Ebook', exact: true }).first().click();
        await expect(page.locator('main h1')).toHaveText('Ebook');
        await expect(page.locator('video[data-scroll-video]')).toHaveCount(0);
        await expect(page.locator('body')).not.toHaveClass(/feedback-landing|film-in-view/);
        expect(errors).toEqual([]);
      });
    }
  }
  for (const [width, height] of [[1440, 1000], [768, 1000], [390, 844], [844, 390]]) {
    test(`${width}px: three character portraits travel in sequence and reverse with the reader`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      const errors = browserErrors(page);
      await openHome(page, 'H');
      const section = page.locator('[data-character-cinema]');
      await expect(section).toHaveClass(/is-cinematic/);
      const geometry = await section.locator('[data-character-stage]').evaluate(el => ({ top: el.getBoundingClientRect().top + scrollY, travel: parseFloat(getComputedStyle(el.parentElement).paddingBottom) }));
      expect(geometry.travel).toBeGreaterThan(2000);
      for (const [fraction, key] of [[0, 'aksa'], [.5, 'rasa'], [1, 'bumi'], [.5, 'rasa'], [0, 'aksa']]) {
        await page.evaluate(({ g, f }) => scrollTo(0, g.top + g.travel * f), { g: geometry, f: fraction });
        await expect(section).toHaveAttribute('data-character-active', key);
        await expect.poll(() => section.locator(`[data-character="${key}"]`).evaluate(el => Math.abs(el.getBoundingClientRect().x)), { timeout: 7000 }).toBeLessThan(2);
        const portrait = section.locator(`[data-character="${key}"] .cinema-person`);
        await expect(portrait).toBeVisible();
        const copy = section.locator(`[data-character="${key}"] .cinema-copy`);
        await expect(copy).toBeInViewport({ ratio: 1 });
        const name = section.locator(`[data-character="${key}"] h3`);
        await expect(name).toBeInViewport({ ratio: 1 });
        const copyBox = await copy.boundingBox(), portraitBox = await portrait.boundingBox(), nameBox = await name.boundingBox();
        const intersects = (a, b) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
        expect(intersects(copyBox, portraitBox), 'Character copy must not overlap the foreground portrait').toBe(false);
        expect(intersects(copyBox, nameBox), 'Character body must be separate from its large name').toBe(false);
      }
      await noOverflow(page);
      expect(errors).toEqual([]);
    });
  }
  test('live reduced-motion and viewport changes reset films and keep all three characters readable', async ({ page }) => {
    await openHome(page, 'H');
    const video = page.locator('video[data-scroll-video]');
    const section = page.locator('[data-character-cinema]');
    await expect.poll(() => video.evaluate(el => el.duration)).toBeGreaterThan(40);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('[data-feedback-home]')).toHaveAttribute('data-motion-mode', 'scroll');
    await expect(section).toHaveClass(/is-cinematic/);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(video).not.toHaveAttribute('src');
    await expect(section).not.toHaveClass(/is-cinematic/);
    await expect(section.locator('h3')).toHaveText(['Aksa', 'Rasa', 'Bumi']);
    for (const key of ['aksa', 'rasa', 'bumi']) {
      const article = section.locator(`[data-character="${key}"]`);
      await article.scrollIntoViewIfNeeded();
      await expect(article.locator('.cinema-copy')).toBeInViewport({ ratio: 1 });
    }
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect(section).toHaveClass(/is-cinematic/);
    await expect.poll(() => video.evaluate(el => el.duration)).toBeGreaterThan(40);
    await noOverflow(page);
  });
});
