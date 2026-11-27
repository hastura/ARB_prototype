import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { mountClientHeroLoop } from './client-hero-loop.js';
import './client-hero.css';

const assetRoot = `${import.meta.env.BASE_URL}assets/client-hero-ijk/`;

const dialogue = [
  ['Aksa', 'I love her.', 'Aku mencintainya.'],
  ['Rasa', 'I know', 'Aku tahu'],
  ['Aksa', 'Then why did I still hurt her?', 'Lalu kenapa aku tetap menyakitinya?'],
  ['Rasa', 'Because loving someone is different from consciously loving them.', 'Karena mencintai seseorang berbeda dengan mencintainya dengan kesadaran.'],
  ['Aksa', '', ''],
  ['Bumi', 'Heavy, isn’t it? The body remembers everything the mind tries to escape.', 'Berat, ya? Tubuh mengingat segala hal yang coba dihindari pikiran.'],
];

function headline(locale) {
  return `<div class="client-hero-title"><h1><span class="client-title-line"><span>${locale === 'id' ? 'Dunia' : 'The world of'}</span></span> <span class="client-title-line"><span>Aksa Rasa Bumi</span></span></h1><span class="client-title-rule" aria-hidden="true"></span></div>`;
}

function panels(locale, isHero) {
  return `<ol class="client-panels" data-client-panels="${isHero ? 'hero' : 'section'}" aria-label="${locale === 'id' ? 'Percakapan Aksa, Rasa, dan Bumi' : 'A conversation with Aksa, Rasa, and Bumi'}">
    ${dialogue.map(([speaker, en, id], index) => {
      const line = locale === 'id' ? id : en;
      const image = `src="${assetRoot}panel-${index + 1}.webp" width="1464" height="518" alt="" decoding="async"${!isHero && index > 0 ? ' loading="lazy"' : ''}`;
      return `<li class="client-panel">
        <div class="client-panel-visual">
          <div class="client-panel-shot"><div class="client-panel-track"><img ${image}${isHero && index === 0 ? ' fetchpriority="high"' : ''}></div></div>
          ${line ? `<p><span class="sr-only">${speaker}: </span>${line}</p>` : `<span class="sr-only">${locale === 'id' ? 'Aksa terdiam.' : 'Aksa falls silent.'}</span>`}
        </div>
      </li>`;
    }).join('')}
  </ol>`;
}

function sceneImage(path, className, alt = '') {
  const source = `${alt ? 'src' : 'data-src'}="${assetRoot}${path}.webp"`;
  return `<img class="${className}" ${source} width="1600" height="900" alt="${alt}" decoding="${alt ? 'sync' : 'async'}"${alt ? ' fetchpriority="high"' : ''}>`;
}

function sceneLayers(key) {
  if (key === 'J') {
    return `${sceneImage('j-portrait-v02/j-paper', 'client-j-paper')}
      <div class="client-j-shapes-rear">${sceneImage('j-portrait-v02/j-shapes-rear', 'client-j-shape-art')}</div>
      <div class="client-j-shapes-front">${sceneImage('j-portrait-v02/j-shapes-front', 'client-j-shape-art')}</div>
      ${sceneImage('j-portrait-v02/j-cast', 'client-j-cast')}
      ${sceneImage('j-portrait-v02/j-foreground', 'client-j-foreground')}`;
  }
  if (key === 'L') {
    return `<div class="client-l-environment">${sceneImage('j-layered-bg', 'client-l-background')}</div>
      ${sceneImage('j-layers/j-characters', 'client-l-characters')}
      ${sceneImage('j-layers/j-foreground', 'client-l-foreground')}`;
  }
  return '';
}

export function clientHero(key, { locale }) {
  if (key === 'I') {
    return `<section class="client-dialog-hero" data-client-hero="I">${headline(locale)}${panels(locale, true)}</section>`;
  }

  const outdoors = key === 'K';
  const poster = { J: 'j-portrait-v02-poster', K: 'k-layered-poster', L: 'j-layered-poster' }[key];
  const alt = locale === 'id'
    ? (outdoors ? 'Aksa, Rasa, dan Bumi berbincang di bawah pohon.' : 'Aksa, Rasa, dan Bumi tertawa bersama di meja.')
    : (outdoors ? 'Aksa, Rasa, and Bumi talking beneath a tree.' : 'Aksa, Rasa, and Bumi laughing together at the table.');
  const toggle = locale === 'id' ? 'Jeda gerak' : 'Pause motion';
  const resume = locale === 'id' ? 'Putar gerak' : 'Resume motion';

  return `<section class="client-scene-hero" data-client-hero="${key}">
    <div class="client-scene-stage">
      <div class="client-scene">
        <div class="client-scene-content">
          <div class="client-scene-reel">
            ${sceneImage(poster, 'client-scene-poster', alt)}
            <div class="client-scene-layers" aria-hidden="true">${sceneLayers(key)}</div>
          </div>
        </div>
        <button type="button" class="client-scene-pause" data-motion-toggle data-pause="${toggle}" data-resume="${resume}">${toggle}</button>
      </div>
      ${headline(locale)}
    </div>
  </section>`;
}

export function clientDialogue({ locale }) {
  return `<section class="client-dialog-band" aria-label="${locale === 'id' ? 'Panel dialog' : 'Dialogue panels'}">${panels(locale, false)}</section>`;
}

function revealTitle(timeline, title, at) {
  timeline.fromTo(title.querySelectorAll('.client-title-line > span'),
    { yPercent: 104, opacity: 0 },
    { yPercent: 0, opacity: 1, duration: 1.2, stagger: .11, ease: 'power4.out' }, at);
  timeline.fromTo(title.querySelector('.client-title-rule'),
    { scaleX: 0 }, { scaleX: 1, duration: 1.05, ease: 'power3.inOut' }, at + .27);
}

function mountPanelSequence(list, title, context, extended) {
  let disposed = false;
  let observer;
  const visuals = gsap.utils.toArray('.client-panel-visual', list);
  const images = visuals.map(visual => visual.querySelector('img'));
  const captions = gsap.utils.toArray('.client-panel p', list);
  const times = [.2, .68, 1.23, 1.83, 2.63, 3.4];
  const hiddenFrame = 'inset(0% 0% 100% 0%)';

  list.classList.add('has-panel-parallax');
  if (extended) list.classList.add('has-extended-panel-parallax');
  gsap.set(visuals, { autoAlpha: 0, clipPath: hiddenFrame });
  gsap.set(captions, { opacity: 0, y: 10 });
  if (title) gsap.set(title, { opacity: 0 });

  visuals.forEach(visual => {
    const panel = visual.parentElement;
    const track = visual.querySelector('.client-panel-track');
    const travel = () => {
      const narrow = panel.clientWidth < 520;
      return panel.clientHeight * (extended ? (narrow ? .31 : .43) : (narrow ? .21 : .25));
    };
    gsap.fromTo(track, { y: () => -travel() }, {
      y: travel,
      ease: 'sine.inOut',
      scrollTrigger: {
        trigger: panel,
        start: extended ? 'top 94%' : 'top bottom',
        end: extended ? 'bottom 13%' : 'bottom top',
        scrub: extended ? .17 : .22,
        invalidateOnRefresh: true,
      },
    });
  });

  function start() {
    observer?.disconnect();
    images[0].decode().catch(() => {}).then(() => {
      if (disposed) return;
      context.add(() => {
        const timeline = gsap.timeline();
        visuals.forEach((visual, index) => {
          const at = times[index];
          timeline.to(visual, { autoAlpha: 1, clipPath: 'inset(0% 0% 0% 0%)', duration: .8, ease: 'power3.inOut' }, at);
          timeline.fromTo(images[index], { scale: 1.12, xPercent: index % 2 ? 1.8 : -1.8, filter: 'brightness(.86)' },
            { scale: 1, xPercent: 0, filter: 'brightness(1)', duration: 2.14, ease: 'power2.out' }, at);
          const caption = visual.querySelector('p');
          if (caption) timeline.to(caption, { opacity: 1, y: 0, duration: .8, ease: 'power3.out' }, at + .52);
        });
        if (title) {
          timeline.set(title, { opacity: 1 }, .36);
          revealTitle(timeline, title, .36);
        }
      });
    });
  }

  if (title || !('IntersectionObserver' in window)) {
    start();
  } else {
    observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) start();
    }, { rootMargin: '0px 0px -54px 0px' });
    observer.observe(list);
  }
  return () => {
    disposed = true;
    observer?.disconnect();
    list.classList.remove('has-panel-parallax', 'has-extended-panel-parallax');
  };
}

function mountParallax(hero, compact) {
  const stage = hero.querySelector('.client-scene-stage');
  const reel = stage.querySelector('.client-scene-reel');
  const title = stage.querySelector('.client-hero-title');
  const camera = { progress: 0 };
  const toggle = hero.querySelector('[data-motion-toggle]');
  const portrait = hero.dataset.clientHero === 'J';
  hero.classList.add('is-vertical');
  revealTitle(gsap.timeline(), title, .16);

  function updateDepth() {
    if (!hero.classList.contains('is-motion-paused')) {
      reel.style.setProperty('--scene-depth-progress', camera.progress);
    }
  }
  toggle.addEventListener('click', updateDepth);

  const depth = gsap.to(camera, {
    progress: 1,
    ease: 'power2.out',
    onUpdate: updateDepth,
  });

  ScrollTrigger.create({
    id: 'client-hero-parallax',
    trigger: stage,
    pin: !compact,
    start: 'top top',
    end: () => `+=${Math.round(stage.clientHeight * (compact ? .62 : portrait ? .66 : .52))}`,
    animation: depth,
    scrub: .26,
    anticipatePin: 1,
    refreshPriority: 1,
    invalidateOnRefresh: true,
  });
  return () => {
    toggle.removeEventListener('click', updateDepth);
    reel.style.removeProperty('--scene-depth-progress');
    hero.classList.remove('is-vertical');
  };
}

export function bindClientHero(root) {
  const hero = root?.querySelector('[data-client-hero]');
  if (!hero) return;

  const key = hero.dataset.clientHero;
  const hasDepth = key === 'J' || key === 'L';
  const disposeLoop = key === 'I' ? null : mountClientHeroLoop(hero);
  const motion = gsap.matchMedia();
  if (hasDepth) {
    motion.add({
      compact: '(max-width: 650px)',
      wide: '(min-width: 651px)',
      animate: '(prefers-reduced-motion: no-preference)',
    }, ({ conditions }) => {
      if (conditions.animate) return mountParallax(hero, conditions.compact);
    });
  }
  motion.add('(prefers-reduced-motion: no-preference)', context => {
    const cleanups = Array.from(root.querySelectorAll('[data-client-panels]'), list =>
      mountPanelSequence(list, key === 'I' ? hero.querySelector('.client-hero-title') : null, context, hasDepth));
    return () => cleanups.forEach(dispose => dispose());
  });
  return () => {
    motion.revert();
    disposeLoop?.();
  };
}
