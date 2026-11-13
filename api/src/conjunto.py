"""Conjunto de treino em município-dia, com uma única fonte de features.

A regra que este módulo existe para cumprir:

    O BDQueimadas fornece **apenas o rótulo** — em que município e em que dia
    houve foco de calor. Toda feature vem da série do Open-Meteo, calculada
    pelo mesmo código para as linhas com fogo e sem fogo.

Isso conserta o vazamento do conjunto anterior, onde `DiaSemChuva`,
`Precipitacao` e `RiscoFogo` vinham prontos do BDQueimadas nos positivos e
eram calculados por nós nos negativos. Eram grandezas diferentes com o mesmo
nome de coluna, e um corte em `DiaSemChuva <= 26` acertava 93% sem modelo
nenhum: o que se aprendia era qual pipeline gerou a linha.

A unidade é município-dia, não município-mês. Queimada é fenômeno de dia; num
mês o clima de um dia representava trinta. Em granularidade diária os
negativos deixam de ser construídos — todo município-dia sem foco registrado é
um negativo real — e a proporção de positivos fica em 5 a 6%, que é a
prevalência verdadeira, não os 47% artificiais de antes.

Limitação do rótulo, que nenhuma feature resolve: ausência de foco registrado
não é ausência de fogo. Depende da passagem do satélite e da nebulosidade. O
ruído é assimétrico — há falsos negativos, quase não há falsos positivos — e
isso limita o teto de desempenho.
"""

import numpy as np
import pandas as pd

import src.queimada as q

# As janelas que a fórmula de período de secura do INPE pede.
PERIODOS_INPE = (1, 2, 3, 4, 5, 10, 15, 30, 60, 90, 120)

# Acumulados que entram como feature por si. Vão além do PSE porque o PSE
# condensa tudo num número e o modelo pode querer a forma da série.
JANELAS = (3, 7, 15, 30, 60, 90)

# Abaixo disto o dia conta como seco para o contador de estiagem. 1 mm é o
# limiar usual: menos que isso evapora sem molhar o combustível fino.
LIMIAR_DIA_SECO = 1.0

FEATURES = [
    'bioma', 'mes', 'prec_dia', *[f'prec_{n}d' for n in JANELAS],
    'dias_secos', 'pse', 'temperatura', 'umidade',
    'temp_max_3d', 'umid_min_3d', 'risco_fogo',
]


def _risco_fogo_saturado(bioma, pse, umidade, temperatura):
    """`q.risco_fogo` com o seno saturado no pico, como o INPE define.

    O `rb` da fórmula é `sin(bioma * dias - 90°)`, que sobe até o argumento
    chegar a 90° e **depois desce**: sem saturar, mais seca produz risco menor,
    e passando de 180° o risco ficaria negativo. No conjunto anterior 11% das
    linhas estavam passadas do pico.

    O conserto fica aqui, e não em `queimada.py`, para não alterar o que já
    está em produção: satura-se a entrada em `180 / bioma`, o que faz o
    argumento parar em 90° e `rb` no seu máximo de 0,8.
    """
    return q.risco_fogo(bioma, min(pse, 180.0 / bioma), umidade, temperatura)


def _por_lugar(serie):
    """Acrescenta à série de um lugar as features que dependem do passado."""
    serie = serie.sort_values('dia').copy()

    # O dia em questão não entra nos acumulados: a fórmula do INPE olha o que
    # chovia *antes*, e incluir o próprio dia vazaria o presente no passado.
    anterior = serie['prec'].shift(1)

    # As do INPE alimentam a fórmula de secura; as de JANELAS entram como
    # feature. Os conjuntos se sobrepõem em parte, mas nem toda janela útil ao
    # modelo é uma das do INPE (7 dias, por exemplo, não é).
    for n in PERIODOS_INPE:
        serie[f'prec{n}'] = anterior.rolling(n, min_periods=n).sum()
    for n in JANELAS:
        serie[f'prec_{n}d'] = anterior.rolling(n, min_periods=n).sum()

    # Dias secos consecutivos terminando no dia anterior. O truque é agrupar
    # por quantas chuvas já ocorreram: dentro de um grupo, a contagem acumulada
    # é o tamanho da estiagem.
    seco = (anterior < LIMIAR_DIA_SECO).astype(int)
    grupo = (seco == 0).cumsum()
    serie['dias_secos'] = seco.groupby(grupo).cumsum()

    serie['temp_max_3d'] = serie['temp'].shift(1).rolling(3, min_periods=1).max()
    serie['umid_min_3d'] = serie['umid'].shift(1).rolling(3, min_periods=1).min()

    return serie


def montar(serie, focos, bioma_por_lugar, cobertura=None):
    """Junta série, rótulo e features num conjunto pronto para treinar.

    `serie` é a saída de `serie.carregar`; `focos` é um conjunto de pares
    (lugar, data) com foco registrado; `bioma_por_lugar` dá a constante de
    vegetação do INPE para cada lugar.

    `cobertura` é (primeiro_dia, ultimo_dia) do BDQueimadas e é **obrigatória
    na prática**: fora dessa janela não existe rótulo, e um dia sem rótulo
    viraria negativo por omissão. A série costuma ir até uma semana atrás,
    enquanto o BDQueimadas para meses antes — sem este corte, todos os meses
    recentes entrariam como "não pegou fogo".
    """
    # Concatenação explícita em vez de `groupby.apply`: no pandas 3 o apply
    # recebe o grupo já sem a coluna de agrupamento, e `lugar` desapareceria.
    d = pd.concat(
        [_por_lugar(grupo) for _, grupo in serie.groupby('lugar', sort=False)],
        ignore_index=True,
    )

    # A janela de 120 dias do PSE precisa estar inteira; os primeiros dias de
    # cada lugar não têm passado suficiente.
    d = d.dropna(subset=[f'prec{max(PERIODOS_INPE)}', 'temp', 'umid']).reset_index(drop=True)

    d['bioma'] = d['lugar'].map(bioma_por_lugar)
    d = d.dropna(subset=['bioma']).reset_index(drop=True)

    d['mes'] = d['dia'].dt.month
    d['prec_dia'] = d['prec']
    d['temperatura'] = d['temp']
    d['umidade'] = d['umid']

    colunas_pse = [f'prec{n}' for n in PERIODOS_INPE]
    d['pse'] = [
        q.periodo_de_secura(dict(zip(colunas_pse, valores)))
        for valores in d[colunas_pse].to_numpy()
    ]
    d['risco_fogo'] = [
        _risco_fogo_saturado(b, p, u, t)
        for b, p, u, t in zip(d['bioma'], d['pse'], d['umidade'], d['temperatura'])
    ]

    if cobertura is not None:
        primeiro, ultimo = cobertura
        dentro = (d['dia'].dt.date >= primeiro) & (d['dia'].dt.date <= ultimo)
        d = d[dentro].reset_index(drop=True)

    datas = d['dia'].dt.date
    d['fogo'] = [
        1 if (lugar, data) in focos else 0 for lugar, data in zip(d['lugar'], datas)
    ]

    return d[['lugar', 'dia', *FEATURES, 'fogo']]


def rotulos(bruto):
    """(lugar, data) com foco registrado, e a constante de vegetação por lugar.

    Do BDQueimadas sai **só** isto. As colunas `DiaSemChuva`, `Precipitacao` e
    `RiscoFogo` dele são deliberadamente ignoradas: usá-las nos positivos foi o
    que vazou o rótulo no conjunto anterior.
    """
    d = bruto.copy()
    d['Municipio'] = d['Municipio'].astype(str).str.replace('﻿', '', regex=False).str.strip()
    d['DataHora'] = pd.to_datetime(
        d['DataHora'].astype(str).str.replace('﻿', '', regex=False), format='mixed'
    )

    # O bioma é propriedade estática do lugar, então pode vir do histórico
    # inteiro de focos sem vazar nada sobre um dia específico.
    d = d[d['Bioma'].isin(['Mata Atlântica', 'Cerrado'])]
    d['constante'] = d['Bioma'].map({'Mata Atlântica': 1.7, 'Cerrado': 3})

    focos = set(zip(d['Municipio'], d['DataHora'].dt.date))
    bioma = d.groupby('Municipio')['constante'].mean().to_dict()

    return focos, bioma
