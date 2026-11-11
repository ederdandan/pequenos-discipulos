"""Formata os módulos de conteúdo: `npm run format:content`

Deixa cada pergunta numa linha só (fica fácil de ler, copiar e comparar no git),
com as perguntas agrupadas por faixa (Infantil, Juvenil, Adulto) e uma linha em branco entre os grupos.
"""
import json
from pathlib import Path

DIR = Path(__file__).resolve().parent.parent / 'src' / 'data' / 'modulos'
ORDER = ['$schema', 'id', 'catechism_part', 'title', 'description', 'icon', 'color', 'levels']
LEVEL_ORDER = ['level_number', 'title', 'description', 'icon', 'questions']


def one_line(obj):
    return json.dumps(obj, ensure_ascii=False, separators=(', ', ': '))


def group(q):
    ages = q.get('target_ages', [])
    return ['KIDS', 'TEENS', 'ADULTS'].index(ages[0]) if ages and ages[0] in ('KIDS', 'TEENS', 'ADULTS') else 9


def fmt_module(m):
    lines = ['{']
    keys = [k for k in ORDER if k in m] + [k for k in m if k not in ORDER]
    for i, k in enumerate(keys):
        comma = ',' if i < len(keys) - 1 else ''
        if k != 'levels':
            lines.append(f'  {json.dumps(k)}: {one_line(m[k])}{comma}')
            continue
        lines.append('  "levels": [')
        for li, lv in enumerate(m['levels']):
            lines.append('    {')
            lkeys = [x for x in LEVEL_ORDER if x in lv] + [x for x in lv if x not in LEVEL_ORDER]
            for j, lk in enumerate(lkeys):
                lcomma = ',' if j < len(lkeys) - 1 else ''
                if lk != 'questions':
                    lines.append(f'      {json.dumps(lk)}: {one_line(lv[lk])}{lcomma}')
                    continue
                lines.append('      "questions": [')
                qs = lv['questions']
                for qi, q in enumerate(qs):
                    if qi > 0 and group(q) != group(qs[qi - 1]):
                        lines.append('')
                    lines.append(f'        {one_line(q)}{"," if qi < len(qs) - 1 else ""}')
                lines.append(f'      ]{lcomma}')
            lines.append('    }' + (',' if li < len(m['levels']) - 1 else ''))
        lines.append(f'  ]{comma}')
    lines.append('}')
    return '\n'.join(lines) + '\n'


if __name__ == '__main__':
    for f in sorted(DIR.glob('*.json')):
        data = json.loads(f.read_text(encoding='utf-8'))
        f.write_text(fmt_module(data), encoding='utf-8', newline='\n')
        print('ok', f.name)
