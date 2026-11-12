from flask import Flask, request, jsonify
from datetime import datetime as dt, date
import os
import openmeteo as om
import queimada as qm
import mapa as mp
import pickle
from pathlib import Path
import sys

api = Flask(__name__)
modelos = {}
scalers = {}


def carregar_modelos(pasta):
    pasta = Path(pasta)
    
    for arq in pasta.glob("*.pkl"):
        nome_base = arq.stem
        
        # Verifica se é o arquivo de scaler (ex: scaler-2023.pkl)
        if nome_base.startswith("scaler-"):
            ano = nome_base.split("-", 1)[1]
            with arq.open("rb") as f:
                scalers[ano] = pickle.load(f)
                
        else:
            try:
                metodo, ano = nome_base.rsplit("-", 1)
                with arq.open("rb") as f:
                    modelos[f"{metodo}_{ano}"] = pickle.load(f)
            except ValueError:
                continue

def get_clima(lat, long, hora):
    hora = dt.fromisoformat(hora)

    clima = om.obter_dados_clima_coord(hora.date(), lat, long)
    
    precs = {k: v for k, v in clima.items() if k.startswith('prec')}
    pse = qm.periodo_de_secura(precs)

    # bioma 2.5 = média entre 2 e 3, que são o fator de vegetação predominantes
    #             na mata atlântica e no cerrado, respectivamente
    rf = qm.risco_fogo(2.5, pse, clima['umidade'], clima['temperatura'])

    return (rf, pse, clima)

@api.get('/modelos/')
def listar_modelos():
    return jsonify(list(modelos.keys()))


@api.get('/regioes/')
def listar_regioes():
    return jsonify(
        {
            nome: {'nome': dados['nome'], 'passo': dados['passo'], 'limites': dados['limites']}
            for nome, dados in mp.REGIOES.items()
        }
    )

@api.get('/modelos/<modelo>')
def prever(modelo):
    lat = float(request.args['lat'])
    long = float(request.args['long'])
    hora = request.args['datetime']

    clima = get_clima(lat, long, hora)
    # bioma 2.5 = média entre 2 e 3, que são o fator de vegetação predominantes
    #             na mata atlântica e no cerrado, respectivamente
    dados = scalers[modelo[-4:]].transform([[
        2.5,                      # Bioma
        clima[1],                 # DiaSemChuva
        clima[2]['precipitacao'], # Precipitacao
        clima[0]                  # RiscoFogo
        ]])

    previsao = float(modelos[modelo].predict_proba(dados)[0][1])

    return jsonify(modelo=modelo, probabilidade_de_incendio=previsao, risco_fogo=clima[0], periodo_de_secura=clima[1], clima=clima[2])

@api.get('/mapa/<modelo>')
def mapa_de_risco(modelo):
    """Grade de risco do estado de São Paulo para um dia.

    Parâmetros: `regiao` (um nome de `mapa.REGIOES`) e `data` (ISO, padrão hoje).

    A região define o recorte e o passo da grade — não há passo livre, porque
    cada combinação nova custaria uma montagem inteira na cota do Open-Meteo.
    """
    if modelo not in modelos:
        return jsonify(erro=f'Modelo {modelo} não carregado'), 404

    regiao = request.args.get('regiao', mp.REGIAO_PADRAO)

    if regiao not in mp.REGIOES:
        return jsonify(erro=f'Região desconhecida: {regiao}'), 404

    try:
        dia = date.fromisoformat(request.args['data']) if 'data' in request.args else date.today()
    except ValueError as erro:
        return jsonify(erro=f'Parâmetro inválido: {erro}'), 400

    try:
        grade = mp.prever_grade(modelos[modelo], scalers[modelo[-4:]], dia, regiao)
    except mp.ClimaIndisponivel as erro:
        return jsonify(erro=str(erro)), 503

    return jsonify(modelo=modelo, **grade)


@api.get('/simular/<modelo>')
def simular(modelo):
    """Predição para condições informadas à mão, com as curvas de resposta.

    Parâmetros (todos opcionais, com padrão): `bioma`, `dias_sem_chuva`,
    `precipitacao`, `umidade`, `temperatura`.
    """
    if modelo not in modelos:
        return jsonify(erro=f'Modelo {modelo} não carregado'), 404

    padroes = {
        'bioma': 2.5,
        'dias_sem_chuva': 20.0,
        'precipitacao': 0.0,
        'umidade': 55.0,
        'temperatura': 28.0,
    }

    parametros = {}
    for nome, padrao in padroes.items():
        try:
            valor = float(request.args.get(nome, padrao))
        except ValueError:
            return jsonify(erro=f'Parâmetro inválido: {nome}'), 400

        minimo, maximo = mp.FAIXAS_SIMULACAO[nome]
        # Prende na faixa em vez de recusar: o formulário não deve quebrar por
        # um valor fora de escala, e extrapolar não traria informação.
        parametros[nome] = min(max(valor, minimo), maximo)

    return jsonify(modelo=modelo, **mp.simular(modelos[modelo], scalers[modelo[-4:]], parametros))


@api.get('/clima')
def clima():
    lat = float(request.args['lat'])
    long = float(request.args['long'])
    hora = request.args['datetime']

    dados = get_clima(lat, long, hora)

    return jsonify(risco_fogo=dados[0], periodo_de_secura=dados[1], clima=dados[2])


if __name__ == '__main__':
    pasta = 'out/'

    try:
        pasta = sys.argv[1]

    except:
        pasta = 'out/'

    carregar_modelos(pasta)
    print(modelos)

    # Em container o Flask precisa escutar em 0.0.0.0 para ser alcançável; o
    # padrão segue 127.0.0.1 para que rodar na mão não exponha a API na rede.
    # O modo debug fica desligado por padrão: além de lento, ele publica um
    # console que executa código arbitrário.
    api.run(
        host=os.environ.get('API_HOST', '127.0.0.1'),
        port=int(os.environ.get('API_PORT', 5000)),
        debug=os.environ.get('API_DEBUG') == '1',
    )
