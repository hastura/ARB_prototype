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

The follow-up revision makes all three film heroes edge to edge and viewport height, with navigation over the image. GSAP ScrollTrigger maps both desktop and mobile scroll directly to a paused, muted source video's `currentTime`; there are no play/pause transport controls and no first-visit welcome gate on F–H. Scrolling backward also reverses the film. The opening frame matches its poster (F/H 2.5s, G 5.8s); the final 0.8 seconds are excluded to avoid the source fade to black. Route changes remove triggers and media listeners. Reduced motion retains the still and does not load a film source.

The hero pacing revision gives the films a calmer scroll interval: F = 10,028px, G = 9,956px, H = 10,748px, or 240px per source second. A 120px scroll step therefore advances approximately 0.5 seconds of film, compared with roughly 1.6–2.1 seconds in the earlier tested desktop/mobile viewports. GSAP applies a 1.5-second scrub catch-up. Visible seeks are limited to 0.18 seconds for small gaps and 0.45 seconds for larger intentional jumps, in either direction. Initial poster alignment and offscreen anchor jumps can settle directly, so the hero does not keep decoding intermediate frames behind the character section. Original source timing, scene order and existing emotional holds are preserved; no new scene holds or playback controls were added.

The fullscreen media uses `object-fit: cover`, with responsive framing and 1.14× overscan on the amber sources to remove their baked-in letterbox. Filling a viewport with a different aspect ratio crops the source composition; its embedded graphics do not reflow. The story's website copy remains separate, readable HTML.

The first follow-up introduced a pinned lateral portrait procession on F, G and H. The supplied-film revision below now replaces it on F/G and additionally updates A/B; H retains that procession. In the retained portrait section, all three existing Aksa/Rasa/Bumi portraits and localized descriptions appear in sequence. Large names sit behind the foreground portraits, while a smaller duplicate of each source portrait moves at a different rate. Character copy stays separate from foreground portraits at desktop, tablet, mobile and landscape. Reduced motion presents all three articles as a natural vertical stack.

The films are derived from the three supplied renders. Their embedded English dialogue/graphics are retained from those sources, including when the surrounding UI is Indonesian. Those visual words are not newly asserted novel excerpts, production credits, or additional canon. Source photographs supply the supporting stills; no new character imagery or dialogue was generated for this revision.

## Current native character introduction — A, B, F and G

The character section is now built with HTML/CSS and GSAP, following the supplied film's overview → pose-rail pan → readable detail → next character → ensemble sequence. A/B/F/G use this native section; C/D/E/H retain their prior introductions. Hero films on F/G/H are unchanged.

Four original full-body poses per character are separate image layers. The 12 transparent WebPs are mechanical crops of the supplied film's original alpha sheets, with exact decoded RGBA equality to the source crops. No figure was resized in asset generation, mirrored or synthesized. Together the poses total 2,613,464 bytes; the source Cormorant font and its OFL license are bundled. See `character-native-media.json` and `scripts/prepare-character-native.py`.

Only transforms and opacity animate. Following the user's H pacing reference, the 14 November revision uses H's 0.65-second scrub catch-up and matches each lateral handoff to H's distance per panel: half of max(2200px, 3.2 viewport heights). Panel crossings are linear; separate sine-eased pose pans settle before copy reveals, followed by full-opacity reading holds. The complete sequence spans 12,736px at 1440×1000 and 10,749px at 390×844, including all pans, reading holds and the ensemble ending. Chapter indicators follow the actual rendered timeline rather than raw scroll position. Forward and reverse scrolling preserve the same poses and content. The website does not intercept wheel/touch input or replace native page scrolling.

Text is now real localized HTML in both EN and ID, including the source headings and descriptions. Portrait/tablet layouts recompose the figures above the copy; short landscape places figures beside the copy and omits the duplicate ensemble caption. Reduced motion shows three readable natural-flow articles. The floating review dock hides while the animated stage is in view and returns afterward.

The clipping follow-up fixes complete figures being sliced by their moving panel edge during a handoff. Moving chapters and the ensemble have transparent backgrounds; art can extend horizontally beyond its chapter, while the stage clips at the viewport and a vertical-only art mask preserves the mobile text region. A short fade removes a fully departing rail without a hard vertical cut. In short landscape, the left-going middle pose dissolves before the detail text appears, so it cannot enter the copy column. The 12 image crops, source sheets, H-referenced scroll distance and scrub timing are unchanged.

Stable small-viewport sizing and touch-aware resize handling keep browser-toolbar height changes from tearing down the pin. Width/orientation changes and desktop resizing rebuild the responsive geometry. The old character MP4 remains as an archived reference asset in the repository; the active native section has no video element and makes no request for that MP4. The original film and pose sheets remain untouched.

## Earlier supplied character film — A, B, F and G

The earlier supplied-film revision replaced the character introduction on **A, B, F and G** with the exact supplied `Motion/ARB_Character_Introduction_v01/render/ARB_Character_Introduction_v01.mp4`. C/D/E retain their previous character sections; H retains the earlier GSAP portrait procession.

The source was inspected at timestamped frames: Aksa 0–13s, Rasa 12–25s, Bumi 24–37s, and an ensemble ending 36–40s. The web derivative is 40.0 seconds, H.264 1280×720/24fps, 5,011,204 bytes, faststart, maximum 0.5-second keyframe spacing, with audio removed for deterministic scroll seeking. Source SHA256 was identical before and after processing. See `character-intro-media.json` and `scripts/prepare-character-intro.py`.

GSAP pins the section below the current header and maps forward/backward scroll to the film's `currentTime`; playback remains paused and muted, with no play/pause controls. The film uses contain framing so its supplied composition is preserved. On short landscape screens, the floating review dock and scroll cue are hidden while this film occupies the viewport, so they cannot cover its embedded names; review controls return after leaving the section. A localized mobile caption accompanies the current character; three readable EN/ID character articles remain below the film. Reduced motion shows three source stills (6s / 18s / 30s) and the complete localized introductions without loading the video source.

Embedded English type, brand graphics, index and arrows are pixels in the supplied film, not new interactive controls or website navigation. They are retained as provided. Source character copy matches the existing English website descriptions; the surrounding UI and companion copy still support EN/ID with English default. No new character artwork, story facts or dialogue was generated.

## References actually inspected

`Haruki Murakami - Book Author Website Animation _ Interaction.mp4` was inspected across eight frames: shelf → selected floating cover → book opening and side excerpt → return to shelf. This informs the reversible rotate/open interaction and separate detail copy. The book opens to an honest excerpt-pending state, never invented manuscript text.

`Website UI_UX Design.mp4` was inspected across eight frames: full scenic hero, asymmetric text/art, layered central cards, and full-width features. This informs changes in section scale, alternating image weight and restrained diagonal overlaps.

`Top 10 Website Designs _ Web Design Inspiration.mp4` was inspected across 16 timestamped frames over its approximately 12.35-second duration. It shows a lateral fashion-portrait composition: large foreground and smaller background figures, oversized type behind portraits, content entering laterally, then a return to earlier compositions. This supplies the character section's scale contrast, horizontal procession and differential layer motion. The clip does not expose its implementation or prove a particular animation library; the prototype implements the observed visual pattern in GSAP. Contact sheets and metadata remain in `../tmp/fullbleed-v03/`.

The Pinterest pin URL was attempted through web and browser access but could not be opened in this environment. Exact fidelity to that inaccessible pin is not claimed. The attached feedback images and the supplied local videos were inspected and used directly.

## Verification and preserved work

Media QA: 15 web assets, three 1280×720 H.264 films at 24fps, no audio, faststart, maximum keyframe spacing 0.5 seconds; 12 WebP decode checks. See `feedback-media.json` for source hashes, timestamps and sizes.

Browser QA covers the feedback changes, all eight directions, both UI languages, 320/390/768/1440 layouts, book opening/closing, real forward/backward film seeking on desktop/mobile, character sequencing, keyboard, route cleanup and automated axe checks. The 14 November clipping-fix release passed its build and all 181 browser tests in 2.2 minutes, including actual wheel-motion comparisons against H and opaque-body-pixel checks across A/B/F/G handoffs. Detailed evidence and verification limits are recorded in `QA.md`.

Uncommitted motion-room/portrait-depth experiments and the user's Vite multipage configuration are preserved. Release QA uses an export of the staged repository so those separate experiments are not accidentally published or required by this release. No PDF was created, replaced or archived.
