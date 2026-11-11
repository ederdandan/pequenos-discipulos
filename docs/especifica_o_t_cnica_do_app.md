# 📖 SPECIFICATION DOCUMENT: PEQUENOS DISCÍPULOS
**Projeto:** Pequenos Discípulos (PWA Catequético Gamificado)  
**Plataforma de Hospedagem:** GitHub Pages (Static Web Hosting / Zero-Backend Architecture)  
**Tecnologias:** HTML5, CSS3 / Tailwind CSS, JavaScript (Vanilla ou React SPA), Service Worker (PWA)  
**Versão:** 2.1.0  

---

## 1. VISÃO GERAL & ARQUITETURA DE HOSPEDAGEM (GITHUB PAGES)

O **Pequenos Discípulos** é uma reestruturação do aplicativo *duo-learn*, adaptado para o ensino e a formação catequética da Igreja Católica para todas as faixas etárias.

Por ser hospedado no **GitHub Pages**, o aplicativo opera como uma aplicação **100% Client-Side (SPA/PWA)**. Todo o motor de regras, seleções por perfil de idade, cálculo de pontuações e armazenamentos de estado acontecem diretamente no navegador do usuário, sem necessidade de servidores externos ou APIs pagas.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        GITHUB PAGES (Hospedagem Estática)              │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────────────────────────┐ │
│  │ index.html │  │ app.bundle.js│  │   data/quiz_database.json        │ │
│  └────────────┘  └─────────────┘  └──────────────────────────────────┘ │
└───────────────────┬────────────────────────────────────┘
                                    │ Download inicial & Execução no Browser
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                           NAVEGADOR DO USUÁRIO                         │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ 1. Engine de Filtro de Perguntas                               │   │
│   │    Filtra `quiz_database.json` pela idade do perfil ativo      │   │
│   └────────────────────────────────────────────────────────────────┘   │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ 2. Banco de Dados Local (LocalStorage)                         │   │
│   │    Persiste múltiplos perfis, vidas, XP, ofensivas e conquistas│   │
│   └────────────────────────────────────────────────────────────────┘   │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ 3. Execução Offline (Service Worker / Cache Storage)           │   │
│   │    Garante funcionamento completo sem internet após 1º acesso  │   │
│   └────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. PERFIS DE IDADE & CURADORIA ADAPTATIVA

Ao abrir o app ou trocar de perfil no dispositivo, a aplicação lê a faixa etária cadastrada no estado local (`UserContext` / `LocalStorage`) e ajusta dinamicamente a linguagem, a complexidade visual e o rigor doutrinário dos conteúdos exibidos:

```
[ Login / Seleção de Perfil ]
         │
         ├──► Infantil (Até 9 anos)   ────► Linguagem lúdica | Arte ilustrada | Foco: Histórias, orações e Santos
         ├──► Juvenil (10 a 16 anos)  ────► Linguagem dinâmica | Desafios/Quiz | Foco: Virtudes, Mandamentos e Bíblia
         └──► Adulto (17+ anos)       ────► Linguagem profunda | Referências diretas (CIC e Bíblia) | Teologia e Apologética
```

### 2.1. Matriz de Diferenciação por Perfil

| Parâmetro | Infantil (≤ 9 anos) | Juvenil (10 a 16 anos) | Adulto (17+ anos) |
| :--- | :--- | :--- | :--- |
| **Identificador (`age_group`)** | `KIDS` | `TEENS` | `ADULTS` |
| **Abordagem** | Lúdica, visual e simplificada | Gamificada, prática e moral | Doutrinária, exegética e teológica |
| **Rigor de Texto** | Resumos conceituais | Explicações diretas | Trechos diretos do Catecismo (CIC) e Sagrada Escritura |
| **Feedback Visual** | Cores quentes, ícones grandes, mascotinho | Estilo moderno, insígnias de conquistas | Interface sóbria, tipografia legível estilo leitor |
| **Fontes & Citações** | Ocultas (foco na narrativa) | Opcionais (card expansível) | Mandatórias (indicação explícita dos números do CIC e Versículos) |

---

## 3. ESTRUTURA MODULAR DA TRILHA DE APRENDIZADO

A trilha de lições é dividida em **Módulos Temáticos** que englobam os 4 Pilares do Catecismo da Igreja Católica (CIC) e temas complementares:

```
================================================================================
PILAR 1: A PROFISSÃO DE FÉ (CREDO)
├── Nível 1: Deus Pai Criador
├── Nível 2: Jesus Cristo (Encarnação, Paixão e Ressurreição)
└── Nível 3: O Espírito Santo e a Santa Igreja

PILAR 2: A CELEBRAÇÃO DO MISTÉRIO CRISTÃO (SACRAMENTOS E LITURGIA)
├── Nível 1: Introdução à Graça e à Liturgia
├── Nível 2: Sacramentos da Iniciação (Batismo, Eucaristia, Crisma)
└── Nível 3: Sacramentos de Cura e Serviço (Penitência, Unção, Ordem, Matrimônio)

PILAR 3: A VIDA EM CRISTO (MORAL E VIRTUDES)
├── Nível 1: As Virtudes Teologais e Cardeais
├── Nível 2: Os 10 Mandamentos (Amor a Deus e ao Próximo)
└── Nível 3: As Obras de Misericórdia

PILAR 4: A ORAÇÃO CRISTÃ (DEVOCIONAL)
├── Nível 1: O que é Orar e Tipos de Oração
└── Nível 2: A Oração do Pai Nosso e a Devoção a Maria

MÓDULOS ESPECIAS & SUPLEMENTARES
├── 🛡️ Hagiografia: Vida e Exemplo dos Santos
├── 📜 Sagrada Escritura: Histórias Bíblicas e Parábolas
├── ⛪ Ano Litúrgico e Festas (Advento, Quaresma, Páscoa)
└── ⛪ Objetos Sacros, Vestimentas e Partes da Missa
================================================================================
```

---

## 4. DESIGN SYSTEM LITÚRGICO (UI/UX)

Substituição dos elementos visuais e tons verdes/amarelos cítricos do app antigo por uma paleta inspirada na arte sacra católica e nos tempos litúrgicos:

### 4.1. Tabela de Cores Litúrgicas

| Elemento UI | Cor / Estilo | Código Hex | Uso na Interface |
| :--- | :--- | :--- | :--- |
| **Primária (Navegação/Ação)** | Azul Mariano | `#1E3A8A` / `#2563EB` | Cabeçalho, botões de ação e nós da trilha ativos |
| **Secundária (Progresso/Sucesso)**| Dourado Sacro | `#D97706` / `#F59E0B` | XP, estrelas, coroas e medalhas de conclusão |
| **Destaque / Níveis Concluídos** | Vermelho Pentecostes | `#DC2626` | Nós de níveis finalizados, badges de conquista |
| **Vidas / Energias** | Fogo do Espírito Santo | `#EA580C` | Contador de chamas/vidas no topo da tela |
| **Fundo de Tela** | Pergaminho Suave | `#FDFBF7` | Fundo principal da aplicação e cards de leitura |
| **Modo Escuro (Opcional)** | Escuro Litúrgico | `#121212` | Fundo para sessões noturnas com texto em tom marfim |

### 4.2. Elementos Gráficos
* **Mascote Guia:** Substituição da coruja por uma pomba estilizada (Espírito Santo) ou um anjo da guarda ilustrado em vetor.
* **Ícones de Fase:** Formatos de escudos medievais, medalhas sacras ou vitrais estilizados.

---

## 5. SCHEMA DO BANCO DE DADOS PRÉ-CADASTRADO (`quiz_database.json`)

O arquivo estático `quiz_database.json` permanece armazenado no repositório do GitHub Pages e é baixado uma única vez pelo navegador. Cada pergunta é indexada pelas tags `target_ages` e `catechism_part`:

```json
{
  "version": "2.1.0",
  "modules": [
    {
      "id": "mod_credo_01",
      "catechism_part": 1,
      "title": "A Profissão de Fé (O Credo)",
      "levels": [
        {
          "level_number": 1,
          "title": "Deus Pai Criador",
          "questions": [
            {
              "id": "q_credo_child_01",
              "type": "multiple_choice",
              "target_ages": ["KIDS"],
              "prompt": "Quem criou o mundo e tudo o que existe com muito amor?",
              "options": ["Deus Pai", "Um robô", "Os anjos sozinhos"],
              "correct_index": 0,
              "explanation": "Deus Pai criou o céu e a terra por amor a todos nós!"
            },
            {
              "id": "q_credo_adult_01",
              "type": "multiple_choice",
              "target_ages": ["TEENS", "ADULTS"],
              "source_reference": "CIC 198",
              "prompt": "Qual é o artigo fundamental da Profissão de Fé Católica?",
              "options": [
                "Creio em Deus Pai Todo-Poderoso, Criador do céu e da terra",
                "Creio na infalibilidade dos homens",
                "Creio na salvação apenas pelas obras sem fé"
              ],
              "correct_index": 0,
              "explanation": "O Credo começa por Deus Pai, pois Ele é a Primeira Pessoa da Santíssima Trindade (CIC 198)."
            }
          ]
        }
      ]
    },
    {
      "id": "mod_santos_01",
      "catechism_part": 5,
      "title": "Módulo Especial: Vida dos Santos",
      "levels": [
        {
          "level_number": 1,
          "title": "Grandes Amigos de Deus",
          "questions": [
            {
              "id": "q_santos_01",
              "type": "match_pairs",
              "target_ages": ["KIDS", "TEENS"],
              "prompt": "Ligue o Santo ao seu símbolo ou história:",
              "pairs": [
                { "item": "São Francisco de Assis", "match": "Amor aos animais e à criação" },
                { "item": "São Pedro", "match": "Chaves do Reino dos Céus" },
                { "item": "Nossa Senhora de Aparecida", "match": "Padroeira do Brasil" }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

---

## 6. PERSISTÊNCIA DE DADOS & MULTI-PERFIS (`LOCALSTORAGE`)

Toda a gestão de perfis e progresso familiar ocorre localmente no dispositivo via `LocalStorage`:

* **Chave de Armazenamento:** `pequenos_discipulos_data`
* **Estrutura Armazenada:**
  * Lista de Perfis (Nome, Avatar, Idade/Faixa Etária).
  * Perfil Ativo.
  * Estatísticas individuais por perfil: XP acumulado, Nível atual, Ofensivas (dias consecutivos / *streaks*), Vidas restantes, Lista de IDs das lições/questões concluídas.
* **Mecanismo de Filtro no Frontend (JS):**
  ```javascript
  function getFilteredQuestions(moduleData, activeProfileAge) {
    return moduleData.questions.filter(q => q.target_ages.includes(activeProfileAge));
  }
  ```

---

## 7. SUPORTE OFFLINE & PWA (`SERVICE-WORKER.JS`)

Para permitir a utilização em acampamentos, encontros de catequese ou locais sem conexão com a internet:

1. **Estratégia Cache First / Stale-While-Revalidate:** Todos os arquivos estáticos (`index.html`, scripts, estilos, áudios, ícones e o `quiz_database.json`) são salvos no `Cache Storage` no primeiro acesso.
2. **Manifest PWA:** Arquivo `manifest.json` configurado com `display: standalone`, permitindo instalar o aplicativo diretamente na tela inicial do celular ou tablet.

---

## 8. ROTEIRO DE MIGRAÇÃO & IMPLANTAÇÃO

1. **Adequação do JSON Existente:** Atualizar o arquivo de perguntas já cadastrado no app anterior, adicionando os campos `target_ages`, `catechism_part` e `source_reference`.
2. **Atualização da Engine de Filtragem:** Garantir que ao alterar o perfil ativo no `LocalStorage`, a árvore de lições e o banco de exercícios sejam instantaneamente recarregados de acordo com a faixa etária.
3. **Redesign do CSS/Tailwind:** Aplicar as variáveis da paleta litúrgica (Azul Mariano e Dourado Sacro).
4. **Deploy estático:** Realizar o `git push` para a branch `main` / `gh-pages` do GitHub Pages.