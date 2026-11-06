const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

/** Decorative gallery artwork with live, localized copy and original image assets. */
export function miniPreview(key, copyText, assetUrl) {
  const variant = /^[A-E]$/.test(key) ? key : 'E';
  const copy = name => escapeHTML(copyText(name));
  const artwork = variant === 'E' ? 'hero-e-static.webp' : `hero-${variant.toLowerCase()}.webp`;
  const title = String(copyText('home.title')).split('\n').map(line => `<span>${escapeHTML(line)}</span>`).join(' ');

  return `<div class="mini-preview mini-preview-${variant.toLowerCase()}" aria-hidden="true">
    <div class="mini-masthead"><span>${copy('brand.name')}</span><span>${copy('nav.home')}</span></div>
    <div class="mini-hero">
      <div class="mini-hero-copy">
        <span class="mini-eyebrow">${copy('home.eyebrow')}</span>
        <span class="mini-title">${title}</span>
        <div class="mini-actions"><span>${copy('home.cta.characters')} <i>↗</i></span><span>${copy('home.cta.ebook')} <i>↗</i></span></div>
      </div>
      <div class="mini-hero-art"><img src="${escapeHTML(assetUrl(artwork))}" alt="" loading="lazy" decoding="async"></div>
    </div>
  </div>`;
}
