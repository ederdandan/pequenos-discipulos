// Fontes das perguntas: traduz siglas ("CIC 336", "Lc 1,26-38") para nomes por extenso
// e busca o resumo do que a fonte diz em src/data/fontes.json.
import fontes from '../data/fontes.json';

const SUMMARIES = fontes as Record<string, string>;

/** Resumo em palavras simples do que diz a fonte (ou undefined se ainda não foi escrito). */
export const sourceSummary = (ref: string): string | undefined => (ref.startsWith('_') ? undefined : SUMMARIES[ref]);

/** Siglas → [nome por extenso, tipo]. Tipo define como os números são lidos. */
type Kind = 'bible' | 'paragraph' | 'number' | 'canon';

const WORKS: Record<string, [string, Kind]> = {
  CIC: ['Catecismo da Igreja Católica', 'paragraph'],
  CDC: ['Código de Direito Canônico', 'canon'],
  GS: ['Gaudium et Spes · Concílio Vaticano II', 'number'],
  LG: ['Lumen Gentium · Concílio Vaticano II', 'number'],
  SC: ['Sacrosanctum Concilium · Concílio Vaticano II', 'number'],
  DV: ['Dei Verbum · Concílio Vaticano II', 'number'],
  IGMR: ['Instrução Geral do Missal Romano', 'number'],
  Gn: ['Gênesis', 'bible'],
  Ex: ['Êxodo', 'bible'],
  Nm: ['Números', 'bible'],
  Dt: ['Deuteronômio', 'bible'],
  Tb: ['Tobias', 'bible'],
  '1Sm': ['1º Livro de Samuel', 'bible'],
  '1Rs': ['1º Livro dos Reis', 'bible'],
  '2Rs': ['2º Livro dos Reis', 'bible'],
  Sl: ['Salmos', 'bible'],
  Is: ['Isaías', 'bible'],
  Jr: ['Jeremias', 'bible'],
  Ez: ['Ezequiel', 'bible'],
  Jn: ['Jonas', 'bible'],
  Mt: ['Evangelho segundo Mateus', 'bible'],
  Mc: ['Evangelho segundo Marcos', 'bible'],
  Lc: ['Evangelho segundo Lucas', 'bible'],
  Jo: ['Evangelho segundo João', 'bible'],
  At: ['Atos dos Apóstolos', 'bible'],
  Rm: ['Carta aos Romanos', 'bible'],
  '1Cor': ['1ª Carta aos Coríntios', 'bible'],
  '2Cor': ['2ª Carta aos Coríntios', 'bible'],
  Cl: ['Carta aos Colossenses', 'bible'],
  '1Ts': ['1ª Carta aos Tessalonicenses', 'bible'],
  '2Tm': ['2ª Carta a Timóteo', 'bible'],
  Hb: ['Carta aos Hebreus', 'bible'],
  Tg: ['Carta de São Tiago', 'bible'],
  '1Jo': ['1ª Carta de São João', 'bible'],
  Ap: ['Apocalipse', 'bible'],
};

/** Obras citadas pelo nome completo seguido de números ("Normas Universais sobre o Ano Litúrgico 22"). */
const LONG_NAMES = ['Normas Universais sobre o Ano Litúrgico'];

export interface SourcePart {
  /** Nome da obra por extenso (ou o texto original, se a sigla não for conhecida). */
  work: string;
  /** Onde, dentro da obra: "§ 336", "capítulo 1, versículos 26-38", "nº 24". */
  where?: string;
}

function locate(kind: Kind, loc: string) {
  if (kind === 'paragraph') return /[-–;]/.test(loc) ? `§§ ${loc}` : `§ ${loc}`;
  if (kind === 'canon') return /[-–]/.test(loc) ? `cânones ${loc}` : `cânon ${loc}`;
  if (kind === 'number') return /[-–]/.test(loc) ? `nºs ${loc}` : `nº ${loc}`;
  // Trecho que atravessa capítulos: "52,13–53,12".
  const cross = loc.match(/^(\d+),(\d+)[–-](\d+),(\d+)$/);
  if (cross) return `capítulo ${cross[1]}, versículo ${cross[2]}, até o capítulo ${cross[3]}, versículo ${cross[4]}`;
  const [chap, rawVerses] = loc.split(',');
  // "23(22)": numeração hebraica e, entre parênteses, a grega/latina (Salmos).
  const c = chap.replace(/\((\d+)\)/, ' ($1)');
  if (!rawVerses) return /[-–]/.test(c) ? `capítulos ${c}` : `capítulo ${c}`;
  const verses = rawVerses.replace(/\./g, ' e ');
  return `capítulo ${c}, ${/[-–]| e /.test(verses) ? 'versículos' : 'versículo'} ${verses}`;
}

/**
 * "CIC 466; 495" → [{work: Catecismo…, where: § 466}, {work: Catecismo…, where: § 495}]
 * Um trecho só com números herda a obra do anterior ("At 1,14; 2,1-4").
 */
export function describeReference(ref: string): SourcePart[] {
  let last: [string, Kind] | null = null;
  return ref.split(';').map((raw) => {
    const part = raw.trim();
    const long = LONG_NAMES.find((n) => part.startsWith(`${n} `) && /^\d/.test(part.slice(n.length + 1)));
    if (long) {
      last = [long, 'number'];
      return { work: long, where: locate('number', part.slice(long.length + 1)) };
    }
    const m = part.match(/^([1-3]?[A-Za-zÀ-ú]+)\s+([\d].*)$/);
    if (m && WORKS[m[1]]) {
      last = WORKS[m[1]];
      return { work: last[0], where: locate(last[1], m[2]) };
    }
    if (/^\d/.test(part) && last) return { work: last[0], where: locate(last[1], part) };
    last = null;
    return { work: part };
  });
}
