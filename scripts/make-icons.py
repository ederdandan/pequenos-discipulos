"""Gera os ícones PNG do app (sem dependências): `python scripts/make-icons.py`

Desenho: cruz branca sobre auréola dourada, em fundo Azul Mariano.
"""
import struct
import zlib
from pathlib import Path

BG = (30, 58, 138)  # Azul Mariano #1E3A8A
HALO = (245, 158, 11)  # Dourado Sacro #F59E0B
HALO_RIM = (252, 211, 77)  # dourado claro
WHITE = (255, 255, 255)


def in_round_rect(x, y, x0, y0, x1, y1, r):
    if not (x0 <= x <= x1 and y0 <= y <= y1):
        return False
    cx = min(max(x, x0 + r), x1 - r)
    cy = min(max(y, y0 + r), y1 - r)
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r


def in_circle(x, y, cx, cy, r):
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r


def color_at(x, y, maskable):
    # Ícone "maskable" ocupa a tela toda; o desenho fica na zona segura (80%).
    if maskable:
        scale = 0.78
        x, y = 0.5 + (x - 0.5) / scale, 0.5 + (y - 0.5) / scale
    elif not in_round_rect(x, y, 0, 0, 1, 1, 0.22):
        return None
    # cruz latina
    if in_round_rect(x, y, 0.445, 0.17, 0.555, 0.84, 0.02) or in_round_rect(x, y, 0.27, 0.33, 0.73, 0.44, 0.02):
        return WHITE
    # auréola: disco dourado com aro mais claro
    if in_circle(x, y, 0.5, 0.385, 0.215):
        return HALO
    if in_circle(x, y, 0.5, 0.385, 0.245):
        return HALO_RIM
    return BG


def render(size, maskable=False, ss=3):
    rows = []
    for py in range(size):
        row = bytearray([0])  # filtro PNG "none"
        for px in range(size):
            r = g = b = a = 0
            for sy in range(ss):
                for sx in range(ss):
                    c = color_at((px + (sx + 0.5) / ss) / size, (py + (sy + 0.5) / ss) / size, maskable)
                    if c:
                        r, g, b, a = r + c[0], g + c[1], b + c[2], a + 255
            n = ss * ss
            k = a / 255 or 1
            row += bytes([round(r / k), round(g / k), round(b / k), round(a / n)])
        rows.append(bytes(row))
    return png(size, size, b''.join(rows))


def png(w, h, raw):
    def chunk(tag, data):
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xFFFFFFFF)

    ihdr = struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0)
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b'')


if __name__ == '__main__':
    out = Path(__file__).resolve().parent.parent / 'public' / 'icons'
    out.mkdir(parents=True, exist_ok=True)
    for name, size, mask, ss in [
        ('icon-192.png', 192, False, 3),
        ('icon-512.png', 512, False, 2),
        ('icon-maskable-512.png', 512, True, 2),
        ('apple-touch-icon.png', 180, True, 3),
    ]:
        (out / name).write_bytes(render(size, mask, ss))
        print('ok', name)
