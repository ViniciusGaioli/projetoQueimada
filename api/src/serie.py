"""Série climática diária crua, baixada uma vez e guardada em disco.

Este módulo existe por causa de um defeito de desenho do `build_rapido.py`:
ele guarda em disco só as *linhas calculadas* e descarta a série de onde elas
saíram. Qualquer mudança de feature — outra janela de acumulado, outro alvo,
outra unidade de análise — obriga a baixar tudo de novo.

Aqui o que se grava é a série crua: um registro por coordenada e por dia, com
precipitação, temperatura e umidade. Depois disso, montar conjunto de treino é
trabalho local, de segundos, sem rede.

Quem fala com o Open-Meteo continua sendo o `openmeteo`, pela sua interface
pública: `preparar_series_lote` traz o intervalo de várias coordenadas numa
requisição e se regula pelos cabeçalhos de cota, e `obter_dados_clima_coord`
com `periodos=(1,)` recorta o dia já baixado sem tocar na rede.

O arquivo é CSV comprimido em vez de parquet para não acrescentar dependência
(`pyarrow` não está no ambiente). Para o estado inteiro e um ano são ~235 mil
linhas, uns poucos megabytes.
"""

import csv
import gzip
from datetime import timedelta
from pathlib import Path

import src.openmeteo as om

PASTA_SAIDA = Path(__file__).resolve().parents[1] / 'out' / 'v2'

# Coordenadas por requisição. O teto de 600 chamadas/minuto do Open-Meteo fixa
# o tempo total; o lote só decide com que frequência o progresso é gravado.
COORDENADAS_POR_LOTE = 25

COLUNAS = ('lugar', 'latitude', 'longitude', 'dia', 'prec', 'temp', 'umid')


def _lotes(sequencia, tamanho):
    for inicio in range(0, len(sequencia), tamanho):
        yield sequencia[inicio : inicio + tamanho]


def lugares_gravados(caminho):
    """Nomes já presentes no arquivo, para a coleta retomar de onde parou."""
    caminho = Path(caminho)
    if not caminho.exists():
        return set()

    with gzip.open(caminho, 'rt', encoding='utf-8', newline='') as arquivo:
        return {linha['lugar'] for linha in csv.DictReader(arquivo)}


def coletar(lugares, inicio, fim, caminho, por_lote=COORDENADAS_POR_LOTE, aviso=print):
    """Baixa e grava a série diária de `inicio` a `fim` para cada lugar.

    `lugares` é {nome: (latitude, longitude)}. O arquivo é aberto em modo de
    acréscimo e os lugares já gravados são pulados, então uma interrupção por
    cota esgotada não perde nada: rodar de novo continua daqui.

    Devolve (gravados, pendentes). `pendentes` não vazio significa que a cota
    acabou antes do fim.
    """
    caminho = Path(caminho)
    caminho.parent.mkdir(parents=True, exist_ok=True)

    prontos = lugares_gravados(caminho)
    if prontos:
        aviso(f'  retomando: {len(prontos)} lugares já no arquivo')

    pendentes = [nome for nome in lugares if nome not in prontos]
    if not pendentes:
        return len(prontos), []

    dias = [inicio + timedelta(days=i) for i in range((fim - inicio).days + 1)]
    novo = not caminho.exists()
    lotes = list(_lotes(pendentes, por_lote))
    aviso(f'  {len(pendentes)} lugares em {len(lotes)} requisições')

    with gzip.open(caminho, 'at', encoding='utf-8', newline='') as arquivo:
        escritor = csv.writer(arquivo)
        if novo:
            escritor.writerow(COLUNAS)

        for ordem, lote in enumerate(lotes, 1):
            # A janela pedida à rede começa um dia antes: `obter_dados_clima_coord`
            # olha o dia anterior para montar `prec1`, e um dia não baixado o
            # faria ir à rede linha por linha.
            try:
                om.preparar_series_lote(
                    [lugares[nome] for nome in lote], inicio - timedelta(days=1), fim
                )
            except om.CotaEsgotada as erro:
                restantes = [n for n in pendentes if n not in prontos]
                aviso(f'\n{erro}')
                aviso(f'  gravado: {len(prontos)} lugares | faltam {len(restantes)}')
                return len(prontos), restantes

            for nome in lote:
                latitude, longitude = lugares[nome]
                for dia in dias:
                    d = om.obter_dados_clima_coord(dia, latitude, longitude, periodos=(1,))
                    escritor.writerow(
                        [nome, latitude, longitude, dia.isoformat(),
                         d['precipitacao'], d['temperatura'], d['umidade']]
                    )
                prontos.add(nome)

            arquivo.flush()
            sobra = om.cota().get('restante')
            extra = f' | cota restante: {sobra:.0f}' if sobra is not None else ''
            aviso(f'  [{ordem}/{len(lotes)}] {len(prontos)}/{len(lugares)} lugares{extra}')

    return len(prontos), []


def carregar(caminho):
    """A série gravada, como DataFrame ordenado por lugar e dia."""
    import pandas as pd

    serie = pd.read_csv(caminho, parse_dates=['dia'])
    return serie.sort_values(['lugar', 'dia']).reset_index(drop=True)
