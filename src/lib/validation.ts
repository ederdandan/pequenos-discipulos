// Comparação tolerante de respostas (voz e digitação).

// Números falados ou digitados: "7" = "sete".
const NUMBERS = ['zero', 'um', 'dois', 'tres', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze'];

export function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[-–—/]/g, ' ') // "Pai-Nosso" = "Pai Nosso"
    .normalize('NFD')
    .replace(/\p{M}/gu, '') // tira acentos: "Sao Paulo" = "São Paulo"
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((w) => (/^\d+$/.test(w) && NUMBERS[Number(w)] ? NUMBERS[Number(w)] : w))
    .join(' ');
}

/** Distância de Levenshtein entre duas palavras (para perdoar erros de digitação). */
function editDistance(a: string, b: string) {
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
}

/** Igual, ou 1 letra de diferença em palavras com 5+ letras. */
const typoMatch = (a: string, b: string) => a === b || (b.length >= 5 && editDistance(a, b) <= 1);

/** Para voz também aceita o mesmo prefixo ("orações" ≈ "oração"). */
const spokenMatch = (a: string, b: string) =>
  typoMatch(a, b) || (b.length >= 4 && a.startsWith(b) && a.length - b.length <= 2);

/**
 * Fala: aceita se a transcrição contém a frase-alvo, ou se ≥ 80% das palavras
 * da frase aparecem em ordem (o reconhecimento de voz erra palavras pequenas).
 */
export function speechMatches(transcripts: string[], target: string) {
  const goal = normalize(target).split(' ');
  return transcripts.some((raw) => {
    const said = normalize(raw);
    if (said.includes(goal.join(' '))) return true;
    const words = said.split(' ');
    let i = 0;
    let hits = 0;
    for (const g of goal) {
      const found = words.slice(i).findIndex((w) => spokenMatch(w, g));
      if (found >= 0) {
        hits++;
        i += found + 1;
      }
    }
    return hits / goal.length >= 0.8;
  });
}

/** Artigo no começo não conta: "anjos" = "Os anjos", "o batismo" = "Batismo". */
const ARTICLE = /^(o|a|os|as|um|uma) (?=\S)/;

/** Digitação: exige todas as palavras, mas perdoa pontuação, maiúsculas, artigo inicial e 1 letra trocada. */
export function typedMatches(typed: string, target: string) {
  const a = normalize(typed).replace(ARTICLE, '').split(' ');
  const b = normalize(target).replace(ARTICLE, '').split(' ');
  return a.length === b.length && a.every((w, i) => typoMatch(w, b[i]));
}
