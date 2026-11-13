"""Baixa a série climática diária dos municípios e grava em disco.

Roda uma vez. Depois disso, `montar_conjunto.py` produz qualquer variação de
conjunto de treino localmente, sem tocar na rede.

Uso:
    python coletar_series.py [--meses N] [--arquivo bdqueimadas.csv]

Custo medido nos cabeçalhos do Open-Meteo: 1 coordenada × 486 dias × 3
variáveis = 10,44 chamadas. Os 642 municípios do estado com um ano de série
custam ~6.700 das 10.000 chamadas diárias — a mesma requisição que o
`build_rapido.py` já fazia, mas agora a série inteira é guardada em vez de só
12 linhas por município.

O teto horário é de 5.000, então um ano atravessa duas janelas de hora. A
coleta é retomável: se a cota acabar, rodar de novo continua de onde parou.
"""

import sys
import time
from datetime import date, timedelta
from pathlib import Path

import pandas as pd
import requests

import src.openmeteo as om
import src.serie as s

# A coleta é ordenada por distância, não por nome: o saldo diário da cota não é
# exposto em cabeçalho nenhum, então não há como dimensionar a lista de
# antemão. Ordenando assim, qualquer prefixo é uma amostra espalhada pelo
# estado — se a cota acabar no meio, o que sobrou ainda cobre São Paulo inteiro
# em vez de ser o pedaço A–F do alfabeto.
PRIMEIROS = ('SÃO JOÃO DA BOA VISTA', 'ÁGUAS DA PRATA')

ARQUIVO_SERIE = s.PASTA_SAIDA / 'serie-diaria.csv.gz'

# A janela do PSE olha 120 dias para trás, então a série começa antes do
# primeiro dia que vai virar linha do conjunto.
FOLGA_PSE = max(s.om.PERIODOS_PRECIPITACAO) + 1


def _argumentos():
    meses, arquivo = 12, 'bdqueimadas.csv'
    restantes = sys.argv[1:]

    for chave, destino in (('--meses', 'meses'), ('--arquivo', 'arquivo')):
        if chave in restantes:
            posicao = restantes.index(chave)
            valor = restantes[posicao + 1]
            if destino == 'meses':
                meses = int(valor)
            else:
                arquivo = valor
            restantes = restantes[:posicao] + restantes[posicao + 2 :]

    return meses, arquivo


def _ordem_espalhada(lugares, primeiros=PRIMEIROS):
    """Travessia do ponto mais distante: cada lugar é o mais afastado dos já escolhidos.

    Começa pelos municípios de estudo do projeto, que precisam estar no
    conjunto. Daí em diante escolhe sempre quem está mais longe de tudo que já
    foi escolhido, o que faz a amostra crescer cobrindo o estado em vez de
    adensar uma região.
    """
    restantes = dict(lugares)
    escolhidos = [nome for nome in primeiros if nome in restantes]
    for nome in escolhidos:
        del restantes[nome]

    if not escolhidos:
        escolhidos = [next(iter(restantes))]
        del restantes[escolhidos[0]]

    # Distância ao conjunto já escolhido, mantida incrementalmente.
    def d2(a, b):
        return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2

    perto = {nome: min(d2(coord, lugares[e]) for e in escolhidos)
             for nome, coord in restantes.items()}

    while restantes:
        nome = max(perto, key=perto.get)
        escolhidos.append(nome)
        coord = restantes.pop(nome)
        del perto[nome]
        for outro, distancia in perto.items():
            nova = d2(restantes[outro], coord)
            if nova < distancia:
                perto[outro] = nova

    return escolhidos


def main():
    meses, arquivo = _argumentos()

    if not Path(arquivo).exists():
        print(f'{arquivo} não existe!')
        return 1

    comeco = time.perf_counter()

    print(f'Lendo {arquivo}...', flush=True)
    bruto = pd.read_csv(arquivo, encoding='utf-8-sig', low_memory=False)
    nomes = sorted(
        bruto['Municipio'].astype(str).str.replace('﻿', '', regex=False).str.strip().unique()
    )
    print(f'  {len(nomes)} municípios', flush=True)

    print('Geocodificando (em cache depois da primeira vez)...', flush=True)
    lugares, ausentes = {}, []
    for ordem, nome in enumerate(nomes, 1):
        try:
            local = om.buscar_cidade(nome)
            lugares[nome] = (local['latitude'], local['longitude'])
        except (om.CidadeNaoEncontrada, requests.exceptions.RequestException) as erro:
            ausentes.append((nome, str(erro)[:60]))
        if ordem % 100 == 0:
            print(f'  {ordem}/{len(nomes)}', flush=True)
    print(f'  {len(lugares)} localizados, {len(ausentes)} não encontrados', flush=True)

    # A série para onde o rótulo para: dia sem foco registrado *e* sem
    # cobertura do BDQueimadas não é negativo, é desconhecido — e baixá-lo
    # gastaria cota para nada.
    ultimo_rotulo = pd.to_datetime(
        bruto['DataHora'].astype(str).str.replace('\ufeff', '', regex=False), format='mixed'
    ).max().date()
    fim = min(date.today() - timedelta(days=om.DIAS_ATRASO_HISTORICO), ultimo_rotulo)
    print(f'  rótulo vai até {ultimo_rotulo}', flush=True)

    ordem = _ordem_espalhada(lugares)
    lugares = {nome: lugares[nome] for nome in ordem}
    print(f'  ordem por distância, começando em {ordem[0]}', flush=True)
    inicio = fim - timedelta(days=round(meses * 30.44)) - timedelta(days=FOLGA_PSE)
    print(f'Série de {inicio} a {fim} ({(fim - inicio).days + 1} dias)', flush=True)
    print(f'  destino: {ARQUIVO_SERIE}', flush=True)

    gravados, faltam = s.coletar(lugares, inicio, fim, ARQUIVO_SERIE)

    minutos = (time.perf_counter() - comeco) / 60
    print(f'\n{gravados} lugares gravados em {minutos:.1f} min', flush=True)

    if faltam:
        print(f'  faltam {len(faltam)} — rode de novo depois da renovação da cota')
        return 1

    tamanho = ARQUIVO_SERIE.stat().st_size / 1e6
    print(f'  arquivo: {tamanho:.1f} MB')
    print('  próximo passo: python montar_conjunto.py')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
