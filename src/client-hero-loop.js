import { gsap } from 'gsap';
import './client-hero-loop.css';

const assetRoot = `${import.meta.env.BASE_URL}assets/client-hero-ijk/`;
const loopClips = { K: 'k-layered-loop.webm', L: 'j-layered-loop.webm' };

function makeShapeLoop(layers) {
  // The parent planes handle scroll depth. Move only the painted artwork here.
  const [rear, front] = layers.querySelectorAll('.client-j-shape-art');
  return gsap.timeline({ paused: true, repeat: -1, defaults: { ease: 'sine.inOut' } })
    .to(rear, { xPercent: .65, yPercent: -.72, duration: 4.5 }, 0)
    .to(rear, { xPercent: -.32, yPercent: .42, duration: 4.1 }, 4.5)
    .to(rear, { xPercent: 0, yPercent: 0, duration: 3.4 }, 8.6)
    .to(front, { xPercent: -.8, yPercent: .88, duration: 3.7 }, 0)
    .to(front, { xPercent: .54, yPercent: -.57, duration: 5 }, 3.7)
    .to(front, { xPercent: 0, yPercent: 0, duration: 3.3 }, 8.7);
}

export function mountClientHeroLoop(hero) {
  const key = hero.dataset.clientHero;
  const layers = hero.querySelector('.client-scene-layers');
  const toggle = hero.querySelector('[data-motion-toggle]');
  const images = Array.from(layers.querySelectorAll('img[data-src]'));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const controller = new AbortController();
  const { signal } = controller;
  const clip = loopClips[key];
  const video = clip ? document.createElement('video') : null;
  if (video) {
    video.className = `client-${key.toLowerCase()}-video`;
    video.loop = true;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.preload = 'none';
    const videoHost = layers.querySelector('.client-l-environment') ?? layers;
    videoHost.append(video);
  }

  const drift = key === 'J' ? makeShapeLoop(layers) : null;
  const reveal = gsap.to(key === 'K' ? video : layers, { opacity: 1, duration: .48, ease: 'sine.out', paused: true });
  let artworkReady;
  let inView = false;
  let paused = false;
  let unavailable = false;

  function wantsPlayback() {
    return inView && !paused && !unavailable && !reducedMotion.matches && !document.hidden;
  }

  function showPoster() {
    unavailable = true;
    reveal.pause(0);
    syncPlayback();
  }

  function showArtwork() {
    artworkReady?.then(() => {
      if (signal.aborted || !wantsPlayback()) return;
      reveal.play();
      drift?.play();
    });
  }

  function syncPlayback() {
    toggle.hidden = reducedMotion.matches || unavailable;
    toggle.textContent = paused ? toggle.dataset.resume : toggle.dataset.pause;
    layers.hidden = reducedMotion.matches || unavailable;
    hero.classList.toggle('is-motion-paused', paused || unavailable);

    if (!wantsPlayback()) {
      video?.pause();
      drift?.pause();
      reveal.pause();
      return;
    }
    if (!artworkReady) {
      artworkReady = Promise.all(images.map(image => {
        image.src = image.dataset.src;
        return image.decode();
      })).catch(() => {
        if (!signal.aborted) showPoster();
      });
      if (video) video.src = `${assetRoot}${clip}`;
    }
    if (!video) {
      showArtwork();
    } else if (video.paused) {
      video.play().catch(error => {
        if (signal.aborted || !wantsPlayback() || error.name === 'AbortError') return;
        if (error.name === 'NotAllowedError') {
          paused = true;
          syncPlayback();
        } else {
          showPoster();
        }
      });
    }
  }

  video?.addEventListener('playing', showArtwork, { signal });
  video?.addEventListener('error', showPoster, { signal });
  toggle.addEventListener('click', () => {
    paused = !paused;
    syncPlayback();
  }, { signal });
  reducedMotion.addEventListener('change', syncPlayback, { signal });
  document.addEventListener('visibilitychange', syncPlayback, { signal });

  const observer = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    syncPlayback();
  });
  observer.observe(layers.parentElement);
  syncPlayback();

  return () => {
    controller.abort();
    observer.disconnect();
    reveal.kill();
    drift?.kill();
    hero.classList.remove('is-motion-paused');
    if (video) {
      video.pause();
      video.removeAttribute('src');
      video.load();
      video.remove();
    }
  };
}
