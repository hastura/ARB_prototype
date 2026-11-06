import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import copy from './copy-source.json';
import './style.css';

gsap.registerPlugin(ScrollTrigger);
const app = document.querySelector('#app');
const overlays = document.querySelector('#overlays');
const embedded = new URLSearchParams(location.search).has('embed');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const mediaFine = matchMedia('(hover: hover) and (pointer: fine)');
const names = { A: 'Potret Editorial', B: 'Ruang Percakapan', C: 'Langkah Bersama', D: 'Halaman Pembuka', E: 'Lapisan Kisah' };
const descriptions = { A: 'Dekat. Personal. Tiga sahabat dalam satu bingkai.', B: 'Sebuah ruang untuk duduk, mendengar, dan berbagi.', C: 'Lanskap terbuka. Langkah yang membawa cerita.', D: 'Seperti membuka halaman pertama sebuah buku.', E: 'Foto, bentuk, dan ruang yang bergerak perlahan.' };
let variant = sessionStorage.getItem('arb-variant') || 'E';
let motion = null;
let routeController = null;
let routeCleanup = [];
let renderToken = 0;
let activeRoute = '';
let restoreFocus = null;
const c = key => copy[key]?.text ?? '';
const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const text = key => esc(c(key)).replace(/\n\n/g, '</p><p>').replace(/\n/g, ' <br>');
const asset = name => `${import.meta.env.BASE_URL}assets/${name}`;
const arrow = '<span aria-hidden="true">↗</span>';
const href = path => `#${path}${path.includes('?') ? '&' : '?'}v=${variant}`;
const link = (path, label, cls = 'button') => `<a class="${cls}" href="${href(path)}">${label}${arrow}</a>`;
const homePath = () => `/home/${variant}`;
const img = (file, alt = '', cls = '', eager = false) => `<img class="${cls}" src="${asset(file)}" alt="${esc(alt)}" loading="${eager ? 'eager' : 'lazy'}" decoding="async" ${eager ? 'fetchpriority="high"' : ''}>`;
const brand = () => `<a class="brand" href="${href(homePath())}" aria-label="Aksa Rasa Bumi — Beranda"><span>AKSA RASA BUMI</span><small>SEBUAH RUANG UNTUK MEMAHAMI</small></a>`;

function navLinks() {
  return [[`${homePath()}?section=karakter`, 'Kisah & Karakter'], ['/ebook', 'Ebook'], ['/renungan', 'Renungan'], ['/ngobrol', 'Ngobrol']].map(([path, label]) => `<a ${activeRoute === path ? 'aria-current="page"' : ''} href="${href(path)}">${label}</a>`).join('');
}
function header() {
  return `<header class="site-header"><div class="shell header-inner">${brand()}<nav aria-label="Navigasi utama">${navLinks()}</nav><button class="menu-toggle icon-button" aria-label="Buka menu" aria-haspopup="dialog"><span></span><span></span></button></div><div class="scroll-meter" aria-hidden="true"></div></header>`;
}
function footer() {
  return `<footer class="site-footer"><div class="shell footer-grid"><div>${brand()}<p class="footer-tagline">${text('footer.tagline')}</p><small>${text('footer.world')}</small></div><div><span class="eyebrow">JELAJAHI</span>${link('/ebook', 'Ebook', 'footer-link')}${link('/renungan', 'Renungan', 'footer-link')}${link('/ngobrol', 'Ngobrol', 'footer-link')}</div><div><span class="eyebrow">INFORMASI</span>${link('/tentang-bantuan', 'Tentang & Bantuan', 'footer-link')}${link('/preview', 'Lihat semua alternatif', 'footer-link')}<span class="footer-note">Prototype untuk review<br>Konten & visual masih draft</span></div></div><div class="shell footer-bottom"><span>AKSA · RASA · BUMI</span><span>Sebuah kisah, banyak cara memahami.</span><button class="text-button" data-top>Kembali ke atas ↑</button></div></footer>`;
}
function dock() {
  return embedded ? '' : `<aside class="review-dock" aria-label="Kontrol review prototype"><span class="status-dot" aria-hidden="true"></span><button data-review aria-haspopup="dialog"><span class="dock-label">Preview</span> ${variant} <span aria-hidden="true">·</span> <span class="dock-label">${names[variant]}</span> <span aria-hidden="true">⌘</span></button><a href="${href('/preview')}" aria-label="Buka hub review semua alternatif">A–E ↗</a></aside>`;
}
function heroCopy() {
  return `<div class="hero-copy"><span class="eyebrow hero-enter">${text('home.eyebrow')}</span><h1><span class="line"><span>Kenali mereka.</span></span><span class="line"><span>Temukan kisahnya.</span></span></h1><p class="hero-enter">${text('home.body')}</p><div class="actions hero-enter">${link(`${homePath()}?section=karakter`, c('home.cta.characters'))}${link('/ebook', c('home.cta.ebook'), 'button secondary')}</div></div>`;
}
function hero() {
  const alt = 'Eksplorasi visual tiga sahabat Aksa, Rasa, dan Bumi';
  let art;
  if (variant === 'E') {
    const depth = !reduced.matches && matchMedia('(min-width: 1101px)').matches;
    art = `<div class="hero-art layered-art"><picture class="hero-base"><source media="(max-width: 767px)" srcset="${asset('hero-e-mobile.webp')}">${img('hero-e-static.webp', alt, '', true)}</picture>${depth ? `<div class="depth-layers" aria-hidden="true">${Array.from({ length: 7 }, (_, i) => `<img data-layer="${i}" src="${asset(`hero-e-l0${i}.webp`)}" alt="" decoding="async">`).join('')}</div>` : ''}</div>`;
  } else {
    const key = variant.toLowerCase();
    art = `<div class="hero-art"><picture><source media="(max-width: 767px)" srcset="${asset(`hero-${key}-mobile.webp`)}">${img(`hero-${key}.webp`, alt, '', true)}</picture></div>`;
  }
  return `<section class="hero hero-${variant.toLowerCase()}" aria-label="Pembuka kisah"><div class="hero-layout ${['A', 'B', 'D'].includes(variant) ? 'shell' : ''}">${heroCopy()}${art}</div><div class="hero-caption shell"><span>${variant} / ${names[variant]}</span><span>${text('home.support')}</span><a href="${href(`${homePath()}?section=pengantar`)}" aria-label="Gulir ke pengantar">GULIR UNTUK MENGENAL ↓</a></div></section>`;
}
function portrait(key) {
  return `<div class="portrait portrait-${key}" aria-hidden="true">${img(`portrait-${key}-background.svg`, '', 'portrait-background')}<div class="portrait-window">${img(`portrait-${key}.webp`, '', 'portrait-photo')}</div></div>`;
}
const characters = ['aksa', 'rasa', 'bumi'];
function characterSection() {
  const rows = variant === 'E';
  return `<section class="shell section characters" id="karakter"><div class="section-heading" data-reveal><span class="eyebrow">TIGA PERSPEKTIF</span><h2>${text('characters.title')}</h2><p>${text('characters.caption')}</p></div><div class="${rows ? 'character-rows' : 'character-grid'}">${characters.map((key, i) => `<article class="character-card" data-reveal>${rows ? portrait(key) : `<div class="character-photo">${img(`card-${key}.webp`, c(`character.${key}.name`))}</div>`}<div class="character-copy"><span class="eyebrow">0${i + 1} / TIGA PERSPEKTIF</span><h3>${text(`character.${key}.name`)}</h3><h4>${esc(c(`detail.highlight.${key}`).split('\n')[0])}</h4><p>${text(`character.${key}.body`)}</p>${link('/ebook', c('character.cta'), 'text-link')}</div></article>`).join('')}</div></section>`;
}
function book() {
  return `<div class="book-stage" data-book-stage><div class="book-shadow" aria-hidden="true"></div><div class="book-object" aria-hidden="true"><div class="book-pages"></div><div class="book-spine">AKSA RASA BUMI</div><div class="book-cover"><span class="book-top">AKSA · RASA · BUMI</span><span class="book-title">The Art<br>of <i>Reflecting</i></span><span class="book-symbol"><i></i><i></i><i></i></span><span class="book-bottom">SEBUAH KISAH<br>TIGA SUDUT PANDANG</span></div><div class="book-back"></div></div><div class="book-controls"><span>MOCKUP SAMPUL SEMENTARA</span><button class="icon-button" data-book-turn aria-label="Putar buku" aria-pressed="false">↻</button></div></div>`;
}
function storyBand() {
  return `<section class="shell section"><div class="story-band" data-reveal><div><span class="eyebrow">${text('story.label')}</span><h2>${text('story.title')}</h2></div><div><p>${text('story.short')}</p><small>${text('story.availability')}</small>${link('/ebook/the-art-of-reflecting', c('story.cta'))}</div></div></section>`;
}
function mediaCard(type) {
  const reflection = type === 'reflections';
  const page = reflection ? 'renungan' : 'ngobrol';
  return `<article class="media-card" data-reveal><span class="media-icon" aria-hidden="true">${reflection ? '▷' : '≋'}</span><h3>${text(`home.${type}.title`)}</h3><p>${text(`home.${type}.body`)}</p><div class="media-empty"><strong>${text(`${type}.empty.title`)}</strong><p>${text(`${type}.empty.body`)}</p></div>${link(`/${page}`, c(`home.${type}.cta`), 'text-link')}</article>`;
}
function home() {
  return `${hero()}<section class="shell intro section" id="pengantar"><div class="intro-grid" data-reveal><h2>${text('intro.title')}</h2><p>${text('intro.body')}</p></div><p class="disclosure">${text('about.disclosure')}</p></section>${characterSection()}${storyBand()}<section class="shell section"><div class="section-heading" data-reveal><span class="eyebrow">RUANG UNTUK BERHENTI SEJENAK</span><h2>Renungan & Ngobrol</h2></div><div class="two-grid">${mediaCard('reflections')}${mediaCard('conversations')}</div></section><section class="shell question section" data-reveal><span class="question-mark" aria-hidden="true">“</span><p>${text('intro.question')}</p><span class="eyebrow">PERTANYAAN UNTUK DIBAWA PULANG</span></section>`;
}
function pageHead(title, body, label = 'DUNIA AKSA RASA BUMI') {
  return `<div class="page-heading shell" data-reveal><span class="eyebrow">${label}</span><h1>${title}</h1><p>${body}</p></div>`;
}
function helpBand() {
  return `<div class="help-band" data-reveal><div><h3>${text('catalog.help.title')}</h3><p>${text('catalog.help.body')}</p></div>${link('/tentang-bantuan?section=bantuan', c('catalog.help.cta'), 'button secondary')}</div>`;
}
function catalog() {
  return `${pageHead(text('catalog.title'), text('catalog.body'))}<section class="shell section catalog-feature" data-reveal>${book()}<div class="catalog-copy"><span class="eyebrow">${text('catalog.featured')}</span><h2>The Art of <br><i>Reflecting</i></h2><p>${text('story.summary')}</p><div class="pending-tag"><span aria-hidden="true">◌</span> ${text('story.availability')}</div>${link('/ebook/the-art-of-reflecting', c('story.cta'))}<small>Judul kisah; identitas produk ebook masih menunggu konfirmasi.</small></div></section><section class="shell section"><h2>${text('catalog.collection.title')}</h2><p class="empty-line">${text('catalog.collection.empty')}</p></section><section class="shell section">${helpBand()}</section>`;
}
function faq(key) {
  return `<details class="faq"><summary>${text(`faq.${key}.title`)}<span aria-hidden="true">+</span></summary><div class="faq-answer"><p>${text(`faq.${key}.body`)}</p></div></details>`;
}
function detail() {
  return `<div class="shell breadcrumb">${link('/ebook', '← Kembali ke Ebook', 'back-link')}<span>The Art of Reflecting</span></div><section class="shell section catalog-feature detail-feature" data-reveal>${book()}<div class="catalog-copy"><span class="eyebrow">${text('story.label')}</span><h1>The Art of <br><i>Reflecting</i></h1><p>${text('story.short')}</p><div class="pending-tag">${text('story.availability')}</div>${link('/ebook/the-art-of-reflecting?section=tentang-kisah', c('story.cta'))}<button class="text-button" data-state="purchase">Lihat alur pembelian ${arrow}</button></div></section><section id="tentang-kisah" class="shell section editorial-grid" data-reveal><h2>${text('detail.about.title')}</h2><div class="prose"><p>${text('detail.about.body')}</p><small>Pengantar editorial website, bukan kutipan naskah atau sinopsis resmi.</small></div></section><section class="shell section"><h2 data-reveal>${text('detail.highlights.title')}</h2><div class="three-grid perspective-grid">${characters.map((key, i) => {const [title, body] = c(`detail.highlight.${key}`).split('\n');return `<article data-reveal><span class="eyebrow">0${i + 1} / ${key.toUpperCase()}</span><h3>${esc(title)}</h3><p>${esc(body)}</p></article>`;}).join('')}</div></section><section class="shell section" data-reveal><div class="excerpt-panel"><span class="eyebrow">${text('excerpt.label')}</span><h3>${text('excerpt.empty.title')}</h3><p>${text('excerpt.empty.body')}</p><button class="text-link" data-state="excerpt">Lihat status cuplikan ${arrow}</button></div></section><section class="shell section editorial-grid" data-reveal><h2>${text('purchase.info.title')}</h2><div>${faq('format')}${faq('access')}</div></section><section class="shell section"><div class="help-band" data-reveal><div><h3>${text('purchase.pending.title')}</h3><p>${text('purchase.pending.body')}</p></div>${link('/tentang-bantuan?section=bantuan', 'Lihat Bantuan Ebook', 'button secondary')}</div></section>`;
}
function mediaPage(type) {
  const reflection = type === 'reflections';
  return `${pageHead(text(`${type}.title`), text(`${type}.body`), reflection ? 'RUANG UNTUK MEMPERHATIKAN' : 'RUANG UNTUK MENDENGARKAN')}<section class="shell section"><div class="media-state" data-reveal><div class="abstract-art ${reflection ? 'abstract-video' : 'abstract-audio'}" aria-hidden="true"><span></span><span></span><span></span><i>${reflection ? '▷' : '≋'}</i></div><div><span class="eyebrow">${reflection ? 'RENUNGAN' : 'NGOBROL'}</span><h2>${text(`${type}.empty.title`)}</h2><p>${text(`${type}.empty.body`)}</p><p class="pending-note">${reflection ? 'Video dan tautan YouTube resmi' : 'Episode dan tautan Spotify resmi'} akan ditampilkan setelah materinya dikonfirmasi.</p><button class="text-link" data-state="${reflection ? 'video' : 'audio'}">${reflection ? 'Lihat status video' : 'Lihat status episode'} ${arrow}</button></div></div></section><section class="shell section"><h2 data-reveal>Jelajahi ruang lainnya</h2><div class="two-grid cross-cards">${mediaCard(reflection ? 'conversations' : 'reflections')}<article class="media-card" data-reveal><span class="eyebrow">KISAH PERTAMA MEREKA</span><h3>${text('story.title')}</h3><p>${text('story.short')}</p>${link('/ebook', 'Jelajahi Ebook', 'text-link')}</article></div></section>`;
}
function about() {
  return `${pageHead(text('about.page.title'), text('about.page.body'))}<div class="shell anchor-nav"><a href="${href('/tentang-bantuan?section=tentang')}">Tentang ARB ↓</a><a href="${href('/tentang-bantuan?section=bantuan')}">Bantuan Ebook ↓</a><a href="${href('/tentang-bantuan?section=kontak')}">Kanal Bantuan ↓</a></div><section class="shell section about-image" data-reveal>${img('hero-a.webp', 'Eksplorasi potret Aksa, Rasa, dan Bumi')}</section><section id="tentang" class="shell section editorial-grid" data-reveal><h2>${text('about.title')}</h2><div class="prose"><p>${text('about.body')}</p><p class="disclosure">${text('about.disclosure')}</p></div></section><section id="bantuan" class="shell section editorial-grid" data-reveal><div><span class="eyebrow">INFORMASI UNTUKMU</span><h2>${text('help.title')}</h2><p>${text('help.body')}</p></div><div>${faq('purchase')}${faq('format')}${faq('access')}</div></section><section class="shell section" id="kontak" data-reveal><div class="help-band"><div><h3>${text('help.contact.title')}</h3><p>${text('help.contact.pending')}</p></div>${link('/ebook', c('purchase.pending.cta'), 'button secondary')}</div></section>`;
}
function reviewHub() {
  return `${pageHead('Lima cara membuka kisah.', 'Satu dunia, lima arah visual. Pilih alternatif, lalu jelajahi setiap halaman dalam ukuran layar yang kamu inginkan.', 'RUANG REVIEW / PROTOTYPE 01')}<section class="shell review-notice"><span class="status-dot" aria-hidden="true"></span><p>Draft untuk review client. Buku adalah mockup berbasis kode. Data pembelian, cuplikan, dan media menunggu materi resmi.</p></section><section class="shell section"><div class="variant-gallery">${Object.entries(names).map(([key, name]) => `<article class="variant-tile" data-reveal><a href="${href(`/home/${key}`)}" class="variant-thumbnail" aria-label="Jelajahi alternatif ${key} — ${name}">${img(`preview-${key.toLowerCase()}.webp`, `Preview Home ${key} — ${name}`)}<span class="tile-enter" aria-hidden="true">↗</span></a><div class="tile-title"><span class="variant-letter">${key}</span><h2>${name}</h2></div><p>${descriptions[key]}</p><div class="tile-actions">${link(`/home/${key}`, 'Jelajahi', 'text-link')}<button data-sandbox="${key}">Preview mobile ↗</button></div></article>`).join('')}</div></section><section class="sandbox-section section" id="sandbox"><div class="shell"><div class="section-heading"><span class="eyebrow">SEMUA LAYAR, SATU PERJALANAN</span><h2>Coba prototype-nya.</h2><p>Berinteraksi langsung di dalam layar. Gunakan menu untuk melanjutkan journey.</p></div><div class="sandbox-toolbar"><label>Alternatif<select id="variant-select" aria-label="Alternatif">${Object.entries(names).map(([k,n])=>`<option value="${k}" ${variant===k?'selected':''}>${k} / ${n}</option>`).join('')}</select></label><label>Halaman<select id="page-select" aria-label="Halaman"><option value="/home/">Beranda</option><option value="/ebook">Ebook</option><option value="/ebook/the-art-of-reflecting">Detail kisah</option><option value="/renungan">Renungan</option><option value="/ngobrol">Ngobrol</option><option value="/tentang-bantuan">Tentang & Bantuan</option><option value="/404">404 / Pemulihan</option></select></label><div class="device-switch" role="group" aria-label="Ukuran layar"><button data-width="1440" aria-pressed="true">Desktop</button><button data-width="768" aria-pressed="false">Tablet</button><button data-width="390" aria-pressed="false">Mobile</button></div></div><div class="sandbox-meta"><span id="device-size">1440 × 900</span><a id="sandbox-open" target="_blank" rel="noopener" href="${href(homePath())}">Buka layar penuh ↗</a></div></div><div class="sandbox-stage"><div class="sandbox-device"><iframe title="Preview interaktif" loading="lazy" src="${location.pathname}?embed=1#/home/${variant}"></iframe></div></div></section><section class="shell section journey-section"><span class="eyebrow">PETA JOURNEY</span><h2>Mulai mengenal, lalu menjelajah.</h2><div class="journey-flow">${[['01','Beranda',homePath()],['02','Kisah & Karakter',`${homePath()}?section=karakter`],['03','Ebook','/ebook'],['04','Detail kisah','/ebook/the-art-of-reflecting'],['05','Bantuan','/tentang-bantuan?section=bantuan']].map(([num,label,path])=>`<a href="${href(path)}"><span>${num}</span><strong>${label}</strong>${arrow}</a>`).join('')}</div><p>Renungan dan Ngobrol terhubung lewat navigasi utama. Pembelian eksternal, cuplikan, dan pemutaran media berhenti pada state menunggu materi, sesuai sumber desain.</p></section>`;
}
function notFound() {
  return `<section class="shell not-found"><span class="eyebrow">404 / HALAMAN TIDAK DITEMUKAN</span><h1>Sepertinya kita<br>perlu kembali.</h1><p>Halaman yang kamu cari belum ada di ruang ini.</p><div class="actions">${link(homePath(), 'Kembali ke Beranda')}${link('/preview', 'Lihat semua alternatif', 'button secondary')}</div></section>`;
}

function dialog(content, cls = '', label = 'Informasi prototype') {
  restoreFocus = document.activeElement;
  const el = document.createElement('dialog');
  el.className = `modal ${cls}`;
  el.setAttribute('aria-label', label);
  el.innerHTML = content;
  overlays.append(el);
  el.addEventListener('click', e => { if (e.target === el || e.target.closest('[data-close]')) el.close(); });
  el.addEventListener('close', () => { el.remove(); document.body.classList.remove('dialog-open'); restoreFocus?.focus(); });
  el.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const focusables = [...el.querySelectorAll('button, a[href], select')].filter(n => !n.disabled);
    const first = focusables[0], last = focusables.at(-1);
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  document.body.classList.add('dialog-open');
  el.showModal();
  return el;
}
function menu() {
  dialog(`<div class="menu-head">${brand()}<button class="icon-button" data-close aria-label="Tutup menu">✕</button></div><nav aria-label="Navigasi mobile">${navLinks()}${link('/tentang-bantuan', 'Tentang & Bantuan', '')}</nav><p>${text('footer.tagline')}</p><span class="eyebrow">AKSA · RASA · BUMI</span>`, 'menu-modal', 'Menu navigasi');
}
function reviewDialog() {
  dialog(`<div class="modal-head"><span class="eyebrow">RUANG REVIEW</span><button class="icon-button" data-close aria-label="Tutup review">✕</button></div><h2>Temukan arah<br>yang terasa dekat.</h2><p>Kelima alternatif berbagi journey yang sama. Pilihan ini hanya mengubah preview yang kamu lihat.</p><div class="review-options">${Object.entries(names).map(([k,n])=>`<a href="${href(`/home/${k}`)}" class="${variant===k?'selected':''}"><span>${k}</span><div><strong>${n}</strong><small>${descriptions[k]}</small></div>${arrow}</a>`).join('')}</div>${link('/preview','Bandingkan desktop & mobile','button')}<small>Draft visual dan copy belum menjadi approval final.</small>`, 'review-modal', 'Pilihan alternatif preview');
}
function pendingDialog(type) {
  const states = {
    purchase: [c('purchase.pending.title'), c('purchase.pending.body'), 'Journey yang direncanakan', 'Detail kisah → checkout eksternal resmi → akses dari penyedia. Prototype berhenti di sini karena SKU, harga, format, dan tujuan checkout belum dikonfirmasi.'],
    excerpt: [c('excerpt.empty.title'), c('excerpt.empty.body'), 'Menunggu naskah yang disetujui', 'Tidak ada potongan novel yang ditambahkan sebagai pengganti.'],
    video: [c('reflections.empty.title'), c('reflections.empty.body'), 'Tujuan: YouTube', 'Tautan diaktifkan setelah video dan URL resmi tersedia.'],
    audio: [c('conversations.empty.title'), c('conversations.empty.body'), 'Tujuan: Spotify', 'Tautan diaktifkan setelah episode dan URL resmi tersedia.']
  };
  const [title, body, sub, note] = states[type];
  dialog(`<div class="modal-head"><span class="eyebrow">STATUS MATERI / PREVIEW</span><button class="icon-button" data-close aria-label="Tutup informasi">✕</button></div><div class="pending-orbit" aria-hidden="true">◌</div><h2>${esc(title)}</h2><p>${esc(body)}</p><div class="pending-box"><strong>${esc(sub)}</strong><p>${esc(note)}</p></div><button class="button" data-close>Kembali menjelajah ${arrow}</button>`, 'pending-modal', title);
}
function setupSandbox(signal) {
  const stage = document.querySelector('.sandbox-stage');
  if (!stage) return;
  const frame = stage.querySelector('iframe');
  const device = stage.querySelector('.sandbox-device');
  const alt = document.querySelector('#variant-select');
  const page = document.querySelector('#page-select');
  let width = 1440;
  const resize = () => {
    const scale = Math.min(1, (stage.clientWidth - 32) / width);
    device.style.width = `${width}px`;
    device.style.height = `${width === 390 ? 844 : 900}px`;
    device.style.transform = `scale(${scale})`;
    stage.style.height = `${(width === 390 ? 844 : 900) * scale + 32}px`;
    document.querySelector('#device-size').textContent = `${width} × ${width === 390 ? 844 : 900}`;
  };
  const update = () => {
    const path = page.value === '/home/' ? `/home/${alt.value}` : `${page.value}?v=${alt.value}`;
    frame.src = `${location.pathname}?embed=1#${path}`;
    document.querySelector('#sandbox-open').href = `#${path}`;
  };
  alt.addEventListener('change', update, { signal });
  page.addEventListener('change', update, { signal });
  document.querySelectorAll('[data-width]').forEach(button => button.addEventListener('click', () => {
    width = Number(button.dataset.width);
    document.querySelectorAll('[data-width]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    resize();
  }, { signal }));
  document.querySelectorAll('[data-sandbox]').forEach(button => button.addEventListener('click', () => {
    alt.value = button.dataset.sandbox; page.value = '/home/'; width = 390; update(); resize();
    document.querySelectorAll('[data-width]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.width === '390')));
    document.querySelector('#sandbox').scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth' });
  }, { signal }));
  const observer = new ResizeObserver(resize);
  observer.observe(stage); routeCleanup.push(() => observer.disconnect()); resize();
}
function setupEvents() {
  routeController = new AbortController();
  const { signal } = routeController;
  document.querySelector('.menu-toggle')?.addEventListener('click', menu, { signal });
  document.querySelector('[data-review]')?.addEventListener('click', reviewDialog, { signal });
  document.querySelectorAll('[data-state]').forEach(button => button.addEventListener('click', () => pendingDialog(button.dataset.state), { signal }));
  document.querySelector('[data-top]')?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduced.matches ? 'instant' : 'smooth' }), { signal });
  document.querySelectorAll('[data-book-stage]').forEach(stage => {
    const bookEl = stage.querySelector('.book-object');
    const button = stage.querySelector('[data-book-turn]');
    routeCleanup.push(() => gsap.killTweensOf(bookEl));
    reduced.addEventListener('change', () => {
      if (!reduced.matches) return;
      gsap.killTweensOf(bookEl);
      gsap.set(bookEl, { rotateX: 0, rotateY: button.getAttribute('aria-pressed') === 'true' ? -155 : -22 });
    }, { signal });
    button.addEventListener('click', () => {
      const turned = button.getAttribute('aria-pressed') !== 'true';
      button.setAttribute('aria-pressed', String(turned));
      if (reduced.matches) { bookEl.style.transform = `rotateY(${turned ? -155 : -22}deg)`; return; }
      gsap.to(bookEl, { rotateY: turned ? -155 : -22, rotateX: turned ? 0 : 7, duration: 1.1, ease: 'power3.inOut', overwrite: true });
    }, { signal });
    stage.addEventListener('pointermove', e => {
      if (!mediaFine.matches || reduced.matches || button.getAttribute('aria-pressed') === 'true') return;
      const r = stage.getBoundingClientRect();
      gsap.to(bookEl, { rotateY: -22 + ((e.clientX-r.left)/r.width-.5)*16, rotateX: 7-((e.clientY-r.top)/r.height-.5)*12, duration:.6, overwrite:true });
    }, { signal });
    stage.addEventListener('pointerleave', () => {
      if (!reduced.matches && button.getAttribute('aria-pressed') !== 'true') gsap.to(bookEl,{ rotateY:-22,rotateX:7,duration:.8 });
    }, { signal });
  });
  setupSandbox(signal);
  document.querySelectorAll('details').forEach(details => details.addEventListener('toggle', () => {
    if (details.open && !reduced.matches) gsap.fromTo(details.querySelector('.faq-answer'),{ opacity:0,y:-6 },{ opacity:1,y:0,duration:.3 });
  }, { signal }));
}
function animate() {
  motion = gsap.matchMedia();
  motion.add({ motionOK:'(prefers-reduced-motion: no-preference)', desktop:'(min-width: 768px)' }, context => {
    if (!context.conditions.motionOK) return;
    const magneticCleanup = [];
    gsap.from('.hero .line > span', { yPercent:105, duration:1.05, stagger:.12, ease:'power4.out', clearProps:'transform' });
    gsap.from('.hero-enter', { y:18, opacity:0, duration:.8, stagger:.1, delay:.25, clearProps:'all' });
    gsap.from('.hero-art', { opacity:0, duration:1.1, ease:'power2.out' });
    gsap.utils.toArray('[data-reveal]').forEach(el => {
      // Only hide a section when it is about to enter, preserving readable distant content.
      gsap.from(el, { y:32, opacity:0, duration:.85, ease:'power3.out', clearProps:'all', scrollTrigger:{ trigger:el,start:'top 96%',once:true } });
    });
    gsap.to('.scroll-meter', { scaleX:1,ease:'none',scrollTrigger:{start:0,end:'max',scrub:true} });
    if (context.conditions.desktop) gsap.utils.toArray('.portrait-background').forEach(el => {
      gsap.from(el, { scale:.92,rotate:-4,duration:1.4,ease:'power3.out',clearProps:'all',scrollTrigger:{trigger:el,start:'top 85%',once:true} });
    });
    if (context.conditions.desktop && variant === 'E' && document.querySelector('.depth-layers')) {
      const travels = [0,0,-1,-2,0,1,2];
      const width = document.querySelector('.layered-art').clientWidth;
      document.querySelectorAll('[data-layer]').forEach((el,i) => {
        if (travels[i]) gsap.to(el,{ y:travels[i]*width/1672,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:1} });
      });
    }
    if (mediaFine.matches) document.querySelectorAll('.button').forEach(button => {
      const move = e => { if(reduced.matches || !mediaFine.matches)return;const r=button.getBoundingClientRect();gsap.to(button,{x:(e.clientX-r.left-r.width/2)*.06,y:(e.clientY-r.top-r.height/2)*.12,duration:.4,overwrite:true}); };
      const leave = () => { if(!reduced.matches)gsap.to(button,{x:0,y:0,duration:.6,ease:'elastic.out(1,.4)'}); };
      button.addEventListener('pointermove',move);button.addEventListener('pointerleave',leave);
      magneticCleanup.push(()=>{button.removeEventListener('pointermove',move);button.removeEventListener('pointerleave',leave);gsap.killTweensOf(button);gsap.set(button,{clearProps:'transform'});});
    });
    return () => magneticCleanup.forEach(cleanup => cleanup());
  });
}
async function render(initial = false) {
  const token = ++renderToken;
  const [rawPath, query = ''] = location.hash.slice(1).split('?');
  const path = rawPath || '/home/E';
  const params = new URLSearchParams(query);
  const match = path.match(/^\/home\/([A-E])$/);
  const nextVariant = match?.[1] || params.get('v');
  if (names[nextVariant]) variant = nextVariant;
  sessionStorage.setItem('arb-variant', variant);
  const section = params.get('section');
  if (!initial && activeRoute === path && section) {
    gsap.killTweensOf('.route-veil');
    gsap.set('.route-veil', { scaleY: 0 });
    document.querySelectorAll('dialog').forEach(d=>d.close());
    document.getElementById(section)?.scrollIntoView({behavior:reduced.matches?'instant':'smooth'});
    return;
  }
  document.querySelectorAll('dialog').forEach(d=>d.close());
  if (!initial && !reduced.matches && !embedded) await gsap.to('.route-veil',{scaleY:1,transformOrigin:'bottom',duration:.25,ease:'power3.in'});
  if (token !== renderToken) return;
  motion?.revert();routeController?.abort();routeCleanup.forEach(fn=>fn());routeCleanup=[];
  activeRoute = path;
  let content, title;
  if (match || path === '/') { content=home(); title=`${variant} · ${names[variant]}`; }
  else if (path === '/ebook') {content=catalog();title='Ebook';}
  else if (path === '/ebook/the-art-of-reflecting') {content=detail();title='The Art of Reflecting';}
  else if (path === '/renungan') {content=mediaPage('reflections');title='Renungan';}
  else if (path === '/ngobrol') {content=mediaPage('conversations');title='Ngobrol';}
  else if (path === '/tentang-bantuan') {content=about();title='Tentang & Bantuan';}
  else if (path === '/preview') {content=reviewHub();title='Ruang review · A–E';}
  else {content=notFound();title='404';}
  document.title = `${title} — Aksa Rasa Bumi`;
  document.body.dataset.variant=variant;
  document.body.classList.toggle('embedded',embedded);
  app.innerHTML=`${header()}<main id="main" tabindex="-1">${content}</main>${footer()}${dock()}`;
  window.scrollTo(0,0);
  setupEvents();animate();
  if (!initial) {
    document.querySelector('main').focus({preventScroll:true});
    document.querySelector('#announcer').textContent=`Halaman ${title}`;
  }
  gsap.to('.route-veil',{scaleY:0,transformOrigin:'top',duration:reduced.matches?0:.45,ease:'power3.out'});
  if(section) requestAnimationFrame(()=>document.getElementById(section)?.scrollIntoView({behavior:'instant'}));
}
function welcome() {
  if (embedded || reduced.matches || sessionStorage.getItem('arb-welcome') === 'seen' || activeRoute === '/preview') return;
  sessionStorage.setItem('arb-welcome','seen');
  const el = document.createElement('div');
  el.className='welcome';el.setAttribute('role','dialog');el.setAttribute('aria-label','Pembuka prototype');el.setAttribute('aria-modal','true');
  el.innerHTML='<div class="welcome-lines"><span>AKSA</span><span>RASA</span><span>BUMI</span></div><p>Satu kisah. Tiga cara memahaminya.</p><button class="text-button">Lewati pembuka ↗</button>';
  document.body.append(el);
  app.inert=true;
  let done=false;
  const close=()=>{if(done)return;done=true;gsap.killTweensOf(el);app.inert=false;gsap.to(el,{yPercent:-100,duration:.65,ease:'power3.inOut',onComplete:()=>el.remove()});};
  el.querySelector('button').addEventListener('click',close);el.querySelector('button').focus();
  el.addEventListener('keydown',e=>{if(e.key==='Escape')close();if(e.key==='Tab')e.preventDefault();});
  gsap.from('.welcome-lines span',{y:40,opacity:0,stagger:.14,duration:.8,ease:'power3.out'});
  gsap.delayedCall(1.8,close);
}
window.addEventListener('hashchange',()=>render());
document.addEventListener('click',e=>{
  const anchor=e.target.closest('a');
  if(anchor?.getAttribute('href')===location.hash){document.querySelectorAll('dialog').forEach(d=>d.close());const q=location.hash.split('?')[1];const section=new URLSearchParams(q).get('section');if(section)document.getElementById(section)?.scrollIntoView({behavior:reduced.matches?'instant':'smooth'});}
  if(anchor?.getAttribute('href')==='#main'){e.preventDefault();document.querySelector('main').focus();document.querySelector('main').scrollIntoView();}
});
await render(true);
welcome();
