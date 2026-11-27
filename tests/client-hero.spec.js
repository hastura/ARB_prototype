import { expect, test } from '@playwright/test';

test('I starts with no panel artwork and reveals six shots in the original split composition', async ({ page }) => {
  let releaseOpeningImage;
  const waitForOpeningImage = new Promise(resolve => { releaseOpeningImage = resolve; });
  await page.route('**/panel-1.webp', async route => {
    await waitForOpeningImage;
    await route.continue();
  });
  await page.goto('/?embed=1#/home/I?lang=en', { waitUntil: 'domcontentloaded' });
  const panels = page.locator('[data-client-panels="hero"]');
  const visuals = panels.locator('.client-panel-visual');
  try {
    await expect(visuals).toHaveCount(6);
    await expect(panels.locator('.client-panel-visual:visible')).toHaveCount(0);
  } finally {
    releaseOpeningImage();
  }
  await expect(visuals.first()).toBeVisible();
  await expect(visuals.last()).toBeHidden();
  await expect(panels.locator('.client-panel p').last()).toHaveCSS('opacity', '0');
  const width = await page.evaluate(() => document.documentElement.clientWidth);
  const panelBounds = await panels.boundingBox();
  expect(panelBounds.x).toBe(0);
  expect(panelBounds.width / width).toBeCloseTo(.565, 2);
  expect((await page.locator('.client-dialog-hero h1').boundingBox()).x).toBeGreaterThan(panelBounds.width);
  await expect(panels.locator('.client-panel p').first()).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(panels.locator('.client-panel p').last()).toHaveCSS('opacity', '1');
  await expect(page.locator('[data-client-hero="I"] + #karakter')).toHaveCount(1);

  const panel = panels.locator('.client-panel').nth(3);
  const track = panel.locator('.client-panel-track');
  const offset = () => track.evaluate(image => new DOMMatrix(getComputedStyle(image).transform).m42);
  const openingOffset = await offset();
  const initialCaptionOffset = (await panel.locator('p').boundingBox()).y - (await panel.boundingBox()).y;
  await page.evaluate(() => scrollTo({ top: 180, behavior: 'instant' }));
  await expect.poll(offset).toBeGreaterThan(openingOffset + 10);
  expect((await panel.locator('p').boundingBox()).y - (await panel.boundingBox()).y).toBeCloseTo(initialCaptionOffset, 1);
});

for (const { width, height } of [
  { width: 1920, height: 760 },
  { width: 768, height: 900 },
  { width: 390, height: 740 },
  { width: 844, height: 390 },
  { width: 568, height: 320 },
]) {
  test(`I fits its title and all six panels in one viewport at ${width} × ${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/?embed=1#/home/I?lang=id');
    const hero = page.locator('[data-client-hero="I"]');
    const panels = hero.locator('.client-panel');
    const heading = hero.getByRole('heading', { level: 1 });

    await expect(panels).toHaveCount(6);
    await expect(heading).toBeInViewport({ ratio: .999 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    const frame = await hero.boundingBox();
    expect(Math.abs(frame.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(frame.height - height)).toBeLessThanOrEqual(1);

    for (const panel of await panels.all()) {
      await expect(panel).toBeInViewport({ ratio: .999 });
      const caption = panel.locator('p');
      if (!await caption.count()) continue;
      const [shot, words] = await Promise.all([panel.boundingBox(), caption.boundingBox()]);
      expect(words.x).toBeGreaterThanOrEqual(shot.x - 1);
      expect(words.x + words.width).toBeLessThanOrEqual(shot.x + shot.width + 1);
      expect(words.y).toBeGreaterThanOrEqual(shot.y - 1);
      expect(words.y + words.height).toBeLessThanOrEqual(shot.y + shot.height + 1);
    }
  });
}

test('J drifts the painted shapes independently of the vertical parallax', async ({ page }) => {
  await page.goto('/?embed=1#/home/J?lang=en');
  const hero = page.locator('[data-client-hero="J"]');
  const stage = hero.locator('.client-scene-stage');
  const rear = stage.locator('.client-j-shapes-rear');
  const front = stage.locator('.client-j-shapes-front');
  const paper = stage.locator('.client-j-paper');
  const cast = stage.locator('.client-j-cast');
  const table = stage.locator('.client-j-foreground');
  const offset = (layer, axis) => layer.evaluate((element, axis) => new DOMMatrix(getComputedStyle(element).transform)[axis], axis);
  const rearDrift = () => offset(rear.locator('img'), 'm41');
  const frontDrift = () => offset(front.locator('img'), 'm41');
  const depth = layer => offset(layer, 'm42');

  await expect(stage.locator('.client-scene-poster')).toHaveAttribute('src', /j-portrait-v02-poster\.webp$/);
  await expect(cast).toHaveAttribute('src', /j-portrait-v02\/j-cast\.webp$/);
  await expect(stage.locator('video')).toHaveCount(0);
  await expect(stage.locator('.client-scene-layers')).toHaveCSS('opacity', '1');
  await expect.poll(rearDrift).toBeGreaterThan(2);
  await expect.poll(frontDrift).toBeLessThan(-2);
  expect(await page.evaluate(() => scrollY)).toBe(0);
  expect(await depth(rear)).toBe(0);

  await page.evaluate(() => scrollTo({ top: 230, behavior: 'instant' }));
  await expect.poll(() => depth(rear)).toBeGreaterThan(9);
  expect(await depth(front)).toBeLessThan(-9);
  expect(await depth(paper)).toBeGreaterThan(3);
  expect(await depth(cast)).toBeLessThan(-1);
  expect(await depth(table)).toBeLessThan(await depth(cast));
  expect(Math.abs((await stage.boundingBox()).y)).toBeLessThanOrEqual(3);

  await hero.getByRole('button', { name: 'Pause motion' }).click();
  const pausedAt = await rearDrift();
  const pausedDepth = await depth(rear);
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(350);
  expect(await rearDrift()).toBe(pausedAt);
  expect(await depth(rear)).toBe(pausedDepth);

  await hero.getByRole('button', { name: 'Resume motion' }).click();
  await expect.poll(rearDrift).not.toBe(pausedAt);
  await expect.poll(() => depth(rear)).toBeLessThan(1);
});

test('L plays the room environment loop and moves registered artwork inside a stationary frame', async ({ page }) => {
  await page.goto('/?embed=1#/home/L?lang=en');
  const hero = page.locator('[data-client-hero="L"]');
  const stage = hero.locator('.client-scene-stage');
  const poster = stage.locator('.client-scene-poster');
  const video = stage.locator('.client-l-video');
  const artwork = stage.locator('.client-scene-layers');
  const environment = stage.locator('.client-l-environment');
  const characters = stage.locator('.client-l-characters');
  const foreground = stage.locator('.client-l-foreground');
  const offset = layer => layer.evaluate(element => new DOMMatrix(getComputedStyle(element).transform).m42);
  const time = () => video.evaluate(element => element.currentTime);

  await expect(hero).toHaveClass(/is-vertical/);
  await expect(poster).toHaveAttribute('src', /j-layered-poster\.webp$/);
  await expect(stage.locator('.client-l-background')).toHaveAttribute('src', /j-layered-bg\.webp$/);
  await expect(characters).toHaveAttribute('src', /j-characters\.webp$/);
  await expect(foreground).toHaveAttribute('src', /j-foreground\.webp$/);
  await expect(video).toHaveAttribute('src', /j-layered-loop\.webm$/);
  await expect.poll(() => video.evaluate(element => element.duration)).toBeCloseTo(8, 1);
  await expect(artwork).toHaveCSS('opacity', '1');
  await expect.poll(time).toBeGreaterThan(.15);

  await page.evaluate(() => scrollTo({ top: 110, behavior: 'instant' }));
  await expect.poll(() => offset(environment)).toBeGreaterThan(6);
  await hero.getByRole('button', { name: 'Pause motion' }).click();
  const pausedAt = await time();
  const pausedOffset = await offset(environment);
  await page.evaluate(() => scrollTo({ top: 350, behavior: 'instant' }));
  await page.waitForTimeout(350);
  expect(await time()).toBe(pausedAt);
  expect(await offset(environment)).toBe(pausedOffset);

  await hero.getByRole('button', { name: 'Resume motion' }).click();
  await expect.poll(time).toBeGreaterThan(pausedAt);
  await expect.poll(() => offset(environment)).toBeGreaterThan(pausedOffset + 3);
  expect(await offset(environment)).toBeLessThan(16);
  expect(await offset(characters)).toBeLessThan(-2);
  expect(await offset(foreground)).toBeGreaterThan(.6);
  expect(Math.abs((await stage.boundingBox()).y)).toBeLessThanOrEqual(3);

  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await expect.poll(() => offset(environment)).toBeLessThan(1);
  await video.evaluate(element => { element.currentTime = element.duration - .15; });
  await expect.poll(time).toBeLessThan(1.5);

  await page.locator('#karakter').scrollIntoViewIfNeeded();
  await expect.poll(() => video.evaluate(element => element.paused)).toBe(true);
});

test('L keeps the registered poster when environment playback fails', async ({ page }) => {
  await page.route('**/j-layered-loop.webm', route => route.fulfill({ status: 404 }));
  await page.goto('/?embed=1#/home/L?lang=en');
  const hero = page.locator('[data-client-hero="L"]');
  await expect(hero.locator('.client-scene-layers')).toBeHidden();
  await expect(hero.locator('[data-motion-toggle]')).toBeHidden();
  await expect.poll(() => hero.locator('.client-scene-poster').evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
});

test('J dialogue has a longer photo drift while the caption stays within its panel', async ({ page }) => {
  await page.goto('/?embed=1#/home/J?lang=en');
  const band = page.locator('.client-dialog-band');
  await band.scrollIntoViewIfNeeded();
  await expect(band.locator('.client-panel-visual').first()).toBeVisible();
  await expect(band.locator('h1, h2')).toHaveCount(0);
  const row = band.locator('.client-panel').nth(2);
  const track = row.locator('.client-panel-track');
  const caption = row.locator('p');
  const initialScroll = await row.evaluate(panel => scrollY + panel.getBoundingClientRect().top - innerHeight * .64);
  await page.evaluate(top => scrollTo({ top, behavior: 'instant' }), initialScroll);
  await expect(caption).toHaveCSS('opacity', '1');
  const offset = () => track.evaluate(image => new DOMMatrix(getComputedStyle(image).transform).m42);
  const before = await offset();
  const captionTop = (await caption.boundingBox()).y - (await row.boundingBox()).y;
  await page.evaluate(top => scrollTo({ top, behavior: 'instant' }), initialScroll + 215);
  await expect.poll(offset).toBeGreaterThan(before + 36);
  expect((await caption.boundingBox()).y - (await row.boundingBox()).y).toBeCloseTo(captionTop, 1);
});

for (const variant of ['J', 'L']) {
  test(`${variant} reduced-motion keeps its registered poster and a visible dialogue flow`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/?embed=1#/home/${variant}?lang=en`);
    const hero = page.locator(`[data-client-hero="${variant}"]`);
    await expect(hero).not.toHaveClass(/is-vertical/);
    await expect(hero.locator('.client-scene-layers [src]')).toHaveCount(0);
    await expect(hero.locator('[data-motion-toggle]')).toBeHidden();
    await expect(hero.locator('.client-scene-poster')).toHaveCSS('opacity', '1');
    await expect(page.locator('.client-dialog-band .client-panel p').last()).toHaveCSS('opacity', '1');
  });
}

test('K plays the rendered environment clip without scrolling, loops, and honors the pause control', async ({ page }) => {
  await page.goto('/?embed=1#/home/K?lang=en');
  const video = page.locator('.client-k-video');
  const time = () => video.evaluate(element => element.currentTime);
  await expect(page.locator('.client-scene-poster')).toHaveAttribute('src', /k-layered-poster\.webp$/);
  await expect(video).toHaveAttribute('src', /k-layered-loop\.webm$/);
  await expect.poll(() => video.evaluate(element => element.duration)).toBeCloseTo(8, 1);
  await expect.poll(time).toBeGreaterThan(.15);
  await expect(video).toHaveCSS('opacity', '1');
  expect(await page.evaluate(() => scrollY)).toBe(0);

  await page.getByRole('button', { name: 'Pause motion' }).click();
  const resume = page.getByRole('button', { name: 'Resume motion' });
  await expect(resume).toBeVisible();
  const pausedAt = await time();
  await page.waitForTimeout(320);
  expect(await time()).toBe(pausedAt);
  await resume.click();
  await expect.poll(time).toBeGreaterThan(pausedAt);

  // Advance near the end to check the browser returns to the first frame.
  await video.evaluate(element => { element.currentTime = element.duration - .15; });
  await expect.poll(time).toBeLessThan(1.5);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(video).toBeHidden();
  await expect.poll(() => video.evaluate(element => element.paused)).toBe(true);
  await page.reload();
  await expect(video).not.toHaveAttribute('src', /.+/);
  await expect(page.locator('.client-scene-poster')).toBeVisible();
});
