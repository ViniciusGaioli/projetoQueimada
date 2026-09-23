# Projeto Queimada

Plataforma de monitoramento e previsão de risco de incêndio na Serra da Paulista, a partir da base
pública de focos de calor do **BDQueimadas / INPE** e de um modelo de regressão.

Este repositório contém, por enquanto, **apenas a camada de apresentação**. O backend (pipeline de
dados em Python e o modelo treinado) é etapa seguinte e ainda não existe aqui.

## Rodando

```bash
npm run dev        # servidor de desenvolvimento
npm run build      # build de produção
npm run lint       # ESLint
npm run format     # Prettier (escreve)
npm run typecheck  # TypeScript sem emitir
```

## Arquitetura

O projeto segue integralmente o `ARQUITETURA.md`. As tabelas abaixo registram como cada **papel
abstrato** foi preenchido nesta stack — é a "tabela de concretização" da §18 aplicada a este projeto.

### Slots preenchidos

| Slot abstrato (§18)  | Escolha aqui                                  |
| -------------------- | --------------------------------------------- |
| Framework + entrada  | Next.js 16 (App Router) + React 19            |
| Linguagem / tipos    | TypeScript `strict`, alias `@/* → ./src/*`    |
| Unidade de lógica    | Hook React (`use…`), sufixo `.hook`           |
| Variante de contexto | `'use client'` no topo do arquivo             |
| Estilo               | Tailwind v4 (tokens em `@theme` + `@layer`)   |
| Estado compartilhado | ainda não necessário (nenhuma store)          |
| Persistência / Model | ainda não existe (backend é etapa futura)     |
| Lint / formatação    | ESLint + Prettier + EditorConfig, versionados |

### Gramática de sufixos (§3.1)

| Papel                  | Arquivo             |
| ---------------------- | ------------------- |
| View (apresentação)    | `Nome.tsx`          |
| Lógica / comportamento | `Nome.hook.ts(x)`   |
| Tipos                  | `Nome.types.ts`     |
| Constantes locais      | `Nome.constants.ts` |
| Entrada pública        | `index.ts`          |

### Árvore

```
src/
├── app/                                  # ENTRADA — rotas finas, só delegam
│   ├── layout.tsx                        # fontes, metadata, <html lang="pt-BR">
│   └── page.tsx                          # → <HomePage />
│
├── core/                                 # DOMÍNIO + INFRA
│   ├── assets/global.css                 # tokens de design (2 temas) + utilities
│   └── theme/                            # chave de storage + script anti-flash
│
└── modules/                              # FEATURES
    └── landing/
        ├── assets/                        # fotos e logos (import estático)
        ├── components/
        │   ├── atoms/                    # FilterChip, SectionHeading, SectionMarker
        │   ├── molecules/                # NavRail, PipelineNode, RangeControl, RiskScale,
        │   │                             #   StackColumn, ThemeToggle*,
        │   │                             #   VariableDetail, VariableRow
        │   ├── organisms/                # SiteHeader*, Hero, Problem, Model,
        │   │                             #   DataSchema*, RiskPreview*, TechStack
        │   └── pages/HomePage/           # topo da composição
        ├── landing.constants.ts          # TODO o conteúdo da página
        └── landing.types.ts              # tipos compartilhados da feature

* unidades com lógica própria (.hook) e marcador 'use client'
```

`core/` não importa de `modules/`. As Views não têm estado, efeitos, handlers nem cálculos — toda
lógica vive nos quatro `.hook` (`SiteHeader`, `DataSchema`, `RiskPreview`, `ThemeToggle`). Imports
sempre por alias de raiz e pelo `index` da pasta, nunca por caminho profundo.

## Convenções

- **Idioma.** Texto voltado ao usuário em **pt-BR**; identificadores de código em **inglês**. A única
  exceção são os nomes das colunas do BDQueimadas (`dias_sem_chuva`, `risco_fogo`…), mantidos exatos
  como aparecem na base do INPE.
- **Estratégia de estilo.** Uma só por camada: utilitários Tailwind nas Views, tokens de design
  declarados em `@theme` e classes transversais em `@layer utilities` (`.shell`, `.section-grid`,
  `.label-mono`, `.display-type`, `.measure`…). Nenhum CSS-in-JS.
- **Logos das tecnologias.** Ficam direto sobre o fundo, sem moldura. Para que isso funcionasse nos
  dois temas, `html.png`, `css.png` e `react.webp` foram recortadas para só a marca, descartando o
  texto preto que as acompanhava e que sumia no tema escuro. O pandas é um wordmark azul-marinho
  sobre transparente e recebe `logoIsDark: true`, que aplica a utility `.logo-invert-on-dark`: no
  tema escuro ela o renderiza em branco, no claro não faz nada. São servidas com `unoptimized`:
  somam 112 KB e, ao passarem pelo otimizador, clientes que não anunciam suporte a webp recebem
  JPEG, que não tem canal alfa e aplica fundo preto.
- **Tema.** Dois temas: **escuro** (brasa sobre carvão, o padrão) e **claro** (brasa sobre papel). Os
  tokens são semânticos por papel — `surface`, `content`, `accent`, `rule` — e nunca por aparência,
  de modo que a mesma classe (`bg-surface`, `text-content`) resolve certo nos dois. O tema claro
  redefine só os valores em `:root[data-theme='light']`; nenhum componente conhece o tema.
  A escolha persiste em `localStorage` e é aplicada antes da primeira pintura por um script síncrono
  no `<head>` (`core/theme/theme.script.ts`), o padrão documentado pelo Next para evitar flash.
  Para fazer o site seguir a preferência do sistema em vez de abrir sempre no escuro, basta duplicar
  o bloco `[data-theme='light']` dentro de `@media (prefers-color-scheme: light)`.
- **Sem comentários explicativos** em componentes; documentação só em utilitários genéricos.

## Conteúdo da página

Todo o texto, os dados e os estados vivem em `src/modules/landing/landing.constants.ts`. Para mudar a
página não é preciso tocar em nenhum componente.

Pontos que são **placeholder** e devem ser revistos:

- `project.region` — "Serra da Paulista" está confirmada: fica entre São João da Boa Vista e Águas
  da Prata (SP). Ajuste apenas se o recorte do modelo mudar.
- `dataVariables[].sample` — exemplos ilustrativos; troque por valores reais da base.
- `RiskPreview.constants.ts` — a fórmula da prévia é ilustrativa e será substituída pela chamada ao
  modelo treinado.
- **Crédito das três fotos.** `serra-da-paulista-sao-joao-da-boa-vista.webp` (hero),
  `fogo-aguas-da-pratagrande.webp` e `fogo-aguas-da-prata1.webp` (seção 01) estão publicadas sem
  atribuição. Antes de o site ir ao ar, confirme a licença das três e acrescente autor e fonte.
- **Afirmações da seção 01.** O texto cita a Operação São Paulo Sem Fogo, as fases da Operação
  Estiagem, o uso dos focos do AQUA pela Polícia Militar Ambiental e a resolução de 25 km do campo
  de precipitação do Risco de Fogo. Tudo vem das fontes listadas abaixo; se for para trabalho
  acadêmico, cite-as formalmente.

- **O projeto não tem nome nem rodapé.** O cabeçalho usa só o losango como marca e a página termina
  na seção de tecnologias. A atribuição ao INPE existe hoje apenas no corpo das seções 01, 02 e 03;
  se o site for publicado, avalie se isso basta como crédito da fonte de dados.

## Fontes da contextualização

- Programa Queimadas / BDQueimadas, INPE: <https://data.inpe.br/queimadas/bdqueimadas/>
- Risco de Fogo, metodologia (versão 9), INPE:
  <https://dataserver-coids.inpe.br/queimadas/queimadas/Publicacoes-Impacto/documentos/RiscoFogo_Sucinto_20130911.pdf>
- Operação São Paulo Sem Fogo, SEMIL/SP: <https://semil.sp.gov.br/sma/sp-sem-fogo/>
- Operação São Paulo Sem Fogo, monitoramento via satélite, Agência SP:
  <https://www.agenciasp.sp.gov.br/operacao-sao-paulo-sem-fogo-amplia-acoes-de-prevencao-e-combate-a-incendios-em-sp-com-monitoramento-via-satelite/>
- Incêndio na Serra da Paulista, Defesa Civil de São João da Boa Vista:
  <https://www.saojoao.sp.gov.br/departamentos/seguranca-e-transito/defesa-civil-de-sao-joao-enfrenta-incendio-na-serra-da-paulista>

## Acessibilidade

Os pares de cor dos dois temas são conferidos contra WCAG AA: texto principal ≥ 16:1, secundário
≥ 5,3:1, terciário ≥ 3,7:1, destaque ≥ 4,6:1 sobre o respectivo fundo. Ao mexer na paleta de
`global.css`, recalcule — os tokens são poucos e os contrastes são fáceis de quebrar sem perceber.
