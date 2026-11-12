"""Grade de risco sobre o estado de São Paulo.

Monta uma grade regular de células dentro do contorno do estado, busca o clima
ao vivo de todas elas no Open-Meteo em poucas requisições em lote e devolve a
predição do modelo para cada célula de uma vez só.

O Open-Meteo aceita várias coordenadas numa mesma chamada (latitude e longitude
separadas por vírgula) e responde com uma lista na mesma ordem. É o que torna a
grade viável: ~500 células saem em ~10 requisições em vez de 500.

A predição é feita em um único `predict_proba` com a grade inteira. O modelo é um
GaussianProcessClassifier, cujo custo por ponto cresce com o conjunto de treino,
então chamar ponto a ponto seria inviável.
"""

import json
import time
from datetime import date, datetime, timedelta
from functools import lru_cache
from pathlib import Path

import requests

import openmeteo as om
import queimada as qm

ARQUIVO_MALHA = Path(__file__).with_name('sao-paulo.geojson')

# Lado da célula em graus. 0.2° ≈ 22 km no centro do estado, ou 538 células.
PASSO_PADRAO = 0.2

# Recortes disponíveis. Cada um define o seu próprio passo, porque aproximar só
# faz sentido se as células também encolherem — um zoom com células de 22 km
# seria a mesma imagem, maior.
#
# `limites` é (lat_min, long_min, lat_max, long_max), ou None para o estado
# inteiro. A célula continua precisando cair dentro de São Paulo: a grade não
# vaza para Minas só porque a caixa do recorte encosta na divisa.
REGIOES = {
    'estado': {
        'nome': 'São Paulo',
        'passo': PASSO_PADRAO,
        'limites': None,
    },
    # A Serra da Paulista é a borda paulista do maciço vulcânico de Poços de
    # Caldas, e o maciço atravessa a divisa com Minas. Os limites abaixo saem de
    # relevo medido, não de palpite: amostramos a altitude de 934 pontos pela API
    # de elevação do Open-Meteo e o terreno acima de 1.000 m se concentra aqui,
    # com o ponto mais alto em 1.536 m (-21.79, -46.65). A sede de Águas da Prata
    # está a 1.232 m; a de São João da Boa Vista, no vale, a 770 m.
    #
    # `so_sao_paulo` é False porque recortar o maciço na linha da divisa mostraria
    # dois terços dele: 40% das células da caixa estão em Minas.
    'serra': {
        'nome': 'Serra da Paulista',
        'passo': 0.025,
        'limites': (-22.12, -46.92, -21.68, -46.48),
        'so_sao_paulo': False,
    },
}

REGIAO_PADRAO = 'estado'

# Coordenadas por requisição ao Open-Meteo. 100 coordenadas com 120 dias de
# histórico respondem em ~2s e ~300 KB; valores muito acima disso esticam a URL.
MAX_COORDENADAS_POR_LOTE = 100

# Cota do Open-Meteo gratuito: 600/min, 5.000/hora, 10.000/dia.
#
# Uma requisição NÃO custa uma chamada. A documentação diz que pedidos acima de
# 2 semanas contam como várias ("4 weeks of data equals 3.0 API calls"), e as
# nossas pedem 120 dias — cerca de 12 chamadas por localidade. O custo por
# coordenada num pedido multi-local não é documentado, mas medimos: com 100
# coordenadas por requisição, poucas requisições esgotam o teto HORÁRIO, e o
# servidor responde "Hourly API request limit exceeded".
#
# Daí o espaçamento entre requisições, o retry com espera longa e, sobretudo, o
# cache: o limite que nos atinge é o da hora, não o do dia, então ele se
# recompõe sozinho e a próxima volta do aquecedor costuma passar.
INTERVALO_ENTRE_REQUISICOES = 20
MAX_TENTATIVAS = 5
ESPERA_APOS_EXCESSO = 70

PASTA_CACHE = Path(__file__).resolve().parents[1] / 'out' / 'cache'

# Bioma 2.5 = média entre 2 e 3, que são os fatores de vegetação predominantes
# na mata atlântica e no cerrado, respectivamente. Mesma constante usada na
# predição por ponto, em `api.py`.
VEGETACAO_PADRAO = 2.5


class ClimaIndisponivel(RuntimeError):
    """O Open-Meteo não respondeu para um dos lotes da grade."""


def _aneis_do_estado():
    """Anéis externos de cada polígono do contorno, como listas de (long, lat)."""
    with ARQUIVO_MALHA.open(encoding='utf-8') as arquivo:
        malha = json.load(arquivo)

    aneis = []
    for feicao in malha['features']:
        geometria = feicao['geometry']
        poligonos = (
            geometria['coordinates']
            if geometria['type'] == 'MultiPolygon'
            else [geometria['coordinates']]
        )
        # [0] é o anel externo; os seguintes seriam buracos, que a malha não tem.
        aneis.extend(poligono[0] for poligono in poligonos)

    return aneis


def _dentro_do_estado(longitude, latitude, aneis):
    """Ray casting: conta cruzamentos de um raio horizontal com as arestas."""
    dentro = False

    for anel in aneis:
        for (x1, y1), (x2, y2) in zip(anel, anel[1:] + anel[:1]):
            # A aresta cruza a altura do ponto?
            if (y1 > latitude) == (y2 > latitude):
                continue
            # Onde ela cruza, em longitude?
            cruzamento = x1 + (latitude - y1) * (x2 - x1) / (y2 - y1)
            if longitude < cruzamento:
                dentro = not dentro

    return dentro


def limites_do_estado():
    """Caixa envolvente do contorno: (long_min, lat_min, long_max, lat_max)."""
    pontos = [ponto for anel in _aneis_do_estado() for ponto in anel]
    longitudes = [ponto[0] for ponto in pontos]
    latitudes = [ponto[1] for ponto in pontos]

    return min(longitudes), min(latitudes), max(longitudes), max(latitudes)


def limites_da_regiao(regiao):
    """Caixa do recorte: (long_min, lat_min, long_max, lat_max)."""
    limites = REGIOES[regiao]['limites']

    if limites is None:
        return limites_do_estado()

    lat_min, long_min, lat_max, long_max = limites
    return long_min, lat_min, long_max, lat_max


@lru_cache(maxsize=8)
def montar_grade(passo=PASSO_PADRAO, limites=None, so_sao_paulo=True):
    """Centros das células dentro de `limites` (e, se pedido, dentro de SP).

    `limites` é (lat_min, long_min, lat_max, long_max) ou None.

    `so_sao_paulo=False` serve para recortes regionais cujo acidente geográfico
    não respeita a divisa estadual. O clima vem do Open-Meteo em qualquer lugar
    e as features do modelo são todas climáticas, então a predição fora de São
    Paulo é tão válida (ou tão frágil) quanto dentro.

    Retorno: tupla de {"latitude": float, "longitude": float}, de norte a sul.
    """
    aneis = _aneis_do_estado() if so_sao_paulo else None

    if limites is None:
        long_min, lat_min, long_max, lat_max = limites_do_estado()
    else:
        lat_min, long_min, lat_max, long_max = limites

    # Os centros ficam em múltiplos de `passo` deslocados de meio passo, para que
    # a grade seja estável: mudar o recorte não desloca as células já calculadas.
    def inicio(valor):
        return (valor // passo) * passo + passo / 2

    celulas = []
    latitude = inicio(lat_max)
    while latitude >= lat_min:
        longitude = inicio(long_min)
        while longitude <= long_max:
            if aneis is None or _dentro_do_estado(longitude, latitude, aneis):
                celulas.append(
                    {'latitude': round(latitude, 4), 'longitude': round(longitude, 4)}
                )
            longitude += passo
        latitude -= passo

    return tuple(celulas)


def _lotes(sequencia, tamanho):
    """Fatia `sequencia` em pedaços de até `tamanho` itens."""
    for inicio in range(0, len(sequencia), tamanho):
        yield sequencia[inicio : inicio + tamanho]


def _requisitar_lote(url, inicio, fim, celulas, horario=None):
    """Uma chamada ao Open-Meteo com todas as coordenadas do lote.

    Retorna a lista de respostas, na mesma ordem de `celulas`.
    """
    params = {
        'latitude': ','.join(str(celula['latitude']) for celula in celulas),
        'longitude': ','.join(str(celula['longitude']) for celula in celulas),
        'start_date': inicio.isoformat(),
        'end_date': fim.isoformat(),
        'daily': 'precipitation_sum,temperature_2m_mean',
        'timezone': 'auto',
    }
    if horario:
        params['hourly'] = horario

    for tentativa in range(MAX_TENTATIVAS):
        try:
            resposta = requests.get(url, params=params, timeout=120)
            resposta.raise_for_status()
            break
        except requests.exceptions.RequestException as erro:
            ultima = tentativa == MAX_TENTATIVAS - 1
            if ultima:
                raise ClimaIndisponivel(f'Open-Meteo não respondeu: {erro}') from erro

            # 429 é cota por minuto estourada: só o tempo resolve.
            excedeu = getattr(erro.response, 'status_code', None) == 429
            espera = ESPERA_APOS_EXCESSO if excedeu else 2 ** (tentativa + 1)
            print(f'  Open-Meteo recusou ({erro}); nova tentativa em {espera}s')
            time.sleep(espera)

    dados = resposta.json()

    # Com uma única coordenada a API responde um objeto, não uma lista.
    if isinstance(dados, dict):
        dados = [dados]

    if len(dados) != len(celulas):
        raise ClimaIndisponivel(
            f'Open-Meteo devolveu {len(dados)} localidades para {len(celulas)} células.'
        )

    return dados


def _trechos(dia, periodos):
    """Divide a janela de histórico entre o arquivo histórico e a previsão.

    Mesma regra de `openmeteo.obter_dados_clima_coord`: o arquivo histórico tem
    alguns dias de atraso, então as datas mais recentes vêm da API de previsão.
    """
    inicio = dia - timedelta(days=max(periodos))
    limite = date.today() - timedelta(days=om.DIAS_ATRASO_HISTORICO)

    if dia <= limite:
        return [(om.URL_HISTORICO, inicio, dia)]

    if inicio > limite:
        return [(om.URL_PREVISAO, inicio, dia)]

    return [
        (om.URL_HISTORICO, inicio, limite),
        (om.URL_PREVISAO, limite + timedelta(days=1), dia),
    ]


def _consolidar(dados, dia, periodos):
    """Converte a resposta de uma célula no mesmo formato de `openmeteo`."""
    precipitacao = {}
    temperatura = {}
    valores_umidade = []

    for resposta, pede_umidade in dados:
        diario = resposta['daily']
        for texto, prec, temp in zip(
            diario['time'], diario['precipitation_sum'], diario['temperature_2m_mean']
        ):
            momento = date.fromisoformat(texto)
            precipitacao[momento] = prec
            temperatura[momento] = temp

        if pede_umidade and 'hourly' in resposta:
            horas = resposta['hourly']
            valores_umidade = [
                valor
                for texto, valor in zip(horas['time'], horas['relative_humidity_2m'])
                if texto.startswith(dia.isoformat()) and valor is not None
            ]

    clima = {
        'data': dia,
        # Vem de graça na resposta do Open-Meteo e é a informação mais relevante
        # num recorte de serra: 800 metros de desnível mudam tudo.
        'altitude': dados[0][0].get('elevation') if dados else None,
        'precipitacao': precipitacao.get(dia),
        'temperatura': temperatura.get(dia),
        'umidade': (
            sum(valores_umidade) / len(valores_umidade) if valores_umidade else None
        ),
    }

    # precN = média dos N dias anteriores (o próprio `dia` não entra)
    for n in periodos:
        valores = [precipitacao.get(dia - timedelta(days=i)) for i in range(1, n + 1)]
        valores = [valor for valor in valores if valor is not None]
        clima[f'prec{n}'] = sum(valores) / len(valores) if valores else None

    return clima


def _chave(celula):
    """Identificador estável de uma célula dentro de um arquivo de cache."""
    return f"{celula['latitude']},{celula['longitude']}"


def _resumir(celula, clima, vegetacao):
    """Converte o clima bruto de uma célula na linha final da grade.

    Devolve `None` quando o Open-Meteo não trouxe tudo o que as fórmulas do
    INPE precisam — a célula é descartada, mas fica registrada no cache parcial
    para não ser pedida de novo.
    """
    if clima['umidade'] is None or clima['temperatura'] is None:
        return None

    precs = {chave: valor for chave, valor in clima.items() if chave.startswith('prec')}
    if any(valor is None for valor in precs.values()):
        return None

    pse = qm.periodo_de_secura(precs)
    risco = qm.risco_fogo(vegetacao, pse, clima['umidade'], clima['temperatura'])

    return {
        'latitude': celula['latitude'],
        'longitude': celula['longitude'],
        'altitude': round(clima['altitude']) if clima.get('altitude') is not None else None,
        'periodo_de_secura': round(pse, 2),
        'risco_fogo': round(risco, 4),
        'precipitacao': round(clima['precipitacao'] or 0, 2),
        'temperatura': round(clima['temperatura'], 1),
        'umidade': round(clima['umidade'], 1),
    }


def _buscar_lote(dia, lote, trechos, periodos, primeira):
    """Clima de um lote de células, uma requisição por trecho de data."""
    respostas = [[] for _ in lote]

    for ordem, (url, inicio, fim) in enumerate(trechos):
        # Espaça REQUISIÇÕES, não lotes: cada uma é cara (100 coordenadas ×
        # 120 dias) e disparar os dois trechos colados concentrava o custo em
        # poucos segundos.
        if not (primeira and ordem == 0):
            time.sleep(INTERVALO_ENTRE_REQUISICOES)

        # A umidade horária só é pedida no trecho que contém o próprio `dia`.
        pede_umidade = fim == dia
        horario = 'relative_humidity_2m' if pede_umidade else None

        for indice, dados in enumerate(_requisitar_lote(url, inicio, fim, lote, horario)):
            respostas[indice].append((dados, pede_umidade))

    return [_consolidar(dados, dia, periodos) for dados in respostas]


def _arquivo_de_cache(regiao, passo, dia):
    return PASTA_CACHE / f'clima-{regiao}-{passo}-{dia.isoformat()}.json'


def _arquivo_parcial(regiao, passo, dia):
    return PASTA_CACHE / f'clima-{regiao}-{passo}-{dia.isoformat()}.parcial.json'


def _ler_json(arquivo):
    if not arquivo.exists():
        return None
    with arquivo.open(encoding='utf-8') as conteudo:
        return json.load(conteudo)


def _gravar_json(arquivo, dados):
    PASTA_CACHE.mkdir(parents=True, exist_ok=True)
    # Grava num temporário e troca: uma interrupção no meio nunca deixa um
    # arquivo de cache pela metade, que seria lido como válido depois.
    temporario = arquivo.with_suffix('.tmp')
    with temporario.open('w', encoding='utf-8') as conteudo:
        json.dump(dados, conteudo)
    temporario.replace(arquivo)


def calcular_grade_em_cache(dia, regiao=REGIAO_PADRAO, vegetacao=VEGETACAO_PADRAO,
                            periodos=om.PERIODOS_PRECIPITACAO):
    """Grade de clima, período de secura e risco de fogo, com cache em disco.

    O clima diário muda uma vez por dia e cada montagem custa caro na cota do
    Open-Meteo, então o resultado é reaproveitado o dia todo. Cada lote é
    gravado assim que chega: se a cota estourar no meio, a próxima execução
    retoma de onde parou em vez de refazer — e de pagar — tudo de novo.
    """
    passo = REGIOES[regiao]['passo']
    limites = REGIOES[regiao]['limites']

    pronto = _ler_json(_arquivo_de_cache(regiao, passo, dia))
    if pronto is not None:
        return pronto

    celulas = montar_grade(passo, limites, REGIOES[regiao].get('so_sao_paulo', True))
    parcial = _ler_json(_arquivo_parcial(regiao, passo, dia)) or {}
    faltantes = [celula for celula in celulas if _chave(celula) not in parcial]

    if faltantes:
        trechos = _trechos(dia, periodos)
        lotes = list(_lotes(faltantes, MAX_COORDENADAS_POR_LOTE))

        print(
            f'  [{regiao}] clima de {len(faltantes)} células em '
            f'{len(lotes) * len(trechos)} requisições'
            + (f'; {len(parcial)} já em cache parcial' if parcial else '')
        )

        for ordem, lote in enumerate(lotes):
            climas = _buscar_lote(dia, lote, trechos, periodos, primeira=not parcial and ordem == 0)

            for celula, clima in zip(lote, climas):
                parcial[_chave(celula)] = _resumir(celula, clima, vegetacao)

            _gravar_json(_arquivo_parcial(regiao, passo, dia), parcial)
            print(f'  [{regiao}] {len(parcial)}/{len(celulas)} células, lote {ordem + 1}/{len(lotes)}')

    grade = [parcial[_chave(c)] for c in celulas if parcial.get(_chave(c)) is not None]

    _gravar_json(_arquivo_de_cache(regiao, passo, dia), grade)
    _arquivo_parcial(regiao, passo, dia).unlink(missing_ok=True)

    return grade


def _caches_disponiveis(regiao):
    """Caches já gravados da região, do mais recente para o mais antigo.

    Retorno: lista de `(data, passo, caminho)`.
    """
    if not PASTA_CACHE.exists():
        return []

    # O nome é clima-<regiao>-<passo>-AAAA-MM-DD.json
    encontrados = []
    for caminho in PASTA_CACHE.glob(f'clima-{regiao}-*.json'):
        if caminho.name.endswith('.parcial.json'):
            continue

        partes = caminho.stem.split('-')
        if len(partes) != 6:
            continue

        try:
            passo = float(partes[2])
            data = date.fromisoformat('-'.join(partes[3:6]))
        except ValueError:
            continue

        encontrados.append((data, passo, caminho))

    return sorted(encontrados, key=lambda item: item[0], reverse=True)


def _melhor_cache(regiao, passo):
    """O cache gravado mais próximo do que se pediu, ou `None`.

    Preferência: o mesmo passo antes de outro passo, e o dia mais recente
    antes. Retorno: `(grade, data, passo)`.
    """
    disponiveis = _caches_disponiveis(regiao)

    for mesmo_passo in (True, False):
        for data, passo_gravado, caminho in disponiveis:
            if (passo_gravado == passo) != mesmo_passo:
                continue

            guardada = _ler_json(caminho)
            if guardada:
                return guardada, data, passo_gravado

    return None


def grade_mais_recente(dia, regiao=REGIAO_PADRAO, vegetacao=VEGETACAO_PADRAO, montar=True):
    """A grade de `dia` para a região, ou a melhor alternativa já em cache.

    **O caminho da requisição não monta a grade.** Montar leva minutos e pode
    esbarrar na cota do Open-Meteo, e fazer um visitante esperar por isso — ou
    pela escada de retentativas até desistir — é pior do que entregar na hora o
    clima de ontem, dizendo o que ele está vendo. Montar é trabalho do aquecedor
    (`aquecer.py --vigiar`), que roda à parte.

    `montar=True` só entra em ação quando não existe cache nenhum da região, no
    primeiro uso de uma instalação, para que a página funcione antes do primeiro
    ciclo do aquecedor.

    Retorno: `(grade, data_usada, passo_usado)`.
    """
    passo = REGIOES[regiao]['passo']

    pronto = _ler_json(_arquivo_de_cache(regiao, passo, dia))
    if pronto is not None:
        return pronto, dia, passo

    alternativa = _melhor_cache(regiao, passo)
    if alternativa is not None:
        _, data, passo_gravado = alternativa
        print(f'  [{regiao}] sem grade de {dia} em {passo}°; servindo {data} em {passo_gravado}°')
        return alternativa

    if not montar:
        raise ClimaIndisponivel(f'Nenhuma grade em cache para {regiao}.')

    print(f'  [{regiao}] nenhum cache disponível; montando agora')
    return calcular_grade_em_cache(dia, regiao, vegetacao), dia, passo


def prever_grade(modelo, scaler, dia, regiao=REGIAO_PADRAO, vegetacao=VEGETACAO_PADRAO):
    """Grade da região com a probabilidade de incêndio prevista por célula.

    `modelo` e `scaler` são os objetos já carregados; a predição é um único
    `predict_proba` com a grade inteira.

    Se o clima de `dia` não estiver pronto, serve o melhor cache disponível e
    sinaliza em `defasado`.
    """
    grade, data_usada, passo_usado = grade_mais_recente(dia, regiao, vegetacao)

    if not grade:
        raise ClimaIndisponivel('Nenhuma célula da grade tem clima utilizável.')

    entradas = [
        [
            vegetacao,
            celula['periodo_de_secura'],
            celula['precipitacao'],
            celula['risco_fogo'],
        ]
        for celula in grade
    ]

    probabilidades = modelo.predict_proba(scaler.transform(entradas))

    for celula, probabilidade in zip(grade, probabilidades):
        celula['probabilidade_de_incendio'] = round(float(probabilidade[1]), 4)

    long_min, lat_min, long_max, lat_max = limites_da_regiao(regiao)

    return {
        'regiao': regiao,
        'nome_da_regiao': REGIOES[regiao]['nome'],
        'data': data_usada.isoformat(),
        # Só a data: um passo diferente do pedido já aparece em `passo`, e
        # chamar isso de defasagem confundiria quem lê.
        'defasado': data_usada != dia,
        'gerado_em': datetime.now().astimezone().isoformat(timespec='seconds'),
        'passo': passo_usado,
        'limites': {
            'longitude_min': round(long_min, 4),
            'latitude_min': round(lat_min, 4),
            'longitude_max': round(long_max, 4),
            'latitude_max': round(lat_max, 4),
        },
        'celulas': grade,
    }


# --- Simulação manual -------------------------------------------------------
#
# O custo de um `predict_proba` é quase todo fixo: 1 linha leva ~780 ms e 200
# levam ~1,1 s, porque o trabalho pesado é o kernel contra os 6.416 pontos de
# treino. Então pedir a curva de resposta inteira do modelo sai praticamente de
# graça — e é ela que deixa o formulário parecer instantâneo, porque o front lê
# o valor na curva enquanto o usuário arrasta, sem ir à rede.

# Faixas dos controles: (mínimo, máximo). Saem do que o modelo viu no treino,
# alargadas para o usuário poder empurrar até o absurdo e ver o que acontece.
FAIXAS_SIMULACAO = {
    'bioma': (1.7, 3.0),
    'dias_sem_chuva': (0, 120),
    'precipitacao': (0, 50),
    'umidade': (10, 100),
    'temperatura': (0, 45),
}

PONTOS_POR_CURVA = 41


def _entrada_do_modelo(parametros, vegetacao):
    """Vetor de features na ordem em que o modelo foi treinado."""
    risco = qm.risco_fogo(
        vegetacao,
        parametros['dias_sem_chuva'],
        parametros['umidade'],
        parametros['temperatura'],
    )

    return [vegetacao, parametros['dias_sem_chuva'], parametros['precipitacao'], risco], risco


def simular(modelo, scaler, parametros):
    """Probabilidade para um conjunto de condições, mais as curvas de resposta.

    `parametros` traz bioma, dias_sem_chuva, precipitacao, umidade e temperatura.

    Retorno: a predição do ponto pedido e, para cada variável, a curva de como a
    probabilidade responde quando só ela varia. Tudo num único `predict_proba`.
    """
    base, risco_base = _entrada_do_modelo(parametros, parametros['bioma'])

    entradas = [base]
    curvas = {}

    for nome, (minimo, maximo) in FAIXAS_SIMULACAO.items():
        passo = (maximo - minimo) / (PONTOS_POR_CURVA - 1)
        valores = [minimo + passo * i for i in range(PONTOS_POR_CURVA)]
        curvas[nome] = {'valores': valores, 'inicio': len(entradas)}

        for valor in valores:
            variante = dict(parametros)
            variante[nome] = valor
            vetor, _ = _entrada_do_modelo(variante, variante['bioma'])
            entradas.append(vetor)

    probabilidades = modelo.predict_proba(scaler.transform(entradas))[:, 1]

    return {
        'entrada': {
            'bioma': parametros['bioma'],
            'dias_sem_chuva': parametros['dias_sem_chuva'],
            'precipitacao': parametros['precipitacao'],
            'umidade': parametros['umidade'],
            'temperatura': parametros['temperatura'],
        },
        'risco_fogo': round(float(risco_base), 4),
        'probabilidade_de_incendio': round(float(probabilidades[0]), 4),
        'curvas': {
            nome: [
                [round(valor, 3), round(float(probabilidades[dados['inicio'] + i]), 4)]
                for i, valor in enumerate(dados['valores'])
            ]
            for nome, dados in curvas.items()
        },
        'faixas': {nome: list(faixa) for nome, faixa in FAIXAS_SIMULACAO.items()},
    }
