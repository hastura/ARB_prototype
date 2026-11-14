const keys = ['aksa', 'rasa', 'bumi'];
const timing = { total: 19.9, chapters: [0, 4.5, 10.7], ensemble: 16.9, slide: 2.5, pan: 2.4, copy: .65, exitFade: .35 };
const stops = { aksa: 3.9 / timing.total, rasa: 10.3 / timing.total, bumi: 16.5 / timing.total, ensemble: 19.7 / timing.total };
const motionProbes = { pan: 1.75 / timing.total, transition: 5.75 / timing.total };
const dimensions = {
  aksa: [[279, 869], [292, 870], [182, 869], [455, 869]],
  rasa: [[244, 863], [234, 863], [184, 863], [235, 863]],
  bumi: [[305, 907], [270, 907], [201, 907], [299, 907]],
};
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));

/** Rebuild the supplied film's pose rail as responsive, localized DOM layers. */
export function renderCharacterNative({ language, c }) {
  const content = key => escapeHTML(c(key));
  const pick = (id, en) => language === 'id' ? id : en;
  const asset = (key, pose) => `${import.meta.env.BASE_URL}assets/character-native-v01/${key}-pose-${pose}.webp`;
  const figure = (key, pose) => `<div class="native-figure" data-native-figure="${pose}" data-native-ratio="${dimensions[key][pose][0] / dimensions[key][pose][1]}"><img src="${asset(key, pose)}" alt="" width="${dimensions[key][pose][0]}" height="${dimensions[key][pose][1]}" loading="lazy" decoding="async"></div>`;
  return `<section class="character-native" id="karakter" data-character-native data-native-stops='${JSON.stringify(stops)}' data-native-motion-probes='${JSON.stringify(motionProbes)}' aria-labelledby="native-character-title">
    <div class="native-heading"><span class="eyebrow">${pick('TIGA PERSPEKTIF', 'THREE PERSPECTIVES')}</span><h2 id="native-character-title">${content('characters.title')}</h2><p>${content('characters.caption')}</p></div>
    <div class="native-stage" data-character-native-stage>
      <div class="native-track" data-character-native-track>${keys.map((key, index) => `<article class="native-chapter" data-native-character="${key}" aria-labelledby="native-${key}-title">
        <div class="native-art" aria-hidden="true">${figure(key, 0)}${figure(key, 3)}${figure(key, 1)}<div class="native-name">${content(`character.${key}.name`)}</div>${figure(key, 2)}</div>
        <div class="native-copy" data-native-copy><div class="native-identity"><span aria-hidden="true">0${index + 1} /</span><h3 id="native-${key}-title">${content(`character.${key}.name`)}</h3></div><h4>${content(`detail.highlight.${key}`).split('\n')[0]}</h4><p>${content(`character.${key}.body`)}</p></div>
      </article>`).join('')}</div>
      <div class="native-ensemble" data-native-ensemble aria-hidden="true"><p class="native-ensemble-heading">${content('characters.title')}</p>${keys.map((key, index) => `<div class="native-ensemble-person" style="--person-index:${index}"><img src="${asset(key, 1)}" width="${dimensions[key][1][0]}" height="${dimensions[key][1][1]}" alt="" loading="lazy" decoding="async"><span>${content(`character.${key}.name`)}</span></div>`).join('')}<p class="native-ensemble-caption">${content('characters.caption')}</p></div>
      <div class="native-chapters" aria-hidden="true"><div class="native-chapter-strip">${keys.map((key, i) => `<span data-native-label="${key}"><small>0${i + 1}</small>${content(`character.${key}.name`)}</span>`).join('')}<i data-native-meter></i></div><span class="native-scroll-label">${pick('Gulir untuk menjelajahi', 'Scroll to explore')} ↓</span></div>
    </div>
  </section>`;
}

export function mountCharacterNative({ gsap, ScrollTrigger, reduced, signal }) {
  const section = document.querySelector('[data-character-native]');
  if (!section) return () => {};
  const stage = section.querySelector('[data-character-native-stage]');
  const chapters = [...section.querySelectorAll('[data-native-character]')];
  const ensemble = section.querySelector('[data-native-ensemble]');
  const labels = [...section.querySelectorAll('[data-native-label]')];
  const meter = section.querySelector('[data-native-meter]');
  const setMeter = gsap.quickSetter(meter, 'scaleX');
  const reduce = reduced || matchMedia('(prefers-reduced-motion: reduce)');
  const touch = matchMedia('(hover: none) and (pointer: coarse)');
  let context, timeline, trigger, resizeTimer = 0, disposed = false;
  let width = 0, height = 0, layout, viewportWidth = 0, orientation = '';
  const orientationKey = () => screen.orientation?.type || String(window.orientation || '');
  const headerHeight = () => Math.ceil(document.querySelector('.site-header')?.getBoundingClientRect().height || 0);
  const syncView = () => {
    const box = stage.getBoundingClientRect();
    document.body.classList.toggle('native-character-in-view', !reduce.matches && section.classList.contains('is-native-scroll') && box.top <= headerHeight() + 4 && box.bottom > headerHeight() + 48);
  };
  const update = () => {
    const progress = timeline.progress();
    const time = progress * timing.total;
    const key = time < timing.chapters[1] ? 'aksa' : time < timing.chapters[2] ? 'rasa' : time < timing.ensemble ? 'bumi' : 'ensemble';
    section.dataset.nativeProgress = progress.toFixed(5);
    section.dataset.nativeActive = key;
    labels.forEach(label => label.classList.toggle('is-current', key === 'ensemble' || label.dataset.nativeLabel === key));
    setMeter(progress);
  };
  const rebuild = () => {
    if (disposed) return;
    context?.revert(); context = null; timeline = null; trigger = null;
    section.classList.remove('is-native-scroll');
    document.body.classList.remove('native-character-in-view');
    delete section.dataset.nativeProgress; delete section.dataset.nativeActive;
    section.style.setProperty('--native-header', `${headerHeight()}px`);
    viewportWidth = innerWidth; orientation = orientationKey();
    // Very short viewports use the readable natural layout rather than clipping text.
    if (reduce.matches || innerHeight < 360) return;
    section.classList.add('is-native-scroll');
    width = stage.clientWidth; height = stage.clientHeight;
    const stableHeight = height + headerHeight();
    const short = stableHeight <= 540 && innerWidth >= 600;
    const portrait = innerWidth <= 1000 && !short;
    const compact = stableHeight <= 740;
    section.dataset.nativeLayout = short ? 'landscape' : portrait ? 'portrait' : 'wide';
    section.dataset.nativeCompact = String(portrait && compact);
    const artWidth = short ? width * .52 : width;
    const artHeight = portrait ? height * (compact ? .43 : .52) : height;
    layout = portrait ? {
      start: [.56, 1.4, .28, 1.08], end: [.12, .88, -.28, .25],
      top: [.12, .10, .08, .04], size: [.70, .76, 1.35, 1.48],
    } : {
      start: [.5625, 1.4245, .2943, .9167], end: [.1042, .965, -.2318, .2969],
      top: [.176, .089, .131, short ? -.02 : -.10], size: [.694, .794, 1.241, short ? 1.9 : 2.222],
    };
    context = gsap.context(() => {
      gsap.set(chapters, { xPercent: 100, autoAlpha: 1 }); gsap.set(chapters[0], { xPercent: 0 });
      gsap.set(ensemble, { xPercent: 100 });
      timeline = gsap.timeline({ onUpdate: update });
      const exitChapter = (chapter, start) => {
        timeline.to(chapter, { xPercent: -100, duration: timing.slide, ease: 'none' }, start);
        // A pose may extend beyond its panel. Fade the whole departing rail
        // at the end, so overscan leaves naturally without a moving hard mask.
        timeline.to(chapter, { autoAlpha: 0, duration: timing.exitFade, ease: 'power1.in' }, start + timing.slide - timing.exitFade);
      };
      chapters.forEach((chapter, index) => {
        const start = timing.chapters[index];
        // Enter at H's steady lateral pace, then pan the pose rail and reveal
        // the copy after it settles. Keep a separate, readable detail hold.
        const panStart = start + (index ? timing.slide : .55);
        const figures = [...chapter.querySelectorAll('[data-native-figure]')];
        const copy = chapter.querySelector('[data-native-copy]');
        const name = chapter.querySelector('.native-name');
        figures.forEach(figure => {
          const pose = Number(figure.dataset.nativeFigure);
          // Array order follows the film: far front / far rear / middle / foreground.
          const layer = ({ 0: 0, 3: 1, 1: 2, 2: 3 })[pose];
          const figureHeight = layout.size[layer] * artHeight;
          gsap.set(figure, { left: layout.start[layer] * artWidth, top: layout.top[layer] * artHeight, height: figureHeight, width: figureHeight * Number(figure.dataset.nativeRatio), xPercent: -50, x: 0 });
          timeline.to(figure, { x: (layout.end[layer] - layout.start[layer]) * artWidth, duration: timing.pan, ease: 'sine.inOut' }, panStart);
          // In split landscape this left-going layer exits into the copy column.
          // Let it dissolve before text appears, instead of cutting its body.
          if (short && pose === 1) timeline.to(figure, { autoAlpha: 0, duration: .5, ease: 'power1.in' }, panStart + timing.pan - .5);
        });
        gsap.set(copy, { opacity: 0, y: 24 });
        timeline.to(copy, { opacity: 1, y: 0, duration: timing.copy, ease: 'power1.out' }, panStart + timing.pan);
        timeline.fromTo(name, { x: 0, opacity: 1 }, { x: -artWidth * (portrait ? .12 : .47), opacity: .12, duration: timing.pan, ease: 'sine.inOut' }, panStart);
        if (index) {
          exitChapter(chapters[index - 1], start);
          timeline.to(chapter, { xPercent: 0, duration: timing.slide, ease: 'none' }, start);
        }
      });
      exitChapter(chapters[2], timing.ensemble);
      timeline.to(ensemble, { xPercent: 0, duration: timing.slide, ease: 'none' }, timing.ensemble);
      timeline.fromTo(ensemble.querySelectorAll('.native-ensemble-person'), { y: 32, opacity: 0 }, { y: 0, opacity: 1, duration: .8, stagger: .1, ease: 'power1.out' }, 18.1);
      timeline.to({}, { duration: .5 }, timing.total - .5); // A settled ensemble hold at the end.
      trigger = ScrollTrigger.create({
        trigger: stage, start: () => `top top+=${headerHeight()}`,
        // H traverses two panels over max(2200px, 3.2 viewport heights).
        // Give each native handoff that same distance, with additional room
        // for the separate pose pans and the reading holds between them.
        end: () => `+=${Math.round(Math.max(2200, stableHeight * 3.2) * timing.total / (2 * timing.slide))}`,
        animation: timeline, scrub: .65, pin: stage, pinSpacing: true, anticipatePin: 1,
        onUpdate: syncView, onRefresh: syncView,
      });
      update();
    }, section);
    ScrollTrigger.refresh(); syncView();
  };
  const resize = () => {
    // Browser-toolbar changes on touch screens must not tear down an eased pin.
    // Stable svh sizing keeps its geometry valid until width/orientation changes.
    if (touch.matches && innerWidth === viewportWidth && orientationKey() === orientation) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(rebuild, 140);
  };
  reduce.addEventListener('change', rebuild);
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('scroll', syncView, { passive: true });
  rebuild();
  const cleanup = () => {
    if (disposed) return;
    disposed = true; clearTimeout(resizeTimer); context?.revert();
    reduce.removeEventListener('change', rebuild);
    window.removeEventListener('resize', resize);
    window.removeEventListener('scroll', syncView);
    section.classList.remove('is-native-scroll');
    document.body.classList.remove('native-character-in-view');
  };
  signal?.addEventListener('abort', cleanup, { once: true });
  return cleanup;
}
