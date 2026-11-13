"""Acesso ao Open-Meteo: geocodificação e clima diário.

As funções públicas (`buscar_cidade`, `obter_dados_clima`,
`obter_dados_clima_coord`) têm a mesma assinatura e devolvem o mesmo formato de
antes. O que mudou é quantas requisições elas custam:

1. **A geocodificação é guardada em disco.** O cache em memória morria junto com
   o processo, e cada execução do `build.py` recomeçava geocodificando os 642
   municípios. Agora a segunda execução custa zero.

2. **As séries diárias são reaproveitadas entre chamadas.** Pedir o clima de
   dois meses seguidos do mesmo lugar pedia duas janelas de 120 dias que se
   sobrepõem em 90. Agora só o trecho que falta é buscado, e, a partir da
   segunda consulta a uma mesma coordenada, a busca vem em blocos de um ano —
   acesso sequencial é o padrão de quem monta conjunto de treino.

3. **`preparar_series_lote` busca um intervalo de várias coordenadas numa
   requisição.** O Open-Meteo aceita latitudes e longitudes separadas por
   vírgula e responde uma lista na mesma ordem. Depois dela, as consultas por
   dia saem do cache.

A cota do Open-Meteo é cobrada por coordenada e por tamanho da janela, então
reaproveitar dias já baixados economiza as duas coisas.
"""

import json
import time
import unicodedata
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

import requests

URL_GEOCODING = "https://geocoding-api.open-meteo.com/v1/search"
URL_HISTORICO = "https://archive-api.open-meteo.com/v1/archive"
URL_PREVISAO = "https://api.open-meteo.com/v1/forecast"

# O arquivo histórico tem alguns dias de atraso; datas mais recentes vêm da API de previsão.
DIAS_ATRASO_HISTORICO = 7

PERIODOS_PRECIPITACAO = (1, 2, 3, 4, 5, 10, 15, 30, 60, 90, 120)

# A busca de cidades é limitada ao estado de São Paulo, Brasil.
PAIS = "BR"
ESTADO = "São Paulo"

PASTA_CACHE = Path(__file__).resolve().parents[1] / "out" / "cache"
ARQUIVO_GEOCODIFICACAO = PASTA_CACHE / "geocodificacao.json"

# Tamanho do bloco buscado a partir da segunda consulta a uma mesma coordenada.
# A primeira traz exatamente o que se pediu: quem consulta um dia só não deve
# pagar por um ano. Repetir a coordenada indica varredura sequencial, e aí vale
# adiantar trabalho.
DIAS_POR_BLOCO = 365

_geocodificacao = None

# {(lat, long): {"prec": {...}, "temp": {...}, "umid": {...}, "dias": {date}}}
#
# `dias` registra o que já foi buscado, e não se deduz das outras chaves: um dia
# pode vir da API sem leitura de umidade, e inferir cobertura pela ausência do
# valor faria o mesmo dia ser pedido para sempre.
_series = {}


def _nova_serie():
    return {"prec": {}, "temp": {}, "umid": {}, "dias": set()}


# Espera máxima aceita num 429 antes de desistir. Acima disso o bloqueio é
# diário, e dormir horas dentro de um laço é pior que encerrar devolvendo o
# progresso: quem chamou pode salvar e retomar amanhã.
ESPERA_MAXIMA = 180

# O que o servidor informou na última resposta. O Open-Meteo devolve o custo de
# cada requisição e quanto resta da janela, então não há por que estimar.
_limite = {"restante": None, "reset": None, "custo": None}


class CidadeNaoEncontrada(ValueError):
    """A cidade não existe (ou não foi encontrada) no estado de São Paulo."""


class CotaEsgotada(RuntimeError):
    """A cota acabou e a espera até a renovação é longa demais para aguardar."""


def cota():
    """O que o servidor disse na última resposta: restante, custo e renovação."""
    return dict(_limite)


def _anotar_limite(resposta):
    cabecalhos = resposta.headers

    for chave, campo in (("X-RateLimit-Remaining", "restante"), ("X-RateLimit-Cost", "custo")):
        if chave in cabecalhos:
            try:
                _limite[campo] = float(cabecalhos[chave])
            except ValueError:
                pass

    if "X-RateLimit-Reset" in cabecalhos:
        try:
            _limite["reset"] = int(float(cabecalhos["X-RateLimit-Reset"]))
        except ValueError:
            pass


def _esperar_renovacao():
    """Dorme até a janela virar, quando o que resta não cobre a próxima chamada."""
    if _limite["reset"] is None:
        return

    falta = _limite["reset"] - datetime.now(timezone.utc).timestamp()

    if 0 < falta <= ESPERA_MAXIMA:
        time.sleep(falta + 1)
        _limite["restante"] = None


def _normalizar(texto):
    """Minúsculas e sem acentos, para comparar nomes de forma tolerante."""
    sem_acento = unicodedata.normalize("NFKD", texto)
    sem_acento = "".join(c for c in sem_acento if not unicodedata.combining(c))
    return sem_acento.casefold().strip()


def _carregar_geocodificacao():
    """Cache de geocodificação lido do disco, uma vez por processo."""
    global _geocodificacao

    if _geocodificacao is None:
        if ARQUIVO_GEOCODIFICACAO.exists():
            with ARQUIVO_GEOCODIFICACAO.open(encoding="utf-8") as arquivo:
                _geocodificacao = json.load(arquivo)
        else:
            _geocodificacao = {}

    return _geocodificacao


def _gravar_geocodificacao():
    PASTA_CACHE.mkdir(parents=True, exist_ok=True)
    temporario = ARQUIVO_GEOCODIFICACAO.with_suffix(".tmp")

    with temporario.open("w", encoding="utf-8") as arquivo:
        json.dump(_geocodificacao, arquivo, ensure_ascii=False)

    temporario.replace(ARQUIVO_GEOCODIFICACAO)


def buscar_cidade(nome):
    """Localiza `nome` no estado de São Paulo e retorna os dados da cidade.

    Retorno:
        {"nome": str, "latitude": float, "longitude": float, "populacao": int | None}

    Levanta `CidadeNaoEncontrada` se nenhum resultado pertencer ao estado de SP.
    Se houver homônimas no estado, escolhe a mais populosa.

    O resultado fica guardado em disco, então o mesmo nome só custa uma
    requisição na vida — inclusive a resposta "não encontrei", que é definitiva
    e não adianta repetir a cada execução.
    """
    cache = _carregar_geocodificacao()
    chave = _normalizar(nome)

    if chave in cache:
        if cache[chave] is None:
            raise CidadeNaoEncontrada(f"Cidade '{nome}' não encontrada no estado de {ESTADO}.")
        return cache[chave]

    params = {
        "name": nome,
        "count": 100,  # máximo da API; garante que resultados de SP apareçam
        "language": "pt",
        "format": "json",
        "countryCode": PAIS,
    }
    resposta = requests.get(URL_GEOCODING, params=params, timeout=30)
    resposta.raise_for_status()
    resultados = resposta.json().get("results", [])

    estado = _normalizar(ESTADO)
    candidatas = [r for r in resultados if _normalizar(r.get("admin1", "")) == estado]

    if not candidatas:
        # Só a ausência é memorizada; falha de rede levanta antes de chegar aqui.
        cache[chave] = None
        _gravar_geocodificacao()
        raise CidadeNaoEncontrada(f"Cidade '{nome}' não encontrada no estado de {ESTADO}.")

    # Prefere correspondência exata de nome; entre elas, a mais populosa.
    alvo = _normalizar(nome)
    exatas = [r for r in candidatas if _normalizar(r["name"]) == alvo]
    escolhida = max(exatas or candidatas, key=lambda r: r.get("population") or 0)

    local = {
        "nome": escolhida["name"],
        "latitude": escolhida["latitude"],
        "longitude": escolhida["longitude"],
        "populacao": escolhida.get("population"),
    }

    cache[chave] = local
    _gravar_geocodificacao()

    return local


def _requisitar(url, inicio, fim, latitudes, longitudes, horario=None, umidade_diaria=False):
    """Uma chamada ao Open-Meteo. Aceita uma coordenada ou várias.

    Com várias, a resposta é uma lista na mesma ordem das coordenadas; com uma
    só, a API devolve um objeto, que aqui vira uma lista de um elemento para o
    chamador não precisar se importar.
    """
    diarias = "precipitation_sum,temperature_2m_mean"
    if umidade_diaria:
        diarias += ",relative_humidity_2m_mean"

    params = {
        "latitude": ",".join(str(v) for v in latitudes),
        "longitude": ",".join(str(v) for v in longitudes),
        "start_date": inicio.isoformat(),
        "end_date": fim.isoformat(),
        "daily": diarias,
        "timezone": "auto",
    }
    if horario:
        params["hourly"] = horario

    # Se o que sobrou da janela não cobre o custo da última requisição igual a
    # esta, espera a renovação em vez de tomar 429 de propósito.
    if _limite["restante"] is not None and _limite["custo"] is not None:
        if _limite["restante"] < _limite["custo"]:
            _esperar_renovacao()

    while True:
        resposta = requests.get(url, params=params, timeout=120)
        _anotar_limite(resposta)

        if resposta.status_code != 429:
            resposta.raise_for_status()
            break

        # O servidor diz em quanto tempo tentar de novo. Esperas curtas são de
        # janela por minuto; longas são bloqueio diário, e aí não há o que fazer
        # a não ser devolver o controle a quem chamou.
        espera = float(resposta.headers.get("Retry-After", ESPERA_MAXIMA + 1))

        if espera > ESPERA_MAXIMA:
            renovacao = datetime.fromtimestamp(_limite["reset"], timezone.utc) if _limite["reset"] else None
            raise CotaEsgotada(
                f"Cota esgotada; renova em {espera / 60:.0f} min"
                + (f" ({renovacao.astimezone():%H:%M})" if renovacao else "")
            )

        time.sleep(espera + 1)

    dados = resposta.json()

    return dados if isinstance(dados, list) else [dados]


def _trechos(dia_final, inicio):
    """Divide [inicio, dia_final] entre o arquivo histórico e a previsão."""
    limite = date.today() - timedelta(days=DIAS_ATRASO_HISTORICO)

    if dia_final <= limite:
        return [(URL_HISTORICO, inicio, dia_final)]

    if inicio > limite:
        return [(URL_PREVISAO, inicio, dia_final)]

    return [
        (URL_HISTORICO, inicio, limite),
        (URL_PREVISAO, limite + timedelta(days=1), dia_final),
    ]


def _guardar(serie, resposta):
    """Absorve uma resposta na série da coordenada."""
    diario = resposta["daily"]

    for texto, prec, temp in zip(
        diario["time"], diario["precipitation_sum"], diario["temperature_2m_mean"]
    ):
        momento = date.fromisoformat(texto)
        serie["prec"][momento] = prec
        serie["temp"][momento] = temp
        serie["dias"].add(momento)

    if "relative_humidity_2m_mean" in diario:
        for texto, umidade in zip(diario["time"], diario["relative_humidity_2m_mean"]):
            if umidade is not None:
                serie["umid"][date.fromisoformat(texto)] = umidade

    if "hourly" in resposta:
        horas = resposta["hourly"]
        por_dia = {}

        for texto, valor in zip(horas["time"], horas["relative_humidity_2m"]):
            if valor is not None:
                por_dia.setdefault(texto[:10], []).append(valor)

        for texto, valores in por_dia.items():
            serie["umid"][date.fromisoformat(texto)] = sum(valores) / len(valores)


def _garantir_serie(latitude, longitude, inicio, fim):
    """Assegura que a série da coordenada cobre [inicio, fim], buscando o que falta.

    Só o intervalo ausente vai para a rede. Da segunda consulta em diante a
    busca é esticada para um bloco de um ano, porque quem volta à mesma
    coordenada quase sempre está varrendo meses em sequência.
    """
    chave = (round(latitude, 4), round(longitude, 4))
    conhecida = chave in _series
    serie = _series.setdefault(chave, _nova_serie())

    faltando = [
        dia
        for dia in (inicio + timedelta(days=i) for i in range((fim - inicio).days + 1))
        if dia not in serie["dias"]
    ]

    if not faltando:
        return serie

    busca_inicio, busca_fim = min(faltando), max(faltando)

    if conhecida:
        busca_fim = max(busca_fim, busca_inicio + timedelta(days=DIAS_POR_BLOCO))

    for url, ini, final in _trechos(busca_fim, busca_inicio):
        resposta = _requisitar(url, ini, final, [latitude], [longitude], "relative_humidity_2m")[0]
        _guardar(serie, resposta)

    return serie


def _montar(serie, dia, periodos):
    """Recorta da série o que as fórmulas do INPE pedem para `dia`."""
    resultado = {
        "data": dia,
        "precipitacao": serie["prec"].get(dia),
        "temperatura": serie["temp"].get(dia),
        "umidade": serie["umid"].get(dia),
    }

    # precN = média dos N dias anteriores (o próprio `dia` não entra)
    for n in periodos:
        valores = [serie["prec"].get(dia - timedelta(days=i)) for i in range(1, n + 1)]
        valores = [v for v in valores if v is not None]
        resultado[f"prec{n}"] = sum(valores) / len(valores) if valores else None

    return resultado


def obter_dados_clima_coord(dia, latitude, longitude, periodos=PERIODOS_PRECIPITACAO):
    """Todos os dados climáticos de `dia` para uma coordenada.

    Retorno:
        {
            "latitude": ..., "longitude": ..., "data": date,
            "precipitacao": mm do dia, "temperatura": °C média,
            "umidade": % média, "prec1": ..., "prec2": ..., etc.
        }

    Nº de chamadas: 1 (ou 2, se a janela cruzar o limite do arquivo histórico)
    na primeira vez para a coordenada. Consultas seguintes a datas já cobertas
    não vão à rede.
    """
    if not isinstance(dia, date):
        dia = date.fromisoformat(str(dia))

    inicio = dia - timedelta(days=max(periodos))
    serie = _garantir_serie(latitude, longitude, inicio, dia)

    return {"latitude": latitude, "longitude": longitude, **_montar(serie, dia, periodos)}


def obter_dados_clima(dia, cidade, periodos=PERIODOS_PRECIPITACAO):
    """Todos os dados climáticos de `dia` para uma cidade do estado de SP.

    Retorno: o mesmo de `obter_dados_clima_coord`, com `"cidade"` no lugar das
    coordenadas.

    Levanta `CidadeNaoEncontrada` se a cidade não existir no estado de SP.
    """
    if not isinstance(dia, date):
        dia = date.fromisoformat(str(dia))

    local = buscar_cidade(cidade)
    inicio = dia - timedelta(days=max(periodos))
    serie = _garantir_serie(local["latitude"], local["longitude"], inicio, dia)

    return {"cidade": local["nome"], **_montar(serie, dia, periodos)}


def preparar_series_lote(coordenadas, inicio, fim):
    """Baixa o intervalo [inicio, fim] de várias coordenadas numa requisição.

    Serve a quem vai consultar muitos dias de muitos lugares — montar um
    conjunto de treino, por exemplo. Depois desta chamada, `obter_dados_clima`
    e `obter_dados_clima_coord` respondem sobre qualquer dia do intervalo sem
    tocar na rede.

    A umidade vem de `relative_humidity_2m_mean`, a média diária que a própria
    API calcula, e não da média das 24 leituras horárias que as funções de um
    dia só usam. A API arredonda esse valor para inteiro, o que desloca o risco
    de fogo do INPE em cerca de 0,4% — medido. Em troca, a resposta não carrega
    24 valores por dia, o que inviabilizaria baixar um ano de centenas de
    lugares de uma vez.

    Coordenadas já cobertas são puladas.
    """
    janela = {inicio + timedelta(days=i) for i in range((fim - inicio).days + 1)}

    pendentes = [
        (lat, lon)
        for lat, lon in coordenadas
        if not janela <= _series.get((round(lat, 4), round(lon, 4)), _nova_serie())["dias"]
    ]

    if not pendentes:
        return

    for url, ini, final in _trechos(fim, inicio):
        respostas = _requisitar(
            url,
            ini,
            final,
            [lat for lat, _ in pendentes],
            [lon for _, lon in pendentes],
            umidade_diaria=True,
        )

        for (lat, lon), resposta in zip(pendentes, respostas):
            chave = (round(lat, 4), round(lon, 4))
            _guardar(_series.setdefault(chave, _nova_serie()), resposta)
