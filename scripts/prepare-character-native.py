"""Crop the supplied film's alpha sheets into lossless WebP assets; retain sources."""
from __future__ import annotations
import hashlib
import json
import math
from pathlib import Path
import re
import shutil
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
PROTO = ROOT / 'Prototype'
SOURCE_ROOT = ROOT / 'Motion/ARB_Character_Introduction_v01'
CHARACTER_SPEC = SOURCE_ROOT / 'src/characters.ts'
OUT = PROTO / 'public/assets/character-native-v01'
QA = ROOT / 'tmp/character-native-v01'


def sha256(path: Path) -> str:
    with path.open('rb') as source:
        return hashlib.file_digest(source, 'sha256').hexdigest()


def relative(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def checkerboard(width: int, height: int) -> Image.Image:
    result = Image.new('RGB', (width, height), '#e2e0d9')
    draw = ImageDraw.Draw(result)
    for y in range(0, height, 16):
        for x in range(0, width, 16):
            if (x // 16 + y // 16) % 2:
                draw.rectangle((x, y, x + 15, y + 15), fill='#f0eee8')
    return result


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    QA.mkdir(parents=True, exist_ok=True)
    spec_text = CHARACTER_SPEC.read_text(encoding='utf-8')
    characters = re.findall(r"id:\s*'(\w+)'.*?poses:\s*(\[\[.*?\]\])", spec_text, re.S)
    assert [key for key, _ in characters] == ['aksa', 'rasa', 'bumi']
    manifest = {
        'sourceSpec': relative(CHARACTER_SPEC), 'sourceSpecSha256': sha256(CHARACTER_SPEC),
        'operation': 'Mechanical normalized-bound crops from existing alpha sheets; lossless WebP; no resizing, mirroring, synthesized pixels or alpha changes.',
        'sources': [], 'assets': [], 'fonts': [],
    }
    sheet = Image.new('RGB', (1120, 3 * 390), '#f4f0e7')
    draw = ImageDraw.Draw(sheet)
    for row, (key, raw_bounds) in enumerate(characters):
        bounds = json.loads(re.sub(r'(?<![\d\w])\.(\d+)', r'0.\1', raw_bounds))
        source_path = SOURCE_ROOT / 'public/characters' / f'{key}-poses-v01.png'
        before = sha256(source_path)
        with Image.open(source_path) as source:
            assert source.mode == 'RGBA', f'{source_path}: RGBA source required'
            width, height = source.size
            source_info = {'character': key, 'path': relative(source_path), 'width': width, 'height': height,
                           'mode': source.mode, 'bytes': source_path.stat().st_size, 'sha256Before': before}
            for index, (left, top, right, bottom) in enumerate(bounds):
                pixel_bounds = (math.floor(left * width), math.floor(top * height), math.ceil(right * width), math.ceil(bottom * height))
                cropped = source.crop(pixel_bounds)
                target = OUT / f'{key}-pose-{index}.webp'
                cropped.save(target, format='WEBP', lossless=True, exact=True, method=6)
                with Image.open(target) as encoded:
                    decoded = encoded.convert('RGBA')
                    assert decoded.size == cropped.size
                    assert cropped.tobytes() == decoded.tobytes(), 'Decoded RGBA pixels must equal source crop'
                    alpha_range = decoded.getchannel('A').getextrema()
                    assert alpha_range[0] == 0 and alpha_range[1] > 0
                    thumb = decoded.copy()
                    thumb.thumbnail((240, 320), Image.Resampling.LANCZOS)
                    x, y = index * 280, row * 390
                    board = checkerboard(256, 336)
                    board.paste(thumb, ((256 - thumb.width) // 2, 336 - thumb.height), thumb)
                    sheet.paste(board, (x + 12, y + 8))
                    draw.text((x + 12, y + 354), f'{key}-pose-{index}  {decoded.width} x {decoded.height}', fill='#292d29')
                    draw.text((x + 12, y + 370), f'{target.stat().st_size:,} B / lossless RGBA', fill='#4b5349')
                    manifest['assets'].append({'character': key, 'pose': index,
                        'asset': target.relative_to(PROTO / 'public').as_posix(),
                        'width': decoded.width, 'height': decoded.height, 'bytes': target.stat().st_size,
                        'normalizedCrop': [left, top, right, bottom], 'pixelCrop': list(pixel_bounds),
                        'sha256': sha256(target), 'mode': decoded.mode, 'alphaRange': list(alpha_range),
                        'decodedPixelsEqualSourceCrop': True})
        source_info['sha256After'] = sha256(source_path)
        assert source_info['sha256After'] == before
        manifest['sources'].append(source_info)
    for name in ['CormorantGaramond-Regular.woff2', 'Cormorant-Garamond-LICENSE.txt']:
        source = SOURCE_ROOT / 'public/fonts' / name
        target = OUT / name
        shutil.copy2(source, target)
        assert sha256(source) == sha256(target)
        manifest['fonts'].append({'source': relative(source), 'asset': target.relative_to(PROTO / 'public').as_posix(), 'bytes': target.stat().st_size, 'sha256': sha256(target)})
    manifest['qa'] = {'pass': True, 'webpDecodeChecks': len(manifest['assets']), 'sourceSheetsModified': False,
                      'losslessRGBAEqualityChecks': len(manifest['assets']), 'noUpscaling': True,
                      'totalPoseBytes': sum(asset['bytes'] for asset in manifest['assets'])}
    sheet.save(QA / 'pose-contact.jpg', quality=94)
    (PROTO / 'docs/character-native-media.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'qa': manifest['qa'], 'assets': [{k: a[k] for k in ['character', 'pose', 'width', 'height', 'bytes']} for a in manifest['assets']]}))


if __name__ == '__main__':
    main()
