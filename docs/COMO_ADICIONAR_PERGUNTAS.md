# ✍️ Como adicionar perguntas

Todo o conteúdo do app fica em **arquivos JSON**, um por módulo, na pasta `src/data/modulos/`.
Não precisa mexer em código: edite o JSON, rode a verificação e pronto.

```
src/data/modulos/
├── 01-credo.json              Pilar 1 · A Profissão de Fé
├── 02-sacramentos.json        Pilar 2 · Sacramentos e Liturgia
├── 03-vida-em-cristo.json     Pilar 3 · Virtudes, Mandamentos, Obras de Misericórdia
├── 04-oracao.json             Pilar 4 · A Oração Cristã
├── 05-santos.json             Especial · Vida dos Santos
├── 06-escritura.json          Especial · Sagrada Escritura
├── 07-ano-liturgico.json      Especial · Ano Litúrgico e Festas
└── 08-missa-e-objetos.json    Especial · Missa e Objetos Sacros
```

> 💡 **Use o VS Code.** Cada arquivo aponta para `src/data/quiz.schema.json`, então o editor
> sugere os campos, mostra a explicação de cada um e sublinha em vermelho o que estiver errado.

## Passo a passo

1. Abra o arquivo do módulo e encontre o nível (`"level_number"`).
2. Copie uma pergunta parecida da lista `"questions"` e cole logo abaixo dela (não esqueça da vírgula entre as perguntas).
3. Troque o `id` por um que ainda não exista. Depois troque o texto.
4. Rode:
   ```bash
   npm run check:content
   ```
   O comando mostra quantas perguntas cada faixa tem e aponta qualquer erro (arquivo, id e o motivo).
5. Veja no app com `npm run dev`.

### Regras importantes

| Regra | Por quê |
|---|---|
| **`id` único** em todo o app. Sugestão: `<modulo>_n<nivel>_<faixa><nn>`, ex.: `credo_n1_k07` (k = Infantil, t = Juvenil, a = Adulto, ta = Juvenil + Adulto) | A revisão de erros guarda o id. |
| **Não mude** o `id` de módulo, o `level_number` nem o `id` de pergunta já publicados | O progresso das pessoas está ligado a eles. Para corrigir um texto, mude só o texto. |
| `target_ages`: `KIDS` (até 9), `TEENS` (10 a 16), `ADULTS` (17+). Uma pergunta pode servir a mais de uma faixa | Cada perfil só vê as perguntas da sua faixa. |
| Pergunta para `ADULTS` **precisa** de `source_reference` (ex.: `"CIC 1213"`, `"Mt 28,19"`) | Especificação: fontes obrigatórias no Adulto. |
| Mire em **4 a 8 perguntas por faixa** em cada nível | Menos que 4 gera aviso; nível sem pergunta para uma faixa some da trilha dela. |
| Use aspas tipográficas “assim” dentro dos textos | Aspas retas `"` precisariam de `\"` no JSON. |

### Como a fonte aparece

| Faixa | `source_reference` | `explanation` |
|---|---|---|
| Infantil | escondida | aparece depois de responder |
| Juvenil | botão “Ver fonte” | aparece |
| Adulto | sempre visível | aparece |

## Tipos de pergunta

Todos aceitam `explanation` e `source_reference`. Os campos marcados com * são obrigatórios.

### `multiple_choice` · Múltipla escolha
```json
{ "id": "credo_n1_k07", "type": "multiple_choice", "target_ages": ["KIDS"],
  "prompt": "Quem é o Filho de Deus?",
  "options": ["Jesus", "Moisés", "Noé"], "icons": ["✝️", "📜", "🚢"], "correct_index": 0,
  "explanation": "Jesus é o Filho de Deus que se fez homem." }
```
`prompt`*, `options`* (2 ou mais), `correct_index`* (começa em **0**; na tela as opções são embaralhadas),
`icons` (opcional, um emoji por opção, aparecem grandes no Infantil), `context` (texto de apoio num cartão).

### `true_false` · Verdadeiro ou falso
```json
{ "id": "...", "type": "true_false", "target_ages": ["TEENS"],
  "statement": "O Batismo pode ser repetido.", "answer": false, "source_reference": "CIC 1272" }
```

### `match_pairs` · Ligar os pares
```json
{ "id": "...", "type": "match_pairs", "target_ages": ["KIDS", "TEENS"],
  "prompt": "Ligue o santo ao símbolo:",
  "pairs": [ { "item": "São Pedro", "match": "Chaves" }, { "item": "São Francisco", "match": "Animais" }, { "item": "Santa Clara", "match": "Ostensório" } ] }
```
Pelo menos 3 pares, sem repetir itens. Até 2 toques errados ainda contam como acerto.

### `fill_blank` · Completar a lacuna
```json
{ "id": "...", "type": "fill_blank", "target_ages": ["KIDS"],
  "sentence": "Ave Maria, cheia de ___, o Senhor é convosco.",
  "answer": "graça", "wrong_options": ["flores", "sono"] }
```
A frase deve ter **exatamente um** `___`.

### `word_bank` · Montar a frase
```json
{ "id": "...", "type": "word_bank", "target_ages": ["TEENS"], "prompt": "Monte o versículo:",
  "sentence": "Eu sou o caminho, a verdade e a vida", "distractors": ["porta", "luz"] }
```
As palavras da frase são separadas pelos espaços; `distractors` são palavras extras.

### `type_answer` · Resposta digitada
```json
{ "id": "...", "type": "type_answer", "target_ages": ["TEENS"],
  "prompt": "Quantos são os sacramentos?", "answer": "sete", "accept": ["os sete"] }
```
A correção ignora maiúsculas, acentos, pontuação e 1 letra trocada em palavras longas. Números viram
palavra (“7” = “sete”). Use `accept` para outras respostas válidas.

### `speaking` · Falar (rezar em voz alta)
```json
{ "id": "...", "type": "speaking", "target_ages": ["KIDS"], "prompt": "Reze em voz alta",
  "phrase": "Pai nosso que estais nos céus", "hint": "Começo do Pai-Nosso" }
```
Usa o microfone (Chrome/Edge). Sem microfone, a pessoa digita.

### `listening` · Ouvir e escrever
```json
{ "id": "...", "type": "listening", "target_ages": ["TEENS"], "phrase": "Deus é amor" }
```

### `listen_choose` · Ouvir e escolher
```json
{ "id": "...", "type": "listen_choose", "target_ages": ["KIDS"],
  "speak": "Quem construiu a arca?", "options": ["Noé", "Davi", "Jonas"], "icons": ["🚢", "🎵", "🐋"], "correct_index": 0 }
```
A pergunta é **falada** (sem texto escrito), ótimo para crianças que ainda não leem.

## Criar um nível ou um módulo novo

- **Nível novo:** adicione um objeto em `"levels"` com o próximo `level_number`, `title`, `description`, `icon` e `questions`.
- **Módulo novo:** crie `src/data/modulos/09-nome.json` (o número define a ordem na trilha). Comece copiando o
  cabeçalho de outro arquivo:
  ```json
  {
    "$schema": "../quiz.schema.json",
    "id": "virtudes_extra",
    "catechism_part": 5,
    "title": "Título do módulo",
    "description": "Subtítulo",
    "icon": "🌟",
    "levels": [ ]
  }
  ```
  `catechism_part`: 1 Credo · 2 Sacramentos · 3 Vida em Cristo · 4 Oração · 5 Especial. A cor do cabeçalho vem
  do pilar; para trocar, use `"color": "#RRGGBB"`.

## Relação com o formato da especificação

A especificação (`docs/especifica_o_t_cnica_do_app.md`, seção 5) descreve um único `quiz_database.json` com uma
lista `modules`. Aqui cada item dessa lista virou um arquivo separado, com os **mesmos campos**
(`id`, `catechism_part`, `title`, `levels`, `level_number`, `questions`, `type`, `target_ages`, `prompt`,
`options`, `correct_index`, `explanation`, `source_reference`, `pairs`). Arquivos menores são mais fáceis de
editar e revisar. O build junta tudo no app, e o service worker deixa funcionando offline.

## ⚠️ Revisão doutrinária

O conteúdo inicial foi escrito com referências ao Catecismo (CIC), à Bíblia e à Instrução Geral do Missal
Romano (IGMR), mas **precisa da revisão de um catequista ou sacerdote** antes de ser usado com turmas.
Confira principalmente os números do CIC/IGMR e as citações bíblicas (a numeração dos Salmos varia entre
traduções).
