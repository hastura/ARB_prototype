import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { language, validLanguage, resolveLanguage, setLanguage, copyText, t, localizedPath } from './i18n';
import { miniPreview } from './mini-preview';
import { renderFeedbackHome, mountFeedbackMotion } from './feedback-designs';
import { mountCharacterCinema } from './character-cinema';
import { renderCharacterNative, mountCharacterNative } from './character-native';
import './mini-preview.css';
import './style.css';
import './feedback-overrides.css';
import './feedback-designs.css';
import './character-cinema.css';
import './character-native.css';
import './fullbleed-cinema.css';

gsap.registerPlugin(ScrollTrigger);
const app = document.querySelector('#app');
const overlays = document.querySelector('#overlays');
const embedded = new URLSearchParams(location.search).has('embed');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const mediaFine = matchMedia('(hover: hover) and (pointer: fine)');
const names = { A: 'Potret Editorial', B: 'Ruang Percakapan', C: 'Langkah Bersama', D: 'Halaman Pembuka', E: 'Lapisan Kisah', F: 'Ruang Bersama', G: 'Sinema Amber', H: 'Kolase Amber' };
const reviewEntries = () => ['F', 'G', 'H', 'A', 'B', 'C', 'D', 'E'].map(key => [key, names[key]]);
const descriptions = { A: 'Dekat. Personal. Tiga sahabat dalam satu bingkai.', B: 'Sebuah ruang untuk duduk, mendengar, dan berbagi.', C: 'Lanskap terbuka. Langkah yang membawa cerita.', D: 'Seperti membuka halaman pertama sebuah buku.', E: 'Foto, bentuk, dan ruang yang bergerak perlahan.', F: 'Kolase ruang hangat, ritme editorial, dan buku yang melayang.', G: 'Cahaya amber, film sinematik, dan komposisi yang luas.', H: 'Lapisan potret, bidang diagonal, dan perjalanan scroll yang menyatu.' };
let variant = sessionStorage.getItem('arb-variant') || 'E';
let motion = null;
let routeController = null;
let routeCleanup = [];
let renderToken = 0;
let activeRoute = '';
let restoreFocus = null;
const c = copyText;
const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const text = key => esc(c(key)).replace(/\n\n/g, '</p><p>').replace(/\n/g, ' <br>');
const asset = name => `${import.meta.env.BASE_URL}assets/${name}`;
const arrow = '<span aria-hidden="true">↗</span>';
const href = path => `#${localizedPath(path, variant)}`;
const link = (path, label, cls = 'button') => `<a class="${cls}" href="${href(path)}">${t(label)}${arrow}</a>`;
const homePath = () => `/home/${variant}`;
const img = (file, alt = '', cls = '', eager = false) => `<img class="${cls}" src="${asset(file)}" alt="${esc(t(alt))}" loading="${eager ? 'eager' : 'lazy'}" decoding="async" ${eager ? 'fetchpriority="high"' : ''}>`;
const brand = () => `<a class="brand" href="${href(homePath())}" aria-label="Aksa Rasa Bumi — ${c('nav.home')}"><span>AKSA RASA BUMI</span></a>`;

function languageSwitch() {
  return `<div class="language-switch" role="group" aria-label="${language === 'en' ? 'Language' : 'Bahasa'}">${['en', 'id'].map(code => `<button type="button" data-language="${code}" lang="${code}" aria-pressed="${language === code}" title="${code === 'en' ? 'English' : 'Bahasa Indonesia'}">${code.toUpperCase()}</button>`).join('')}</div>`;
}

function navLinks() {
  return [['/tentang-bantuan', c('nav.help')], ['/ebook', c('nav.ebook')], ['/renungan', c('nav.reflections')]].map(([path, label]) => `<a ${activeRoute === path ? 'aria-current="page"' : ''} href="${href(path)}">${label}</a>`).join('');
}
function header() {
  return `<header class="site-header"><div class="shell header-inner">${brand()}<nav aria-label="${t('Navigasi utama')}">${navLinks()}</nav><div class="header-tools">${languageSwitch()}<button class="menu-toggle icon-button" aria-label="${c('nav.open')}" aria-haspopup="dialog"><span></span><span></span></button></div></div><div class="scroll-meter" aria-hidden="true"></div></header>`;
}
function footer() {
  return `<footer class="site-footer"><div class="shell footer-grid"><div>${brand()}</div><div><span class="eyebrow">${t('JELAJAHI')}</span>${link('/tentang-bantuan', c('nav.help'), 'footer-link')}${link('/ebook', c('nav.ebook'), 'footer-link')}${link('/renungan', c('nav.reflections'), 'footer-link')}</div><div><span class="eyebrow">${t('INFORMASI')}</span>${[['instagram','Instagram'],['youtube','YouTube'],['spotify','Spotify'],['tiktok','TikTok']].map(([key,label])=>`<button class="footer-link social-link" data-social="${key}" aria-haspopup="dialog">${label}${arrow}</button>`).join('')}</div></div><div class="shell footer-bottom"><span>AKSA · RASA · BUMI</span>${link('/preview', 'Lihat semua alternatif', 'footer-review-link')}<button class="text-button" data-top>${t('Kembali ke atas ↑')}</button></div></footer>`;
}
function dock() {
  return embedded ? '' : `<aside class="review-dock" aria-label="${t("Kontrol review prototype")}"><span class="status-dot" aria-hidden="true"></span><button data-review aria-haspopup="dialog"><span class="dock-label">Preview</span> ${variant} <span aria-hidden="true">·</span> <span class="dock-label">${t(names[variant])}</span> <span aria-hidden="true">⌘</span></button><a href="${href('/preview')}" aria-label="${t("Buka hub review semua alternatif")}">A–H ↗</a></aside>`;
}
function heroCopy() {
  return `<div class="hero-copy"><span class="eyebrow hero-enter">${text('home.eyebrow')}</span><h1>${c('home.title').split('\n').map(line => `<span class="line"><span>${esc(line)}</span></span>`).join(' ')}</h1><p class="hero-enter">${text('home.body')}</p><div class="actions hero-enter">${link(`${homePath()}?section=karakter`, c('home.cta.characters'))}${link('/ebook', c('home.cta.ebook'), 'button secondary')}</div></div>`;
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
  return `<section class="hero hero-${variant.toLowerCase()}" aria-label="${t("Pembuka kisah")}"><div class="hero-layout ${['A', 'B', 'D'].includes(variant) ? 'shell' : ''}">${heroCopy()}${art}</div><div class="hero-caption shell"><span>${variant} / ${t(names[variant])}</span><span>${text('home.support')}</span><a href="${href(`${homePath()}?section=pengantar`)}" aria-label="${t("Gulir ke pengantar")}">${t("GULIR UNTUK MENGENAL ↓")}</a></div></section>`;
}
function portrait(key) {
  return `<div class="portrait portrait-${key}" aria-hidden="true">${img(`portrait-${key}-background.svg`, '', 'portrait-background')}<div class="portrait-window">${img(`portrait-${key}.webp`, '', 'portrait-photo')}</div></div>`;
}
const characters = ['aksa', 'rasa', 'bumi'];
function characterSection() {
  if ('AB'.includes(variant)) return renderCharacterNative({ language, c });
  const rows = variant === 'E';
  return `<section class="shell section characters" id="karakter"><div class="section-heading" data-reveal><span class="eyebrow">${t("TIGA PERSPEKTIF")}</span><h2>${text('characters.title')}</h2><p>${text('characters.caption')}</p></div><div class="${rows ? 'character-rows' : 'character-grid'}">${characters.map((key, i) => `<article class="character-card" data-reveal>${rows ? portrait(key) : `<div class="character-photo">${img(`card-${key}.webp`, c(`character.${key}.name`))}</div>`}<div class="character-copy"><span class="eyebrow">0${i + 1} / ${t("TIGA PERSPEKTIF")}</span><h3>${text(`character.${key}.name`)}</h3><h4>${esc(c(`detail.highlight.${key}`).split('\n')[0])}</h4><p>${text(`character.${key}.body`)}</p>${link('/ebook', c('character.cta'), 'text-link')}</div></article>`).join('')}</div></section>`;
}
function book() {
  return `<div class="book-stage" data-book-stage><div class="book-shadow" aria-hidden="true"></div><div class="book-object" aria-hidden="true"><div class="book-pages"></div><div class="book-inner"><span>AKSA · RASA · BUMI</span><strong>The Art of<br><i>Reflecting</i></strong><small>${t('CUPLIKAN MENUNGGU MATERI')}</small></div><div class="book-spine">AKSA RASA BUMI</div><div class="book-cover"><span class="book-top">AKSA · RASA · BUMI</span><span class="book-title">The Art<br>of <i>Reflecting</i></span><span class="book-symbol"><i></i><i></i><i></i></span><span class="book-bottom">${t('SEBUAH KISAH')}<br>${t('TIGA SUDUT PANDANG')}</span></div><div class="book-back"></div></div><div class="book-controls"><span>${t('MOCKUP SAMPUL SEMENTARA')}</span><div class="book-actions"><button class="text-button" data-book-open aria-expanded="false">${t('Buka buku')}</button><button class="icon-button" data-book-turn aria-label="${t('Putar buku')}" aria-pressed="false">↻</button></div><p class="book-open-note" hidden>${esc(c('excerpt.empty.title'))} ${esc(c('excerpt.empty.body'))}</p></div></div>`;
}
function storyBand() {
  return `<section class="shell section"><div class="story-band floating-story" data-reveal>${book()}<div><span class="eyebrow">${text('story.label')}</span><h2>${text('story.title')}</h2><p>${text('story.short')}</p><small>${text('story.availability')}</small>${link('/ebook/the-art-of-reflecting', c('story.cta'))}</div></div></section>`;
}
function mediaCard(type) {
  const reflection = type === 'reflections';
  const page = reflection ? 'renungan' : 'ngobrol';
  return `<article class="media-card" data-reveal><span class="media-icon" aria-hidden="true">${reflection ? '▷' : '≋'}</span><h3>${text(`home.${type}.title`)}</h3><p>${text(`home.${type}.body`)}</p><div class="media-empty"><strong>${text(`${type}.empty.title`)}</strong><p>${text(`${type}.empty.body`)}</p></div>${link(`/${page}`, c(`home.${type}.cta`), 'text-link')}</article>`;
}
function home() {
  if ('FGH'.includes(variant)) return renderFeedbackHome({ variant, language, c, t, href, link, img, book });
  return `${hero()}<section class="shell intro section" id="pengantar"><div class="intro-grid" data-reveal><h2>${text('intro.title')}</h2><p>${text('intro.body')}</p></div></section>${characterSection()}${storyBand()}<section class="shell section reflection-feature"><div class="section-heading" data-reveal><span class="eyebrow">${t('RUANG UNTUK BERHENTI SEJENAK')}</span><h2>${text('home.reflections.title')}</h2></div>${mediaCard('reflections')}</section><section class="shell question section" data-reveal><span class="eyebrow">${t('PERTANYAAN UNTUK DIBAWA PULANG')}</span><p>${text('intro.question')}</p></section>`;
}
function pageHead(title, body, label = 'DUNIA AKSA RASA BUMI') {
  return `<div class="page-heading shell" data-reveal><span class="eyebrow">${t(label)}</span><h1>${t(title)}</h1><p>${t(body)}</p></div>`;
}
function helpBand() {
  return `<div class="help-band" data-reveal><div><h3>${text('catalog.help.title')}</h3><p>${text('catalog.help.body')}</p></div>${link('/tentang-bantuan?section=bantuan', c('catalog.help.cta'), 'button secondary')}</div>`;
}
function catalog() {
  return `${pageHead(text('catalog.title'), text('catalog.body'))}<section class="shell section catalog-feature" data-reveal>${book()}<div class="catalog-copy"><span class="eyebrow">${text('catalog.featured')}</span><h2>The Art of <br><i>Reflecting</i></h2><p>${text('story.summary')}</p><div class="pending-tag"><span aria-hidden="true">◌</span> ${text('story.availability')}</div>${link('/ebook/the-art-of-reflecting', c('story.cta'))}<small>${t("Judul kisah; identitas produk ebook masih menunggu konfirmasi.")}</small></div></section><section class="shell section"><h2>${text('catalog.collection.title')}</h2><p class="empty-line">${text('catalog.collection.empty')}</p></section><section class="shell section">${helpBand()}</section>`;
}
function faq(key) {
  return `<details class="faq"><summary>${text(`faq.${key}.title`)}<span aria-hidden="true">+</span></summary><div class="faq-answer"><p>${text(`faq.${key}.body`)}</p></div></details>`;
}
function detail() {
  return `<div class="shell breadcrumb">${link('/ebook', '← Kembali ke Ebook', 'back-link')}<span>The Art of Reflecting</span></div><section class="shell section catalog-feature detail-feature" data-reveal>${book()}<div class="catalog-copy"><span class="eyebrow">${text('story.label')}</span><h1>The Art of <br><i>Reflecting</i></h1><p>${text('story.short')}</p><div class="pending-tag">${text('story.availability')}</div>${link('/ebook/the-art-of-reflecting?section=tentang-kisah', c('story.cta'))}<button class="text-button" data-state="purchase">${t("Lihat alur pembelian")} ${arrow}</button></div></section><section id="tentang-kisah" class="shell section editorial-grid" data-reveal><h2>${text('detail.about.title')}</h2><div class="prose"><p>${text('detail.about.body')}</p><small>${t("Pengantar editorial website, bukan kutipan naskah atau sinopsis resmi.")}</small></div></section><section class="shell section"><h2 data-reveal>${text('detail.highlights.title')}</h2><div class="three-grid perspective-grid">${characters.map((key, i) => {const [title, body] = c(`detail.highlight.${key}`).split('\n');return `<article data-reveal><span class="eyebrow">0${i + 1} / ${key.toUpperCase()}</span><h3>${esc(title)}</h3><p>${esc(body)}</p></article>`;}).join('')}</div></section><section class="shell section" data-reveal><div class="excerpt-panel"><span class="eyebrow">${text('excerpt.label')}</span><h3>${text('excerpt.empty.title')}</h3><p>${text('excerpt.empty.body')}</p><button class="text-link" data-state="excerpt">${t("Lihat status cuplikan")} ${arrow}</button></div></section><section class="shell section editorial-grid" data-reveal><h2>${text('purchase.info.title')}</h2><div>${faq('format')}${faq('access')}</div></section><section class="shell section"><div class="help-band" data-reveal><div><h3>${text('purchase.pending.title')}</h3><p>${text('purchase.pending.body')}</p></div>${link('/tentang-bantuan?section=bantuan', 'Lihat Bantuan Ebook', 'button secondary')}</div></section>`;
}
function mediaPage(type) {
  const reflection = type === 'reflections';
  return `${pageHead(text(`${type}.title`), text(`${type}.body`), reflection ? 'RUANG UNTUK MEMPERHATIKAN' : 'RUANG UNTUK MENDENGARKAN')}<section class="shell section"><div class="media-state" data-reveal><div class="abstract-art ${reflection ? 'abstract-video' : 'abstract-audio'}" aria-hidden="true"><span></span><span></span><span></span><i>${reflection ? '▷' : '≋'}</i></div><div><span class="eyebrow">${t(reflection ? "RENUNGAN" : "NGOBROL")}</span><h2>${text(`${type}.empty.title`)}</h2><p>${text(`${type}.empty.body`)}</p><p class="pending-note">${t(reflection ? "Video dan tautan YouTube resmi akan ditampilkan setelah materinya dikonfirmasi." : "Episode dan tautan Spotify resmi akan ditampilkan setelah materinya dikonfirmasi.")}</p><button class="text-link" data-state="${reflection ? 'video' : 'audio'}">${t(reflection ? "Lihat status video" : "Lihat status episode")} ${arrow}</button></div></div></section><section class="shell section"><h2 data-reveal>${t("Jelajahi ruang lainnya")}</h2><div class="two-grid cross-cards">${reflection ? aboutCrossCard() : mediaCard('reflections')}<article class="media-card" data-reveal><span class="eyebrow">${t("KISAH PERTAMA MEREKA")}</span><h3>${text('story.title')}</h3><p>${text('story.short')}</p>${link('/ebook', 'Jelajahi Ebook', 'text-link')}</article></div></section>`;
}
function aboutCrossCard() {
  return `<article class="media-card" data-reveal><span class="eyebrow">AKSA · RASA · BUMI</span><h3>${text('about.page.title')}</h3><p>${text('about.page.body')}</p>${link('/tentang-bantuan', c('nav.help'), 'text-link')}</article>`;
}
function reviewThumbnail(key) {
  if (!'FGH'.includes(key)) return miniPreview(key, c, asset);
  const media = { F: 'living-room', G: 'amber-cinematic', H: 'amber-collage' }[key];
  return `<div class="motion-mini" aria-hidden="true">${img(`feedback-v02/${media}-poster.webp`)}<span><small>GSAP / SCROLL</small>${esc(c('home.title')).replace(/\n/g, ' ')}</span></div>`;
}
function about() {
  return `${pageHead(text('about.page.title'), text('about.page.body'))}<div class="shell anchor-nav"><a href="${href('/tentang-bantuan?section=tentang')}">${t("Tentang ARB ↓")}</a><a href="${href('/tentang-bantuan?section=bantuan')}">${t("Bantuan Ebook ↓")}</a><a href="${href('/tentang-bantuan?section=kontak')}">${t("Kanal Bantuan ↓")}</a></div><section class="shell section about-image" data-reveal>${img('hero-a.webp', 'Eksplorasi potret Aksa, Rasa, dan Bumi')}</section><section id="tentang" class="shell section editorial-grid" data-reveal><h2>${text('about.title')}</h2><div class="prose"><p>${text('about.body')}</p></div></section><section id="bantuan" class="shell section editorial-grid" data-reveal><div><span class="eyebrow">${t("INFORMASI UNTUKMU")}</span><h2>${text('help.title')}</h2><p>${text('help.body')}</p></div><div>${faq('purchase')}${faq('format')}${faq('access')}</div></section><section class="shell section" id="kontak" data-reveal><div class="help-band"><div><h3>${text('help.contact.title')}</h3><p>${text('help.contact.pending')}</p></div>${link('/ebook', c('purchase.pending.cta'), 'button secondary')}</div></section>`;
}
function reviewHub() {
  return `${pageHead('Delapan cara membuka kisah.', 'Satu dunia, delapan arah visual. Pilih alternatif, lalu jelajahi setiap halaman dalam ukuran layar yang kamu inginkan.', 'RUANG REVIEW / PROTOTYPE 01')}<section class="shell review-notice"><span class="status-dot" aria-hidden="true"></span><p>${t("Draft untuk review client. Buku adalah mockup berbasis kode. Data pembelian, cuplikan, dan media menunggu materi resmi.")}</p></section><section class="shell section"><div class="variant-gallery">${reviewEntries().map(([key, name]) => `<article class="variant-tile" data-reveal><a href="${href(`/home/${key}`)}" class="variant-thumbnail" aria-label="${t("Jelajahi alternatif")} ${key} — ${t(name)}">${reviewThumbnail(key)}<span class="tile-enter" aria-hidden="true">↗</span></a><div class="tile-title"><span class="variant-letter">${key}</span><h2>${t(name)}</h2></div><p>${t(descriptions[key])}</p><div class="tile-actions">${link(`/home/${key}`, 'Jelajahi', 'text-link')}<button data-sandbox="${key}">${t("Preview mobile ↗")}</button></div></article>`).join('')}</div></section><section class="sandbox-section section" id="sandbox"><div class="shell"><div class="section-heading"><span class="eyebrow">${t("SEMUA LAYAR, SATU PERJALANAN")}</span><h2>${t("Coba prototype-nya.")}</h2><p>${t("Berinteraksi langsung di dalam layar. Gunakan menu untuk melanjutkan journey.")}</p></div><div class="sandbox-toolbar"><label>${t("Alternatif")}<select id="variant-select" aria-label="${t("Alternatif")}">${Object.entries(names).map(([k,n])=>`<option value="${k}" ${variant===k?'selected':''}>${k} / ${t(n)}</option>`).join('')}</select></label><label>${t("Halaman")}<select id="page-select" aria-label="${t("Halaman")}"><option value="/home/">${t("Beranda")}</option><option value="/ebook">${t("Ebook")}</option><option value="/ebook/the-art-of-reflecting">${t("Detail kisah")}</option><option value="/renungan">${t("Renungan")}</option><option value="/tentang-bantuan">${t("Tentang kami")}</option><option value="/404">${t("404 / Pemulihan")}</option></select></label><div class="device-switch" role="group" aria-label="${t("Ukuran layar")}"><button data-width="1440" aria-pressed="true">Desktop</button><button data-width="768" aria-pressed="false">Tablet</button><button data-width="390" aria-pressed="false">Mobile</button></div></div><div class="sandbox-meta"><span id="device-size">1440 × 900</span><a id="sandbox-open" target="_blank" rel="noopener" href="${href(homePath())}">${t("Buka layar penuh ↗")}</a></div></div><div class="sandbox-stage"><div class="sandbox-device"><iframe title="${t("Preview interaktif")}" loading="lazy" src="${location.pathname}?embed=1#${localizedPath(`/home/${variant}`, variant)}"></iframe></div></div></section><section class="shell section journey-section"><span class="eyebrow">${t("PETA JOURNEY")}</span><h2>${t("Mulai mengenal, lalu menjelajah.")}</h2><div class="journey-flow">${[['01','Beranda',homePath()],['02','Tentang kami','/tentang-bantuan'],['03','Ebook','/ebook'],['04','Detail kisah','/ebook/the-art-of-reflecting'],['05','Renungan','/renungan']].map(([num,label,path])=>`<a href="${href(path)}"><span>${num}</span><strong>${t(label)}</strong>${arrow}</a>`).join('')}</div><p>${t("Navigasi saat ini berfokus pada Tentang kami, Ebook, dan Renungan. Pembelian, cuplikan, serta media tetap menunggu materi resmi.")}</p></section>`;
}
function notFound() {
  return `<section class="shell not-found"><span class="eyebrow">${t("404 / HALAMAN TIDAK DITEMUKAN")}</span><h1>${t("Sepertinya kita")}<br>${t("perlu kembali.")}</h1><p>${t("Halaman yang kamu cari belum ada di ruang ini.")}</p><div class="actions">${link(homePath(), 'Kembali ke Beranda')}${link('/preview', 'Lihat semua alternatif', 'button secondary')}</div></section>`;
}

function dialog(content, cls = '', label = 'Informasi prototype') {
  restoreFocus = document.activeElement;
  const el = document.createElement('dialog');
  el.className = `modal ${cls}`;
  el.setAttribute('aria-label', t(label));
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
  dialog(`<div class="menu-head">${brand()}<button class="icon-button" data-close aria-label="${t("Tutup menu")}">✕</button></div><nav aria-label="${t("Navigasi mobile")}">${navLinks()}</nav><span class="eyebrow">AKSA · RASA · BUMI</span>`, 'menu-modal', 'Menu navigasi');
}
function reviewDialog() {
  dialog(`<div class="modal-head"><span class="eyebrow">${t("RUANG REVIEW")}</span><button class="icon-button" data-close aria-label="${t("Tutup review")}">✕</button></div><h2>${t("Temukan arah")}<br>${t("yang terasa dekat.")}</h2><p>${t("Kedelapan alternatif berbagi journey yang sama. Pilihan ini hanya mengubah preview yang kamu lihat.")}</p><div class="review-options">${Object.entries(names).map(([k,n])=>`<a href="${href(`/home/${k}`)}" class="${variant===k?'selected':''}"><span>${k}</span><div><strong>${t(n)}</strong><small>${t(descriptions[k])}</small></div>${arrow}</a>`).join('')}</div>${link('/preview','Bandingkan desktop & mobile','button')}<small>${t("Draft visual dan copy belum menjadi approval final.")}</small>`, 'review-modal', 'Pilihan alternatif preview');
}
function pendingDialog(type) {
  const states = {
    purchase: [c('purchase.pending.title'), c('purchase.pending.body'), 'Journey yang direncanakan', 'Detail kisah → checkout eksternal resmi → akses dari penyedia. Prototype berhenti di sini karena SKU, harga, format, dan tujuan checkout belum dikonfirmasi.'],
    excerpt: [c('excerpt.empty.title'), c('excerpt.empty.body'), 'Menunggu naskah yang disetujui', 'Tidak ada potongan novel yang ditambahkan sebagai pengganti.'],
    video: [c('reflections.empty.title'), c('reflections.empty.body'), 'Tujuan: YouTube', 'Tautan diaktifkan setelah video dan URL resmi tersedia.'],
    audio: [c('conversations.empty.title'), c('conversations.empty.body'), 'Tujuan: Spotify', 'Tautan diaktifkan setelah episode dan URL resmi tersedia.']
  };
  const [title, body, sub, note] = states[type];
  dialog(`<div class="modal-head"><span class="eyebrow">${t("STATUS MATERI / PREVIEW")}</span><button class="icon-button" data-close aria-label="${t("Tutup informasi")}">✕</button></div><div class="pending-orbit" aria-hidden="true">◌</div><h2>${esc(title)}</h2><p>${esc(body)}</p><div class="pending-box"><strong>${esc(t(sub))}</strong><p>${esc(t(note))}</p></div><button class="button" data-close>${t("Kembali menjelajah")} ${arrow}</button>`, 'pending-modal', title);
}
function socialDialog(key) {
  const channel = { instagram: 'Instagram', youtube: 'YouTube', spotify: 'Spotify', tiktok: 'TikTok' }[key];
  if (!channel) return;
  const title = t('Tautan resmi belum tersedia.');
  dialog(`<div class="modal-head"><span class="eyebrow">${channel} / ${t('PREVIEW SOSIAL')}</span><button class="icon-button" data-close aria-label="${t('Tutup informasi')}">✕</button></div><h2>${title}</h2><p>${t('Kanal ini masih berupa dummy untuk preview. Tautan akun resmi akan dipasang setelah tersedia.')}</p><button class="button" data-close>${t('Kembali menjelajah')}${arrow}</button>`, 'pending-modal', title);
}
function setupSandbox(signal, saved) {
  const stage = document.querySelector('.sandbox-stage');
  if (!stage) return;
  const frame = stage.querySelector('iframe');
  const device = stage.querySelector('.sandbox-device');
  const alt = document.querySelector('#variant-select');
  const page = document.querySelector('#page-select');
  let width = saved?.width || 1440;
  if (saved?.alternative) alt.value = saved.alternative;
  if (saved?.page) page.value = saved.page;
  const resize = () => {
    const scale = Math.min(1, (stage.clientWidth - 32) / width);
    device.style.width = `${width}px`;
    device.style.height = `${width === 390 ? 844 : 900}px`;
    device.style.transform = `scale(${scale})`;
    stage.style.height = `${(width === 390 ? 844 : 900) * scale + 32}px`;
    document.querySelector('#device-size').textContent = `${width} × ${width === 390 ? 844 : 900}`;
  };
  const update = (savedHash) => {
    const path = typeof savedHash === 'string' && savedHash.startsWith('#/') ? savedHash.slice(1) : page.value === '/home/' ? `/home/${alt.value}` : page.value;
    const localized = localizedPath(path, alt.value);
    frame.src = `${location.pathname}?embed=1#${localized}`;
    document.querySelector('#sandbox-open').href = `#${localized}`;
  };
  alt.addEventListener('change', () => update(), { signal });
  page.addEventListener('change', () => update(), { signal });
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
  observer.observe(stage); routeCleanup.push(() => observer.disconnect());
  document.querySelectorAll('[data-width]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.width) === width)));
  if (saved) {
    frame.addEventListener('load', () => frame.contentWindow?.scrollTo(0, saved.scroll || 0), { once: true, signal });
    update(saved.hash);
  }
  resize();
}
function setupEvents(savedSandbox) {
  routeController = new AbortController();
  const { signal } = routeController;
  document.querySelectorAll('[data-language]').forEach(button => button.addEventListener('click', () => changeLanguage(button.dataset.language), { signal }));
  document.querySelector('.menu-toggle')?.addEventListener('click', menu, { signal });
  document.querySelector('[data-review]')?.addEventListener('click', reviewDialog, { signal });
  document.querySelectorAll('[data-state]').forEach(button => button.addEventListener('click', () => pendingDialog(button.dataset.state), { signal }));
  document.querySelectorAll('[data-social]').forEach(button => button.addEventListener('click', () => socialDialog(button.dataset.social), { signal }));
  document.querySelector('[data-top]')?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduced.matches ? 'instant' : 'smooth' }), { signal });
  document.querySelectorAll('[data-book-stage]').forEach(stage => {
    const bookEl = stage.querySelector('.book-object');
    const button = stage.querySelector('[data-book-turn]');
    const openButton = stage.querySelector('[data-book-open]');
    const cover = stage.querySelector('.book-cover');
    openButton?.addEventListener('click', () => {
      const open = openButton.getAttribute('aria-expanded') !== 'true';
      openButton.setAttribute('aria-expanded', String(open));
      openButton.textContent = t(open ? 'Tutup buku' : 'Buka buku');
      stage.classList.toggle('book-is-open', open);
      stage.querySelector('.book-open-note').hidden = !open;
      gsap.to(cover, { rotateY: open ? -145 : 0, duration: reduced.matches ? 0 : 1, transformOrigin: 'left center', ease: 'power3.inOut', overwrite: true });
      button.disabled = open;
      button.setAttribute('aria-pressed', 'false');
      const compact = window.innerWidth < 768;
      gsap.to(bookEl, { x: open ? (compact ? 58 : 40) : 0, scale: open ? (compact ? .72 : .94) : 1, rotateY: open ? -4 : -22, rotateX: open ? 0 : 7, duration: reduced.matches ? 0 : 1, ease: 'power3.inOut', overwrite: true });
    }, { signal });
    routeCleanup.push(() => gsap.killTweensOf(cover));
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
      if (!mediaFine.matches || reduced.matches || button.getAttribute('aria-pressed') === 'true' || openButton?.getAttribute('aria-expanded') === 'true') return;
      const r = stage.getBoundingClientRect();
      gsap.to(bookEl, { rotateY: -22 + ((e.clientX-r.left)/r.width-.5)*16, rotateX: 7-((e.clientY-r.top)/r.height-.5)*12, duration:.6, overwrite:true });
    }, { signal });
    stage.addEventListener('pointerleave', () => {
      if (!reduced.matches && button.getAttribute('aria-pressed') !== 'true' && openButton?.getAttribute('aria-expanded') !== 'true') gsap.to(bookEl,{ rotateY:-22,rotateX:7,duration:.8 });
    }, { signal });
  });
  setupSandbox(signal, savedSandbox);
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
async function render(initial = false, options = {}) {
  const token = ++renderToken;
  const [rawPath, query = ''] = location.hash.slice(1).split('?');
  const path = rawPath || '/home/E';
  const params = new URLSearchParams(query);
  const previousLanguage = language;
  setLanguage(resolveLanguage(params.get('lang')));
  const languageChanged = previousLanguage !== language;
  const match = path.match(/^\/home\/([A-H])$/);
  const nextVariant = match?.[1] || params.get('v');
  if (names[nextVariant]) variant = nextVariant;
  sessionStorage.setItem('arb-variant', variant);
  const section = params.get('section');
  if (!initial && activeRoute === path && section && !languageChanged) {
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
  if (match || path === '/') { content=home(); title=`${variant} · ${t(names[variant])}`; }
  else if (path === '/ebook') {content=catalog();title='Ebook';}
  else if (path === '/ebook/the-art-of-reflecting') {content=detail();title='The Art of Reflecting';}
  else if (path === '/renungan') {content=mediaPage('reflections');title='Renungan';}
  else if (path === '/ngobrol') {content=mediaPage('conversations');title='Ngobrol';}
  else if (path === '/tentang-bantuan') {content=about();title=c('about.page.title');}
  else if (path === '/preview') {content=reviewHub();title='Ruang review · A–H';}
  else {content=notFound();title='404';}
  document.title = `${t(title)} — Aksa Rasa Bumi`;
  document.querySelector('.skip-link').textContent = t('Lewati ke konten');
  document.querySelector('meta[name="description"]').content = t('Prototype interaktif Aksa Rasa Bumi. Delapan arah visual, satu perjalanan kisah. Draft untuk review client.');
  document.body.dataset.variant=variant;
  document.body.classList.toggle('feedback-landing', 'FGH'.includes(variant) && Boolean(match || path === '/'));
  document.body.classList.remove('film-in-view');
  document.body.classList.toggle('embedded',embedded);
  app.innerHTML=`${header()}<main id="main" tabindex="-1">${content}</main>${footer()}${dock()}`;
  if (options.preserveScroll === undefined) window.scrollTo(0,0);
  setupEvents(options.sandbox);animate();
  if ('FGH'.includes(variant) && (match || path === '/')) {
    routeCleanup.push(mountFeedbackMotion({ variant, gsap, ScrollTrigger, reduced, signal: routeController.signal }));
    routeCleanup.push(mountCharacterCinema({ gsap, ScrollTrigger, reduced, signal: routeController.signal }));
  }
  if (match || path === '/') routeCleanup.push(mountCharacterNative({ gsap, ScrollTrigger, reduced, signal: routeController.signal }));
  if (!initial) {
    document.querySelector('main').focus({preventScroll:true});
    document.querySelector('#announcer').textContent=`${t('Halaman')} ${t(title)}`;
  }
  gsap.to('.route-veil',{scaleY:0,transformOrigin:'top',duration:reduced.matches?0:.45,ease:'power3.out'});
  if (options.preserveScroll !== undefined) {
    ScrollTrigger.refresh();
    window.scrollTo(0, options.preserveScroll);
    document.querySelector(`[data-language="${language}"]`)?.focus({ preventScroll: true });
  } else if(section) requestAnimationFrame(()=>document.getElementById(section)?.scrollIntoView({behavior:'instant'}));
}

async function changeLanguage(next) {
  if (!validLanguage(next) || language === next) return;
  const preserveScroll = window.scrollY;
  const frame = document.querySelector('.sandbox-device iframe');
  let sandbox;
  if (frame) {
    sandbox = { alternative: document.querySelector('#variant-select').value, page: document.querySelector('#page-select').value, width: Number(document.querySelector('[data-width][aria-pressed="true"]').dataset.width) };
    try { sandbox.hash = frame.contentWindow.location.hash; sandbox.scroll = frame.contentWindow.scrollY; } catch { /* Embedded preview may still be loading. */ }
  }
  const [path = '/home/E', query = ''] = location.hash.slice(1).split('?');
  const params = new URLSearchParams(query);
  params.set('lang', next);
  history.replaceState(null, '', `${location.pathname}${location.search}#${path || '/home/E'}?${params}`);
  await render(false, { preserveScroll, sandbox });
  if (embedded && language === next) parent.postMessage({ type: 'arb-language', language: next }, location.origin);
}
function welcome() {
  if (document.body.classList.contains('feedback-landing') || embedded || reduced.matches || sessionStorage.getItem('arb-welcome') === 'seen' || activeRoute === '/preview') return;
  sessionStorage.setItem('arb-welcome','seen');
  const el = document.createElement('div');
  el.className='welcome';el.setAttribute('role','dialog');el.setAttribute('aria-label',t('Pembuka prototype'));el.setAttribute('aria-modal','true');
  el.innerHTML=`<div class="welcome-lines"><span>AKSA</span><span>RASA</span><span>BUMI</span></div><p>${t("Satu kisah. Tiga cara memahaminya.")}</p><button class="text-button">${t("Lewati pembuka")} ↗</button>`;
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
window.addEventListener('storage', event => { if (event.key === 'arb-language' && validLanguage(event.newValue)) changeLanguage(event.newValue); });
window.addEventListener('message', event => {
  if (event.origin === location.origin && event.source === document.querySelector('.sandbox-device iframe')?.contentWindow && event.data?.type === 'arb-language') changeLanguage(event.data.language);
});
document.addEventListener('click',e=>{
  const anchor=e.target.closest('a');
  if(anchor?.getAttribute('href')===location.hash){document.querySelectorAll('dialog').forEach(d=>d.close());const q=location.hash.split('?')[1];const section=new URLSearchParams(q).get('section');if(section)document.getElementById(section)?.scrollIntoView({behavior:reduced.matches?'instant':'smooth'});}
  if(anchor?.getAttribute('href')==='#main'){e.preventDefault();document.querySelector('main').focus();document.querySelector('main').scrollIntoView();}
});
await render(true);
welcome();
