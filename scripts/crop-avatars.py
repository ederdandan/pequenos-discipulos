"""Recorta os 30 avatares circulares das grades em `imagens/` para `public/avatares/`.

Uso: `PYTHONIOENCODING=utf-8 python scripts/crop-avatars.py [--sheet saida.png]`
Requer Pillow e numpy (`pip install pillow numpy`).

Cada grade tem 2 linhas x 5 colunas. Para cada célula o script acha a borda do disco colorido
(o ponto mais à esquerda/direita de cada linha de pixels) e ajusta um círculo por RANSAC.
O recorte é só o disco (o nome escrito embaixo fica de fora), com fundo transparente fora dele.
"""
import random
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'imagens'
OUT = ROOT / 'public' / 'avatares'
SIZE = 256

GRIDS = {
    'Personagens Santos 1.jpg': [
        'nossa-senhora-aparecida', 'sao-jose', 'santa-teresinha', 'santo-antonio', 'sao-francisco',
        'santa-rita', 'sao-jorge', 'sao-pedro', 'santa-dulce', 'sao-carlo-acutis',
    ],
    'Personagens Santos 2.jpg': [
        'sao-domingos-savio', 'sao-joao-bosco', 'santa-ines', 'sao-tarcisio', 'santa-maria-goretti',
        'santo-expedito', 'santa-clara', 'sao-judas-tadeu', 'santa-joana-darc', 'sao-padre-pio',
    ],
    'Personagens Magisterio.jpg': [
        'papa', 'bispo', 'padre', 'diacono', 'freira',
        'monge', 'acolito', 'catequista', 'leitor', 'ministro-eucaristia',
    ],
}

# Faixas verticais (em fração da altura) onde ficam os discos de cada linha.
ROW_BANDS = [(0.15, 0.47), (0.53, 0.86)]


def fit_circle(pts):
    """Círculo por 3+ pontos (mínimos quadrados algébricos)."""
    x, y = pts[:, 0], pts[:, 1]
    a = np.c_[2 * x, 2 * y, np.ones(len(x))]
    b = x * x + y * y
    (cx, cy, c), *_ = np.linalg.lstsq(a, b, rcond=None)
    return cx, cy, np.sqrt(max(c + cx * cx + cy * cy, 0))


def find_disc(fg, x0, y0, rmin, rmax):
    pts = []
    for yy in range(fg.shape[0]):
        xs = np.flatnonzero(fg[yy])
        if len(xs) > 20:
            pts.append((xs[0], yy))
            pts.append((xs[-1], yy))
    pts = np.array(pts, dtype=float)
    rng = random.Random(1)
    best, best_in = None, 0
    for _ in range(3000):
        s = pts[rng.sample(range(len(pts)), 3)]
        cx, cy, r = fit_circle(s)
        if not (rmin <= r <= rmax):
            continue
        d = np.abs(np.hypot(pts[:, 0] - cx, pts[:, 1] - cy) - r)
        n = int((d < 2.5).sum())
        if n > best_in:
            best, best_in = (cx, cy, r), n
    cx, cy, r = best
    d = np.abs(np.hypot(pts[:, 0] - cx, pts[:, 1] - cy) - r)
    cx, cy, r = fit_circle(pts[d < 2.5])
    return cx + x0, cy + y0, r


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    crops = []
    for file, names in GRIDS.items():
        img = Image.open(SRC / file).convert('RGB')
        arr = np.asarray(img).astype(int)
        h, w, _ = arr.shape
        border = np.concatenate([arr[:20].reshape(-1, 3), arr[-20:].reshape(-1, 3)])
        bg = np.median(border, axis=0)
        fg_all = np.abs(arr - bg).sum(axis=2) > 28
        for i, name in enumerate(names):
            row, col = divmod(i, 5)
            x0, x1 = col * w // 5, (col + 1) * w // 5
            y0, y1 = int(ROW_BANDS[row][0] * h), int(ROW_BANDS[row][1] * h)
            cx, cy, r = find_disc(fg_all[y0:y1, x0:x1], x0, y0, 0.08 * w, 0.1 * w)
            r -= 1  # evita o anti-aliasing da borda
            box = (round(cx - r), round(cy - r), round(cx + r), round(cy + r))
            tile = img.crop(box).resize((SIZE * 4, SIZE * 4), Image.LANCZOS)
            mask = Image.new('L', tile.size, 0)
            ImageDraw.Draw(mask).ellipse((0, 0, tile.size[0] - 1, tile.size[1] - 1), fill=255)
            tile = tile.convert('RGBA')
            tile.putalpha(mask)
            tile = tile.resize((SIZE, SIZE), Image.LANCZOS)
            tile.save(OUT / f'{name}.webp', 'WEBP', quality=86, method=6)
            crops.append(tile)
            print(f'{name:28s} centro=({cx:.0f},{cy:.0f}) raio={r:.0f}')

    if '--sheet' in sys.argv:
        out = sys.argv[sys.argv.index('--sheet') + 1]
        sheet = Image.new('RGBA', (SIZE * 10, SIZE * 3), (255, 255, 255, 255))
        for k, t in enumerate(crops):
            sheet.alpha_composite(t, ((k % 10) * SIZE, (k // 10) * SIZE))
        sheet.convert('RGB').save(out)


if __name__ == '__main__':
    main()
