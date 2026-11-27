import { expect, test } from '@playwright/test';

test.use({ reducedMotion: 'reduce' });

async function expectOutline(link) {
  await expect(link).toBeVisible();
  await expect(link).toHaveCSS('border-top-style', 'solid');
  await expect(link).toHaveCSS('border-top-width', '1px');
  expect((await link.boundingBox()).height).toBeGreaterThanOrEqual(44);
}

async function expectPurchaseStatus(page, purchase, statusTitle, statusBody) {
  await purchase.click();
  const dialog = page.getByRole('dialog', { name: statusTitle, exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(statusBody);
  await expect(dialog).not.toContainText(/planned journey|journey yang direncanakan|checkout eksternal resmi|external checkout/i);
  await expect(dialog.locator('a[href^="http"]')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(purchase).toBeFocused();
}

const ebookCopy = {
  en: {
    purchase: 'Purchase',
    discover: 'Discover the story',
    reflection: 'Write a reflection for The Art of Reflecting',
    statusTitle: 'Purchase information is not available yet.',
    statusBody: 'Format, price, and access details will be shown once confirmed.',
  },
  id: {
    purchase: 'Beli',
    discover: 'Kenali Kisahnya',
    reflection: 'Tulis renungan untuk The Art of Reflecting',
    statusTitle: 'Informasi pembelian belum tersedia.',
    statusBody: 'Detail format, harga, dan cara mengakses ebook akan ditampilkan setelah dikonfirmasi.',
  },
};

for (const { variants, width, height, language, listLabel } of [
  { variants: ['I', 'J'], width: 1440, height: 900, language: 'en', listLabel: 'List' },
  { variants: ['K', 'L'], width: 390, height: 844, language: 'id', listLabel: 'Daftar' },
]) {
  test(`Reflection layouts and Ebook actions on previews ${variants.join(' and ')}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const copy = ebookCopy[language];
    for (const variant of variants) {
      await page.goto(`./?embed=1#/renungan?v=${variant}&lang=${language}`);
      const catalog = page.locator('[data-reflection-catalog]');
      const titles = catalog.locator('#reflection-titles');
      const grid = catalog.getByRole('button', { name: 'Grid', exact: true });
      const list = catalog.getByRole('button', { name: listLabel, exact: true });
      await expect(grid).toBeVisible();
      await expect(list).toBeVisible();
      await expect(grid).toHaveAttribute('aria-pressed', 'true');
      await expect(titles).toHaveAttribute('data-view', 'grid');
      await expect(titles.locator('li')).toHaveCount(6);
      await expectOutline(titles.locator('.reflection-entry').first());

      const first = titles.locator('li').first();
      const second = titles.locator('li').nth(1);
      expect((await second.boundingBox()).x).toBeGreaterThan((await first.boundingBox()).x);
      await list.click();
      await expect(list).toHaveAttribute('aria-pressed', 'true');
      await expect(grid).toHaveAttribute('aria-pressed', 'false');
      await expect(titles).toHaveAttribute('data-view', 'list');
      expect((await second.boundingBox()).x).toBeCloseTo((await first.boundingBox()).x);
      expect((await second.boundingBox()).y).toBeGreaterThan((await first.boundingBox()).y);
      await page.reload();
      await expect(list).toHaveAttribute('aria-pressed', 'true');
      await expect(titles).toHaveAttribute('data-view', 'list');
      await grid.click();

      await page.goto(`./?embed=1#/ebook?v=${variant}&lang=${language}`);
      const actions = page.locator('.featured-ebook-actions');
      const purchase = actions.getByRole('button', { name: copy.purchase, exact: true });
      const discover = actions.getByRole('link', { name: copy.discover, exact: true });
      const reflection = actions.getByRole('link', { name: copy.reflection, exact: true });
      await expect(purchase).toBeVisible();
      await expect(purchase).not.toHaveClass(/\bsecondary\b/);
      await expect(discover).toHaveClass(/\bsecondary\b/);
      await expectOutline(reflection);
      const purchaseBox = await purchase.boundingBox();
      const discoverBox = await discover.boundingBox();
      const reflectionBox = await reflection.boundingBox();
      expect(purchaseBox.x + purchaseBox.width).toBeLessThan(discoverBox.x);
      expect(purchaseBox.y).toBeCloseTo(discoverBox.y, 0);
      expect(reflectionBox.y).toBeGreaterThan(purchaseBox.y + purchaseBox.height);
      expect(reflectionBox.x).toBeCloseTo(purchaseBox.x, 0);
      expect(reflectionBox.x + reflectionBox.width).toBeCloseTo(discoverBox.x + discoverBox.width, 0);
      await expectPurchaseStatus(page, purchase, copy.statusTitle, copy.statusBody);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);

      await discover.click();
      await expect(page.locator('main h1')).toHaveText(/The Art of\s*Reflecting/);
      await expect(page.locator('.detail-feature').getByText(/View the purchase journey|Lihat alur pembelian/i)).toHaveCount(0);
      await expect(discover).toHaveCount(0);
      await expectOutline(reflection);
      const detailPurchaseBox = await purchase.boundingBox();
      const detailReflectionBox = await reflection.boundingBox();
      expect(detailReflectionBox.x).toBeCloseTo(detailPurchaseBox.x, 0);
      expect(detailReflectionBox.y).toBeGreaterThan(detailPurchaseBox.y + detailPurchaseBox.height);
      await expectOutline(page.locator('.book-reflection .reflection-entry'));
      await expectPurchaseStatus(page, purchase, copy.statusTitle, copy.statusBody);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    }
  });
}

test('a larger Reflection catalog loads another batch on scroll and returns to the opened title', async ({ page }) => {
  const fixture = Array.from({ length: 24 }, (_, i) => ({
    id: `test-reflection-${i + 1}`,
    title: `Fixture Reflection ${i + 1}`,
    artwork: 'ripples',
  }));
  // Add titles to the shipped catalog in this browser only.
  const seed = /\{\s*id:\s*([^\w\s])waktu-untuk-bernapas\1,\s*title:\s*([^\w\s])Waktu untuk Bernapas\2,\s*artwork:\s*([^\w\s])arches\3\s*,?\}/;
  await page.route('**/assets/*.js', async route => {
    const response = await route.fetch();
    const javascript = (await response.text()).replace(seed, book => `${book},${fixture.map(title => JSON.stringify(title)).join(',')}`);
    await route.fulfill({ response, body: javascript });
  });
  await page.addInitScript(() => sessionStorage.setItem('arb-reflection-view', 'list'));
  await page.setViewportSize({ width: 390, height: 700 });
  await page.goto('./?embed=1#/renungan?v=J&lang=en');

  const rows = page.locator('#reflection-titles li');
  const more = page.getByRole('button', { name: 'Load more titles' });
  await expect(rows).toHaveCount(12);
  await expect(more).toBeVisible();
  await more.scrollIntoViewIfNeeded();
  await expect(rows).toHaveCount(24);

  const title = 'Fixture Reflection 15';
  await page.getByRole('link', { name: `Write a reflection for ${title}` }).click();
  await expect(page.getByRole('heading', { name: title, level: 1 })).toBeVisible();
  await page.getByRole('link', { name: 'Back to Reflection' }).click();
  await expect(page.getByRole('heading', { name: title, level: 3 })).toBeFocused();
});
