"""Optimize supplied ARB UI artwork without repainting or inventing imagery.

Run from any directory using Pillow. Original artwork remains untouched.
"""
from pathlib import Path
import hashlib
import json
import shutil
import sys
from PIL import Image

PROJECT = Path(__file__).resolve().parents[2]
OUT = PROJECT / 'Prototype' / 'public' / 'assets'
DOCS = PROJECT / 'Prototype' / 'docs'
OUT.mkdir(parents=True, exist_ok=True)
DOCS.mkdir(parents=True, exist_ok=True)
records = []
prior_manifest = DOCS / 'asset-manifest.json'
prior_records = json.loads(prior_manifest.read_text(encoding='utf-8')).get('assets', []) if prior_manifest.exists() else []

def image(source, filename, width=None, quality=90):
    original = PROJECT / source
    target = OUT / filename
    prior = next((r for r in prior_records if r['file'] == 'assets/' + filename and r['source'] == source), None)
    if '--missing-only' in sys.argv and target.exists() and prior:
        records.append(prior)
        return
    with Image.open(original) as im:
        source_size = im.size
        if im.mode not in ('RGB', 'RGBA'):
            im = im.convert('RGBA' if 'transparency' in im.info else 'RGB')
        if width and im.width > width:
            im = im.resize((width, round(im.height * width / im.width)), Image.Resampling.LANCZOS)
        im.save(target, 'WEBP', quality=quality, method=6, exact=True)
        dimensions = im.size
    records.append({'file': 'assets/' + filename, 'source': source, 'sourceSize': source_size,
                    'width': dimensions[0], 'height': dimensions[1], 'bytes': target.stat().st_size,
                    'sourceSha256': hashlib.sha256(original.read_bytes()).hexdigest(),
                    'operation': 'WebP compression' + (' and proportional resize' if source_size != dimensions else '')})

heroes = {
    'a': 'KV/ARB-KV-portrait-photography-alt.png',
    'b': 'KV/ARB-KV-photography-abstract-v02.png',
    'c': 'KV/ARB-KV-photography-abstract-v02-alt.png',
    'd': 'KV/ARB-KV-drawing-abstract-v02-alt.png',
}
for key, source in heroes.items():
    image(source, f'hero-{key}.webp', 1672)
    image(source, f'hero-{key}-mobile.webp', 840, 88)
    image(f'Web/UI Home Drafts/previews/{key.upper()}-Hero-Desktop.png', f'preview-{key}.webp', 960, 86)
image(heroes['c'], 'hero-e-static.webp', 1672)
image(heroes['c'], 'hero-e-mobile.webp', 840, 88)
image('Web/UI Home Source Revision/previews/E-Hero-Desktop.png', 'preview-e.webp', 960, 86)

for key, filename in (('aksa', 'Aksa_Hero_Portrait_v02.png'), ('rasa', 'Rasa_Hero_Portrait_v01.png'), ('bumi', 'Bumi_Hero_Portrait_v01.png')):
    image('output/character_bible_assets/' + filename, f'card-{key}.webp', 1200, 90)

layer_manifest = json.loads((PROJECT / 'KV/Layered_Hero_v01/layer-export-manifest.json').read_text(encoding='utf-8'))
for source_path in layer_manifest['files']:
    original = Path(source_path)
    key = original.name.split('_')[3].lower()
    image(original.relative_to(PROJECT).as_posix(), f'hero-e-{key}.webp', 1672, 92)

for key in ('aksa', 'rasa', 'bumi'):
    image(f'KV/Character_Backdrop_v01/{key}-photo-cutout-v01.png', f'portrait-{key}.webp', quality=92)
    source = f'KV/Character_Backdrop_v01/backgrounds/{key}-background-v01.svg'
    target = OUT / f'portrait-{key}-background.svg'
    shutil.copyfile(PROJECT / source, target)
    records.append({'file': 'assets/' + target.name, 'source': source, 'width': 816, 'height': 624,
                    'bytes': target.stat().st_size, 'operation': 'Unmodified native SVG copy'})

manifest = {
    'status': 'Existing supplied UI artwork optimized for browser preview; no generated or repainted imagery.',
    'alternatives': {key.upper(): value for key, value in heroes.items()} | {'E': heroes['c']},
    'assets': records,
    'portraits': {
        'canvas': [816, 624], 'background': 'portrait-{character}-background.svg',
        'desktopWindow': {'x': 96, 'y': 40, 'width': 624, 'height': 472},
        'photoHeight': 720,
        'photoLeftWithinWindow': {'aksa': 5.51, 'rasa': -59.56, 'bumi': -56.13},
        'photoTopWithinWindow': 0,
        'mobileCanvas': [390, 392],
        'mobileWindow': {'x': 16, 'y': 48, 'width': 358, 'height': 292},
        'mobilePhotoHeight': 444,
        'mobilePhotoLeftWithinWindow': {'aksa': -10, 'rasa': -50.13, 'bumi': -48.02},
        'mobileBackgroundTransform': {'scale': .53, 'left': -21.24, 'top': 30},
        'guidance': 'Keep upper chest clipping window. Shapes behind photo. Keep people static and do not reconstruct hidden shoulders.'
    },
    'cardsAD': {
        'sources': 'output/character_bible_assets/{Aksa_Hero_Portrait_v02,Rasa_Hero_Portrait_v01,Bumi_Hero_Portrait_v01}.png',
        'desktopFrame': [400, 288], 'mobileFrame': [342, 240],
        'objectFit': 'cover',
        'aksa': {'imageWidthPercent': 100, 'imageHeightPercent': 100, 'leftPercent': 0, 'topPx': 0},
        'rasaAndBumi': {'imageWidthPercent': 160, 'imageHeightPercent': 160, 'leftPercent': -30, 'topPx': -8},
        'guidance': 'Images are unchanged complete sources. Apply clipping via CSS to reproduce supplied matched-scale cards; no invented body pixels.'
    },
    'heroE': {
        'canvas': [1672, 941], 'orderBackToFront': [f'hero-e-l0{i}.webp' for i in range(7)],
        'sourceTravelY': [0, 0, -1, -2, 0, 1, 2],
        'guidance': 'All seven full-canvas images use identical contain scale and origin. Independent travel max 2 source pixels. People static; mobile/reduced motion use hero-e-mobile.webp with zero travel. Inferred cleanplate is reconstructed scenery, not a recovered original.'
    }
}
(DOCS / 'asset-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'assets': len(records), 'totalBytes': sum(r['bytes'] for r in records), 'output': str(OUT)}, indent=2))
