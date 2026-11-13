const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const keys = ['aksa', 'rasa', 'bumi'];

/** Existing source portraits and copy, composed as a lateral portrait procession. */
export function renderCharacterCinema({ language, c }) {
  const pick = (id, en) => language === 'id' ? id : en;
  const content = key => escapeHTML(c(key));
  const asset = key => `${import.meta.env.BASE_URL}assets/portrait-${key}.webp`;
  return `<section class="character-cinema" id="karakter" data-character-cinema aria-labelledby="cinema-characters-title">
    <div class="cinema-heading"><span class="eyebrow">${pick('TIGA PERSPEKTIF', 'THREE PERSPECTIVES')}</span><h2 id="cinema-characters-title">${content('characters.title')}</h2><p>${content('characters.caption')}</p></div>
    <div class="cinema-stage" data-character-stage>
      <div class="cinema-track" data-character-track>${keys.map((key, index) => `<article class="cinema-panel cinema-${key}" data-character="${key}" aria-labelledby="cinema-${key}-name">
        <span class="cinema-index" aria-hidden="true">0${index + 1} <i>/</i> 03</span>
        <img class="cinema-echo" src="${asset(key)}" alt="" aria-hidden="true" loading="lazy" decoding="async">
        <div class="cinema-name"><h3 id="cinema-${key}-name">${content(`character.${key}.name`)}</h3><span aria-hidden="true">AKSA · RASA · BUMI</span></div>
        <img class="cinema-person" src="${asset(key)}" alt="${content(`character.${key}.name`)}" loading="lazy" decoding="async" width="${({ aksa: 600, rasa: 800, bumi: 692 })[key]}" height="841">
        <div class="cinema-copy"><span class="eyebrow">${content(`detail.highlight.${key}`).split('\n')[0]}</span><p>${content(`character.${key}.body`)}</p></div>
      </article>`).join('')}</div>
      <div class="cinema-chapters" aria-hidden="true">${keys.map(key => `<span data-character-label="${key}">${content(`character.${key}.name`)}</span>`).join('')}<i data-character-progress></i></div>
    </div>
  </section>`;
}

export function mountCharacterCinema({ gsap, ScrollTrigger, reduced, signal }) {
  const section = document.querySelector('[data-character-cinema]');
  if (!section) return () => {};
  const stage = section.querySelector('[data-character-stage]');
  const track = section.querySelector('[data-character-track]');
  const reduce = reduced || matchMedia('(prefers-reduced-motion: reduce)');
  let context, disposed = false;
  const rebuild = () => {
    context?.revert(); context = null;
    section.classList.remove('is-cinematic');
    delete section.dataset.characterActive;
    if (reduce.matches) return;
    section.classList.add('is-cinematic');
    context = gsap.context(() => {
      const labels = [...section.querySelectorAll('[data-character-label]')];
      const progress = section.querySelector('[data-character-progress]');
      const update = value => {
        const index = Math.min(2, Math.round(value * 2));
        section.dataset.characterActive = keys[index];
        labels.forEach((label, i) => label.classList.toggle('is-active', i === index));
        gsap.set(progress, { scaleX: value, transformOrigin: 'left' });
      };
      const timeline = gsap.timeline({ scrollTrigger: {
        trigger: stage, start: 'top top', end: () => `+=${Math.max(2200, innerHeight * 3.2)}`,
        pin: stage, pinSpacing: true, scrub: .65, anticipatePin: 1, invalidateOnRefresh: true,
        onUpdate: self => update(self.progress),
      } });
      timeline.to(track, { x: () => -stage.clientWidth * 2, duration: 2, ease: 'none' }, 0);
      timeline.fromTo('.cinema-person', { xPercent: 7 }, { xPercent: -7, duration: 2, ease: 'none' }, 0);
      timeline.fromTo('.cinema-echo', { xPercent: 24 }, { xPercent: -24, duration: 2, ease: 'none' }, 0);
      timeline.fromTo('.cinema-name', { xPercent: 3 }, { xPercent: -4, duration: 2, ease: 'none' }, 0);
      update(0);
    }, section);
    ScrollTrigger.refresh();
  };
  reduce.addEventListener('change', rebuild);
  rebuild();
  const cleanup = () => {
    if (disposed) return;
    disposed = true; context?.revert();
    reduce.removeEventListener('change', rebuild);
    section.classList.remove('is-cinematic');
    delete section.dataset.characterActive;
  };
  signal?.addEventListener('abort', cleanup, { once: true });
  return cleanup;
}
