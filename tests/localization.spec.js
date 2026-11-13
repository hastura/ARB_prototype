import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const englishScreens = [
  ...['A', 'B', 'C', 'D', 'E'].map((alternative) => ({
    route: `/home/${alternative}`, title: /Meet them\.\s*Discover their story\./,
  })),
  { route: '/ebook', title: /^Ebook$/ },
  { route: '/ebook/the-art-of-reflecting', title: /The Art of\s+Reflecting/ },
  { route: '/renungan', title: /^Reflection$/ },
  { route: '/ngobrol', title: /^Conversations$/ },
  { route: '/tentang-bantuan', title: /^About us$/i },
];

const indonesianLeaks = /Kenali mereka\.|Temukan kisahnya\.|Informasi ebook belum tersedia|Belum ada video yang ditampilkan|Belum ada percakapan yang ditampilkan|Kanal bantuan resmi belum ditampilkan|Bagian dari dunia Mantra Djiwa|Kembali ke atas|Jelajahi Ebook/;

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('arb-welcome', 'seen'));
});

function captureErrors(page) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

async function expectLanguage(page, code) {
  await expect(page.locator('html')).toHaveAttribute('lang', code);
  await expect(page.getByRole('button', { name: code.toUpperCase(), exact: true }).first()).toHaveAttribute('aria-pressed', 'true');
}

async function noOverflow(page) {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
  }));
  expect(dimensions.content, JSON.stringify(dimensions)).toBeLessThanOrEqual(dimensions.viewport + 1);
}

async function loadedArt(page) {
  const broken = await page.locator('main img').evaluateAll(async (images) => {
    await Promise.all(images.map(async (image) => {
      image.loading = 'eager';
      try { await image.decode(); } catch { /* report the URL below */ }
    }));
    return images.filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.currentSrc || image.src);
  });
  expect(broken).toEqual([]);
}

async function openEnglish(page, route) {
  await page.goto(`./#${route}${route.includes('?') ? '&' : '?'}lang=en`);
  await expect(page.locator('main h1')).toBeVisible();
  await expectLanguage(page, 'en');
  await page.evaluate(() => document.fonts.ready);
}

test.describe('English source screens', () => {
  test.use({ reducedMotion: 'reduce' });
  for (const width of [320, 1440]) {
    for (const screen of englishScreens) {
      test(`EN ${width}px ${screen.route}: translated content and responsive artwork`, async ({ page }) => {
        const errors = captureErrors(page);
        await page.setViewportSize({ width, height: 1000 });
        await openEnglish(page, screen.route);
        await expect(page.locator('main h1')).toHaveText(screen.title);
        await expect(page.locator('body')).not.toContainText(indonesianLeaks);
        await noOverflow(page);
        await loadedArt(page);
        await page.locator('footer').scrollIntoViewIfNeeded();
        await noOverflow(page);
        expect(errors).toEqual([]);
      });
    }
  }
});

test.describe('locale journeys and controls', () => {
  test.use({ reducedMotion: 'reduce' });

  test('a fresh visit defaults to English, including hub and mobile menu', async ({ page }) => {
    await page.goto('./#/preview');
    await expectLanguage(page, 'en');
    await expect(page.getByRole('group', { name: 'Language', exact: true }).first()).toBeVisible();
    await expect(page.locator('main')).not.toContainText(indonesianLeaks);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('./#/home/E');
    await expect(page.locator('main h1')).toHaveText(/Meet them/);
    await page.getByRole('button', { name: 'Open menu', exact: true }).click();
    const menu = page.getByRole('dialog');
    await expect(menu).toBeVisible();
    await expect(menu.getByRole('button', { name: 'Close menu', exact: true })).toBeVisible();
    await expect(menu.getByRole('link', { name: 'About us', exact: true })).toBeVisible();
    await expect(menu.getByRole('link', { name: 'Ebook', exact: true })).toBeVisible();
    await menu.getByRole('link', { name: 'Reflection', exact: true }).click();
    await expect(page.locator('main h1')).toHaveText('Reflection');
    await expectLanguage(page, 'en');
  });

  test('switching ID and EN preserves the selected alternative and a usable scroll position', async ({ page }) => {
    const errors = captureErrors(page);
    const clickVisibleLanguageButton = async (code) => {
      const button = page.getByRole('button', { name: code, exact: true }).first();
      await expect(button).toBeInViewport({ ratio: 1 });
      const bounds = await button.boundingBox();
      expect(bounds).not.toBeNull();
      // A real pointer click leaves this visible sticky header in place. Locator
      // click's automatic scrollIntoView can itself scroll the page before the
      // application receives the event, invalidating a preservation assertion.
      await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    };
    await openEnglish(page, '/home/C');
    await page.getByRole('link', { name: 'Meet them', exact: true }).click();
    await expect(page.locator('#karakter')).toBeInViewport();
    const initialScroll = await page.evaluate(() => window.scrollY);
    await clickVisibleLanguageButton('ID');
    await expectLanguage(page, 'id');
    await expect(page).toHaveURL(/#\/home\/C\?/);
    expect(new URLSearchParams((await page.url()).split('?').at(-1)).get('lang')).toBe('id');
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeCloseTo(initialScroll, 0);
    await expect(page.locator('#karakter')).toBeInViewport();
    await expect(page.getByRole('group', { name: 'Bahasa', exact: true }).first()).toBeVisible();
    await clickVisibleLanguageButton('EN');
    await expectLanguage(page, 'en');
    await expect(page).toHaveURL(/#\/home\/C\?/);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeCloseTo(initialScroll, 0);
    await expect(page.locator('#karakter')).toBeInViewport();
    await page.getByRole('link', { name: 'Ebook', exact: true }).first().click();
    await expect(page.locator('main h1')).toHaveText('Ebook');
    await expect(page).toHaveURL(/lang=en/);
    expect(new URLSearchParams((await page.url()).split('?').at(-1)).get('v')).toBe('C');
    await noOverflow(page);
    expect(errors).toEqual([]);
  });

  test('selected language persists through navigation, refresh and another tab without a locale URL', async ({ page, context }) => {
    await openEnglish(page, '/home/B');
    await page.getByRole('button', { name: 'ID', exact: true }).first().click();
    await expectLanguage(page, 'id');
    await page.getByRole('link', { name: 'Ebook', exact: true }).first().click();
    await expect(page.locator('main h1')).toHaveText('Ebook');
    await expect(page).toHaveURL(/lang=id/);
    await page.reload();
    await expectLanguage(page, 'id');
    expect(await page.evaluate(() => localStorage.getItem('arb-language'))).toBe('id');
    const anotherTab = await context.newPage();
    await anotherTab.goto('./#/renungan');
    await expectLanguage(anotherTab, 'id');
    await expect(anotherTab.locator('main h1')).toHaveText('Renungan');
    await anotherTab.getByRole('button', { name: 'EN', exact: true }).first().click();
    await expectLanguage(anotherTab, 'en');
    await anotherTab.goto('./#/ngobrol');
    await expect(anotherTab.locator('main h1')).toHaveText('Conversations');
    await anotherTab.reload();
    await expectLanguage(anotherTab, 'en');
    await anotherTab.close();
  });

  test('an explicit locale URL overrides the saved preference in both directions', async ({ page }) => {
    await openEnglish(page, '/home/E');
    await page.evaluate(() => localStorage.setItem('arb-language', 'id'));
    await page.goto('./#/renungan?lang=en');
    await expectLanguage(page, 'en');
    await expect(page.locator('main h1')).toHaveText('Reflection');
    await page.evaluate(() => localStorage.setItem('arb-language', 'en'));
    await page.goto('./#/ngobrol?lang=id');
    await expectLanguage(page, 'id');
    await expect(page.locator('main h1')).toHaveText('Ngobrol');
  });

  test('the interactive review iframe follows parent locale through alternative and page controls', async ({ page }) => {
    const errors = captureErrors(page);
    await openEnglish(page, '/preview');
    const iframe = page.locator('iframe');
    await iframe.scrollIntoViewIfNeeded();
    await expect(iframe).toHaveAttribute('title', 'Interactive preview');
    const frame = page.frameLocator('iframe');
    await expect(frame.locator('html')).toHaveAttribute('lang', 'en');
    await expect(iframe).toHaveAttribute('src', /lang=en/);
    await page.locator('#variant-select').selectOption('C');
    await page.locator('#page-select').selectOption('/renungan');
    await expect(frame.locator('main h1')).toHaveText('Reflection');
    await expect(frame.locator('html')).toHaveAttribute('lang', 'en');
    await expect(iframe).toHaveAttribute('src', /lang=en/);
    await page.getByRole('button', { name: 'ID', exact: true }).first().click();
    await expectLanguage(page, 'id');
    await page.locator('iframe').scrollIntoViewIfNeeded();
    await expect(frame.locator('html')).toHaveAttribute('lang', 'id');
    await page.locator('#variant-select').selectOption('D');
    await page.locator('#page-select').selectOption('/tentang-bantuan');
    await expect(frame.locator('main h1')).toHaveText('Tentang kami');
    await expect(page.locator('iframe')).toHaveAttribute('src', /lang=id/);
    expect(errors).toEqual([]);
  });

  test('all eight gallery thumbnails use live localized preview text in both languages', async ({ page }) => {
    await openEnglish(page, '/preview');
    const thumbnails = page.locator('.variant-thumbnail');
    await expect(thumbnails).toHaveCount(8);
    await expect(thumbnails.locator('img[src*="preview-"]')).toHaveCount(0);
    for (const thumbnail of await thumbnails.all()) {
      await expect(thumbnail).toContainText(/Meet them\.\s*Discover their story\./);
      await expect(thumbnail).not.toContainText(/Kenali mereka\.|Temukan kisahnya\./);
    }
    await page.getByRole('button', { name: 'ID', exact: true }).first().click();
    await expectLanguage(page, 'id');
    for (const thumbnail of await thumbnails.all()) {
      await expect(thumbnail).toContainText(/Kenali mereka\.\s*Temukan kisahnya\./);
      await expect(thumbnail).not.toContainText(/Meet them\.|Discover their story\./);
    }
  });

  test('all pending-material dialogs use English status and accessible controls', async ({ page }) => {
    const cases = [
      ['/ebook/the-art-of-reflecting', 'purchase', 'Purchase information is not available yet.'],
      ['/ebook/the-art-of-reflecting', 'excerpt', 'The excerpt is not available yet.'],
      ['/renungan', 'video', 'No videos to show yet.'],
      ['/ngobrol', 'audio', 'No conversations to show yet.'],
    ];
    for (const [route, state, title] of cases) {
      await openEnglish(page, route);
      const trigger = page.locator(`[data-state="${state}"]`);
      await expect(trigger).toHaveAccessibleName(/purchase|excerpt|video|episode/i);
      await trigger.click();
      const dialog = page.getByRole('dialog', { name: title, exact: true });
      await expect(dialog).toBeVisible();
      await expect(dialog.getByRole('heading')).toHaveText(title);
      await expect(dialog).not.toContainText(/belum tersedia|belum dikonfirmasi|Kembali|Tutup/);
      await expect(dialog.getByRole('button', { name: /close/i }).first()).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible();
      await expect(trigger).toBeFocused();
    }
  });

  test('English 404 has a usable recovery route and translated labels', async ({ page }) => {
    await openEnglish(page, '/missing-page');
    await expect(page.locator('main')).toContainText(/404\s*\/\s*page not found/i);
    await expect(page.getByRole('link', { name: /skip to content/i })).toHaveAttribute('href', '#main');
    await expect(page.locator('main')).not.toContainText(/kembali|Halaman|kamu/i);
    await page.locator('main').getByRole('link', { name: /back to home/i }).click();
    await expect(page.locator('main h1')).toHaveText(/Meet them/);
    await expectLanguage(page, 'en');
  });

  for (const route of ['/home/E', '/preview', '/tentang-bantuan']) {
    test(`English WCAG A/AA automated checks ${route}`, async ({ page }) => {
      await openEnglish(page, route);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      expect(results.violations.map(({ id, impact, nodes }) => ({ id, impact, targets: nodes.map((node) => node.target) }))).toEqual([]);
    });
  }
});

test('fresh English welcome exposes an English keyboard skip action', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, reducedMotion: 'no-preference' });
  try {
    const firstVisit = await context.newPage();
    await firstVisit.clock.install();
    await firstVisit.clock.pauseAt(new Date(Date.now() + 1000));
    await firstVisit.goto('./#/home/E');
    const welcome = firstVisit.getByRole('dialog');
    await expect(welcome).toBeVisible();
    await expect(welcome).toHaveAccessibleName(/prototype|introduction|welcome/i);
    const skip = welcome.getByRole('button', { name: /^Skip/i });
    await expect(skip).toBeFocused();
    await expect(welcome).not.toContainText(/kisah|pembuka|Lewati/);
    await skip.press('Enter');
    await firstVisit.clock.runFor(750);
    await expect(welcome).not.toBeVisible();
    await firstVisit.clock.resume();
    await expectLanguage(firstVisit, 'en');
    await expect(firstVisit.locator('main h1')).toHaveText(/Meet them/);
  } finally {
    await context.close();
  }
});
