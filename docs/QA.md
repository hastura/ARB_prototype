# Calmer F/G/H hero scroll — 13 November 2026

Release build: **passed** (24 modules, Vite 8.3.6). Full Chromium suite: **171 / 171 passed** (1.8 minutes) from the isolated staged-source export.

- Six hero cases (F/G/H ×1440/390px) verify fullscreen framing, a substantially longer scroll interval, an actual 120px wheel step advancing less than 0.8 seconds, visible intermediate video positions, bounded forward/reverse frame jumps and eventual accurate settling.
- Hero intervals are F 10,028px / G 9,956px / H 10,748px, with 240px per source second and a 1.5-second eased playhead catch-up. The source remains paused/muted and its original scene timing remains intact.
- The seek queue always uses its latest target. Visible steps are bounded; initial metadata alignment and offscreen anchor jumps can settle directly. Route/reduced-motion cleanup stops tweens, RAF work and media listeners. Existing poster and reduced-motion fallbacks remain covered.
- All previous native character, EN/ID, routing, keyboard, book, accessibility, source-asset, responsive and review-hub checks remain covered. No new dependencies or media assets were introduced.

Independent measurements passed all six F/G/H desktop/mobile cases: the largest sampled step was 0.45 seconds, large forward/reverse jumps settled in roughly 1.7–2.8 seconds, initial poster alignment was correct, and character-anchor jumps had no continuing seek queue. The dedicated offscreen/reduced-motion probe also recorded zero page errors and zero seek activity after settling. Pacing evidence is stored in project `tmp/hero-pacing-v01/`. Headless Chromium measurements do not establish physical device FPS or Safari/Firefox performance. No PDF was generated, replaced or archived.

---

# Native HTML/CSS character introduction — 13 November 2026

Final staged-source build: **passed**, 24 modules, Vite 8.3.6, locally bundled Cormorant font. Full Chromium suite: **171 / 171 passed** (1.3 minutes). Source export excludes the separate uncommitted motion-room/portrait-depth experiments.

- A/B/F/G use native HTML/CSS/GSAP figures and localized text; no character MP4 is requested. F/G/H hero films and the existing C/D/E/H introductions retain their earlier behavior.
- Tests observe intermediate eased timeline positions during a large scroll step, forward/reverse character transitions, readable detail holds and the final ensemble. Chapter state follows rendered progress.
- Touch viewport height-only changes retain the current pin. Width/orientation changes rebuild geometry, and reduced motion restores three readable articles. Route cleanup removes the scoped animation and resize/scroll listeners.
- Independent visual QA covered 32 alternative/language/viewport combinations, plus all three ID details at 320×640. A duplicate ensemble caption collision in short landscape was corrected; the three names are now unobstructed.
- No horizontal overflow, browser errors or axe violations appeared in the tested journeys. All prior localization, keyboard, routing, book, source-asset and review-hub checks remain covered.
- Pose asset QA: 12 lossless RGBA crops match the source-sheet pixels exactly, total 2,613,464 bytes. No source sheet was changed, upscaled or mirrored. Font/license and source hashes are recorded in `character-native-media.json`.

Evidence remains in project `tmp/character-native-v01/`. Collision checks use visible foreground pixels bounded by their clipping ancestors; viewport-frame checks allow a one-pixel layout-rounding margin. Smoothing checks verify actual rendered interpolation, not a hardware FPS guarantee. Physical mobile browser-toolbar behavior, Safari/Firefox and screen-reader narration remain outside the current manual coverage. No PDF was generated, replaced or archived.

---

# Supplied character-introduction film — 13 November 2026

Release build: **passed**, 24 modules, Vite 8.3.6. Full Chromium suite: **170 / 170 passed** (1.1 minutes) from the isolated staged-source export. The release excludes separate uncommitted motion-room/portrait-depth work.

- Exact selected source film is mapped to A/B/F/G only. C/D/E retain their prior introductions, and H retains the GSAP portrait sequence.
- All four integrations have EN/ID companion copy, three readable source stills and correct reduced-motion behavior at 390/1440 px. The original English graphics remain embedded in the film.
- Actual paused, muted film seeks forward and backward from scroll on all four alternatives at desktop and mobile widths. Route cleanup, resizing and live reduced-motion rebuilding are covered.
- Prior hero, localization, keyboard, book, routing, asset, overflow, eight-alternative hub and axe regressions remain covered. New axe checks on A/B report zero violations.
- Local release smoke passed for ten alternative/device combinations: A/B/F/G supplied film and H portrait sequence, plus the existing F/G/H fullscreen heroes, in desktop EN and mobile ID. No browser errors were recorded.
- Media QA: exact 40-second web derivative, H.264 1280×720/24fps, 80 keyframes with maximum 0.5-second spacing, faststart and no audio; four WebP decode checks. Original source SHA256 remained unchanged. See `character-intro-media.json`.

Independent visual QA covered 32 alternative/language/viewport combinations. It found a review-dock overlap in short landscape; the dock and cue now hide while this film is visible, and restoration after leaving was verified. Visual evidence and source contact sheets are in project `tmp/character-intro-v01/`. The new film retains its full composition with contain framing; mobile also supplies a readable localized caption. Existing physical-device, Safari/Firefox and screen-reader verification limits remain. No PDF was generated, replaced or archived.

---

# Fullscreen cinema follow-up — 13 November 2026

Final staged-source build: **passed** (22 modules, Vite 8.3.6). Full browser suite: **141 / 141 passed**, 47.9 seconds, Chromium. The independent source export excludes uncommitted motion-room and portrait-depth experiments.

- F/G/H film stages touch all four viewport edges. No pause, resume or play control is rendered. Fresh cinematic visits have no welcome gate.
- Actual muted videos seek forward and backward from scroll at 1440×1000 and 390×844, without autoplay or a play-button prerequisite. Reduced motion unloads the video source.
- Aksa, Rasa and Bumi remain three semantic articles with original localized descriptions and source portraits. Their lateral sequence works forward/backward at 1440×1000, 768×1000, 390×844 and 844×390; copy does not intersect the foreground portrait or large name.
- EN/ID, all eight alternatives, onward journeys, keyboard interactions, routing, book states, no horizontal overflow and existing automated axe checks remain covered.
- Visual QA reviewed source-reference frames, full pages, actual film scrubbing, all three character positions and short/mobile/tablet/landscape compositions. A tablet portrait/copy overlap and landscape name/body overlap were corrected before the final run.
- Evidence is in project `tmp/fullbleed-v03/`; fullscreen films use cover cropping, so baked-in video graphics can be cropped at unlike aspect ratios. Main website and character copy remains HTML.

Physical devices, Safari/Firefox and screen-reader narration remain unverified. Reduced motion preserves a static hero and readable stacked characters. Existing content, payment and official social-link limitations still apply. No PDF was generated, replaced or archived.

---

# Prototype QA — 13 November 2026

Release build: **passed** (`npm run build`, Vite 8.3.6, single-entry staged-source export). Browser suite: **133 / 133 passed**, 49.2 seconds, on Chromium. The export excludes separate uncommitted motion-room and portrait-depth experiments.

| Area | Verified for this revision |
| --- | --- |
| Client feedback | Exact supplied intro, removed strapline/disclosures/footer copy, three-item navigation, question hierarchy, four localized dummy social dialogs |
| Alternatives | Eight directions A–H in the hub; F/G/H first, desktop and exact-width mobile/tablet simulator |
| Responsive and languages | F–H in EN/ID at 320, 390, 768 and 1440 px; existing A–E and onward regressions retained |
| Film motion | Actual source-video seeks while paused, reversible scroll pause/resume, route cleanup, explicit muted mobile playback, reduced-motion poster with no film source loaded |
| Floating book | Transparent page canvas; keyboard rotate/open/close, honest pending excerpt, disabled rotation while open, mobile control/note collision checks |
| Visual review | F–H full pages at 390/768/1440, all six mobile EN/ID open-book states, actual mid-scroll and endpoint film frames, corrected legacy-card width |
| Accessibility and errors | Tested keyboard/dialog focus behavior; zero axe WCAG A/AA violations on tested screens; no browser errors or horizontal document overflow in the suite |
| Local release smoke | HTTP 200, eight alternatives, default English, EN/ID persistence, mobile detail refresh and dummy social dialog; zero browser errors |
| Media | 15 assets from supplied sources; three H.264 1280×720/24fps films, no audio, faststart and maximum 0.5-second keyframe spacing; 12 WebP decode checks |

QA corrected a gallery last-card width regression and an open-book note collision. A separate test setup initially sought beyond the film's pin interval; it now tests interior scroll points and retains the freeze/catch-up assertions. Final full-suite result above uses the corrected product and tests.

Source mapping, reference access limits and content scope are in `CLIENT_FEEDBACK_2026-11-13.md`. The supplied films retain their embedded English graphics when the surrounding UI is Indonesian. Social destinations are deliberately dummy controls, per user instruction. Product/payment/manuscript data remains pending. Pinterest could not be opened; exact fidelity to that pin is not asserted.

Automated checks do not establish complete accessibility conformance. Physical devices, Safari/Firefox and screen-reader narration remain unverified. No PDF was generated, replaced or archived.

---

# Prototype QA — 6 November 2026

Local final build: **passed** (`npm run build`, Vite 8.3.6).

Browser suite: **90 / 90 passed** in Chromium on the bilingual build (32.0 seconds). Tests are in `tests/prototype.spec.js` and `tests/localization.spec.js`; CI repeats this suite before deployment.

| Area | Verified |
| --- | --- |
| Responsive screens | All five Home alternatives and five onward pages at 320, 390, 768, 1440 px |
| Layout/assets | No horizontal document overflow; all referenced screen images decoded; no browser console errors in tested journeys |
| Desktop journey | Character anchor → Ebook → detail → honest availability states → help/FAQ |
| Mobile journey | Menu, keyboard focus containment, Escape/focus return, Renungan → Ngobrol |
| Routing | Browser back and deep-route refresh, 404 recovery |
| Review hub | Exact iframe viewport widths 390/768/1440, alternative and page switching, 320 px outer layout |
| Interaction | Reversible accessible book rotation; native FAQ disclosure; purchase/excerpt dialogs and focus return |
| Motion | Skippable first-visit welcome, normal-motion route changes, immediate reduced-motion content, plus live preference changes across breakpoints |
| Accessibility | Automated axe WCAG 2 A/AA and 2.1 A/AA: zero violations on Home E, detail, Renungan, Ngobrol, help, review hub |
| Dependencies | `npm audit`: zero known vulnerabilities at verification time |
| Languages | Fresh visits default to EN; EN/ID switch, saved preference, explicit URL override, cross-page/tab persistence, iframe language, localized dialogs/welcome/404 |
| English layouts | All five Home alternatives and five onward pages at 320 and 1440 px, including loaded artwork and no horizontal overflow |
| Review thumbnails | All five previews use live EN/ID text instead of text baked into raster screenshots |

The Indonesian regression suite remains intact with an explicit ID preference. New English checks also run axe on Home E, review hub and help, with zero violations. Language switching through the visible header retains the current alternative and scroll position; the test uses an actual pointer click to avoid automation's automatic scrolling of sticky controls. The additional English copy has 112 keys aligned with the existing Indonesian source, with source/status metadata preserved.

Visual review compared the source PDF/screens with desktop/mobile full-page captures for A–E, Ebook, detail and review. Additional tablet inspection verified the hero copy is separated from the photograph. The D illustration retains its full 16:9 composition. E portraits preserve source facial/garment pixels and separate background geometry. Screenshots and source audit artifacts remain in project `tmp/prototype-qa/` and `tmp/prototype-source/`, outside this standalone repository.

Corrections during QA: semantic whitespace in story titles, contrast of the story label on sage, exact simulator viewport widths, full D illustration, tablet copy/photo separation, and cleanup of magnetic listeners when motion preferences change. Initial failed tests were corrected and the complete final suite rerun successfully.

## Scope of verification

Automated accessibility checks do not prove full accessibility conformance. Physical iOS/Android devices, Safari/Firefox rendering, screen-reader narration and production media/payment services have not been manually validated. The prototype does not claim those services work: their source data is pending.

Content/visual approval is separate from implementation QA. Editorial copy, artwork, title-to-product mapping and the temporary code-built book cover remain review material. No new PDF was created, changed, or archived.
