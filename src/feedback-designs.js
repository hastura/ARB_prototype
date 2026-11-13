import { renderCharacterCinema } from './character-cinema';
import { renderCharacterNative } from './character-native';
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
          <div class="fb-film-cue" aria-hidden="true"><span>${pick('Gulir untuk membuka percakapan', 'Scroll to unfold the conversation')}</span><span>↓</span></div>
          <p class="fb-film-status sr-only" role="status" aria-live="polite" data-film-status></p>
        </div>
      </div>
    </section>
    <section class="fb-intro" id="pengantar">
      <div class="fb-section-index fb-reveal"><span>01</span><span>${pick('TENTANG KAMI', 'ABOUT US')}</span><i aria-hidden="true"></i></div>
      <h2 class="fb-intro-title fb-reveal">${content('intro.title')}</h2>
      <div class="fb-intro-body fb-reveal"><p>${content('intro.body')}</p>${link('/tentang-bantuan?section=tentang', pick('Tentang kami', 'About us'), 'text-link')}</div>
      <figure class="fb-cutaway fb-cutaway-intro" data-fb-drift><img src="${asset(`${design.media}-still-01.webp`)}" alt="${pick('Salah satu gambar sumber percakapan Aksa, Rasa, dan Bumi.', 'An original image from the Aksa, Rasa, and Bumi conversation.')}" width="1280" height="720" loading="lazy" decoding="async"><figcaption>${pick('Tiga cara memahaminya.', 'Three ways to understand it.')}</figcaption></figure>
    </section>
    ${variant === 'H' ? renderCharacterCinema({ variant, language, c }) : renderCharacterNative({ language, c })}
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

/** Scroll is the only film transport. Reduced motion never loads the video. */
export function mountFeedbackMotion({ gsap, ScrollTrigger, reduced, signal }) {
  const home = document.querySelector('[data-feedback-home]');
  if (!home) return () => {};
  const video = home.querySelector('video[data-scroll-video]');
  const status = home.querySelector('[data-film-status]');
  const reduce = reduced || matchMedia('(prefers-reduced-motion: reduce)');
  const isID = document.documentElement.lang === 'id';
  let context, trigger, targetTime = 0, seekFrame = 0, disposed = false, primed = false;
  const playhead = { progress: 0 };
  const sourceStart = ({ 'living-room': 2.5, 'amber-cinematic': 5.8, 'amber-collage': 2.5 })[video.dataset.mediaKey] || 0;
  const sourceDuration = video.dataset.mediaKey === 'living-room' ? 45.083333 : 48.083333;
  // Give every source second room to breathe, independently of viewport height.
  const scrollDistance = Math.round((sourceDuration - sourceStart - .8) * 240);
  const heroVisible = () => !trigger || (scrollY < trigger.end + innerHeight && scrollY + innerHeight > trigger.start);
  const seek = () => {
    seekFrame = 0;
    if (disposed || reduce.matches || !Number.isFinite(video.duration) || video.seeking) return;
    const delta = targetTime - video.currentTime;
    if (Math.abs(delta) > .035) {
      // Small scroll gestures stay gentle. Larger intentional jumps may catch up
      // a little faster, without requesting a whole scene in one visible seek.
      const step = !primed || !heroVisible() ? delta : gsap.utils.clamp(Math.abs(delta) > 2 ? -.45 : -.18, Math.abs(delta) > 2 ? .45 : .18, delta);
      try {
        video.currentTime = Math.max(0, Math.min(video.currentTime + step, video.duration - .08));
        primed = true;
      } catch { /* Retain the supplied poster until metadata is available. */ }
    }
  };
  const requestSeek = progress => {
    if (disposed || reduce.matches || !Number.isFinite(video.duration)) return;
    // Anchor jumps past the hero settle once offscreen, avoiding a background
    // queue of intermediate decodes while the reader explores another section.
    if (!heroVisible()) progress = trigger?.progress ?? progress;
    targetTime = sourceStart + gsap.utils.clamp(0, 1, progress) * Math.max(0, video.duration - .8 - sourceStart);
    if (!seekFrame && !video.seeking && Math.abs(video.currentTime - targetTime) > .035) seekFrame = requestAnimationFrame(seek);
  };
  const seeked = () => {
    if (disposed || reduce.matches) return;
    home.classList.add('fb-media-visible');
    if (Math.abs(video.currentTime - targetTime) > .035 && !seekFrame) seekFrame = requestAnimationFrame(seek);
  };
  const metadata = () => { if (!reduce.matches) requestSeek(playhead.progress); };
  const failed = () => {
    home.classList.remove('fb-media-visible');
    status.textContent = isID ? 'Film belum dapat dimuat. Gambar statis tetap ditampilkan.' : 'The film could not load. The still image remains available.';
  };
  const syncHeader = () => document.body.classList.toggle('film-in-view', scrollY < (trigger ? trigger.end + innerHeight : innerHeight) - 1);
  const rebuild = () => {
    context?.revert(); trigger = null;
    cancelAnimationFrame(seekFrame); seekFrame = 0;
    playhead.progress = 0; primed = false;
    video.pause(); home.classList.remove('fb-media-visible');
    home.dataset.motionMode = reduce.matches ? 'still' : 'scroll';
    if (reduce.matches) {
      video.removeAttribute('src'); video.preload = 'none'; video.load();
      syncHeader(); return;
    }
    context = gsap.context(() => {
      home.querySelectorAll('.fb-reveal').forEach(element => gsap.from(element, { y: 32, opacity: 0, duration: .9, ease: 'power3.out', clearProps: 'all', scrollTrigger: { trigger: element, start: 'top 96%', once: true } }));
      const filmMotion = gsap.to(playhead, { progress: 1, duration: 1, ease: 'none', paused: true, onUpdate: () => requestSeek(playhead.progress) });
      trigger = ScrollTrigger.create({
        trigger: home.querySelector('[data-hero-scroll]'), start: 'top top',
        end: `+=${scrollDistance}`,
        animation: filmMotion, scrub: 1.5,
        pin: home.querySelector('.fb-film-stage'), pinSpacing: true, anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: () => { if (!heroVisible()) requestSeek(playhead.progress); syncHeader(); },
        onRefresh: () => { requestSeek(playhead.progress); syncHeader(); },
      });
      if (matchMedia('(min-width: 1001px)').matches) {
        home.querySelectorAll('[data-fb-drift]').forEach((element, index) => gsap.fromTo(element, { y: 34, rotation: index ? 3 : -3 }, { y: -34, rotation: index ? -1 : 1, ease: 'none', scrollTrigger: { trigger: element, start: 'top bottom', end: 'bottom top', scrub: 1 } }));
        gsap.fromTo(home.querySelector('.fb-book-float'), { y: 36, rotate: -7 }, { y: -40, rotate: 5, ease: 'none', scrollTrigger: { trigger: home.querySelector('.fb-books'), start: 'top bottom', end: 'bottom top', scrub: 1 } });
      }
    }, home);
    if (!video.getAttribute('src')) { video.src = video.dataset.src; video.preload = 'auto'; video.load(); }
    requestSeek(playhead.progress); syncHeader();
  };
  video.muted = true;
  video.addEventListener('loadedmetadata', metadata);
  video.addEventListener('seeked', seeked);
  video.addEventListener('error', failed);
  reduce.addEventListener('change', rebuild);
  window.addEventListener('scroll', syncHeader, { passive: true });
  rebuild();
  const cleanup = () => {
    if (disposed) return;
    disposed = true; context?.revert(); cancelAnimationFrame(seekFrame);
    reduce.removeEventListener('change', rebuild);
    window.removeEventListener('scroll', syncHeader);
    video.removeEventListener('loadedmetadata', metadata);
    video.removeEventListener('seeked', seeked);
    video.removeEventListener('error', failed);
    video.pause(); video.removeAttribute('src'); video.load();
    document.body.classList.remove('film-in-view');
  };
  signal?.addEventListener('abort', cleanup, { once: true });
  return cleanup;
}
