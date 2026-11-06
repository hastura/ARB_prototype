import idCopy from './copy-source.json';
import enCopy from './copy-en.json';
import englishUI from './ui-en.json';

export const validLanguage = value => value === 'en' || value === 'id';
export let language = 'en';

export function savedLanguage() {
  try { return localStorage.getItem('arb-language'); } catch { return null; }
}

export function resolveLanguage(explicit) {
  if (validLanguage(explicit)) return explicit;
  const saved = savedLanguage();
  return validLanguage(saved) ? saved : 'en';
}

export function setLanguage(value) {
  language = validLanguage(value) ? value : 'en';
  try { localStorage.setItem('arb-language', language); } catch { /* URL still preserves the choice. */ }
  document.documentElement.lang = language;
}

export const copyText = key => (language === 'en' ? enCopy : idCopy)[key]?.text ?? '';
export const t = value => language === 'en' ? englishUI[value] ?? value : value;

export function localizedPath(path, variant) {
  const [pathname, query = ''] = path.split('?');
  const params = new URLSearchParams(query);
  params.set('v', variant);
  params.set('lang', language);
  return `${pathname}?${params}`;
}
