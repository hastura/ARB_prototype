# Client feedback revision — 13 November 2026

## Applied feedback

| Request | Implemented behavior |
| --- | --- |
| Remove the AI/reality disclosure sentence | Removed from rendered Home and About content; the original source record remains traceable. |
| Revise the intro | English uses the exact supplied ending, **“keep learning from every experiences.”** Its grammar has deliberately not been silently corrected. Indonesian carries the equivalent meaning. |
| Short-term navigation | About us / Ebook / Reflection; Indonesian: Tentang kami / Ebook / Renungan. Header, mobile menu and footer agree. |
| Remove the brand strapline | The brand displays AKSA RASA BUMI without “A SPACE FOR UNDERSTANDING.” |
| Remove footer taglines and Mantra Djiwa attribution | Removed from the footer and mobile-menu decoration. |
| Information = social channels | Instagram, YouTube, Spotify and TikTok are clickable dummy controls, as explicitly requested. Each opens a localized preview status. No official account URL is invented. |
| Floating ebook | Catalog, detail and Home book stages use the page canvas directly, without a rectangular stage background. The temporary code-built cover, pages, spine and shadow remain separate. |
| Question hierarchy | The uppercase label precedes the italic question in all Home directions. |

The current launch does not publish the long-term navigation as available content. Journeys/Experiences, Masterpiece, My Home, Community and Environmental, including the supplied future title *Becoming Everything, Becoming Nothing*, remain the client's roadmap. They are not fabricated catalog entries, product formats, or completed services. The old Conversations route remains reachable for existing direct links, but is absent from the active three-item navigation and review page selector.

## Three additional prototype directions

| Variant | Source film | Look and layout |
| --- | --- | --- |
| F / Living Room | `Motion/ARB_Living_Room_Collage/render/ARB_Living_Room_Collage_v01.mp4` | Cream, sage and timber; offset editorial title, tilted film, suspended book and asymmetric image/copy. |
| G / Amber Cinema | `Motion/ARB_Alt03_Amber_Cinematic/render/ARB_Alt03_Amber_Cinematic_v02.mp4` | Espresso, amber and cream; cinema-first opening, wide pauses and a large book-title composition. |
| H / Amber Collage | `Motion/ARB_Alt03_Amber_Cinematic/render/ARB_Amber_Collage_Parallax_Cinematic_v01.mp4` | Warm paper and umber; diagonal framing, overlapping portraits and alternating visual weight. |

The review hub puts F–H first, followed by the five earlier directions A–E. All eight preserve the shared onward journey, source content constraints and EN/ID switching; first visits still default to EN.

Desktop GSAP ScrollTrigger pins only the film stage and maps scroll to an actual paused video's `currentTime`. The opening frame matches its poster (F/H 2.5s, G 5.8s); the final 0.8 seconds are excluded from scrubbing to avoid the source fade to black. Pause freezes the current film frame; resume catches up to the reader's scroll. Route changes remove triggers and media listeners. Smaller screens use a complete still with optional, explicit muted film playback. Reduced motion retains the still and does not load a film source.

The films are derived from the three supplied renders. Their embedded English dialogue/graphics are retained from those sources, including when the surrounding UI is Indonesian. Those visual words are not newly asserted novel excerpts, production credits, or additional canon. Source photographs supply the supporting stills; no new character imagery or dialogue was generated for this revision.

## References actually inspected

`Haruki Murakami - Book Author Website Animation _ Interaction.mp4` was inspected across eight frames: shelf → selected floating cover → book opening and side excerpt → return to shelf. This informs the reversible rotate/open interaction and separate detail copy. The book opens to an honest excerpt-pending state, never invented manuscript text.

`Website UI_UX Design.mp4` was inspected across eight frames: full scenic hero, asymmetric text/art, layered central cards, and full-width features. This informs changes in section scale, alternating image weight and restrained diagonal overlaps.

The Pinterest pin URL was attempted through web and browser access but could not be opened in this environment. Exact fidelity to that inaccessible pin is not claimed. The attached feedback images and the supplied local videos were inspected and used directly.

## Verification and preserved work

Media QA: 15 web assets, three 1280×720 H.264 films at 24fps, no audio, faststart, maximum keyframe spacing 0.5 seconds; 12 WebP decode checks. See `feedback-media.json` for source hashes, timestamps and sizes.

Browser QA covers the feedback changes, all eight directions, both UI languages, 320/390/768/1440 layouts, book opening/closing, real scroll seeking, pause/resume, mobile playback opt-in, keyboard, route cleanup and automated axe checks. Final staged-source release: build passed; 133/133 browser tests passed in 49.2 seconds. Local release smoke passed with HTTP 200 and zero browser errors. Detailed evidence and scope are recorded in `QA.md`.

Uncommitted motion-room/portrait-depth experiments and the user's Vite multipage configuration are preserved. Release QA uses an export of the staged repository so those separate experiments are not accidentally published or required by this release. No PDF was created, replaced or archived.
