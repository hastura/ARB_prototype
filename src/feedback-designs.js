const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));

export const feedbackDesigns = {
  F: { media: 'living-room', en: 'Living Room', id: 'Ruang Bersama', tone: 'paper' },
  G: { media: 'amber-cinematic', en: 'Amber Cinema', id: 'Sinema Amber', tone: 'cinema' },
  H: { media: 'amber-collage', en: 'Amber Collage', id: 'Kolase Amber', tone: 'collage' },
};

/** New home directions use existing story copy and supplied films, never invented catalogue data. */
export function renderFeedbackHome({ variant, language, c, href, link, book }) {
  const design = feedbackDesigns[variant];
  if (!design) return '';
  const pick = (id, en) => language === 'id' ? id : en;
  const content = key => escapeHTML(c(key)).replace(/\n/g, '<br>');
  const asset = file => `${import.meta.env.BASE_URL}assets/feedback-v02/${file}`;
  const title = c('home.title').split('\n').map(line => `<span>${escapeHTML(line)}</span>`).join(' ');
  const name = language === 'id' ? design.id : design.en;
  const stageId = `feedback-film-${variant.toLowerCase()}`;
  return `<div class="feedback-home fb-${variant.toLowerCase()}" data-feedback-home="${variant}">
    <section class="feedback-hero" aria-label="${pick('Pembuka kisah', 'Story opening')}">
      <div class="fb-hero-heading">
        <span class="fb-direction">${variant} <i aria-hidden="true">/</i> ${escapeHTML(name)}</span>
        <div class="fb-title-block"><span class="eyebrow">${content('home.eyebrow')}</span><h1>${title}</h1></div>
        <div class="fb-hero-aside"><p>${content('home.body')}</p><div class="actions">${link('/ebook', c('home.cta.ebook'))}${link(`/home/${variant}?section=karakter`, c('home.cta.characters'), 'button secondary')}</div></div>
      </div>
      <div class="fb-film-scroll" data-hero-scroll>
        <div class="fb-film-stage">
          <div class="fb-film-visual" id="${stageId}">
            <img class="fb-film-poster" src="${asset(`${design.media}-poster.webp`)}" alt="${pick('Komposisi film Aksa, Rasa, dan Bumi dari materi hero yang disediakan.', 'Aksa, Rasa, and Bumi in the supplied hero film composition.')}" width="1280" height="720" fetchpriority="high" decoding="async">
            <video data-scroll-video data-src="${asset(`${design.media}.mp4`)}" data-media-key="${design.media}" muted playsinline preload="none" poster="${asset(`${design.media}-poster.webp`)}" aria-hidden="true" tabindex="-1"></video>
            <span class="fb-film-corner" aria-hidden="true">AKSA · RASA · BUMI</span>
          </div>
          <div class="fb-film-controls"><span class="fb-scroll-hint">${pick('Gulir untuk membuka percakapan', 'Scroll to unfold the conversation')} <span aria-hidden="true">↓</span></span><span class="fb-film-track" aria-hidden="true"><i data-film-progress></i></span><button type="button" data-motion-toggle aria-controls="${stageId}" aria-pressed="false" data-label-pause="${pick('Jeda gerak scroll', 'Pause scroll motion')}" data-label-resume="${pick('Lanjutkan gerak scroll', 'Resume scroll motion')}" data-label-play="${pick('Putar film', 'Play film')}" data-label-stop="${pick('Jeda film', 'Pause film')}" data-label-reduced="${pick('Gambar statis · gerak dikurangi', 'Still image · reduced motion')}">${pick('Putar film', 'Play film')}</button></div>
          <p class="fb-film-status sr-only" role="status" aria-live="polite" data-film-status></p>
        </div>
      </div>
    </section>
    <section class="fb-intro" id="karakter">
      <div class="fb-section-index fb-reveal"><span>01</span><span>${pick('TENTANG KAMI', 'ABOUT US')}</span><i aria-hidden="true"></i></div>
      <h2 class="fb-intro-title fb-reveal">${content('intro.title')}</h2>
      <div class="fb-intro-body fb-reveal"><p>${content('intro.body')}</p>${link('/tentang-bantuan?section=tentang', pick('Tentang kami', 'About us'), 'text-link')}</div>
      <figure class="fb-cutaway fb-cutaway-intro" data-fb-drift><img src="${asset(`${design.media}-still-01.webp`)}" alt="${pick('Salah satu gambar sumber percakapan Aksa, Rasa, dan Bumi.', 'An original image from the Aksa, Rasa, and Bumi conversation.')}" width="1280" height="720" loading="lazy" decoding="async"><figcaption>${pick('Tiga cara memahaminya.', 'Three ways to understand it.')}</figcaption></figure>
    </section>
    <section class="fb-books" aria-labelledby="fb-book-title">
      <div class="fb-section-index fb-reveal"><span>02</span><span>${pick('EBOOK', 'EBOOK')}</span><i aria-hidden="true"></i></div>
      <div class="fb-book-copy fb-reveal"><span class="eyebrow">${content('story.label')}</span><h2 id="fb-book-title">${content('story.title')}</h2><p>${content('story.short')}</p></div>
      <div class="fb-book-float"><div class="fb-book-orbit" aria-hidden="true"></div>${book()}</div>
      <div class="fb-book-detail fb-reveal"><p>${content('story.summary')}</p><span class="fb-availability">${content('story.availability')}</span>${link('/ebook/the-art-of-reflecting', c('story.cta'))}</div>
    </section>
    <section class="fb-reflection" aria-labelledby="fb-reflection-title">
      <div class="fb-section-index fb-reveal"><span>03</span><span>${pick('RENUNGAN', 'REFLECTION')}</span><i aria-hidden="true"></i></div>
      <figure class="fb-cutaway fb-reflection-image" data-fb-drift><img src="${asset(`${design.media}-still-03.webp`)}" alt="${pick('Gambar karakter dari materi percakapan yang disediakan.', 'A character image from the supplied conversation material.')}" width="1280" height="720" loading="lazy" decoding="async"></figure>
      <div class="fb-reflection-copy fb-reveal"><span class="eyebrow">${pick('RUANG UNTUK BERHENTI SEJENAK', 'A SPACE TO PAUSE')}</span><h2 id="fb-reflection-title">${pick('Renungan', 'Reflection')}</h2><p>${content('home.reflections.body')}</p><div class="fb-reflection-empty"><strong>${content('reflections.empty.title')}</strong><p>${content('reflections.empty.body')}</p></div>${link('/renungan', c('home.reflections.cta'), 'text-link')}</div>
    </section>
    <section class="fb-question fb-reveal"><span class="eyebrow">${pick('PERTANYAAN UNTUK DIBAWA PULANG', 'A QUESTION TO TAKE WITH YOU')}</span><p>${content('intro.question')}</p><span class="fb-question-rule" aria-hidden="true"></span></section>
  </div>`;
}

/** Route-local motion: no source is loaded until motion is enabled on a suitable viewport. */
export function mountFeedbackMotion({ gsap, ScrollTrigger, reduced, signal }) {
  const home = document.querySelector('[data-feedback-home]');
  if (!home) return () => {};
  const video = home.querySelector('video[data-scroll-video]');
  const button = home.querySelector('[data-motion-toggle]');
  const progress = home.querySelector('[data-film-progress]');
  const status = home.querySelector('[data-film-status]');
  const desktop = matchMedia('(min-width: 1001px)');
  const reduce = reduced && typeof reduced.matches === 'boolean' ? reduced : matchMedia('(prefers-reduced-motion: reduce)');
  const isID = document.documentElement.lang === 'id';
  let context;
  let trigger;
  let enabled = false;
  let targetTime = 0;
  let seekFrame = 0;
  let disposed = false;
  let mode = 'still';

  const load = () => {
    if (!video.getAttribute('src')) {
      video.src = video.dataset.src;
      video.preload = 'auto';
      video.load();
    }
  };
  const seek = () => {
    seekFrame = 0;
    if (disposed || !enabled || mode !== 'scroll' || !Number.isFinite(video.duration) || video.seeking) return;
    if (Math.abs(video.currentTime - targetTime) > 0.055) {
      try { video.currentTime = Math.max(0, Math.min(targetTime, video.duration - 0.08)); } catch { /* Poster stays available until metadata can be read. */ }
    }
  };
  const requestSeek = progressValue => {
    if (!Number.isFinite(video.duration)) return;
    const sourceStart = ({ 'living-room': 2.5, 'amber-cinematic': 5.8, 'amber-collage': 2.5 })[video.dataset.mediaKey] || 0;
    const endTime = Math.max(sourceStart, video.duration - 0.8);
    targetTime = sourceStart + Math.max(0, Math.min(1, progressValue)) * (endTime - sourceStart);
    if (progress) progress.style.transform = `scaleX(${progressValue})`;
    if (!seekFrame) seekFrame = requestAnimationFrame(seek);
  };
  const seeked = () => {
    if (mode === 'scroll' && targetTime > 0.1) home.classList.add('fb-media-visible');
    if (enabled && mode === 'scroll' && Math.abs(video.currentTime - targetTime) > 0.12 && !seekFrame) seekFrame = requestAnimationFrame(seek);
  };
  const updateButton = () => {
    button.disabled = mode === 'still';
    button.setAttribute('aria-pressed', String(enabled));
    button.textContent = mode === 'still' ? button.dataset.labelReduced : mode === 'scroll' ? enabled ? button.dataset.labelPause : button.dataset.labelResume : enabled ? button.dataset.labelStop : button.dataset.labelPlay;
    home.dataset.motionMode = mode;
  };
  const metadata = () => {
    if (mode === 'scroll') requestSeek(trigger?.progress || 0);
  };
  const timeupdate = () => {
    if (mode === 'film' && Number.isFinite(video.duration) && progress) progress.style.transform = `scaleX(${video.currentTime / video.duration})`;
  };
  const ended = () => { enabled = false; updateButton(); };
  const failed = () => {
    home.classList.remove('fb-media-visible');
    status.textContent = isID ? 'Film belum dapat dimuat. Gambar statis tetap ditampilkan.' : 'The film could not load. The still image remains available.';
    enabled = false;
    updateButton();
  };
  const toggle = () => {
    if (mode === 'still') return;
    enabled = !enabled;
    if (mode === 'scroll') {
      if (enabled) requestSeek(trigger?.progress || 0);
    } else if (enabled) {
      load();
      video.play().then(() => { if (!disposed && enabled) home.classList.add('fb-media-visible'); }).catch(failed);
    } else video.pause();
    updateButton();
  };
  const rebuild = () => {
    context?.revert();
    context = null;
    trigger = null;
    cancelAnimationFrame(seekFrame);
    seekFrame = 0;
    video.pause();
    home.classList.remove('fb-media-visible');
    if (progress) progress.style.transform = 'scaleX(0)';
    mode = reduce.matches ? 'still' : desktop.matches ? 'scroll' : 'film';
    enabled = mode === 'scroll';
    if (mode === 'still') {
      video.removeAttribute('src');
      video.preload = 'none';
      video.load();
    }
    updateButton();
    if (reduce.matches) return;
    context = gsap.context(() => {
      home.querySelectorAll('.fb-reveal').forEach(element => {
        gsap.from(element, { y: 32, opacity: 0, duration: 0.9, ease: 'power3.out', clearProps: 'all', scrollTrigger: { trigger: element, start: 'top 96%', once: true } });
      });
      if (!desktop.matches) return;
      load();
      trigger = ScrollTrigger.create({
        trigger: home.querySelector('[data-hero-scroll]'),
        start: 'top top+=100',
        end: () => `+=${Math.max(1800, Math.min(2800, innerHeight * 2.6))}`,
        pin: home.querySelector('.fb-film-stage'),
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: self => { if (enabled) requestSeek(self.progress); },
      });
      home.querySelectorAll('[data-fb-drift]').forEach((element, index) => {
        gsap.fromTo(element, { y: 34, rotation: index ? 3 : -3 }, { y: -34, rotation: index ? -1 : 1, ease: 'none', scrollTrigger: { trigger: element, start: 'top bottom', end: 'bottom top', scrub: 1 } });
      });
      gsap.fromTo(home.querySelector('.fb-book-float'), { y: 36, rotate: -7 }, { y: -40, rotate: 5, ease: 'none', scrollTrigger: { trigger: home.querySelector('.fb-books'), start: 'top bottom', end: 'bottom top', scrub: 1 } });
    }, home);
  };
  video.muted = true;
  video.addEventListener('loadedmetadata', metadata);
  video.addEventListener('seeked', seeked);
  video.addEventListener('timeupdate', timeupdate);
  video.addEventListener('ended', ended);
  video.addEventListener('error', failed);
  button.addEventListener('click', toggle);
  desktop.addEventListener('change', rebuild);
  reduce.addEventListener('change', rebuild);
  rebuild();

  const cleanup = () => {
    if (disposed) return;
    disposed = true;
    context?.revert();
    cancelAnimationFrame(seekFrame);
    desktop.removeEventListener('change', rebuild);
    reduce.removeEventListener('change', rebuild);
    button.removeEventListener('click', toggle);
    video.removeEventListener('loadedmetadata', metadata);
    video.removeEventListener('seeked', seeked);
    video.removeEventListener('timeupdate', timeupdate);
    video.removeEventListener('ended', ended);
    video.removeEventListener('error', failed);
    video.pause();
    video.removeAttribute('src');
    video.load();
  };
  signal?.addEventListener('abort', cleanup, { once: true });
  return cleanup;
}
