"""Recorta as 7 poses do Cordeirinho (`imagens/Cordeirinho.jpg`) para `public/cordeirinho/`.

Uso: `PYTHONIOENCODING=utf-8 python scripts/crop-lamb.py [--sheet saida.png]`
Requer Pillow, numpy e scipy (`pip install pillow numpy scipy`).

O fundo bege é removido a partir das bordas de cada caixa (só o que está ligado à borda some, então
a lã branca e as partes claras dentro do contorno ficam). A sombra sob os pés vira uma sombra
escura semitransparente, para funcionar sobre qualquer cor de fundo.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'imagens' / 'Cordeirinho.jpg'
OUT = ROOT / 'public' / 'cordeirinho'
MAX_SIDE = 400

# Caixas (x0, y0, x1, y1) na imagem original de 2400x1792, sem os rótulos escritos.
POSES = {
    'acolhimento': (170, 230, 740, 935),
    'sucesso': (880, 230, 1550, 945),
    'ops': (1690, 245, 2215, 945),
    'aprendendo': (170, 1075, 655, 1672),
    'descanso': (760, 1110, 1210, 1672),
    'fe': (1285, 1065, 1755, 1672),
    'vamos': (1790, 1055, 2300, 1672),
}

BG = np.array([243, 226, 194], float)
SHADOW = np.array([210, 186, 154], float)


def cut(img: np.ndarray, max_side: int | None = MAX_SIDE) -> Image.Image:
    px = img.astype(float)
    axis = SHADOW - BG
    t = np.clip(((px - BG) @ axis) / (axis @ axis), 0, 1.2)
    off_axis = np.linalg.norm(px - (BG + t[..., None] * axis), axis=2)
    beige = (off_axis < 14) & (t < 1.15)  # fundo ou sombra (tons na linha bege → sombra)
    labels, _ = ndimage.label(beige)
    edge = np.unique(np.r_[labels[0], labels[-1], labels[:, 0], labels[:, -1]])
    bg = np.isin(labels, edge[edge > 0])

    rgba = np.dstack([img, np.full(img.shape[:2], 255, np.uint8)])
    # Fundo vira sombra marrom-escura com transparência proporcional ao quanto escurece.
    alpha = np.clip(t * 0.32 * 255, 0, 255)
    rgba[bg, :3] = (90, 60, 40)
    rgba[bg, 3] = alpha[bg].astype(np.uint8)
    # Borda anti-aliased: pixels encostados no fundo ficam meio transparentes.
    ring = ndimage.binary_dilation(bg) & ~bg & (off_axis < 40)
    rgba[ring, 3] = 170
    rgba[bg & (alpha < 8), 3] = 0

    im = Image.fromarray(rgba, 'RGBA')
    bbox = Image.fromarray((rgba[..., 3] > 10).astype(np.uint8) * 255).getbbox()
    im = im.crop(bbox)
    if max_side:
        im.thumbnail((max_side, max_side), Image.LANCZOS)
    return im


def pose(name: str, max_side: int | None = None) -> Image.Image:
    """Uma pose recortada em resolução cheia (usada também por make-icons.py)."""
    x0, y0, x1, y1 = POSES[name]
    return cut(np.asarray(Image.open(SRC).convert('RGB'))[y0:y1, x0:x1], max_side)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    src = np.asarray(Image.open(SRC).convert('RGB'))
    tiles = []
    for name, (x0, y0, x1, y1) in POSES.items():
        im = cut(src[y0:y1, x0:x1])
        im.save(OUT / f'{name}.webp', 'WEBP', quality=88, method=6)
        tiles.append(im)
        print(f'{name:12s} {im.size}')

    if '--sheet' in sys.argv:
        out = sys.argv[sys.argv.index('--sheet') + 1]
        sheet = Image.new('RGBA', (MAX_SIDE * 7, MAX_SIDE * 2), (255, 255, 255, 255))
        for k, t in enumerate(tiles):
            for row, color in enumerate([(253, 248, 238, 255), (254, 226, 226, 255)]):
                cell = Image.new('RGBA', (MAX_SIDE, MAX_SIDE), color)
                cell.alpha_composite(t, ((MAX_SIDE - t.width) // 2, MAX_SIDE - t.height))
                sheet.paste(cell, (k * MAX_SIDE, row * MAX_SIDE))
        sheet.convert('RGB').save(out)


if __name__ == '__main__':
    main()
