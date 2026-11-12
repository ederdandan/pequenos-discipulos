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
    BottomSheet.tsx, VoiceSettings.tsx, Avatar.tsx, AvatarChooser.tsx, PhotoPicker.tsx, Lamb.tsx (Cordeirinho) ...
scripts/               check-content.ts, format-content.py, make-icons.py, crop-avatars.py, crop-lamb.py
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
- **Níveis de dificuldade** (`lib/difficulty.ts`, campo `difficulty` do perfil, padrão `normal`): Fácil, Normal,
  Intermediário, Especialista. As perguntas são as mesmas da faixa; `adaptExercise` muda só o jeito de responder
  (Fácil: 2 alternativas, 3 pares, frase sem palavras sobrando, digitar vira escolher com `easy_options`;
  Intermediário: completar a frase digitando, salvo `typed: false`, palavras a mais no montar frase, +5 XP;
  Especialista: também digita as múltiplas escolhas marcadas `typed: true`, +10 XP). Esses campos foram revisados
  pergunta por pergunta (142 escolhas digitáveis, 6 lacunas que continuam de escolher, 65 `easy_options`);
  pergunta nova precisa da mesma avaliação (guia em `docs/COMO_ADICIONAR_PERGUNTAS.md`, seção Níveis).
  A digitação ignora artigo inicial (`typedMatches`). O id do exercício não muda. Cada nível tem a própria trilha:
  `setDifficulty` guarda `completedLevels` em `progressByDifficulty`. Ao concluir a trilha toda, `levelOffer`
  abre na Trilha a pergunta "quer mudar de nível?" com a dica de onde trocar (Perfil → Ajustes → Nível de dificuldade).
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
  Mascote: Cordeirinho (logo da entrada e ícone do PWA). Evitar zigue-zague de círculos, corações e ícones copiados do Duolingo.

## Foto e avatares

- O perfil tem `avatar` (emoji, padrão 🐑, usado só quando não há foto) e `photo`: foto própria (data URL) ou um
  **avatar pré-definido** salvo como caminho relativo `avatares/<id>.webp`.
- 30 avatares (Santos 20, Magistério e Ministérios 10) listados em `src/data/avatars.ts`; as imagens ficam em
  `public/avatares/` e são recortadas das grades em `imagens/` por `scripts/crop-avatars.py`
  (Pillow + numpy; `--sheet arquivo.png` gera uma folha de conferência).
- `AvatarChooser` (foto no topo, "Enviar foto", abas com a grade) aparece na criação de perfil e, na aba Perfil,
  num BottomSheet aberto pelo botão "Foto ou avatar".
- **Cordeirinho** (`components/Lamb.tsx`): mascote do app (logo da entrada; o ícone do PWA é o rosto do Cordeirinho Alegre) e companheiro das lições.
  Ícones do app e favicon: "O Cordeirinho Alegre" (ícone 3 da grade `imagens/icone.jpeg`, fundo trocado para Azul Mariano), recortados por
  `scripts/make-icons.py` (`--preview arquivo.png` gera folha de conferência). O script grava `?v=<hash>` nos
  endereços dos ícones (manifest e index.html): ícone novo = endereço novo, sem precisar limpar cache. O `sw.js`
  busca o manifest pela rede e atualiza ícones/imagens em segundo plano. iPhone não troca o ícone da tela de
  início sozinho (só removendo e adicionando de novo).
  7 poses em `public/cordeirinho/` (acolhimento, sucesso, ops, aprendendo, descanso, fe, vamos), recortadas de
  `imagens/Cordeirinho.jpg` por `scripts/crop-lamb.py` (Pillow + numpy + scipy). Aparece no rodapé de correção
  (todas as faixas), no fim da lição, sem chamas, sem revisão e na `CheerScreen` (`LessonPage.tsx`): tela
  rápida entre perguntas só em marcos (3/5/8 seguidas, acerto após erro, metade, falta uma), nunca duas seguidas,
  some em 1,8 s ou com um toque. Animações por pose em `index.css` (`.lamb-<pose>`; prop `animated`/`once`).
- **Atualização do app** (`lib/update.ts`): compara o `assets/index-<hash>.js` em uso com o do `index.html`
  publicado (fetch `no-store`, que o `sw.js` deixa passar). Verifica ao abrir, ao voltar para o app e a cada 30 min.
  "Atualizar automaticamente" (Perfil → Atualizações, por aparelho, chave `pequenos_discipulos_auto_update`,
  ligado por padrão) recarrega sozinho, nunca durante uma lição; desligado, mostra um aviso com "Atualizar".
  A data do build vem de `__BUILD_DATE__` (`vite.config.ts`). Só funciona no build de produção (`vite preview`).
- **Conteúdo que surge ao rolar** (`lib/reveal.ts` + `.reveal` em `index.css`): blocos da página e lições da
  trilha surgem um pouco antes de entrar na tela (margem de 25%, opacidade inicial 0,35: nunca fica em branco); a pergunta nova da lição entra deslizando (`.animate-question`).
  Tudo desligado com "reduzir movimento". Em teste automatizado a aba sem foco pausa a renderização: confira
  com rolagem real + screenshot, não só com `scrollTo` por script.
- **Modo app sem seleção de texto** (`index.css`): com `display-mode: standalone` (ou `html[data-standalone]`,
  marcado em `lib/pwa.ts` para iPhone antigo) o texto não é selecionável e some o menu "copiar"; campos continuam.
- **Usabilidade (análise UX):** a Trilha abre com o cartão **Próxima lição / Continue de onde parou** (`NextLesson`
  em `PathPage.tsx`) antes de tudo. Os números do topo (`StatsBar`) são um botão que abre `HowItWorks` (velas,
  meta, graça, chamas); na primeira vez de cada perfil ele abre sozinho como boas-vindas (`introSeen`).
  `BackupReminder` lembra de salvar backup quando há 3+ lições e nenhum backup em 14 dias ("Depois" adia 7;
  chaves `pequenos_discipulos_last_backup` e `_backup_snooze`, marcadas por `downloadBackup`). Textos usam no mínimo
  `text-slate-500` (contraste WCAG AA); não usar `text-slate-400` em texto.
- **Perfil em duas abas** (`ProfilePage`, `ProfileTab`): "Meu progresso" (números, conquistas, histórico, bloqueio)
  e "Ajustes" (nível `#nivel`, faixa, meta, erros, reinício por inatividade, voz, instalar, backup, atualizações,
  trocar/apagar). Apagar perfil exige digitar o nome (`DeleteProfile`).
- **Criar perfil** pede só nome e faixa; "Mais opções" guarda foto, nível, erros (padrão 10 no Infantil, 5 nas
  outras) e letra grande.
- **Reinício por inatividade** é por perfil (`inactivityReset`; `inactivityResetOn`): sem valor, desligado no
  Infantil (só mostra "Bem-vindo de volta") e ligado nas outras faixas.
- **Família** ordena por "XP da semana" ou "Constância" (dias seguidos, depois metas batidas).
- Verdadeiro/falso no Infantil usa 👍/👎. Explicação e resumo da fonte (`.allow-select`) podem ser copiados no
  modo app.
- **Versão do app:** rodapé da aba Perfil mostra `APP_VERSION` (versão do package.json + commit curto, via
  `__APP_VERSION__`/`__COMMIT__` em `vite.config.ts`) e a data do build.
- No dev, com `base: './'`, abra `http://localhost:5173/` (na raiz): em `/pequenos-discipulos/` os arquivos de
  `public/` caem no fallback do index.html. Em produção funciona normalmente.
