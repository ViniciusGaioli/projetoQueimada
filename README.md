# Projeto Queimada

Plataforma de monitoramento e previsão de risco de incêndio na Serra da Paulista, entre São João da
Boa Vista e Águas da Prata, no estado de São Paulo.

A região concentra focos recorrentes todo ano, nos mesmos meses e quase sempre nos mesmos trechos. O
INPE já calcula e prevê um índice de risco de fogo, mas em uma escala espacial ampla, na qual uma
única célula cobre a serra inteira e os municípios ao redor. Este projeto usa a base pública de
focos de calor do BDQueimadas para treinar um modelo sobre o histórico da própria serra,
transformando essa leitura regional em uma leitura local.

## Os dados

Cada foco detectado chega em onze colunas: data e hora, satélite, país, estado, município, bioma,
dias sem chuva, precipitação, risco de fogo, latitude e longitude.

Fontes públicas usadas pela plataforma:

| Fonte                  | Para quê                                                                   |
| ---------------------- | -------------------------------------------------------------------------- |
| **BDQueimadas** (INPE) | Histórico de focos de calor detectados por satélite, base do treino        |
| **Open-Meteo**         | Clima ao vivo, histórico de precipitação de 120 dias e altitude do terreno |
| **IBGE**               | Malha do estado de São Paulo e dos 658 municípios desenhados nos mapas     |

## A plataforma

A página `/mapa` reúne três leituras da mesma previsão:

1. **Mapa do estado** — São Paulo em 538 células de 22 km, cada uma com clima lido ao vivo e a
   previsão do modelo, apresentada como um índice de 0 a 1.
2. **Serra da Paulista** — o recorte de estudo em 324 células de 2,8 km, com divisas municipais no
   lugar do contorno estadual. Os limites do recorte vieram de 934 pontos de altitude amostrados: o
   terreno vai de 563 m a 1.536 m, e a serra atravessa a divisa com Minas, então o mapa também.
3. **Simulação** — um formulário em que você informa as condições e o modelo responde. Cada controle
   traz a curva de como a previsão reage quando só aquela variável muda.

A página `/` é a apresentação do projeto: o problema, como o modelo é construído, os dados de
entrada, as decisões de projeto com suas limitações e as tecnologias. O mapa é alcançado pelo botão
do banner.

## Arquitetura

Três processos, que o `docker-compose.yml` sobe juntos:

- **`app`** — o site em Next.js. É ele, no servidor, que busca a predição: o navegador nunca fala
  com a API, o que dispensa CORS e mantém o endereço da API fora da internet.
- **`api`** — Flask com o modelo carregado. Não publica porta; só o site a alcança, pela rede
  interna do compose.
- **`aquecedor`** — monta o cache de clima do dia antes que alguém abra a página. Substitui um cron:
  vai para o ar junto com o site e, a cada meia hora, pergunta se a grade de hoje existe.

O front segue o `ARQUITETURA.md`: entrada fina em `src/app/`, features em `src/modules/`, domínio e
infraestrutura em `src/core/`, transversal em `src/shared/`. Cada unidade é uma pasta com sufixos por
papel (`.hook`, `.types`, `.constants`, `index`).

Os mapas são SVG desenhado à mão, sem biblioteca de mapas: o contorno vem da malha do IBGE, é
projetado no servidor e desce como um atributo `d`; as cores são variáveis de CSS, então a troca de
tema não recalcula nada.

### Cota do Open-Meteo

O plano gratuito permite 600 chamadas por minuto, 5.000 por hora e 10.000 por dia, e uma requisição
não custa uma chamada: pedidos acima de duas semanas contam como várias, e os nossos cobrem 120 dias.
Por isso a grade do dia é montada **uma vez**, gravada lote a lote em `api/out/cache/` e reaproveitada
o dia inteiro. Se a cota estourar no meio, a próxima tentativa retoma de onde parou; se a grade de
hoje não estiver pronta, a API serve a mais recente que tiver e a interface avisa.

## Como rodar

Precisa de Node 20+ e Python 3.13+. O modelo treinado (`gpc-2026.pkl` e `scaler-2026.pkl`) não está
no repositório — copie-o para `api/out/`.

```bash
# API de predição
cd api
python -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python src/api.py out/        # http://127.0.0.1:5000

# Aquecedor do cache, em outro terminal
cd api && .venv/bin/python aquecer.py --vigiar

# Site, em outro terminal
npm install
npm run dev                             # http://localhost:3000
```

Variáveis de ambiente:

| Variável                | Onde      | Padrão                  | Para quê                                 |
| ----------------------- | --------- | ----------------------- | ---------------------------------------- |
| `PREDICTION_API_URL`    | site      | `http://127.0.0.1:5000` | Endereço da API de predição              |
| `API_HOST` / `API_PORT` | api       | `127.0.0.1` / `5000`    | Onde o Flask escuta                      |
| `INTERVALO_VIGIA`       | aquecedor | `1800`                  | Segundos entre conferências do cache     |
| `REGIOES_GRADE`         | aquecedor | todas                   | Regiões a aquecer, separadas por vírgula |

Em produção, `docker compose up -d --build` sobe os três serviços. A API precisa de **2 GB de RAM**:
o modelo passa de 1 GB carregado.

## Estado atual

A plataforma está completa e funcionando de ponta a ponta. **O modelo está em revisão** — a forma
como as duas classes foram construídas no treino precisa ser corrigida, e os números que a plataforma
mostra hoje refletem esse problema. A infraestrutura em volta não muda com isso: trocar o `.pkl` em
`api/out/` basta.
