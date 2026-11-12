"""Gera os ícones PNG do app: `PYTHONIOENCODING=utf-8 python scripts/make-icons.py [--preview arquivo.png]`

Fonte: o ícone "3. O Cordeirinho Alegre" da grade `imagens/icone.jpeg` (Pillow + numpy + scipy).
O fundo laranja original vira Azul Mariano, a cor principal do app (a borda da lã é suavizada).
O quadrado do ícone é recortado um pouco para dentro (some o canto arredondado e o fundo bege da grade)
e vira um desenho "sangrado", que preenche o quadro todo:

- icon-192 / icon-512 ("any", favicon do site): cantos arredondados com fundo transparente.
- apple-touch-icon (180): quadro todo, o iOS arredonda sozinho.
- icon-maskable-512: quadro todo, como o da Apple. O Android recorta em círculo/squircle; o rosto
  fica no centro e só as pontas da lã e das orelhas são cortadas.

No fim, o script grava um código da versão (?v=<hash das imagens>) nos endereços dos ícones em
public/manifest.webmanifest e index.html: endereço novo faz o navegador e o Android baixarem o ícone novo
sem precisar limpar o cache. Ao mudar os ícones, suba também a versão do cache em public/sw.js.
"""
import hashlib
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'imagens' / 'icone.jpeg'
OUT = ROOT / 'public' / 'icons'

# Quadrado do ícone 3 na grade (x0, y0, lado), medido pela borda laranja.
TILE = (836, 164, 284)
# Recuo para eliminar o canto arredondado da grade: raio ~50 px → r·(1 − 1/√2) ≈ 15 px,
# mais uma folga para a borda suavizada do canto.
INSET = 21

BG = np.array([30, 58, 138])  # Azul Mariano #1E3A8A (brand-700)
ORANGE = np.array([243, 109, 42])  # fundo original (média medida)


def recolor(im: Image.Image) -> Image.Image:
    """Troca o fundo laranja (as regiões laranja que tocam a borda) pelo azul do app."""
    a = np.array(im).astype(float)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    orange = (r > 200) & (b < 110) & (g > 70) & (g < 190)
    labels, _ = ndimage.label(orange)
    edge = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    core = np.isin(labels, edge[edge > 0])
    # Faixa da borda: pixel misturado entre laranja e lã branca. t = quanto de laranja ele tem.
    band = ndimage.binary_dilation(core, iterations=2) & ~core
    t = np.clip(((255 - g) / (255 - ORANGE[1]) + (255 - b) / (255 - ORANGE[2])) / 2, 0, 1)
    out = a.copy()
    out[core] = BG
    out[band] = a[band] + t[band, None] * (BG - ORANGE)
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))


def bleed() -> Image.Image:
    """O desenho sem cantos nem fundo da grade, preenchendo um quadrado."""
    x, y, s = TILE
    im = Image.open(SRC).convert('RGB')
    return recolor(im.crop((x + INSET, y + INSET, x + s - INSET, y + s - INSET)))


def rounded(size: int, radius: float = 0.22) -> Image.Image:
    """Ícone com cantos arredondados e fundo transparente (máscara suavizada 4x)."""
    art = bleed().resize((size, size), Image.LANCZOS).convert('RGBA')
    big = size * 4
    mask = Image.new('L', (big, big), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, big - 1, big - 1), radius=int(big * radius), fill=255)
    art.putalpha(mask.resize((size, size), Image.LANCZOS))
    return art


def full(size: int) -> Image.Image:
    return bleed().resize((size, size), Image.LANCZOS)


def stamp_version(names):
    """Põe ?v=<hash> nos endereços dos ícones (manifest e index.html)."""
    h = hashlib.sha1()
    for n in sorted(names):
        h.update((OUT / n).read_bytes())
    v = h.hexdigest()[:8]
    for f in [ROOT / 'public' / 'manifest.webmanifest', ROOT / 'index.html']:
        text = f.read_text(encoding='utf-8')
        new = re.sub(r'(icons/[\w-]+\.png)(\?v=\w+)?', lambda m: f'{m.group(1)}?v={v}', text)
        f.write_text(new, encoding='utf-8')
    print('versão dos ícones:', v)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    out = {
        'icon-192.png': rounded(192),
        'icon-512.png': rounded(512),
        'icon-maskable-512.png': full(512),
        'apple-touch-icon.png': full(180),
    }
    for name, im in out.items():
        im.save(OUT / name, optimize=True)
        print('ok', name, im.size)
    stamp_version(list(out))

    if '--preview' in sys.argv:
        # Folha de conferência: cada ícone sobre fundo claro e escuro, e o maskable recortado em círculo.
        dest = Path(sys.argv[sys.argv.index('--preview') + 1])
        sheet = Image.new('RGB', (4 * 270, 2 * 270), (240, 240, 240))
        sheet.paste((40, 40, 40), (0, 270, sheet.width, sheet.height))
        circle = Image.new('L', (512, 512), 0)
        ImageDraw.Draw(circle).ellipse((0, 0, 511, 511), fill=255)
        masked = out['icon-maskable-512.png'].convert('RGBA')
        masked.putalpha(circle)
        items = [out['icon-512.png'], out['apple-touch-icon.png'].convert('RGBA'), out['icon-maskable-512.png'].convert('RGBA'), masked]
        for row in range(2):
            for i, im in enumerate(items):
                t = im.resize((230, 230), Image.LANCZOS)
                sheet.paste(t, (i * 270 + 20, row * 270 + 20), t)
        sheet.save(dest)
        print('folha', dest)


if __name__ == '__main__':
    main()
