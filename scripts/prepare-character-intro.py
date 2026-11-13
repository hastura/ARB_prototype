"""Prepare web derivatives of the user-selected character film; preserve its source."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
import subprocess

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
PROTO = ROOT / 'Prototype'
SOURCE = ROOT / 'Motion/ARB_Character_Introduction_v01/render/ARB_Character_Introduction_v01.mp4'
OUT = PROTO / 'public/assets/character-intro-v01'
QA = ROOT / 'tmp/character-intro-v01'
BIN = ROOT / 'Motion/ARB_Alt03_Amber_Cinematic/node_modules/@remotion/compositor-win32-x64-msvc'
FFMPEG = BIN / 'ffmpeg.exe'
FFPROBE = BIN / 'ffprobe.exe'
STILLS = [('aksa', 6.0), ('rasa', 18.0), ('bumi', 30.0)]
POSTER_TIME = 0.8


def run(args):
    result = subprocess.run([str(arg) for arg in args], capture_output=True,
                            text=True, encoding='utf-8', errors='replace')
    if result.returncode:
        raise RuntimeError(result.stderr[-3000:])
    return result.stdout


def probe(path):
    return json.loads(run([FFPROBE, '-v', 'error', '-show_streams', '-show_format', '-of', 'json', path]))


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def image_at(time, name, width=1280):
    frame = QA / f'{name}.png'
    run([FFMPEG, '-hide_banner', '-loglevel', 'error', '-y', '-ss', time,
         '-i', SOURCE, '-map', '0:v:0', '-frames:v', 1,
         '-vf', f'scale={width}:-2', '-threads', 1, frame])
    image = Image.open(frame).convert('RGB')
    image.save(OUT / f'{name}.webp', quality=90, method=6)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    QA.mkdir(parents=True, exist_ok=True)
    before = sha256(SOURCE)
    source_metadata = probe(SOURCE)
    (QA / 'source-metadata.json').write_text(json.dumps(source_metadata, indent=2), encoding='utf-8')
    source_video = next(stream for stream in source_metadata['streams'] if stream['codec_type'] == 'video')
    duration = float(source_metadata['format']['duration'])
    target = OUT / 'character-introduction.mp4'
    run([FFMPEG, '-hide_banner', '-loglevel', 'error', '-y', '-i', SOURCE,
         '-map', '0:v:0', '-an', '-vf', 'scale=1280:720', '-r', 24, '-t', duration,
         '-c:v', 'libx264', '-preset', 'medium', '-crf', 23, '-pix_fmt', 'yuv420p',
         '-g', 12, '-keyint_min', 12, '-sc_threshold', 0, '-movflags', '+faststart',
         '-threads', 2, target])
    image_at(POSTER_TIME, 'poster')
    for key, time in STILLS:
        image_at(time, f'still-{key}')

    # Timestamped visual evidence is kept outside the standalone web repository.
    sheet = Image.new('RGB', (1600, 4 * 265), '#e8dfca')
    draw = ImageDraw.Draw(sheet)
    for index in range(16):
        time = duration * index / 16
        frame = QA / f'frame-{index:02}.jpg'
        run([FFMPEG, '-hide_banner', '-loglevel', 'error', '-y', '-ss', time,
             '-i', SOURCE, '-map', '0:v:0', '-frames:v', 1, '-vf', 'scale=400:-2', '-threads', 1, frame])
        x, y = (index % 4) * 400, (index // 4) * 265
        sheet.paste(Image.open(frame).convert('RGB'), (x, y + 25))
        draw.text((x + 8, y + 6), f'{time:.2f}s', fill='#21170f')
    sheet.save(QA / 'source-contact.jpg', quality=93)

    metadata = probe(target)
    video = next(stream for stream in metadata['streams'] if stream['codec_type'] == 'video')
    packets = json.loads(run([FFPROBE, '-v', 'error', '-select_streams', 'v:0',
                              '-show_packets', '-show_entries', 'packet=pts_time,flags', '-of', 'json', target]))['packets']
    keyframes = sorted(float(packet['pts_time']) for packet in packets if 'K' in packet.get('flags', ''))
    gap = max(round(b - a, 6) for a, b in zip(keyframes, keyframes[1:]))
    after = sha256(SOURCE)
    assert before == after, 'Original film must remain byte-for-byte unchanged.'
    assert gap <= .5 and video['width'] == 1280 and video['height'] == 720
    assert video['avg_frame_rate'] == '24/1'
    assert abs(float(metadata['format']['duration']) - duration) < 1 / 24
    assert not any(stream['codec_type'] == 'audio' for stream in metadata['streams'])
    for image_path in OUT.glob('*.webp'):
        with Image.open(image_path) as image:
            image.load()
            assert image.size == (1280, 720)
    media_bytes = target.read_bytes()
    assert media_bytes.index(b'moov') < media_bytes.index(b'mdat'), 'The web film must use faststart.'
    result = {
        'source': str(SOURCE.relative_to(ROOT)).replace('\\', '/'),
        'sourceSha256': before, 'sourceSha256After': after,
        'sourceBytes': SOURCE.stat().st_size, 'sourceDuration': duration,
        'sourceWidth': source_video['width'], 'sourceHeight': source_video['height'],
        'sourceFrameRate': source_video['avg_frame_rate'],
        'video': 'assets/character-intro-v01/character-introduction.mp4',
        'videoSha256': sha256(target), 'bytes': target.stat().st_size,
        'duration': float(metadata['format']['duration']), 'width': video['width'], 'height': video['height'],
        'frameRate': video['avg_frame_rate'], 'codec': video['codec_name'], 'audioStreams': 0,
        'poster': 'assets/character-intro-v01/poster.webp', 'posterTimestamp': POSTER_TIME,
        'stills': [{'character': key, 'timestamp': time,
                    'asset': f'assets/character-intro-v01/still-{key}.webp'} for key, time in STILLS],
        'observedSequence': [
            {'character': 'aksa', 'start': 0.0, 'end': 13.0},
            {'character': 'rasa', 'start': 12.0, 'end': 25.0},
            {'character': 'bumi', 'start': 24.0, 'end': 37.0},
            {'character': 'ensemble', 'start': 36.0, 'end': 40.0},
        ],
        'embeddedCopyLanguage': 'English',
        'operation': 'H.264 web derivative of the exact user-selected render; source composition unchanged; audio removed for scroll seeking.',
        'qa': {'pass': True, 'maxKeyframeGapSeconds': gap, 'keyframeCount': len(keyframes),
               'webpDecodeChecks': 4, 'faststart': True, 'sourceRendersModified': False},
    }
    (PROTO / 'docs/character-intro-media.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
    (QA / 'web-metadata.json').write_text(json.dumps(metadata, indent=2), encoding='utf-8')
    print(json.dumps(result))


if __name__ == '__main__':
    main()
