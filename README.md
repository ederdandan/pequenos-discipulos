# 🕊️ Pequenos Discípulos · Catequese em Família

PWA catequético gamificado para toda a família (crianças, jovens e adultos). Roda 100% no navegador, sem
backend e sem APIs pagas, e fica hospedado no GitHub Pages. Funciona offline depois do primeiro acesso, o que
ajuda em encontros, retiros e acampamentos.

> 📘 **Especificação:** [`docs/especifica_o_t_cnica_do_app.md`](docs/especifica_o_t_cnica_do_app.md)
> ✍️ **Para adicionar perguntas:** [`docs/COMO_ADICIONAR_PERGUNTAS.md`](docs/COMO_ADICIONAR_PERGUNTAS.md)

## Rodando localmente

```bash
npm install
npm run dev             # http://localhost:5173
npm run check:content   # valida as perguntas e mostra quantas cada faixa tem
npm run build           # valida + gera dist/ (o que vai para o GitHub Pages)
```

> A leitura em voz alta e o microfone usam a Web Speech API em **português (pt-BR)**. O microfone funciona
> melhor no **Chrome/Edge** e exige `localhost` ou HTTPS. Sem suporte, os exercícios de fala viram digitação.

## Faixas etárias

A trilha é a mesma para todos; cada pergunta diz para quais faixas serve (`target_ages`), e o app filtra
pelo perfil ativo. Trocar a faixa no Perfil recarrega a trilha na hora, e as lições já concluídas continuam
valendo.

| | 🧸 Infantil (até 9) | 🎒 Juvenil (10–16) | 📖 Adulto (17+) |
|---|---|---|---|
| Linguagem | lúdica, histórias, orações e santos | dinâmica: virtudes, mandamentos, Bíblia | doutrinária: CIC, Escritura, teologia |
| Leitura em voz alta | automática (pergunta e opções) | botão 🔊 | botão 🔊 |
| Fonte (CIC/versículo) | escondida | botão “Ver fonte” | sempre visível |
| Visual | emojis grandes, mascote pomba | padrão | tipografia serifada de leitor |

**Letra grande** é uma opção de acessibilidade separada (texto maior e voz mais lenta), disponível para
qualquer faixa. Perfis antigos “60+” viram Adulto com letra grande.

## Conteúdo atual

8 módulos, 18 níveis e 283 perguntas: 101 no Infantil, 108 no Juvenil e 108 no Adulto (algumas valem para
mais de uma faixa).

| Módulo | Níveis |
|---|---|
| ✝️ Pilar 1 · A Profissão de Fé | Deus Pai Criador · Jesus Cristo · O Espírito Santo e a Igreja |
| 🍞 Pilar 2 · Sacramentos e Liturgia | A Graça e a Liturgia · Iniciação · Cura e Serviço |
| ❤️ Pilar 3 · A Vida em Cristo | Virtudes · Dez Mandamentos · Obras de Misericórdia |
| 🙏 Pilar 4 · A Oração Cristã | O que é Orar · O Pai-Nosso e Maria |
| 😇 Vida dos Santos | Grandes Amigos de Deus · Santos do Brasil e de Hoje |
| 📜 Sagrada Escritura | Antigo Testamento · Jesus e as Parábolas |
| 🕯️ Ano Litúrgico e Festas | Tempos e Festas |
| ⛪ A Missa e os Objetos Sacros | Partes da Missa · Objetos Sacros e Vestes |

> ⚠️ O conteúdo precisa de **revisão doutrinária** (catequista/sacerdote) antes do uso com turmas.

## Design litúrgico

Cores definidas em `src/index.css` (`@theme`):

| Token | Cor | Uso |
|---|---|---|
| `brand` | Azul Mariano `#1E3A8A` / `#2563EB` | navegação, botões, nós ativos |
| `gold` | Dourado Sacro `#D97706` / `#F59E0B` | XP, progresso, acertos |
| `pentecost` | Vermelho Pentecostes `#DC2626` | níveis concluídos, conquistas |
| `fire` | Fogo do Espírito Santo `#EA580C` | chamas (vidas) |
| `parchment` | Pergaminho `#FDFBF7` | fundo |

Mascote: pomba em SVG (`src/components/Mascot.tsx`). Ícones gerados por `python scripts/make-icons.py`.

## App instalável (PWA)

- **Android / Chrome / Edge:** botão **“Instalar app”** no Perfil (ou menu ⋮ → “Instalar app”).
- **iPhone / iPad:** no Safari, **Compartilhar → “Adicionar à Tela de Início”**.
- `public/sw.js` guarda a página e os arquivos (inclusive todas as perguntas) para uso offline. Com internet,
  sempre carrega a versão nova. Ele só apaga caches com o próprio prefixo, porque no GitHub Pages vários apps
  do mesmo usuário dividem a mesma origem.

## Publicando no GitHub Pages

1. No GitHub: **Settings → Pages → Source: GitHub Actions**.
2. Faça push na `main`. O workflow `.github/workflows/deploy.yml` roda o build (com a validação do conteúdo)
   e publica.
3. O site fica em `https://<usuario>.github.io/pequenos-discipulos/`.

## Estrutura

```
src/
├── data/
│   ├── modulos/*.json      # CONTEÚDO: um arquivo por módulo (ver docs/COMO_ADICIONAR_PERGUNTAS.md)
│   ├── quiz.schema.json    # JSON Schema: autocompletar e validação no editor
│   ├── schema.ts           # Formato do JSON → exercícios da tela + validação (usado pelo app e pelo check)
│   └── curriculum.ts       # Carrega os módulos, filtra por faixa etária, regras de desbloqueio
├── types/index.ts          # Modelos: UserProfile, Unit (módulo), Level, Exercise
├── lib/
│   ├── rules.ts            # Regras do jogo: XP, chamas, sequência, conquistas, ligas, faixas etárias
│   ├── quests.ts           # Missões diárias e baús
│   ├── speech.ts           # Web Speech API em pt-BR: falar e ouvir
│   ├── validation.ts       # Correção tolerante (acentos, pontuação, números, 1 letra trocada)
│   └── …                   # dates, sounds, pwa, image, useNow
├── store/                  # Estado global + localStorage (chave `pequenos_discipulos_data`) + backup
├── components/
│   ├── exercises/          # Um componente por tipo de exercício (+ Prompt com leitura em voz alta)
│   ├── Mascot.tsx          # Pomba mascote
│   └── …
└── pages/                  # Perfis, Trilha, Lição, Ranking, Perfil
```

## Regras do jogo

| Regra | Valor |
|---|---|
| Lição concluída | +20 XP (+5 se não errar nada) |
| Treino (lição já feita) | +5 XP, reacende 1 🔥 e não gasta chamas |
| Chamas (vidas) | 3, 5, 10 ou 20, à escolha do perfil. −1 por erro; reacende 1 a cada 30 min |
| Erro | o exercício volta no fim da lição e entra na revisão de erros |
| Revisão de erros | repetição espaçada (1, 3, 7 e 14 dias). Não gasta chamas, reacende 1 e dá 10 XP |
| Sair no meio da lição | o progresso é salvo a cada resposta; na trilha aparece “Continuar” |
| 5 dias sem estudar | o **módulo atual** recomeça; os anteriores, o XP e as conquistas ficam |
| Dias seguidos 🕯️ | sequência de dias com pelo menos uma lição; bloqueio de sequência custa 50 XP (máx. 2) |
| Meta diária | 10, 20, 30 ou 50 XP por dia |
| Missões diárias | 3 por dia, cada uma libera um baú 🎁 (XP, chamas cheias ou bloqueio de sequência) |
| Liga da Família | ranking semanal por XP, zera toda segunda-feira |

## Próximos passos

- [ ] Revisão doutrinária do conteúdo
- [ ] Mais perguntas por nível (meta: 6–8 por faixa)
- [ ] Modo escuro litúrgico (`#121212`, texto marfim), opcional na especificação
- [ ] Ícones de fase em forma de escudo/vitral (hoje são medalhas redondas com aro dourado)
- [ ] Criador de perguntas pela interface (para catequistas)
