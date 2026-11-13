const keys = ['aksa', 'rasa', 'bumi'];
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));

/** The user's exact character-introduction film, with readable localized companion copy. */
export function renderCharacterVideoCinema({ language, c }) {
  const content = key => escapeHTML(c(key));
  const pick = (id, en) => language === 'id' ? id : en;
  const asset = file => `${import.meta.env.BASE_URL}assets/character-intro-v01/${file}`;
  return `<section class="character-video-cinema" id="karakter" data-character-video-cinema aria-labelledby="character-video-title">
    <div class="character-video-heading"><span class="eyebrow">${pick('TIGA PERSPEKTIF', 'THREE PERSPECTIVES')}</span><h2 id="character-video-title">${content('characters.title')}</h2><p data-character-video-summary>${content('characters.caption')}</p></div>
    <div class="character-video-stage" data-character-video-stage>
      <div class="character-video-visual"><img src="${asset('poster.webp')}" width="1280" height="720" alt="${pick('Komposisi film pengenalan Aksa, Rasa, dan Bumi yang disediakan.', 'The supplied Aksa, Rasa, and Bumi introduction film composition.')}" loading="lazy" decoding="async"><video data-character-video data-src="${asset('character-introduction.mp4')}" poster="${asset('poster.webp')}" muted playsinline preload="none" aria-hidden="true" tabindex="-1"></video></div>
      <div class="character-video-caption" data-character-video-caption aria-hidden="true"><strong>${content('character.aksa.name')}</strong><p>${content('character.aksa.body')}</p></div>
      <span class="character-video-cue" aria-hidden="true">${pick('Gulir untuk mengenal mereka', 'Scroll to meet them')} ↓</span>
      <p class="sr-only" data-character-video-status role="status" aria-live="polite"></p>
    </div>
    <div class="character-video-copy">${keys.map(key => `<article data-character-copy="${key}"><img src="${asset(`still-${key}.webp`)}" width="1280" height="720" alt="${content(`character.${key}.name`)}" loading="lazy" decoding="async"><div><h3>${content(`character.${key}.name`)}</h3><p>${content(`character.${key}.body`)}</p></div></article>`).join('')}</div>
  </section>`;
}

export function mountCharacterVideoCinema({ gsap, ScrollTrigger, reduced, signal }) {
  const section = document.querySelector('[data-character-video-cinema]');
  if (!section) return () => {};
  const stage = section.querySelector('[data-character-video-stage]');
  const video = section.querySelector('[data-character-video]');
  const caption = section.querySelector('[data-character-video-caption]');
  const status = section.querySelector('[data-character-video-status]');
  const reduce = reduced || matchMedia('(prefers-reduced-motion: reduce)');
  const copy = Object.fromEntries(keys.map(key => {
    const article = section.querySelector(`[data-character-copy="${key}"]`);
    return [key, { name: article.querySelector('h3').textContent, body: article.querySelector('p').textContent }];
  }));
  copy.ensemble = { name: section.querySelector('h2').textContent, body: section.querySelector('[data-character-video-summary]').textContent };
  let context, trigger, frame = 0, targetTime = .8, disposed = false;
  const setChapter = time => {
    // These boundaries match Navigation in the supplied 30fps source composition.
    const key = time < 12.5 ? 'aksa' : time < 24.5 ? 'rasa' : time < 36.5 ? 'bumi' : 'ensemble';
    if (section.dataset.characterVideoActive === key) return;
    section.dataset.characterVideoActive = key;
    caption.querySelector('strong').textContent = copy[key].name;
    caption.querySelector('p').textContent = copy[key].body;
  };
  const seek = () => {
    frame = 0;
    if (disposed || reduce.matches || !Number.isFinite(video.duration) || video.seeking) return;
    if (Math.abs(video.currentTime - targetTime) > .05) {
      try { video.currentTime = targetTime; } catch { /* Keep the source poster while metadata is pending. */ }
    } else if (video.readyState >= 2) section.classList.add('character-video-ready');
  };
  const requestSeek = progress => {
    if (!Number.isFinite(video.duration)) return;
    targetTime = .8 + gsap.utils.clamp(0, 1, progress) * Math.max(0, video.duration - .88);
    setChapter(targetTime);
    if (!frame) frame = requestAnimationFrame(seek);
  };
  const metadata = () => { if (!reduce.matches) requestSeek(trigger?.progress || 0); };
  const seeked = () => {
    if (disposed || reduce.matches) return;
    section.classList.add('character-video-ready');
    if (Math.abs(video.currentTime - targetTime) > .1 && !frame) frame = requestAnimationFrame(seek);
  };
  const failed = () => {
    section.classList.remove('character-video-ready');
    status.textContent = document.documentElement.lang === 'id' ? 'Film belum dapat dimuat. Gambar dan pengenalan karakter tetap tersedia.' : 'The film could not load. Character images and introductions remain available.';
  };
  const headerHeight = () => Math.ceil(document.querySelector('.site-header')?.getBoundingClientRect().height || 0);
  const size = () => section.style.setProperty('--character-header', `${headerHeight()}px`);
  const syncView = () => {
    const bounds = stage.getBoundingClientRect();
    document.body.classList.toggle('character-video-in-view', !reduce.matches && bounds.top <= headerHeight() + 4 && bounds.bottom > headerHeight() + 48);
  };
  const rebuild = () => {
    context?.revert(); context = null; trigger = null;
    cancelAnimationFrame(frame); frame = 0; video.pause();
    section.classList.remove('character-video-ready', 'is-scroll-video');
    document.body.classList.remove('character-video-in-view');
    delete section.dataset.characterVideoActive;
    size();
    if (reduce.matches) {
      video.removeAttribute('src'); video.preload = 'none'; video.load();
      return;
    }
    section.classList.add('is-scroll-video'); setChapter(.8);
    context = gsap.context(() => {
      trigger = ScrollTrigger.create({
        trigger: stage, start: () => `top top+=${headerHeight()}`,
        end: () => `+=${Math.max(2600, Math.min(4200, innerHeight * 4))}`,
        pin: stage, pinSpacing: true, anticipatePin: 1, invalidateOnRefresh: true,
        onUpdate: self => { requestSeek(self.progress); syncView(); },
        onRefresh: self => { requestSeek(self.progress); syncView(); },
      });
    }, section);
    if (!video.getAttribute('src')) { video.src = video.dataset.src; video.preload = 'auto'; video.load(); }
    requestSeek(trigger?.progress || 0);
    ScrollTrigger.refresh();
  };
  video.muted = true;
  video.addEventListener('loadedmetadata', metadata);
  video.addEventListener('loadeddata', metadata);
  video.addEventListener('seeked', seeked);
  video.addEventListener('error', failed);
  reduce.addEventListener('change', rebuild);
  window.addEventListener('scroll', syncView, { passive: true });
  ScrollTrigger.addEventListener('refreshInit', size);
  rebuild();
  const cleanup = () => {
    if (disposed) return;
    disposed = true; context?.revert(); cancelAnimationFrame(frame);
    reduce.removeEventListener('change', rebuild);
    window.removeEventListener('scroll', syncView);
    ScrollTrigger.removeEventListener('refreshInit', size);
    video.removeEventListener('loadedmetadata', metadata);
    video.removeEventListener('loadeddata', metadata);
    video.removeEventListener('seeked', seeked);
    video.removeEventListener('error', failed);
    video.pause(); video.removeAttribute('src'); video.load();
    section.classList.remove('is-scroll-video', 'character-video-ready');
    document.body.classList.remove('character-video-in-view');
  };
  signal?.addEventListener('abort', cleanup, { once: true });
  return cleanup;
}
