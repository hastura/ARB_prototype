/**
 * Reveal elements immediately when already in view and animate below-the-fold
 * sections only as they enter the viewport, keeping distant content readable.
 */
export function revealElements(gsap, elements, { y = 32, duration = 0.85 } = {}) {
  const viewportHeight = window.innerHeight;
  for (const el of elements) {
    const rect = el.getBoundingClientRect();
    if (rect.bottom <= 0) continue;
    if (rect.top < viewportHeight) {
      gsap.from(el, { y: Math.min(y, 24), opacity: 0, duration: Math.min(duration, 0.75), ease: 'power3.out', clearProps: 'all' });
      continue;
    }
    gsap.from(el, {
      y,
      opacity: 0,
      duration,
      ease: 'power3.out',
      clearProps: 'all',
      immediateRender: false,
      scrollTrigger: { trigger: el, start: 'top bottom', once: true },
    });
  }
}
