import type { AgeGroup, Exercise, Level, Unit } from '../types';
import { AGES, buildStages, buildUnit, trackFor, validateModules, type RawModule } from './schema';

// Todo o conteúdo vem dos arquivos src/data/modulos/*.json, na ordem do nome
// (01-…, 02-…). Para criar um módulo novo basta adicionar um arquivo lá.
// Guia: docs/COMO_ADICIONAR_PERGUNTAS.md

const files = import.meta.glob<RawModule>('./modulos/*.json', { eager: true, import: 'default' });
const raw = Object.entries(files)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([file, data]) => ({ file: file.replace('./', 'src/data/'), data }));

if (import.meta.env.DEV) {
  const { errors, warnings } = validateModules(raw);
  if (errors.length) console.error(`[conteúdo] ${errors.length} erro(s):\n- ${errors.join('\n- ')}`);
  if (warnings.length) console.warn(`[conteúdo] ${warnings.length} aviso(s):\n- ${warnings.join('\n- ')}`);
}

const fullUnits = raw.map(({ data }) => buildUnit(data));

/**
 * Trilha de cada faixa: as mesmas etapas e lições, com as perguntas filtradas pela idade.
 * Cada etapa traz uma lição de cada tema, e a dificuldade sobe de etapa em etapa.
 */
export const tracks: Record<AgeGroup, Unit[]> = Object.fromEntries(
  AGES.map((g) => [g, trackFor(buildStages(fullUnits), g)]),
) as Record<AgeGroup, Unit[]>;

export const trackLevels = (g: AgeGroup): Level[] => tracks[g].flatMap((u) => u.levels);

const levelById = new Map(fullUnits.flatMap((u) => u.levels.map((l) => [l.id, l] as const)));
const exerciseById = new Map<string, Exercise>(
  fullUnits.flatMap((u) => u.levels.flatMap((l) => l.exercises.map((e) => [e.id, e] as const))),
);

/** Nível com as perguntas da faixa indicada (sem faixa: todas). */
export function findLevel(id: string, g?: AgeGroup): Level | undefined {
  if (g) return trackLevels(g).find((l) => l.id === id);
  return levelById.get(id);
}

export const findExercise = (id: string) => exerciseById.get(id);

export function findUnitOfLevel(id: string) {
  return fullUnits.find((u) => u.levels.some((l) => l.id === id));
}

/** Desbloqueio sequencial dentro da trilha. */
export function isLevelUnlocked(g: AgeGroup, levelId: string, completed: string[]) {
  const levels = trackLevels(g);
  const idx = levels.findIndex((l) => l.id === levelId);
  return idx === 0 || (idx > 0 && completed.includes(levels[idx - 1].id));
}

/** Etapa atual: a que contém a primeira lição ainda não concluída. */
export function currentUnit(g: AgeGroup, completed: string[]) {
  return tracks[g].find((u) => u.levels.some((l) => !completed.includes(l.id))) ?? null;
}

/** Tipos de exercício presentes na trilha (as missões só sorteiam o que dá para cumprir). */
export function exerciseTypes(g: AgeGroup) {
  return new Set(trackLevels(g).flatMap((l) => l.exercises.map((e) => e.type)));
}
