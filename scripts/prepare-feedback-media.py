"""Optimize only the supplied November feedback videos; retain all originals."""
from __future__ import annotations
import argparse
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[2]
PROTO = ROOT / 'Prototype'
OUT = PROTO / 'public/assets/feedback-v02'
QA = ROOT / 'tmp/feedback-v02'
BIN = ROOT / 'Motion/ARB_Alt03_Amber_Cinematic/node_modules/@remotion/compositor-win32-x64-msvc'
FFMPEG = BIN / 'ffmpeg.exe'
FFPROBE = BIN / 'ffprobe.exe'
SOURCES = {
    'living-room': ROOT / 'Motion/ARB_Living_Room_Collage/render/ARB_Living_Room_Collage_v01.mp4',
    'amber-cinematic': ROOT / 'Motion/ARB_Alt03_Amber_Cinematic/render/ARB_Alt03_Amber_Cinematic_v02.mp4',
    'amber-collage': ROOT / 'Motion/ARB_Alt03_Amber_Cinematic/render/ARB_Amber_Collage_Parallax_Cinematic_v01.mp4',
    'reference-books': ROOT / 'Motion References/Haruki Murakami - Book Author Website Animation _ Interaction.mp4',
    'reference-ui': ROOT / 'Motion References/Website UI_UX Design.mp4',
}

def run(args):
    completed = subprocess.run([str(x) for x in args], capture_output=True, text=True, encoding='utf-8', errors='replace')
    if completed.returncode:
        raise RuntimeError(completed.stderr[-3000:])
    return completed.stdout

def probe(path):
    return json.loads(run([FFPROBE, '-v', 'error', '-show_streams', '-show_format', '-of', 'json', path]))

def frame(source, time, target, width=640):
    actual = QA / f'{target.stem}-frame.jpg' if target.suffix == '.webp' else target
    run([FFMPEG, '-hide_banner', '-loglevel', 'error', '-y', '-ss', time, '-i', source, '-frames:v', 1, '-vf', f'scale={width}:-2', '-threads', 1, actual])
    if actual != target:
        from PIL import Image
        Image.open(actual).convert('RGB').save(target, quality=90, method=6)

def audit(key):
    from PIL import Image, ImageDraw
    source = SOURCES[key]
    metadata = probe(source)
    duration = float(metadata['format']['duration'])
    video = next(s for s in metadata['streams'] if s['codec_type'] == 'video')
    (QA / key).mkdir(parents=True, exist_ok=True)
    times = ([1.8, 5.0, 8.8, 12.5, 20.0, 29.5, 37.0, duration-1.5]
             if key in ('living-room', 'amber-cinematic', 'amber-collage')
             else [duration * i / 8 for i in range(8)])
    sheet = Image.new('RGB', (1280, 4*396), '#f3eee4')
    draw = ImageDraw.Draw(sheet)
    for i, time in enumerate(times):
        target = QA / key / f'frame-{i+1:02}.jpg'
        frame(source, time, target)
        image = Image.open(target).convert('RGB')
        image.thumbnail((640, 360))
        x, y = (i % 2)*640, (i // 2)*396
        sheet.paste(image, (x, y+28))
        draw.text((x+12, y+8), f'{key} | {time:.2f}s', fill='#28231e')
    sheet.save(QA / f'{key}-contact.jpg', quality=90)
    summary = {'source': str(source.relative_to(ROOT)), 'duration': duration, 'width': video['width'], 'height': video['height'], 'frameRate': video['avg_frame_rate'], 'audioStreams': sum(s['codec_type']=='audio' for s in metadata['streams'])}
    (QA / f'{key}-metadata.json').write_text(json.dumps(metadata, indent=2), encoding='utf-8')
    print(json.dumps(summary), flush=True)
    return summary

def encode(key):
    from PIL import Image
    source = SOURCES[key]
    target = OUT / f'{key}.mp4'
    # Dense half-second keyframes keep browser currentTime seeks bounded.
    if not (target.exists() and target.stat().st_size > 0 and target.stat().st_mtime >= source.stat().st_mtime):
        run([FFMPEG, '-hide_banner', '-loglevel', 'error', '-y', '-i', source,
             '-map', '0:v:0', '-an', '-vf', 'scale=1280:720', '-r', 24, '-c:v', 'libx264',
             '-preset', 'medium', '-crf', 24, '-pix_fmt', 'yuv420p', '-g', 12, '-keyint_min', 12,
             '-sc_threshold', 0, '-movflags', '+faststart', '-threads', 2, target])
    duration = float(probe(target)['format']['duration'])
    poster_time = 5.8 if key == 'amber-cinematic' else 2.5
    frame(source, poster_time, OUT / f'{key}-poster.webp', width=1280)
    still_dir = ROOT / ('Motion/ARB_Living_Room_Collage/public/stills' if key == 'living-room' else 'Motion/ARB_Alt03_Amber_Cinematic/public/stills')
    still_sources = [still_dir / name for name in ['01-Aksa.png', '04-Rasa.png', '06-Bumi.png']]
    for i, still_source in enumerate(still_sources, 1):
        image = Image.open(still_source).convert('RGB')
        image.thumbnail((1000,1000))
        image.save(OUT / f'{key}-still-{i:02}.webp', quality=88, method=6)
    metadata = probe(target)
    video = next(s for s in metadata['streams'] if s['codec_type']=='video')
    result = {'key': key, 'source': str(source.relative_to(ROOT)), 'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
              'video': f'assets/feedback-v02/{key}.mp4', 'poster': f'assets/feedback-v02/{key}-poster.webp',
              'posterTimestamp': poster_time,
              'stills': [f'assets/feedback-v02/{key}-still-{i:02}.webp' for i in range(1,4)],
              'stillSources': [str(path.relative_to(ROOT)) for path in still_sources],
              'duration': duration, 'width': video['width'], 'height': video['height'], 'frameRate': video['avg_frame_rate'],
              'bytes': target.stat().st_size, 'audioStreams': sum(s['codec_type']=='audio' for s in metadata['streams']),
              'codec': video['codec_name'], 'keyframeIntervalSeconds': 0.5, 'operation': 'H.264 web derivative; source visuals unchanged; audio removed'}
    poster = Image.open(OUT / f'{key}-poster.webp').convert('RGB')
    sampled = poster.resize((160,90)).quantize(colors=8)
    palette = sampled.getpalette()
    result['sampledPosterColors'] = ['#'+''.join(f'{v:02x}' for v in palette[index*3:index*3+3]) for _,index in sorted(sampled.getcolors(),reverse=True)]
    print(json.dumps(result), flush=True)
    return result

def verify(assets):
    from PIL import Image
    checks = []
    for asset in assets:
        packets = json.loads(run([FFPROBE, '-v', 'error', '-select_streams', 'v:0', '-show_packets', '-show_entries', 'packet=pts_time,flags', '-of', 'json', PROTO / 'public' / asset['video']]))['packets']
        keys = sorted(float(packet['pts_time']) for packet in packets if 'K' in packet.get('flags',''))
        gap = max(round(b-a,6) for a,b in zip(keys,keys[1:]))
        assert gap <= .5, (asset['key'], gap)
        assert asset['width'] == 1280 and asset['height'] == 720 and asset['audioStreams'] == 0
        for filename in [asset['poster'], *asset['stills']]:
            with Image.open(PROTO / 'public' / filename) as image:
                image.load()
                assert image.width > 0 and image.height > 0
        checks.append({'key':asset['key'], 'keyframeCount':len(keys), 'maxKeyframeGap':gap, 'imageDecodeChecks':4})
    return {'pass':True, 'videoMetadataChecks':3, 'webpDecodeChecks':12, 'keyframes':checks, 'sourceRendersModified':False, 'issues':[]}

REFERENCE_AUDIT = {
    'bookReference': {'source':'Motion References/Haruki Murakami - Book Author Website Animation _ Interaction.mp4', 'duration':8.212993, 'observed':'Horizontal cover shelf; selected cover expands to floating book with side details; book rotates/opens into page and excerpt view; back reverses into shelf. Borrow motion/composition, not titles, ratings, metadata or manuscript content.'},
    'layoutReference': {'source':'Motion References/Website UI_UX Design.mp4', 'duration':13.8138, 'observed':'Full-bleed scenic-depth opening, asymmetric text-and-art section, overlapping central card/deck, then a full-width feature. Vary section placement and depth instead of repeating uniform cards.'},
    'visualEvidence':'Project tmp/feedback-v02 contains 8-frame contact sheets for each supplied source and reference video.',
}

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--audit', action='store_true')
    parser.add_argument('--encode', action='store_true')
    args = parser.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    QA.mkdir(parents=True, exist_ok=True)
    if args.audit:
        with ThreadPoolExecutor(max_workers=2) as pool:
            list(pool.map(audit, SOURCES))
    if args.encode:
        with ThreadPoolExecutor(max_workers=3) as pool:
            assets = list(pool.map(encode, ['living-room', 'amber-cinematic', 'amber-collage']))
        manifest = {'date': '2026-11-13', 'sourcePolicy': 'Only user-supplied project renders; no generation, dialogue invention or source replacement.', 'assets': assets, 'qa':verify(assets), 'referenceAudit':REFERENCE_AUDIT}
        (PROTO / 'docs/feedback-media.json').write_text(json.dumps(manifest, indent=2)+'\n', encoding='utf-8')
