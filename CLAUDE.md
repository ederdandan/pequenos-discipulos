# Pequenos Discípulos — contexto do projeto

PWA de **catequese católica gamificada para toda a família** (crianças, jovens e adultos), adaptado do app
de inglês "duo-learn" do mesmo autor. A especificação original está em `docs/especifica_o_t_cnica_do_app.md`.

- **Produção:** https://ederdandan.github.io/pequenos-discipulos/ (GitHub Pages; repo `ederdandan/pequenos-discipulos`)
- **Deploy:** automático a cada push na `main` (`.github/workflows/deploy.yml`). O `gh` CLI não está instalado;
  para ver o status do deploy use a API pública:
  `curl -s https://api.github.com/repos/ederdandan/pequenos-discipulos/actions/runs?per_page=1`
- **Sem backend:** tudo roda no navegador; os perfis ficam no `localStorage` (chave `pequenos_discipulos_data`).
  Há backup e importação em arquivo JSON (aba Perfil).

## Como trabalhar com o usuário

- Responder sempre em **português do Brasil**.
- O usuário prefere **modo autônomo**: seguir sem perguntar o que dá para decidir sozinho.
- Testar no **Chrome** (extensão Claude in Chrome): `npx vite --port 5173 --strictPort` em segundo plano e
  abrir `http://localhost:5173/pequenos-discipulos/`. Ao terminar, apague o perfil de teste
  (`localStorage.removeItem('pequenos_discipulos_data')`), feche a aba e pare o servidor.
- **Commit e push só quando o usuário pedir.** Mensagens de commit em português.
- No Windows, rode o Python com `PYTHONIOENCODING=utf-8` (emojis). Para editar arquivos com aspas
  curvas ou emojis, prefira as ferramentas Edit/Write a heredocs no shell.

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento (Vite) |
| `npm run build` | Typecheck + validação do conteúdo + build. **Rode antes de commitar.** |
| `npm run typecheck` | Só `tsc --noEmit` |
| `npm run check:content` | Valida os JSON de perguntas e mostra a tabela de perguntas por faixa |
| `npm run format:content` | Reformata os JSON: uma pergunta por linha, agrupadas por faixa |

## Stack

Vite 6, React 18, TypeScript, Tailwind v4 (tokens em `src/index.css` dentro de `@theme`) e lucide-react.
O app tem só o **Web Speech API** (pt-BR) para leitura em voz alta e microfone. `vite.config.ts` usa `base: './'`.
O service worker (`public/sw.js`) usa o prefixo de cache `pequenos-discipulos-` e só apaga os próprios caches,
porque divide a mesma origem (github.io) com o duo-learn.

## Estrutura

```
src/
  App.tsx              abas (Trilha, Família, Perfil), tamanho da fonte, voz do perfil
  data/
    modulos/*.json     TODO o conteúdo (8 temas). A ordem vem do nome do arquivo (01-, 02-...)
    schema.ts          formato do JSON, conversão para exercícios, validação, ETAPAS (STAGES), trackFor
    curriculum.ts      monta as trilhas por faixa, findLevel, isLevelUnlocked, currentUnit
    fontes.json        resumo "O que diz" de cada source_reference (painel Ver fonte)
    quiz.schema.json   JSON Schema para autocompletar nos editores
  lib/
    rules.ts           regras de jogo: XP, chamas (vidas), sequência, meta diária, revisão, conquistas, AGE_GROUPS
    quests.ts          missões do dia
    speech.ts          TTS e reconhecimento de voz; preferências de voz (tom e voz) por perfil
    sources.ts         traduz siglas (CIC, Lc, IGMR, CDC...) para nomes por extenso
    validation.ts      correção tolerante das respostas digitadas/faladas
  store/               AppStore (contexto React) e storage (localStorage, migração, backup)
  pages/               PathPage (trilha), LessonPage, ProfilesPage (criar/escolher perfil), ProfilePage, LeaderboardPage
  components/
    exercises/         MultipleChoice, FillBlank, MatchPairs, WordBank, TypeAnswer, Speaking, Prompt, shared.ts
    icons.tsx          ícones próprios (vela, chama, graça, meta, escudo, terço de progresso)
    BottomSheet.tsx, VoiceSettings.tsx, Avatar.tsx, PhotoPicker.tsx, Mascot.tsx (pomba) ...
scripts/               check-content.ts, format-content.py, make-icons.py
docs/COMO_ADICIONAR_PERGUNTAS.md   guia completo para escrever perguntas
imagens/               artes de referência (faixas etárias e grades de avatares de santos/magistério)
```

## Conceitos do app

- **Faixas etárias:** `kids` (Infantil, até 9), `teens` (Juvenil, 10–16), `adults` (Adulto, 17+). No JSON aparecem
  como `KIDS`/`TEENS`/`ADULTS` em `target_ages`. Cada faixa vê só as suas perguntas. Perfis antigos "seniors"
  foram migrados para Adulto com **letra grande** (`largeText`).
- **Trilha em 5 etapas de dificuldade:** o `level_number` de cada lição no JSON **é a etapa**. A Etapa 1 reúne a
  lição 1 de todos os temas, a Etapa 2 a lição 2, e assim por diante (`buildStages` em `schema.ts`). Etapas:
  Primeiros Passos, Conhecendo a Fé, Crescendo na Fé, Aprofundando, Discípulo Missionário.
  Lições com 6 → 7 → 8 → 8 → 9 perguntas por faixa. O desbloqueio é sequencial.
- **Dentro da lição** as perguntas são ordenadas automaticamente pela dificuldade do tipo
  (`TYPE_RANK`): verdadeiro/falso → escolha → pares → lacuna/fala → montar frase → digitar.
- **Conteúdo atual:** 8 temas × 5 lições = 40 lições; **304 perguntas por faixa** (878 diferentes).
- **Tipos de pergunta (JSON):** `multiple_choice`, `true_false`, `match_pairs`, `fill_blank` (uma lacuna `___`),
  `word_bank`, `type_answer`, `speaking`. Campo opcional `illustration` (emoji grande sobre a pergunta; ilustra o
  tema, nunca entrega a resposta). As opções são **só texto**.
- **Adulto exige `source_reference`.** Toda referência deve ter resumo em `src/data/fontes.json`
  (paráfrase, nunca citação literal); o `check:content` avisa quando falta. Siglas novas vão em `WORKS` (`sources.ts`).
- **Fontes por faixa:** Infantil não vê fontes; Juvenil tem o botão "Ver fonte"; Adulto vê a sigla no botão.
  O botão abre um painel de baixo para cima (BottomSheet) com a referência por extenso e o resumo.
- **Áudio** (`AudioMode` em `exercises/shared.ts`): Infantil = `auto` (lê a pergunta e a opção tocada);
  letra grande = `button` (botão 🔊); demais = `off`. Não existem exercícios só de ouvir.
  Tom e voz são configurados por perfil em Perfil → Voz da leitura.
- **Gamificação:** chamas (vidas, recarga de 1 a cada 30 min, quantidade configurável), XP ("graça"), velas
  (dias seguidos), meta diária, missões, conquistas, revisão de erros com repetição espaçada, treino de lições
  já feitas. Ficar `INACTIVITY_DAYS` (5) dias sem estudar reinicia a **etapa** atual.
- **Identidade visual (não parecer Duolingo):** paleta litúrgica (azul mariano `brand`, dourado `gold`, vermelho
  `pentecost`, fogo `fire`, fundo pergaminho), fontes Lora (títulos, serifa) e Plus Jakarta Sans, botões planos
  arredondados sem efeito 3D e sem caixa alta, trilha vertical com escudos, progresso em contas de terço.
  Mascote: pomba. Evitar zigue-zague de círculos, corações e ícones copiados do Duolingo.

## Foto e avatares

- O perfil tem `avatar` (emoji, padrão 🕊️, usado só quando não há foto) e `photo`: foto própria (data URL) ou um
  **avatar pré-definido** salvo como caminho relativo `avatares/<id>.webp`.
- 30 avatares (Santos 20, Magistério e Ministérios 10) listados em `src/data/avatars.ts`; as imagens ficam em
  `public/avatares/` e são recortadas das grades em `imagens/` por `scripts/crop-avatars.py`
  (Pillow + numpy; `--sheet arquivo.png` gera uma folha de conferência).
- `AvatarChooser` (foto no topo, "Enviar foto", abas com a grade) aparece na criação de perfil e, na aba Perfil,
  num BottomSheet aberto pelo botão "Foto ou avatar".
- **Cordeirinho** (`components/Lamb.tsx`): companheiro das lições; a pomba segue como mascote da marca.
  7 poses em `public/cordeirinho/` (acolhimento, sucesso, ops, aprendendo, descanso, fe, vamos), recortadas de
  `imagens/Cordeirinho.jpg` por `scripts/crop-lamb.py` (Pillow + numpy + scipy). Aparece no rodapé de correção
  (só Infantil e Juvenil), no fim da lição, sem chamas, sem revisão e na `CheerScreen` (`LessonPage.tsx`): tela
  rápida entre perguntas só em marcos (3/5/8 seguidas, acerto após erro, metade, falta uma), nunca duas seguidas,
  some em 1,8 s ou com um toque.
- No dev, com `base: './'`, abra `http://localhost:5173/` (na raiz): em `/pequenos-discipulos/` os arquivos de
  `public/` caem no fallback do index.html. Em produção funciona normalmente.
