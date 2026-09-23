# Projeto Queimada

Plataforma de monitoramento e previsão de risco de incêndio na Serra da Paulista, entre São João da
Boa Vista e Águas da Prata, no estado de São Paulo.

A região concentra focos recorrentes todo ano, nos mesmos meses e quase sempre nos mesmos trechos. O
INPE já calcula e prevê um índice de risco de fogo, mas em uma escala espacial ampla, na qual uma
única célula cobre a serra inteira e os municípios ao redor. Este projeto usa a base pública de
focos de calor do BDQueimadas para treinar um modelo de regressão sobre o histórico da própria
serra, transformando essa leitura regional em uma leitura local.

## Os dados

Cada foco detectado chega em onze colunas: data e hora, satélite, país, estado, município, bioma,
dias sem chuva, precipitação, risco de fogo, latitude e longitude. As dez primeiras são a entrada do
modelo; o risco de fogo é o valor que ele aprende a prever.

Fonte: Programa Queimadas do INPE, via BDQueimadas.

## Tecnologias

- **Interface:** React, TypeScript, HTML e CSS, sobre Next.js
- **Modelo e dados:** Python, pandas e scikit-learn

## Estado atual

Este repositório contém a página de apresentação do projeto. A coleta de dados está em andamento; o
treinamento do modelo e a integração com a plataforma são as etapas seguintes.

## Como rodar

```bash
npm install
npm run dev
```

A página fica disponível em http://localhost:3000.
