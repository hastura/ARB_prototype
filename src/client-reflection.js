import { copyText, localizedPath, t } from './i18n';
import './client-reflection.css';

export const featuredBookId = 'the-art-of-reflecting';
export const sampleBooks = [
  { id: 'ruang-sunyi', title: 'Ruang Sunyi', artwork: 'ripples' },
  { id: 'jalan-pulang', title: 'Jalan Pulang', artwork: 'horizon' },
  { id: 'pelan-pelan-tumbuh', title: 'Pelan-Pelan Tumbuh', artwork: 'leaves' },
  { id: 'di-antara-musim', title: 'Di Antara Musim', artwork: 'orbit' },
  { id: 'waktu-untuk-bernapas', title: 'Waktu untuk Bernapas', artwork: 'arches' },
];

const routes = { reflection: '/renungan', ebook: '/ebook', 'ebook-detail': `/ebook/${featuredBookId}` };
const originFor = (id, from) => from === 'ebook' || (from === 'ebook-detail' && id === featuredBookId) ? from : 'reflection';
const titleId = (id, from) => `title-${from}-${id}`;
const backHref = (id, variant, from) => `#${localizedPath(`${routes[from]}?section=${titleId(id, from)}`, variant)}`;
const arrow = '<span aria-hidden="true">↗</span>';
const samplesById = new Map(sampleBooks.map(book => [book.id, book]));
const reflectionTitleIds = [featuredBookId, ...samplesById.keys()];
const titleBatchSize = 12;
const viewStorageKey = 'arb-reflection-view';
const views = [['list', 'Daftar'], ['grid', 'Grid']];
let preferredView = 'grid';
let pendingEntry;

export function reflectionBook(id) {
  if (id === featuredBookId) return { id, title: copyText('story.title') };
  const sample = samplesById.get(id);
  return sample && { id, title: t(sample.title) };
}

export function reflectionLink(book, variant, from) {
  const url = localizedPath(`/renungan/${book.id}?from=${from}`, variant);
  return `<a class="text-link reflection-entry" data-reflection-entry="${backHref(book.id, variant, from)}" href="#${url}" aria-label="${t('Tulis renungan untuk')} ${book.title}">${t('Tulis renungan')} ${arrow}</a>`;
}

function reflectionTitle(id, variant) {
  const book = reflectionBook(id);
  return `<li>
    <h3 id="${titleId(id, 'reflection')}" data-reflection-title tabindex="-1">${book.title}</h3>
    ${reflectionLink(book, variant, 'reflection')}
  </li>`;
}

function reflectionView() {
  try {
    const stored = sessionStorage.getItem(viewStorageKey);
    if (stored === 'list' || stored === 'grid') return stored;
  } catch { /* Keep view changes available in memory if storage is unavailable. */ }
  return preferredView;
}

export function reflectionIndex(variant, section, retainedTitles = 0) {
  // Back and direct links must find the title even if it was in a later batch.
  const target = reflectionTitleIds.findIndex(id => titleId(id, 'reflection') === section);
  const count = Math.max(titleBatchSize, retainedTitles, Math.ceil((target + 1) / titleBatchSize) * titleBatchSize);
  const view = reflectionView();
  return `<section class="shell section reflection-catalog" data-reflection-catalog="${variant}" aria-labelledby="reflection-title-list">
    <div class="reflection-toolbar">
      <div>
        <h2 id="reflection-title-list">${t('Pilih judul')}</h2>
        <p>${t('Judul contoh tersedia untuk mencoba alur renungan.')}</p>
      </div>
      <div class="reflection-view-switch" role="group" aria-label="${t('Tampilan judul')}">
        ${views.map(([mode, label]) => `<button type="button" data-reflection-view="${mode}" aria-pressed="${view === mode}" aria-controls="reflection-titles">${t(label)}</button>`).join('')}
      </div>
    </div>
    <ul id="reflection-titles" class="reflection-titles" data-view="${view}">${reflectionTitleIds.slice(0, count).map(id => reflectionTitle(id, variant)).join('')}</ul>
    <button type="button" class="reflection-load-more" data-reflection-load-more aria-controls="reflection-titles"${count >= reflectionTitleIds.length ? ' hidden' : ''}>${t('Muat judul lainnya')}</button>
    <p class="sr-only" role="status"></p>
  </section>`;
}

function mountReflectionIndex(catalog, signal) {
  const list = catalog.querySelector('#reflection-titles');
  const controls = catalog.querySelectorAll('[data-reflection-view]');
  controls.forEach(control => {
    control.addEventListener('click', () => {
      const view = control.dataset.reflectionView;
      preferredView = list.dataset.view = view;
      controls.forEach(button => button.setAttribute('aria-pressed', String(button === control)));
      try { sessionStorage.setItem(viewStorageKey, view); } catch { /* Keep the chosen view in memory. */ }
    }, { signal });
  });

  const more = catalog.querySelector('[data-reflection-load-more]');
  if (more.hidden) return;
  const status = catalog.querySelector('[role="status"]');
  const variant = catalog.dataset.reflectionCatalog;
  let observer;

  function loadNextTitles(focusNewTitle = false) {
    const shown = list.children.length;
    const next = reflectionTitleIds.slice(shown, shown + titleBatchSize);
    if (!next.length) return;
    list.insertAdjacentHTML('beforeend', next.map(id => reflectionTitle(id, variant)).join(''));
    more.hidden = list.children.length >= reflectionTitleIds.length;
    status.textContent = t('Judul tambahan dimuat.');
    observer?.unobserve(more);
    if (!more.hidden) observer?.observe(more);
    if (focusNewTitle) document.getElementById(titleId(next[0], 'reflection'))?.focus();
  }

  more.addEventListener('click', () => loadNextTitles(true), { signal });
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(([entry]) => {
      if (!signal.aborted && entry?.isIntersecting && document.activeElement !== more) loadNextTitles();
    }, { rootMargin: '240px 0px' });
    observer.observe(more);
    signal.addEventListener('abort', () => observer.disconnect(), { once: true });
  }
}

export function bookReflectionSection(variant) {
  return `<section id="renungan-buku" class="shell section editorial-grid book-reflection" aria-labelledby="book-reflection-title">
    <h2 id="book-reflection-title">${copyText('reflections.title')}</h2>
    <div class="prose"><p>${t('Bagian mana dari kisah ini yang masih kamu pikirkan?')}</p>
      ${reflectionLink(reflectionBook(featuredBookId), variant, 'ebook-detail')}
    </div>
  </section>`;
}

export function reflectionForm(book, variant, from) {
  const origin = originFor(book.id, from);
  return `<section class="shell section reflection-editor">
    <header class="reflection-editor-heading">
      <a class="reflection-back" href="${backHref(book.id, variant, origin)}"><span aria-hidden="true">←</span> ${t(origin === 'reflection' ? 'Kembali ke Renungan' : 'Kembali ke Ebook')}</a>
      <h1>${book.title}</h1>
    </header>
    <form class="reflection-form" data-reflection-form="${book.id}">
      <label for="reflection-draft">${t('Renunganmu')}</label>
      <textarea id="reflection-draft" name="reflection" rows="8" required aria-describedby="reflection-local-note"></textarea>
      <p id="reflection-local-note">${t('Renungan tersimpan di browser ini.')}</p>
      <button class="button" type="submit">${t('Simpan renungan')}</button>
      <p class="reflection-status" role="status"></p>
    </form>
  </section>`;
}

export function mountReflection(signal) {
  const catalog = document.querySelector('[data-reflection-catalog]');
  if (catalog) mountReflectionIndex(catalog, signal);
  const form = document.querySelector('[data-reflection-form]');
  if (form) {
    const back = document.querySelector('.reflection-back');
    if (location.hash === pendingEntry?.destination) {
      history.replaceState({ ...history.state, reflectionOrigin: pendingEntry.origin }, '');
    }
    back.addEventListener('click', event => {
      if (!followsLink(event)) return;
      event.preventDefault();
      if (history.state?.reflectionOrigin === back.hash) history.back();
      else location.replace(back.href);
    }, { signal });

    const field = form.elements.reflection;
    const status = form.querySelector('[role="status"]');
    const key = `arb-reflection:${form.dataset.reflectionForm}`;
    try { field.value = localStorage.getItem(key) || ''; } catch { /* A blocked browser can still edit the form. */ }
    field.addEventListener('input', () => {
      field.setCustomValidity('');
      status.textContent = '';
    }, { signal });
    form.addEventListener('submit', event => {
      event.preventDefault();
      const value = field.value.trim();
      if (!value) {
        field.setCustomValidity(t('Tulis renungan sebelum menyimpan.'));
        field.reportValidity();
        return;
      }
      try {
        localStorage.setItem(key, value);
        status.textContent = t('Renungan tersimpan.');
      } catch {
        status.textContent = t('Browser ini tidak dapat menyimpan renungan.');
      }
    }, { signal });
  }
  pendingEntry = undefined;

  // Delegate so the title links added in later batches keep the same Back behavior.
  document.querySelector('main')?.addEventListener('click', event => {
    const entry = event.target.closest('[data-reflection-entry]');
    if (!entry || !followsLink(event)) return;
    const origin = entry.dataset.reflectionEntry;
    history.replaceState(history.state, '', origin);
    pendingEntry = { origin, destination: entry.hash };
  }, { signal });
}

function followsLink(event) {
  return !event.defaultPrevented && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}
