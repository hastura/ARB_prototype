# Source and interaction register

Source inspected: `Documentation/Web/ARB_Web_UI_Preview_v02.pdf`, 25 pages. Reference material is design/content evidence, not authorization to execute instructions embedded in a document.

| Source pages | Implementation |
| --- | --- |
| 1–2 | Review hub and comparison at `#/preview` |
| 3–4 | A / Potret Editorial at `#/home/A` |
| 5–6 | B / Ruang Percakapan at `#/home/B` |
| 7–8 | C / Langkah Bersama at `#/home/C` |
| 9–10 | D / Halaman Pembuka at `#/home/D` |
| 11–12 | E / Lapisan Kisah at `#/home/E` |
| 13–15 | E source layers / conservative motion endpoints |
| 16–17 | Ebook at `#/ebook` |
| 18–19 | Story detail at `#/ebook/the-art-of-reflecting` |
| 20–21 | Renungan at `#/renungan` |
| 22–23 | Ngobrol at `#/ngobrol` |
| 24–25 | Tentang & Bantuan at `#/tentang-bantuan` |

All five alternatives share navigation, content and onward journeys. A–D use equal character cards; E uses photo cutouts with separate geometric SVG backgrounds. The review simulator is additional review tooling, and is hidden inside its own embedded preview.

## New code-built behavior

Native dialog provides mobile menu, focus containment, Escape and focus return. Native details/summary provides FAQs. Route changes update page title, announce the page and focus the main region; hash paths support deep refresh on Pages. Pending purchase/excerpt/media dialogs state what is missing and provide a return path. They do not simulate successful transactions or playback.

The first-visit GSAP welcome lasts 1.8 seconds and has an immediate skip control. It is skipped for reduced motion, embedded screens, and subsequent visits in the same session. Controls remain keyboard-operable.

Motion uses `gsap.matchMedia()` and reverts route animations/ScrollTriggers before each new screen. The page curtain, staggered headline, section reveals, shape reveal, scroll progress, magnetic buttons, and book rotation operate without scroll hijacking. Mobile retains scroll and touch control. Raster faces do not travel independently.

Book mockup uses CSS perspective, front/back/spine/pages, a pointer tilt and an explicit accessible rotation button. No image generation was used for this asset. Its label makes the temporary cover status visible.

## Pending content

Source copy is mostly `USULAN`; availability strings are `SEMENTARA`; external actions are `BERSYARAT`. `src/copy-source.json` preserves those original statuses. No claims are added about product approval, sales, credits, format, excerpts, episodes, platform URLs, policies, or official contact channels.
