"""Gera os ícones PNG do app com o Cordeirinho: `PYTHONIOENCODING=utf-8 python scripts/make-icons.py [--preview]`

Requer Pillow, numpy e scipy. Desenho: Cordeirinho (pose "acolhimento") sobre auréola dourada,
em fundo Azul Mariano. Os ícones "maskable" e o da Apple ocupam o quadro todo e deixam o
desenho dentro da zona segura (círculo de 80%), porque o sistema recorta as bordas.
"""
import importlib.util
import sys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'public' / 'icons'

BG = (30, 58, 138)  # Azul Mariano #1E3A8A
HALO = (253, 230, 138)  # dourado claro #FDE68A
HALO_RIM = (245, 158, 11)  # Dourado Sacro #F59E0B

_spec = importlib.util.spec_from_file_location('crop_lamb', ROOT / 'scripts' / 'crop-lamb.py')
crop_lamb = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(crop_lamb)


def lamb(bust: bool) -> Image.Image:
    im = crop_lamb.pose('acolhimento', None)
    if bust:  # cabeça, lenço e Bíblia: lê melhor em tamanho pequeno
        im = im.crop((0, 0, im.width, int(im.height * 0.68)))
    return im


def render(size: int, full_bleed: bool, bust: bool, ss: int = 4) -> Image.Image:
    S = size * ss
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if full_bleed:
        d.rectangle((0, 0, S, S), fill=BG)
        area = 0.80  # zona segura do maskable
    else:
        d.rounded_rectangle((0, 0, S - 1, S - 1), radius=int(S * 0.22), fill=BG)
        area = 0.96
    # Auréola atrás do cordeirinho.
    r = S * area * 0.40
    cx, cy = S / 2, S / 2 + (S * 0.09 if bust and full_bleed else -S * area * (0.04 if bust else 0.07))
    w = max(2, int(S * 0.018))
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=HALO, outline=HALO_RIM, width=w)

    fig = lamb(bust)
    box = S * area * (0.84 if bust else 0.86)
    scale = box / max(fig.width, fig.height)
    fig = fig.resize((int(fig.width * scale), int(fig.height * scale)), Image.LANCZOS)
    x = (S - fig.width) // 2
    if bust:  # o busto encosta na borda de baixo (o rosto fica dentro da zona segura)
        y = S - fig.height
    else:
        y = (S - fig.height) // 2 + int(S * 0.02)
    img.alpha_composite(fig, (x, y))
    if not full_bleed:  # corta o que passar do quadrado arredondado
        mask = Image.new('L', (S, S), 0)
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, S - 1, S - 1), radius=int(S * 0.22), fill=255)
        img.putalpha(Image.composite(img.getchannel('A'), mask, mask))
    return img.resize((size, size), Image.LANCZOS)


ICONS = [
    ('icon-192.png', 192, False),
    ('icon-512.png', 512, False),
    ('icon-maskable-512.png', 512, True),
    ('apple-touch-icon.png', 180, True),
]

if __name__ == '__main__':
    if '--preview' in sys.argv:
        out = Path(sys.argv[sys.argv.index('--preview') + 1])
        sheet = Image.new('RGBA', (4 * 300 + 50, 2 * 300 + 30), (240, 240, 240, 255))
        for row, bust in enumerate([False, True]):
            for col, (_, _, fb) in enumerate(ICONS[1:3] + [(None, None, False), (None, None, True)]):
                size = 256 if col < 2 else 96
                sheet.alpha_composite(render(size, fb, bust), (10 + col * 300, 10 + row * 300))
        sheet.save(out)
    else:
        bust = '--full' not in sys.argv
        OUT.mkdir(parents=True, exist_ok=True)
        for name, size, fb in ICONS:
            render(size, fb, bust).save(OUT / name, optimize=True)
            print(name, size)
