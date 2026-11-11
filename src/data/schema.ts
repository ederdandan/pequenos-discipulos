// Formato do conteúdo escrito à mão (arquivos src/data/modulos/*.json) e a
// conversão para os modelos usados pela tela. Funções puras: usadas pelo app
// e pelo `npm run check:content`.
//
// Guia para quem escreve perguntas: docs/COMO_ADICIONAR_PERGUNTAS.md

import type { AgeGroup, Exercise, Level, Option, TaggedExercise, Unit } from '../types';

export type RawAge = 'KIDS' | 'TEENS' | 'ADULTS';

interface RawBase {
  id: string;
  target_ages: RawAge[];
  prompt?: string;
  explanation?: string;
  source_reference?: string;
}

export type RawQuestion = RawBase &
  (
    | { type: 'multiple_choice'; context?: string; options: string[]; icons?: string[]; correct_index: number }
    | { type: 'true_false'; statement: string; answer: boolean }
    | { type: 'match_pairs'; pairs: Array<{ item: string; match: string }> }
    | { type: 'fill_blank'; sentence: string; answer: string; wrong_options: string[] }
    | { type: 'word_bank'; sentence: string; distractors?: string[] }
    | { type: 'type_answer'; context?: string; answer: string; accept?: string[] }
    | { type: 'listening'; phrase: string }
    | { type: 'speaking'; phrase: string; hint?: string }
    | { type: 'listen_choose'; speak: string; options: string[]; icons?: string[]; correct_index: number }
  );

export interface RawLevel {
  level_number: number;
  title: string;
  description?: string;
  icon?: string;
  questions: RawQuestion[];
}

export interface RawModule {
  $schema?: string;
  id: string;
  catechism_part: number;
  title: string;
  description?: string;
  icon?: string;
  color?: string;
  levels: RawLevel[];
}

export const AGES: AgeGroup[] = ['kids', 'teens', 'adults'];
const AGE_FROM_RAW: Record<RawAge, AgeGroup> = { KIDS: 'kids', TEENS: 'teens', ADULTS: 'adults' };

/** Cor padrão do cabeçalho por pilar (paleta litúrgica). */
export const PART_COLORS: Record<number, string> = {
  1: '#1E3A8A', // Credo: Azul Mariano
  2: '#B45309', // Sacramentos: Dourado Sacro
  3: '#DC2626', // Vida em Cristo: Vermelho Pentecostes
  4: '#6D28D9', // Oração: Roxo
  5: '#0F766E', // Especiais: Verde litúrgico
};

/** Separador da lacuna no fill_blank. */
export const BLANK = '___';

export const levelId = (moduleId: string, n: number) => `${moduleId}_n${n}`;

function options(texts: string[], icons: string[] | undefined, correctIndex: number): Option[] {
  return texts.map((text, i) => ({ text, icon: icons?.[i] || undefined, correct: i === correctIndex }));
}

/** Converte uma pergunta do JSON no exercício usado pela tela. */
export function toExercise(q: RawQuestion): TaggedExercise {
  const base = {
    id: q.id,
    ages: q.target_ages.map((a) => AGE_FROM_RAW[a]),
    explanation: q.explanation,
    sourceReference: q.source_reference,
  };
  let e: Exercise;
  switch (q.type) {
    case 'multiple_choice':
      e = { ...base, type: 'multiple-choice', prompt: q.prompt ?? '', context: q.context, options: options(q.options, q.icons, q.correct_index) };
      break;
    case 'true_false':
      e = {
        ...base,
        type: 'multiple-choice',
        prompt: q.prompt ?? 'Verdadeiro ou falso?',
        context: q.statement,
        options: [
          { text: 'Verdadeiro', icon: '👍', correct: q.answer },
          { text: 'Falso', icon: '👎', correct: !q.answer },
        ],
      };
      break;
    case 'match_pairs':
      e = { ...base, type: 'match-pairs', prompt: q.prompt ?? 'Toque nos pares', pairs: q.pairs.map((p) => [p.item, p.match]) };
      break;
    case 'fill_blank': {
      const [before, after = ''] = q.sentence.split(BLANK);
      e = {
        ...base,
        type: 'fill-blank',
        prompt: q.prompt ?? 'Complete a frase',
        sentenceParts: [before.trim(), after.trim()],
        correctWord: q.answer,
        options: [q.answer, ...q.wrong_options],
      };
      break;
    }
    case 'word_bank':
      e = {
        ...base,
        type: 'word-bank',
        prompt: q.prompt ?? 'Monte a frase',
        sentence: q.sentence,
        words: [...q.sentence.split(' '), ...(q.distractors ?? [])],
      };
      break;
    case 'type_answer':
      e = { ...base, type: 'type-answer', prompt: q.prompt ?? 'Escreva a resposta', context: q.context, answer: q.answer, accept: q.accept };
      break;
    case 'listening':
      e = { ...base, type: 'listening', prompt: q.prompt ?? 'Ouça e escreva o que ouviu', phrase: q.phrase };
      break;
    case 'speaking':
      e = { ...base, type: 'speaking', prompt: q.prompt ?? 'Fale em voz alta', targetPhrase: q.phrase, hint: q.hint };
      break;
    case 'listen_choose':
      e = { ...base, type: 'listen-choose', prompt: q.prompt ?? 'Ouça e escolha', speak: q.speak, options: options(q.options, q.icons, q.correct_index) };
      break;
  }
  return e as TaggedExercise;
}

/** Módulo com todos os exercícios (de todas as idades), já convertidos. */
export interface FullUnit extends Omit<Unit, 'levels'> {
  levels: Array<Omit<Level, 'exercises'> & { exercises: TaggedExercise[] }>;
}

export function buildUnit(m: RawModule): FullUnit {
  return {
    id: m.id,
    catechismPart: m.catechism_part,
    title: m.title,
    description: m.description ?? '',
    icon: m.icon ?? '✝️',
    color: m.color ?? PART_COLORS[m.catechism_part] ?? PART_COLORS[1],
    levels: [...m.levels]
      .sort((a, b) => a.level_number - b.level_number)
      .map((l) => ({
        id: levelId(m.id, l.level_number),
        title: l.title,
        description: l.description ?? '',
        icon: l.icon ?? '⭐',
        exercises: l.questions.map(toExercise),
      })),
  };
}

/** Recorta a trilha para uma faixa: só as perguntas dela; níveis e módulos vazios somem. */
export function trackFor(units: FullUnit[], age: AgeGroup): Unit[] {
  return units
    .map((u) => ({
      ...u,
      levels: u.levels
        .map((l) => ({ ...l, exercises: l.exercises.filter((e) => e.ages.includes(age)) }))
        .filter((l) => l.exercises.length > 0),
    }))
    .filter((u) => u.levels.length > 0);
}

// ---------------- Validação ----------------

const TYPES = ['multiple_choice', 'true_false', 'match_pairs', 'fill_blank', 'word_bank', 'type_answer', 'listening', 'speaking', 'listen_choose'];
const RAW_AGES = Object.keys(AGE_FROM_RAW);
/** Menos que isso numa lição fica curto demais (só aviso). */
export const MIN_PER_LESSON = 4;

export interface ValidationReport {
  errors: string[];
  warnings: string[];
}

/**
 * Confere os módulos: campos obrigatórios, ids únicos, respostas coerentes.
 * `file` de cada módulo aparece nas mensagens para achar o erro rápido.
 */
export function validateModules(mods: Array<{ file: string; data: RawModule }>): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const moduleIds = new Set<string>();
  const questionIds = new Map<string, string>();

  for (const { file, data: m } of mods) {
    const err = (msg: string) => errors.push(`${file}: ${msg}`);
    if (!m || typeof m !== 'object') {
      err('o arquivo não é um módulo');
      continue;
    }
    if (!m.id) err('módulo sem "id"');
    else if (moduleIds.has(m.id)) err(`id de módulo repetido "${m.id}"`);
    moduleIds.add(m.id);
    if (!m.title) err('módulo sem "title"');
    if (![1, 2, 3, 4, 5].includes(m.catechism_part)) err('"catechism_part" deve ser 1, 2, 3, 4 ou 5');
    if (!Array.isArray(m.levels) || m.levels.length === 0) {
      err('módulo sem "levels"');
      continue;
    }

    const numbers = new Set<number>();
    for (const l of m.levels) {
      const where = `nível ${l.level_number}`;
      if (!Number.isInteger(l.level_number) || l.level_number < 1) err(`${where}: "level_number" deve ser 1, 2, 3…`);
      if (numbers.has(l.level_number)) err(`${where}: número de nível repetido`);
      numbers.add(l.level_number);
      if (!l.title) err(`${where}: sem "title"`);
      if (!Array.isArray(l.questions)) {
        err(`${where}: sem "questions"`);
        continue;
      }

      const perAge: Record<string, number> = { KIDS: 0, TEENS: 0, ADULTS: 0 };
      for (const q of l.questions) {
        const qe = (msg: string) => err(`${q.id ?? `${where} (pergunta sem id)`}: ${msg}`);
        if (!q.id) qe('pergunta sem "id"');
        else if (questionIds.has(q.id)) qe(`id repetido (já usado em ${questionIds.get(q.id)})`);
        if (q.id) questionIds.set(q.id, file);
        if (!TYPES.includes(q.type)) {
          qe(`tipo desconhecido "${(q as { type: string }).type}". Use: ${TYPES.join(', ')}`);
          continue;
        }
        if (!Array.isArray(q.target_ages) || q.target_ages.length === 0) qe('"target_ages" vazio');
        else {
          for (const a of q.target_ages) {
            if (!RAW_AGES.includes(a)) qe(`faixa "${a}" inválida (use KIDS, TEENS, ADULTS)`);
            else perAge[a]++;
          }
          if (q.target_ages.includes('ADULTS') && !q.source_reference)
            qe('perguntas para ADULTS precisam de "source_reference" (CIC ou versículo)');
        }
        checkQuestion(q, qe);
      }
      for (const [age, n] of Object.entries(perAge)) {
        if (n === 0) warnings.push(`${file} ${where}: nenhuma pergunta para ${age} (o nível some dessa trilha)`);
        else if (n < MIN_PER_LESSON) warnings.push(`${file} ${where}: só ${n} pergunta(s) para ${age}`);
      }
    }
  }
  return { errors, warnings };
}

function checkQuestion(q: RawQuestion, qe: (m: string) => void) {
  const distinct = (xs: string[]) => new Set(xs.map((x) => x.trim().toLowerCase())).size === xs.length;
  switch (q.type) {
    case 'multiple_choice':
    case 'listen_choose':
      if (q.type === 'multiple_choice' && !q.prompt) qe('sem "prompt"');
      if (q.type === 'listen_choose' && !q.speak) qe('sem "speak"');
      if (!Array.isArray(q.options) || q.options.length < 2) qe('precisa de pelo menos 2 "options"');
      else {
        if (!distinct(q.options)) qe('opções repetidas');
        if (!Number.isInteger(q.correct_index) || q.correct_index < 0 || q.correct_index >= q.options.length)
          qe(`"correct_index" fora das opções (0 a ${q.options.length - 1})`);
        if (q.icons && q.icons.length !== q.options.length) qe('"icons" deve ter o mesmo tamanho de "options"');
      }
      break;
    case 'true_false':
      if (!q.statement) qe('sem "statement"');
      if (typeof q.answer !== 'boolean') qe('"answer" deve ser true ou false');
      break;
    case 'match_pairs':
      if (!Array.isArray(q.pairs) || q.pairs.length < 3) qe('precisa de pelo menos 3 pares');
      else {
        if (q.pairs.some((p) => !p.item || !p.match)) qe('cada par precisa de "item" e "match"');
        else if (!distinct(q.pairs.map((p) => p.item)) || !distinct(q.pairs.map((p) => p.match))) qe('pares repetidos');
      }
      break;
    case 'fill_blank':
      if (typeof q.sentence !== 'string' || q.sentence.split(BLANK).length !== 2) qe(`"sentence" deve ter exatamente uma lacuna ${BLANK}`);
      if (!q.answer) qe('sem "answer"');
      if (!Array.isArray(q.wrong_options) || q.wrong_options.length < 1) qe('precisa de "wrong_options"');
      else if (!distinct([q.answer, ...q.wrong_options])) qe('a resposta aparece nas opções erradas');
      break;
    case 'word_bank':
      if (!q.sentence) qe('sem "sentence"');
      else if (q.sentence.split(' ').length < 3) qe('frase curta demais para montar');
      break;
    case 'type_answer':
      if (!q.prompt) qe('sem "prompt"');
      if (!q.answer) qe('sem "answer"');
      break;
    case 'listening':
    case 'speaking':
      if (!q.phrase) qe('sem "phrase"');
      break;
  }
}
