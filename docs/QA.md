# Prototype QA — 6 November 2026

Local final build: **passed** (`npm run build`, Vite 8.3.6).

Browser suite: **57 / 57 passed** in Chromium on the final build (16.4 seconds). Tests are in `tests/prototype.spec.js`; CI repeats this suite before deployment.

| Area | Verified |
| --- | --- |
| Responsive screens | All five Home alternatives and five onward pages at 320, 390, 768, 1440 px |
| Layout/assets | No horizontal document overflow; all referenced screen images decoded; no browser console errors in tested journeys |
| Desktop journey | Character anchor → Ebook → detail → honest availability states → help/FAQ |
| Mobile journey | Menu, keyboard focus containment, Escape/focus return, Renungan → Ngobrol |
| Routing | Browser back and deep-route refresh, 404 recovery |
| Review hub | Exact iframe viewport widths 390/768/1440, alternative and page switching, 320 px outer layout |
| Interaction | Reversible accessible book rotation; native FAQ disclosure; purchase/excerpt dialogs and focus return |
| Motion | Skippable first-visit welcome, normal-motion route changes, immediate reduced-motion content |
| Accessibility | Automated axe WCAG 2 A/AA and 2.1 A/AA: zero violations on Home E, detail, Renungan, Ngobrol, help, review hub |
| Dependencies | `npm audit`: zero known vulnerabilities at verification time |

Visual review compared the source PDF/screens with desktop/mobile full-page captures for A–E, Ebook, detail and review. Additional tablet inspection verified the hero copy is separated from the photograph. The D illustration retains its full 16:9 composition. E portraits preserve source facial/garment pixels and separate background geometry. Screenshots and source audit artifacts remain in project `tmp/prototype-qa/` and `tmp/prototype-source/`, outside this standalone repository.

Corrections during QA: semantic whitespace in story titles, contrast of the story label on sage, exact simulator viewport widths, full D illustration, and tablet copy/photo separation. Initial failed tests were corrected and the complete final suite rerun successfully.

## Scope of verification

Automated accessibility checks do not prove full accessibility conformance. Physical iOS/Android devices, Safari/Firefox rendering, screen-reader narration and production media/payment services have not been manually validated. The prototype does not claim those services work: their source data is pending.

Content/visual approval is separate from implementation QA. Editorial copy, artwork, title-to-product mapping and the temporary code-built book cover remain review material. No new PDF was created, changed, or archived.
