import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const sourceRoutes = [
  ...['A', 'B', 'C', 'D', 'E'].map((alternative) => ({
    route: `/home/${alternative}`, title: /Kenali mereka/i,
  })),
  { route: '/ebook', title: /^Ebook$/ },
  { route: '/ebook/the-art-of-reflecting', title: /The Art of\s+Reflecting/ },
  { route: '/renungan', title: /^Renungan$/ },
  { route: '/ngobrol', title: /^Ngobrol$/ },
  { route: '/tentang-bantuan', title: /Tentang\s*&\s*Bantuan/ },
];

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

async function openRoute(page, route) {
  await page.goto(`./#${route}`);
  await expect(page.locator('main h1').first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

async function expectNoOverflow(page) {
  const layout = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    width: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
    offenders: [...document.querySelectorAll('main *')].filter((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return style.position !== 'fixed' && rect.width > 0 &&
        (rect.left < -1 || rect.right > document.documentElement.clientWidth + 1);
    }).slice(0, 8).map((element) => ({ tag: element.tagName, class: element.className })),
  }));
  expect(Math.max(layout.width, layout.body), JSON.stringify(layout)).toBeLessThanOrEqual(layout.viewport + 1);
}

async function expectImagesLoaded(page) {
  const broken = await page.locator('main img').evaluateAll(async (images) => {
    await Promise.all(images.map(async (image) => {
      image.loading = 'eager';
      try { await image.decode(); } catch { /* reported below with its URL */ }
    }));
    return images.filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.currentSrc || image.src);
  });
  expect(broken, 'Every image referenced by the visible route must load').toEqual([]);
}

test.describe('responsive source screens', () => {
  test.use({ reducedMotion: 'reduce' });

  for (const width of [320, 390, 768, 1440]) {
    for (const screen of sourceRoutes) {
      test(`${width}px ${screen.route}: correct screen, loaded art, no overflow`, async ({ page }) => {
        await page.setViewportSize({ width, height: 1000 });
        const errors = captureErrors(page);
        await openRoute(page, screen.route);
        await expect(page.locator('main h1').first()).toHaveText(screen.title);
        await expect(page.locator('main h1')).toHaveCount(1);
        await expectNoOverflow(page);
        await expectImagesLoaded(page);
        await page.locator('footer').scrollIntoViewIfNeeded();
        await expectNoOverflow(page);
        expect(errors).toEqual([]);
      });
    }
  }
});

test.describe('complete journeys', () => {
  test.use({ reducedMotion: 'reduce' });

  test('desktop story journey reaches details and honest availability/help states', async ({ page }) => {
    const errors = captureErrors(page);
    await openRoute(page, '/home/E');
    await page.getByRole('link', { name: 'Kenali Mereka', exact: true }).click();
    await expect(page.locator('#karakter')).toBeInViewport();
    await expect(page.getByRole('heading', { name: 'Aksa', exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Ebook', exact: true }).first().click();
    await expect(page).toHaveURL(/#\/ebook(?:\?|$)/);
    await page.getByRole('link', { name: 'Kenali Kisahnya', exact: true }).first().click();
    await expect(page).toHaveURL(/#\/ebook\/the-art-of-reflecting/);
    await expect(page.getByText('Cuplikan belum tersedia.', { exact: true })).toBeVisible();
    await expect(page.getByText('Informasi pembelian belum tersedia.', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Beli Ebook', exact: true })).toHaveCount(0);
    await page.getByRole('link', { name: 'Lihat Bantuan Ebook', exact: true }).first().click();
    await expect(page).toHaveURL(/#\/tentang-bantuan/);
    const question = page.locator('summary').filter({ hasText: 'Bagaimana Cara Membeli Ebook?' });
    const detail = page.locator('details').filter({ has: question });
    await question.click();
    await expect(detail).toHaveAttribute('open', '');
    await expect(detail).toContainText('Informasi pembelian ebook belum tersedia.');
    await question.press('Enter');
    await expect(detail).not.toHaveAttribute('open', '');
    expect(errors).toEqual([]);
  });

  test('mobile menu supports Escape, focus return, keyboard and navigation', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openRoute(page, '/home/B');
    const trigger = page.getByRole('button', { name: 'Buka menu', exact: true });
    await trigger.click();
    const menu = page.getByRole('dialog');
    await expect(menu).toBeVisible();
    await expect(menu.getByRole('button', { name: 'Tutup menu', exact: true })).toBeVisible();
    const menuStops = await menu.locator('a, button').count();
    for (let index = 0; index < menuStops + 2; index += 1) {
      await page.keyboard.press('Tab');
      expect(await menu.evaluate((dialog) => dialog.contains(document.activeElement)), 'Tab focus stays inside the open modal menu').toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(menu).not.toBeVisible();
    await expect(trigger).toBeFocused();
    await trigger.press('Enter');
    await menu.getByRole('link', { name: 'Renungan', exact: true }).click();
    await expect(menu).not.toBeVisible();
    await expect(page.locator('main h1')).toHaveText('Renungan');
    await expect(page.getByText('Belum ada video yang ditampilkan.', { exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Lihat Semua Ngobrol', exact: true }).first().click();
    await expect(page.locator('main h1')).toHaveText('Ngobrol');
    await expect(page.getByText('Belum ada percakapan yang ditampilkan.', { exact: true })).toBeVisible();
    await expectNoOverflow(page);
  });

  test('browser back and deep-route refresh preserve the requested screen', async ({ page }) => {
    await openRoute(page, '/home/C');
    await page.getByRole('link', { name: 'Ebook', exact: true }).first().click();
    await expect(page.locator('main h1')).toHaveText('Ebook');
    await page.goBack();
    await expect(page).toHaveURL(/#\/home\/C(?:\?|$)/);
    await expect(page.locator('main h1')).toHaveText(/Kenali mereka/i);
    await openRoute(page, '/ebook/the-art-of-reflecting');
    await page.reload();
    await expect(page.locator('main h1')).toHaveText(/The Art of\s+Reflecting/);
    await expect(page.getByText('Cuplikan belum tersedia.', { exact: true })).toBeVisible();
  });

  test('temporary code-built book has an accessible, reversible interaction', async ({ page }) => {
    await openRoute(page, '/ebook');
    const rotate = page.getByRole('button', { name: 'Putar buku', exact: true }).first();
    await expect(rotate).toHaveAttribute('aria-pressed', 'false');
    await rotate.click();
    await expect(rotate).toHaveAttribute('aria-pressed', 'true');
    await rotate.press('Enter');
    await expect(rotate).toHaveAttribute('aria-pressed', 'false');
  });

  test('unknown hash routes show recovery instead of a blank screen', async ({ page }) => {
    const errors = captureErrors(page);
    await openRoute(page, '/screen-that-does-not-exist');
    await expect(page.locator('main')).toContainText(/404|tidak ditemukan/i);
    await expect(page.locator('main a')).not.toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('client review offers live Desktop, Tablet, Mobile and alternatives', async ({ page }) => {
    const errors = captureErrors(page);
    await page.goto('./#/preview');
    const frameElement = page.getByTitle('Preview interaktif', { exact: true });
    await frameElement.scrollIntoViewIfNeeded();
    await expect(frameElement).toBeVisible();
    const frame = page.frameLocator('iframe[title="Preview interaktif"]');
    await expect(frame.locator('main h1')).toBeVisible();
    for (const [device, width] of [['Mobile', 390], ['Tablet', 768], ['Desktop', 1440]]) {
      const switcher = page.getByRole('button', { name: device, exact: true });
      await switcher.click();
      await expect(switcher).toHaveAttribute('aria-pressed', 'true');
      await expect(frame.locator('main h1')).toBeVisible();
      await expect.poll(() => frame.locator('html').evaluate(() => window.innerWidth)).toBe(width);
    }
    const alternatives = page.getByLabel('Alternatif', { exact: true });
    await expect(alternatives.locator('option')).toHaveCount(5);
    await alternatives.selectOption({ index: 1 });
    await expect(frame.locator('main h1')).toBeVisible();
    const pages = page.getByLabel('Halaman', { exact: true });
    await expect(pages).toBeVisible();
    const ebook = await pages.locator('option').evaluateAll((options) => options.find((option) => option.textContent.trim() === 'Ebook')?.value);
    expect(ebook, 'The review hub must offer Ebook as part of the full journey').toBeTruthy();
    await pages.selectOption(ebook);
    await expect(frame.locator('main h1')).toHaveText('Ebook');
    expect(errors).toEqual([]);
  });

  test('client review hub remains usable at 320px without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 844 });
    await openRoute(page, '/preview');
    await expectNoOverflow(page);
    const frameElement = page.getByTitle('Preview interaktif', { exact: true });
    await frameElement.scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: 'Mobile', exact: true }).click();
    await expectNoOverflow(page);
    await expectImagesLoaded(page);
    const frame = page.frameLocator('iframe[title="Preview interaktif"]');
    await expect(frame.locator('main h1')).toBeVisible();
  });

  test('pending purchase and excerpt dialogs explain the available journey without fabricating data', async ({ page }) => {
    await openRoute(page, '/ebook/the-art-of-reflecting');
    const purchase = page.getByRole('button', { name: 'Lihat alur pembelian', exact: true });
    await purchase.click();
    const purchaseDialog = page.getByRole('dialog', { name: 'Informasi pembelian belum tersedia.', exact: true });
    await expect(purchaseDialog).toBeVisible();
    await expect(purchaseDialog).toContainText('checkout eksternal resmi');
    await expect(purchaseDialog).toContainText('belum dikonfirmasi');
    await expect(purchaseDialog.locator('a[href^="http"]')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(purchaseDialog).not.toBeVisible();
    await expect(purchase).toBeFocused();
    const excerpt = page.getByRole('button', { name: 'Lihat status cuplikan', exact: true });
    await excerpt.click();
    const excerptDialog = page.getByRole('dialog', { name: 'Cuplikan belum tersedia.', exact: true });
    await expect(excerptDialog).toBeVisible();
    await expect(excerptDialog).toContainText('Menunggu naskah yang disetujui');
    await excerptDialog.getByRole('button', { name: 'Kembali menjelajah', exact: true }).click();
    await expect(excerptDialog).not.toBeVisible();
    await expect(excerpt).toBeFocused();
  });
});

test.describe('accessibility and motion', () => {
  test('first-visit welcome can be skipped and returns access to the full interface', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, reducedMotion: 'no-preference' });
    try {
      const firstVisit = await context.newPage();
      // Freeze the automatic dismissal so this exercises the user's skip action,
      // even on a slow CI runner. Resume real time before the route interaction.
      await firstVisit.clock.install();
      await firstVisit.clock.pauseAt(new Date(Date.now() + 1000));
      await firstVisit.goto('./#/home/E');
      const welcome = firstVisit.getByRole('dialog', { name: 'Pembuka prototype', exact: true });
      await expect(welcome).toBeVisible();
      await expect(firstVisit.locator('#app')).toHaveAttribute('inert', '');
      const skip = welcome.getByRole('button', { name: /^Lewati pembuka/ });
      await expect(skip).toBeFocused();
      await skip.press('Enter');
      await expect(firstVisit.locator('#app')).not.toHaveAttribute('inert', '');
      await firstVisit.clock.runFor(750);
      await expect(welcome).not.toBeVisible();
      await firstVisit.clock.resume();
      await expect(firstVisit.locator('main h1')).toBeVisible();
      await firstVisit.getByRole('link', { name: 'Ebook', exact: true }).first().click();
      await expect(firstVisit.locator('main h1')).toHaveText('Ebook');
      await expect(firstVisit.getByRole('dialog', { name: 'Pembuka prototype', exact: true })).toHaveCount(0);
    } finally {
      await context.close();
    }
  });

  test('motion enabled reaches readable content and responds after route changes', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const errors = captureErrors(page);
    await openRoute(page, '/home/E');
    await expect(page.locator('main h1')).toHaveCSS('opacity', '1');
    await page.getByRole('link', { name: 'Ebook', exact: true }).first().click();
    await expect(page.locator('main h1')).toHaveText('Ebook');
    await expect(page.locator('main h1')).toHaveCSS('opacity', '1');
    await expectNoOverflow(page);
    expect(errors).toEqual([]);
  });

  test('reduced motion retains all content and avoids looping motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openRoute(page, '/home/E');
    await expect(page.locator('main h1')).toBeVisible();
    await page.locator('#karakter').scrollIntoViewIfNeeded();
    await expect(page.getByRole('heading', { name: 'Aksa', exact: true })).toBeVisible();
    const loopingAnimations = await page.evaluate(() => document.getAnimations().filter((animation) => animation.effect?.getTiming().iterations === Infinity && animation.playState === 'running').length);
    expect(loopingAnimations).toBe(0);
    await expectNoOverflow(page);
  });

  for (const route of ['/home/E', '/ebook/the-art-of-reflecting', '/renungan', '/ngobrol', '/tentang-bantuan', '/preview']) {
    test(`WCAG A/AA automated checks ${route}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await openRoute(page, route);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      expect(results.violations.map(({ id, impact, nodes }) => ({ id, impact, targets: nodes.map((node) => node.target) }))).toEqual([]);
    });
  }
});
