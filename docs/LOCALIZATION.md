# English and Indonesian preview

New visits default to **English**. The EN / ID switch appears in the header on desktop, tablet and mobile. The active choice has `aria-pressed="true"`; document language, page titles, navigation, image descriptions, dialogs, book labels, welcome, 404 and review controls all follow the selected language.

The choice is saved in localStorage (`arb-language`). An explicit `lang=en` or `lang=id` parameter inside the hash overrides the saved preference. Links preserve both language and the selected alternative, for example `#/home/C?lang=id` or `#/ebook?v=C&lang=en`. If storage is unavailable, navigation URLs continue to preserve the choice.

The live review iframe receives an explicit language parameter. Switching language preserves the outer page, alternative, review selections and viewport. Language changes are also synchronized across open same-origin tabs and the embedded preview. Scroll position is retained when switching language.

## Content sources

- `src/copy-source.json`: original 112 Indonesian strings and their provenance/status metadata.
- `src/copy-en.json`: the matching 112 English texts from the existing project `Web/Copy and UX Writing/content_mapping_en_v02.py`. Keys and metadata remain aligned with the Indonesian master.
- `src/ui-en.json`: English localization for additional prototype controls, accessibility labels and review tooling.

Proper names and *The Art of Reflecting* remain unchanged. Reflections and Conversations are English interface labels; they do not assert an approved channel rebrand. Pending commercial, manuscript and media information remains pending in both languages.

Review thumbnails use code-rendered localized text over the existing artwork, so the English preview does not display Indonesian text baked into source screenshots.
