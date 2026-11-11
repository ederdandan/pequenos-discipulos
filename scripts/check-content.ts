// Valida o conteúdo: `npm run check:content` (roda também no `npm run build`).
// Lê src/data/modulos/*.json, confere tudo e mostra quantas perguntas cada faixa tem.
// Erros param o build; avisos só aparecem na tela.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { AGES, buildUnit, trackFor, validateModules, type RawModule } from '../src/data/schema';

const dir = join(process.cwd(), 'src', 'data', 'modulos');
const mods: Array<{ file: string; data: RawModule }> = [];
const parseErrors: string[] = [];

for (const name of readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
  const file = `src/data/modulos/${name}`;
  try {
    mods.push({ file, data: JSON.parse(readFileSync(join(dir, name), 'utf8')) });
  } catch (err) {
    parseErrors.push(`${file}: JSON inválido — ${(err as Error).message}`);
  }
}

const { errors, warnings } = validateModules(mods);
errors.unshift(...parseErrors);

if (!errors.length) {
  const units = mods.map((m) => buildUnit(m.data));
  const label = { kids: 'Infantil', teens: 'Juvenil', adults: 'Adulto' };
  console.log('Módulo'.padEnd(34) + AGES.map((g) => label[g].padStart(10)).join(''));
  for (const u of units) {
    const counts = AGES.map((g) => trackFor([u], g)[0]?.levels.reduce((n, l) => n + l.exercises.length, 0) ?? 0);
    console.log(u.title.slice(0, 33).padEnd(34) + counts.map((c) => String(c).padStart(10)).join(''));
  }
  const totals = AGES.map((g) => trackFor(units, g).reduce((n, u) => n + u.levels.reduce((m, l) => m + l.exercises.length, 0), 0));
  console.log('TOTAL'.padEnd(34) + totals.map((c) => String(c).padStart(10)).join(''));
  const unique = units.reduce((n, u) => n + u.levels.reduce((m, l) => m + l.exercises.length, 0), 0);
  console.log(`\n${mods.length} módulos · ${unique} perguntas no total (algumas servem a mais de uma faixa)`);
}

if (warnings.length) console.warn(`\n${warnings.length} aviso(s):\n- ${warnings.join('\n- ')}`);
if (errors.length) {
  console.error(`\n${errors.length} problema(s):\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log('\nConteúdo OK ✔');
