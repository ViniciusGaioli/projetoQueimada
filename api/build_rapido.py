"""Monta o conjunto de treino como o `build.py`, mas buscando o clima em lote.

O `build.py` pede ao Open-Meteo uma janela de 120 dias **para cada
município-mês**, um de cada vez. Como meses vizinhos do mesmo município
compartilham 90 dos 120 dias, ele baixa quase tudo quatro vezes, e espera uma
resposta de rede por vez: 47 mil idas à rede, cerca de 36 horas.

Aqui a série diária inteira de cada município vem de uma vez, e as janelas de
120 dias são recortadas dela na memória. Medido na API: 12 anos para uma
coordenada custam uma requisição de 1,5 s, e 25 coordenadas cabem na mesma
requisição. São ~26 requisições no lugar de 47 mil.

O `DiaSemChuva` vem do Open-Meteo nas **duas** classes. O BDQueimadas publica
uma contagem de dias inteiros, limitada a 120; a fórmula de período de secura
do INPE, aplicada à série do Open-Meteo, devolve um valor contínuo de 0 a 105.
Usar a coluna do BDQueimadas nos positivos e a fórmula nos negativos colocava
duas grandezas diferentes na mesma coluna, e o modelo aprendia a distinguir
qual das duas origens produziu a linha em vez de aprender clima. Aqui os
positivos também passam pela fórmula, com o mesmo dia de referência dos
negativos. Isso não custa requisição nenhuma: a série do município inteiro já
é baixada para os negativos, e os meses com fogo saem do mesmo cache.

As outras colunas dos positivos (`Precipitacao` e `RiscoFogo`) continuam vindo
do BDQueimadas, como pedido. Vale saber que `RiscoFogo` é calculado pelo INPE a
partir do `DiaSemChuva` *deles*, então depois da troca ele não corresponde mais
ao `DiaSemChuva` da mesma linha.

O resultado é o mesmo arquivo `out/out.csv`, com as mesmas colunas, os mesmos
filtros e as mesmas fórmulas. Duas diferenças, ambas deliberadas e pequenas:

1. A umidade vem de `relative_humidity_2m_mean`, a média diária que a própria
   API calcula, em vez da média das 24 leituras horárias. A API arredonda esse
   valor para inteiro, o que desloca o risco de fogo em cerca de 0,3%. Baixar
   12 anos de dados horários para 642 municípios seria inviável.
2. O progresso é gravado em disco a cada lote, então uma interrupção retoma de
   onde parou em vez de recomeçar.

Quem fala com a rede é o `openmeteo`: ele guarda as séries por coordenada,
responde por dia a partir do cache e se regula pelos cabeçalhos de cota da
própria API, esperando a renovação quando o saldo não cobre a próxima
requisição. Aqui só se decide o que pedir e o que fazer com o resultado — e o
que se grava em disco são as linhas prontas, que cabem em poucos megabytes.

Uso:
    python build_rapido.py [arquivo.csv] [--meses N]
    python build_rapido.py --corrigir out/out.csv

`--corrigir` não monta nada: pega um `out.csv` que já existe e só troca o
`DiaSemChuva` das linhas com fogo pelo valor do Open-Meteo, deixando os
negativos exatamente como estão. Serve para consertar um conjunto já coletado
sem recalcular o que nele já está certo.

`--meses` recorta o histórico aos N meses mais recentes. Serve para caber na
cota: o custo é proporcional a municípios × dias, e a cota gratuita do
Open-Meteo cobre cerca de 600 mil localidade-dias por dia. Com os 642
municípios do estado, 12 meses custam ~312 mil e cabem numa janela; os 150
meses completos custam 3 milhões e levam cerca de cinco dias.

A lista de municípios e o fator de vegetação continuam vindo da base inteira,
mesmo com o recorte — só os meses encolhem.
"""

import json
import os
import sys
import time
from datetime import date, datetime, timedelta
from pathlib import Path

import pandas as pd
import requests

import src.openmeteo as om
import src.queimada as q

# Coordenadas por requisição. O tamanho do lote não muda o tempo total: o teto
# de 600 chamadas por minuto do Open-Meteo fixa o piso, e um município com 12
# meses custa ~10,4 chamadas — os 642 levam ~11 min seja em lotes de 15 ou 50.
# Fica em 25 por ser um meio-termo: requisições menores que o teto do minuto e
# progresso gravado com frequência razoável.
MUNICIPIOS_POR_LOTE = 25

PASTA_SAIDA = Path(__file__).resolve().parent / 'out'
ARQUIVO_PARCIAL = PASTA_SAIDA / 'out.parcial.json'

# Versão do arquivo parcial. Subiu para 2 quando os positivos passaram a ter
# período de secura calculado: um parcial da versão 1 não tem esse dado.
FORMATO_PARCIAL = 2


def carregar_focos(arquivo):
    """Positivos: os município-mês que o BDQueimadas registrou com foco.

    Os filtros e agregações são os mesmos do `build.py`, na mesma ordem.
    """
    df = pd.read_csv(arquivo, encoding='utf-8-sig')

    df = df.drop(columns=['Satelite', 'Pais', 'Estado', 'FRP', 'Latitude', 'Longitude'])
    df = df[df['Bioma'].isin(['Mata Atlântica', 'Cerrado'])]
    df['Bioma'] = df['Bioma'].map({'Mata Atlântica': 1.7, 'Cerrado': 3})
    df = df[df['DiaSemChuva'] >= 0]
    df = df[df['RiscoFogo'] >= 0]

    # Alguns arquivos do portal trazem um BOM solto no meio dos dados, o que
    # impede a conversão de data.
    for coluna in ('DataHora', 'Municipio'):
        df[coluna] = df[coluna].astype(str).str.replace('﻿', '', regex=False).str.strip()

    df['DataHora'] = pd.to_datetime(df['DataHora'], format='mixed')

    df['Data_Temp'] = df['DataHora'].dt.date
    df = df.drop_duplicates(subset=['Data_Temp', 'Municipio'], keep='first')
    df = df.drop(columns=['Data_Temp'])

    df['DataHora'] = df['DataHora'].dt.to_period('M').astype(str)
    df = df.groupby(['DataHora', 'Municipio']).mean().reset_index()
    df = df.sort_values(by=['Municipio', 'DataHora']).reset_index(drop=True)
    df['Fogo'] = 1

    return df


def localizar(municipios):
    """Coordenada de cada município, pela geocodificação do Open-Meteo.

    É a mesma fonte que o `build.py` usa, para que as duas saídas sejam
    comparáveis. Municípios não encontrados são devolvidos à parte.
    """
    coordenadas = {}
    ausentes = []

    for ordem, nome in enumerate(municipios, 1):
        try:
            local = om.buscar_cidade(nome)
            coordenadas[nome] = (local['latitude'], local['longitude'])
        except (om.CidadeNaoEncontrada, requests.exceptions.RequestException) as erro:
            ausentes.append((nome, str(erro)[:60]))

        if ordem % 50 == 0:
            print(f'  geocodificados {ordem}/{len(municipios)}', flush=True)

    return coordenadas, ausentes


def _secura_do_mes(mes, latitude, longitude):
    """Período de secura do INPE no primeiro dia de `mes`, ou None sem dados.

    É o mesmo dia de referência que os negativos usam. Ter positivos e
    negativos medidos no mesmo ponto do mês é o que torna a coluna comparável
    entre as duas classes.
    """
    dia = datetime.strptime(mes, '%Y-%m').date()
    clima = om.obter_dados_clima_coord(dia, latitude, longitude)
    precs = {chave: valor for chave, valor in clima.items() if chave.startswith('prec')}

    if any(valor is None for valor in precs.values()):
        return None, clima

    return q.periodo_de_secura(precs), clima


def _lotes(sequencia, tamanho):
    for inicio in range(0, len(sequencia), tamanho):
        yield sequencia[inicio : inicio + tamanho]


def _carregar_parcial():
    """Progresso em disco: linhas dos negativos e secura dos positivos.

    O formato é versionado porque um parcial antigo guardava só os negativos;
    aproveitá-lo deixaria os positivos sem secura calculada e a troca passaria
    em branco, sem erro.
    """
    vazio = {'negativos': {}, 'secura': {}}

    if not ARQUIVO_PARCIAL.exists():
        return vazio

    with ARQUIVO_PARCIAL.open(encoding='utf-8') as parcial:
        dados = json.load(parcial)

    if dados.get('formato') != FORMATO_PARCIAL:
        print('  parcial em formato antigo; recomeçando a coleta', flush=True)
        return vazio

    return {'negativos': dados['negativos'], 'secura': dados['secura']}


def _gravar_parcial(resultados):
    PASTA_SAIDA.mkdir(parents=True, exist_ok=True)
    temporario = ARQUIVO_PARCIAL.with_suffix('.tmp')

    with temporario.open('w', encoding='utf-8') as parcial:
        json.dump({'formato': FORMATO_PARCIAL, **resultados}, parcial)

    temporario.replace(ARQUIVO_PARCIAL)


def _argumentos():
    """Lê `[arquivo] [--meses N]` sem depender de biblioteca de linha de comando."""
    arquivo = 'bdqueimadas.csv'
    meses = None
    restantes = sys.argv[1:]

    if '--meses' in restantes:
        posicao = restantes.index('--meses')
        meses = int(restantes[posicao + 1])
        restantes = restantes[:posicao] + restantes[posicao + 2 :]

    if restantes:
        arquivo = restantes[0]

    return arquivo, meses


def _coletar(coordenadas, sem_foco, com_foco, vegetacao, inicio, fim):
    """Roda os lotes e devolve (resultados, sem_clima, sem_clima_positivo, completo).

    `completo=False` significa que a cota acabou no meio; o progresso já está
    em disco e rodar de novo continua daqui.

    Chamar com `sem_foco={}` calcula só o período de secura dos meses com fogo,
    que é o que o modo `--corrigir` precisa.
    """
    resultados = _carregar_parcial()
    if resultados['secura']:
        print(f'  retomando: {len(resultados["secura"])} municípios já processados', flush=True)

    pendentes = [nome for nome in coordenadas if nome not in resultados['secura']]
    lotes = list(_lotes(pendentes, MUNICIPIOS_POR_LOTE))
    print(f'  {len(pendentes)} municípios em {len(lotes)} requisições', flush=True)

    sem_clima = 0
    sem_clima_positivo = 0

    for ordem, lote in enumerate(lotes, 1):
        # Uma requisição para o lote inteiro; depois dela, cada mês sai do cache
        # do openmeteo sem tocar na rede.
        try:
            om.preparar_series_lote([coordenadas[n] for n in lote], inicio, fim)
        except om.CotaEsgotada as erro:
            print(f'\n{erro}', flush=True)
            print(f'  progresso salvo: {len(resultados["secura"])}/{len(coordenadas)} municípios', flush=True)
            print('  rode de novo depois da renovação para continuar daqui', flush=True)
            return resultados, sem_clima, sem_clima_positivo, False

        for nome in lote:
            latitude, longitude = coordenadas[nome]
            linhas = []

            for mes in sem_foco.get(nome, []):
                pse, clima = _secura_do_mes(mes, latitude, longitude)

                if pse is None or clima['umidade'] is None or clima['temperatura'] is None:
                    sem_clima += 1
                    continue

                veg = vegetacao[nome]
                rf = q.risco_fogo(veg, pse, clima['umidade'], clima['temperatura'])

                linhas.append([mes, nome, veg, pse, clima['precipitacao'], rf, 0])

            # Os meses com fogo saem do mesmo cache, sem requisição nova: só o
            # período de secura, que vai substituir a contagem do BDQueimadas.
            secura = {}
            for mes in sorted(com_foco.get(nome, ())):
                pse, _ = _secura_do_mes(mes, latitude, longitude)
                if pse is None:
                    sem_clima_positivo += 1
                    continue
                secura[mes] = pse

            resultados['negativos'][nome] = linhas
            resultados['secura'][nome] = secura

        _gravar_parcial(resultados)

        restante = om.cota().get('restante')
        sobra = f' | cota restante: {restante:.0f}' if restante is not None else ''
        feitos = len(resultados['secura'])
        print(f'  [{ordem}/{len(lotes)}] {feitos}/{len(coordenadas)} municípios{sobra}', flush=True)

    return resultados, sem_clima, sem_clima_positivo, True


def _trocar_secura(df, secura):
    """Troca o DiaSemChuva dos positivos pelo período de secura do Open-Meteo.

    Linha sem secura calculada é descartada em vez de manter o valor do
    BDQueimadas: manter reintroduziria, em silêncio, as duas grandezas na mesma
    coluna — exatamente o que esta troca existe para desfazer.

    Devolve (df, descartados).
    """
    valores = [
        secura.get(municipio, {}).get(mes)
        for municipio, mes in zip(df['Municipio'], df['DataHora'])
    ]

    df = df.copy()
    df['DiaSemChuva'] = pd.Series(valores, index=df.index, dtype='float64')
    antes = len(df)
    df = df.dropna(subset=['DiaSemChuva']).reset_index(drop=True)

    return df, antes - len(df)


def corrigir(caminho):
    """Troca o DiaSemChuva dos positivos de um out.csv que já existe.

    Não recalcula nada dos negativos: eles já vêm do Open-Meteo e ficam byte a
    byte como estavam. O original é copiado para `.anterior.csv` antes da
    escrita.
    """
    caminho = Path(caminho)
    if not caminho.exists():
        print(f'{caminho} não existe!')
        return 1

    comeco = time.perf_counter()

    saida = pd.read_csv(caminho)
    positivos = saida['Fogo'] == 1
    com_foco = saida[positivos].groupby('Municipio')['DataHora'].apply(set).to_dict()
    meses = sorted(saida['DataHora'].unique())

    print(f'{caminho}: {len(saida):,} linhas | {positivos.sum():,} com fogo', flush=True)
    print(f'  {len(com_foco)} municípios | {meses[0]} a {meses[-1]}', flush=True)

    print('Geocodificando municípios...', flush=True)
    coordenadas, ausentes = localizar(sorted(com_foco))
    print(f'  {len(coordenadas)} localizados, {len(ausentes)} não encontrados', flush=True)

    primeiro = datetime.strptime(meses[0], '%Y-%m').date()
    ultimo = datetime.strptime(meses[-1], '%Y-%m').date()
    inicio = primeiro - timedelta(days=max(om.PERIODOS_PRECIPITACAO) + 1)
    fim = min(ultimo, date.today() - timedelta(days=om.DIAS_ATRASO_HISTORICO))
    print(f'Baixando séries de {inicio} a {fim}...', flush=True)

    resultados, _, sem_clima, completo = _coletar(coordenadas, {}, com_foco, {}, inicio, fim)
    if not completo:
        return 1

    trocados, descartados = _trocar_secura(saida[positivos], resultados['secura'])
    nova = pd.concat([trocados, saida[~positivos]], ignore_index=True)
    nova = nova.sort_values(by=['Municipio', 'DataHora']).reset_index(drop=True)

    anterior = caminho.with_suffix('.anterior.csv')
    saida.to_csv(anterior, index=False)
    nova.to_csv(caminho, index=False)
    ARQUIVO_PARCIAL.unlink(missing_ok=True)

    print(f'\nConcluído em {(time.perf_counter() - comeco) / 60:.1f} min', flush=True)
    print(f'  {int(positivos.sum()) - descartados:,} positivos com DiaSemChuva do Open-Meteo')
    print(f'  {descartados:,} positivos descartados por não ter secura ({sem_clima:,} meses sem clima)')
    print(f'  {int((~positivos).sum()):,} negativos intocados')
    print(f'  original em {anterior}')
    print(f'  salvo em {caminho}')
    return 0


def main():
    if '--corrigir' in sys.argv:
        return corrigir(sys.argv[sys.argv.index('--corrigir') + 1])

    arquivo, limite_meses = _argumentos()

    if not os.path.exists(arquivo):
        print(f'{arquivo} não existe!')
        return 1

    comeco = time.perf_counter()

    print(f'Lendo {arquivo}...', flush=True)
    df = carregar_focos(arquivo)

    # Municípios e vegetação saem da base inteira: o recorte é de tempo, não de
    # lugar, e um município sem foco na janela escolhida continua existindo.
    municipios = sorted(df['Municipio'].unique())
    vegetacao = df.groupby('Municipio')['Bioma'].mean().to_dict()

    meses = pd.date_range(start=df['DataHora'].min(), end=df['DataHora'].max(), freq='MS')
    meses = meses.strftime('%Y-%m').tolist()

    if limite_meses:
        meses = meses[-limite_meses:]
        # Os positivos precisam encolher junto, senão o conjunto ficaria com 12
        # anos de meses com fogo contra um ano de meses sem.
        df = df[df['DataHora'].isin(meses)].reset_index(drop=True)
        print(f'  recorte: últimos {limite_meses} meses ({meses[0]} a {meses[-1]})', flush=True)

    com_foco = df.groupby('Municipio')['DataHora'].apply(set).to_dict()

    sem_foco = {
        nome: [mes for mes in meses if mes not in com_foco.get(nome, set())] for nome in municipios
    }
    faltantes = sum(len(meses_sem) for meses_sem in sem_foco.values())

    print(f'  {len(df):,} positivos | {len(municipios)} municípios × {len(meses)} meses', flush=True)
    print(f'  {faltantes:,} negativos a calcular ({meses[0]} a {meses[-1]})', flush=True)

    print('Geocodificando municípios...', flush=True)
    coordenadas, ausentes = localizar(municipios)
    print(f'  {len(coordenadas)} localizados, {len(ausentes)} não encontrados', flush=True)

    # A janela de 120 dias do mês mais antigo começa antes dele.
    primeiro = datetime.strptime(meses[0], '%Y-%m').date()
    ultimo = datetime.strptime(meses[-1], '%Y-%m').date()
    inicio = primeiro - timedelta(days=max(om.PERIODOS_PRECIPITACAO) + 1)
    fim = min(ultimo, date.today() - timedelta(days=om.DIAS_ATRASO_HISTORICO))

    print(f'Baixando séries de {inicio} a {fim}...', flush=True)
    resultados, sem_clima, sem_clima_positivo, completo = _coletar(
        coordenadas, sem_foco, com_foco, vegetacao, inicio, fim
    )
    if not completo:
        return 1

    df, descartados = _trocar_secura(df, resultados['secura'])

    novas = [linha for linhas in resultados['negativos'].values() for linha in linhas]

    saida = pd.concat([df, pd.DataFrame(novas, columns=df.columns)], ignore_index=True)
    saida = saida.sort_values(by=['Municipio', 'DataHora']).reset_index(drop=True)

    PASTA_SAIDA.mkdir(parents=True, exist_ok=True)
    saida.to_csv(PASTA_SAIDA / 'out.csv', index=False)
    ARQUIVO_PARCIAL.unlink(missing_ok=True)

    minutos = (time.perf_counter() - comeco) / 60
    print(f'\nConcluído em {minutos:.1f} min', flush=True)
    print(f'  {len(saida):,} linhas  ({int(saida["Fogo"].sum()):,} com fogo, {int((saida["Fogo"] == 0).sum()):,} sem)')
    print(f'  {sem_clima:,} negativos descartados por clima incompleto')
    print(f'  {descartados:,} positivos descartados por não ter secura '
          f'({sem_clima_positivo:,} meses com fogo sem clima)')

    if ausentes:
        print(f'  {len(ausentes)} municípios sem coordenada:')
        for nome, motivo in ausentes[:10]:
            print(f'    - {nome}: {motivo}')

    print(f'  salvo em {PASTA_SAIDA / "out.csv"}')

    return 0


if __name__ == '__main__':
    raise SystemExit(main())
