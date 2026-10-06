"""Build Scout's feeling sprite sheets.

Each feeling is a frame sequence of 64x64 transparent PNGs named
<prefix>_<i>.png (frame 0 is Scout at rest). This joins each sequence into one
horizontal strip, src/assets/characters/scout/<feeling>.png, that the game
animates with CSS steps().

Usage (from the repo root):
  uv run --with pillow python tools/build-scout-sheets.py <frames-folder>
"""
import sys
from pathlib import Path

from PIL import Image

FRAME = 64
# The source frames hold Scout at (8, 16), as scout_0.png padded 48 -> 64. The
# sheets move Scout to (12, 12): a multiple of 12 source pixels lands on whole
# screen pixels at every size the game draws Scout (28, 32, 52, 64, 96px from
# the 48px original), so the pixelated scaling lines up with scout_0.png's.
SHIFT = (4, -4)
# feeling sheet name -> (frame file prefix, frame count)
FEELINGS = {
    'hug': ('hug', 9),
    'proud': ('proud2', 7),
    'happy': ('happy', 7),
    'wave': ('waving', 7),
    'go-do-it': ('godoit', 7),
    'thinking-a': ('thinkingA', 7),
    'thinking-b': ('thinkingB', 7),
    'worried': ('worried', 7),
    'sad': ('sad', 7),
}


def save_small(sheet, path):
    """Save as an exact (lossless) palette PNG when the sheet has at most 256
    colours, which the pixel art does; otherwise as plain RGBA."""
    pixels = [p if p[3] else (0, 0, 0, 0) for p in getattr(sheet, 'get_flattened_data', sheet.getdata)()]
    colours = sorted(set(pixels), key=lambda c: c[3])  # transparent first
    if len(colours) > 256:
        sheet.save(path, optimize=True)
        return
    index = {c: i for i, c in enumerate(colours)}
    pal = Image.new('P', sheet.size)
    pal.putdata([index[p] for p in pixels])
    pal.putpalette([v for c in colours for v in c[:3]])
    pal.save(path, optimize=True, transparency=bytes(c[3] for c in colours))


def main(src):
    out = Path(__file__).resolve().parent.parent / 'src/assets/characters/scout'
    out.mkdir(parents=True, exist_ok=True)
    for name, (prefix, count) in FEELINGS.items():
        sheet = Image.new('RGBA', (FRAME * count, FRAME), (0, 0, 0, 0))
        for i in range(count):
            frame = Image.open(Path(src) / f'{prefix}_{i}.png').convert('RGBA')
            if frame.size != (FRAME, FRAME):
                raise SystemExit(f'{prefix}_{i}.png is {frame.size}, expected {FRAME}x{FRAME}')
            box = frame.getchannel('A').getbbox()
            if box and (box[0] + SHIFT[0] < 0 or box[1] + SHIFT[1] < 0
                        or box[2] + SHIFT[0] > FRAME or box[3] + SHIFT[1] > FRAME):
                raise SystemExit(f'{prefix}_{i}.png does not fit after the shift')
            shifted = Image.new('RGBA', (FRAME, FRAME), (0, 0, 0, 0))
            shifted.paste(frame, SHIFT)
            sheet.paste(shifted, (FRAME * i, 0))
        path = out / f'{name}.png'
        save_small(sheet, path)
        print(f'{path.name}: {count} frames, {path.stat().st_size} bytes')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    main(sys.argv[1])
