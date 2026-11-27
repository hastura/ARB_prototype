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
let pendingEntry;

export function reflectionBook(id) {
  if (id === featuredBookId) return { id, title: copyText('story.title') };
  const sample = sampleBooks.find(book => book.id === id);
  return sample && { id, title: t(sample.title) };
}

export function reflectionLink(book, variant, from) {
  const url = localizedPath(`/renungan/${book.id}?from=${from}`, variant);
  return `<a class="text-link reflection-entry" data-reflection-entry="${backHref(book.id, variant, from)}" href="#${url}" aria-label="${t('Tulis renungan untuk')} ${book.title}">${t('Tulis renungan')} ${arrow}</a>`;
}

export function reflectionIndex(variant) {
  const ids = [featuredBookId, ...sampleBooks.map(book => book.id)];
  return `<section class="shell section reflection-catalog" aria-labelledby="reflection-title-list">
    <h2 id="reflection-title-list">${t('Pilih judul')}</h2>
    <p>${t('Lima judul contoh tersedia untuk mencoba alur renungan.')}</p>
    <ul class="reflection-titles">${ids.map(id => {
      const book = reflectionBook(id);
      return `<li>
        <h3 id="${titleId(id, 'reflection')}" data-reflection-title tabindex="-1">${book.title}</h3>${reflectionLink(book, variant, 'reflection')}
      </li>`;
    }).join('')}</ul>
  </section>`;
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

  // Record the title anchor in the entry's history item as well as the explicit Back link.
  document.querySelectorAll('[data-reflection-entry]').forEach(entry => {
    entry.addEventListener('click', event => {
      if (!followsLink(event)) return;
      const origin = entry.dataset.reflectionEntry;
      history.replaceState(history.state, '', origin);
      pendingEntry = { origin, destination: entry.hash };
    }, { signal });
  });
}

function followsLink(event) {
  return !event.defaultPrevented && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}
