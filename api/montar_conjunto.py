"""Monta o conjunto de treino a partir da série já gravada. Não usa rede.

Uso:
    python montar_conjunto.py [--arquivo bdqueimadas.csv]

Como tudo é local, mudar features é barato: edite `src/conjunto.py` e rode de
novo. A série em disco não precisa ser baixada outra vez.
"""

import sys
import time
from pathlib import Path

import pandas as pd

import src.conjunto as c
import src.serie as s

ARQUIVO_SERIE = s.PASTA_SAIDA / 'serie-diaria.csv.gz'
ARQUIVO_SAIDA = s.PASTA_SAIDA / 'conjunto.csv'


def main():
    arquivo = 'bdqueimadas.csv'
    if '--arquivo' in sys.argv:
        arquivo = sys.argv[sys.argv.index('--arquivo') + 1]

    for caminho in (ARQUIVO_SERIE, Path(arquivo)):
        if not caminho.exists():
            print(f'{caminho} não existe! Rode coletar_series.py primeiro.')
            return 1

    comeco = time.perf_counter()

    print(f'Lendo {ARQUIVO_SERIE}...', flush=True)
    serie = s.carregar(ARQUIVO_SERIE)
    print(f'  {len(serie):,} dias-lugar | {serie["lugar"].nunique()} lugares', flush=True)
    print(f'  {serie["dia"].min().date()} a {serie["dia"].max().date()}', flush=True)

    print(f'Lendo rótulos de {arquivo}...', flush=True)
    focos, bioma = c.rotulos(pd.read_csv(arquivo, encoding='utf-8-sig', low_memory=False))
    print(f'  {len(focos):,} lugar-dia com foco no histórico | {len(bioma)} lugares com bioma', flush=True)

    # Fora da janela do BDQueimadas não existe rótulo, e um dia sem rótulo
    # viraria negativo por omissão.
    datas = sorted({data for _, data in focos})
    cobertura = (datas[0], datas[-1])
    print(f'  cobertura do rótulo: {cobertura[0]} a {cobertura[1]}', flush=True)

    print('Calculando features...', flush=True)
    d = c.montar(serie, focos, bioma, cobertura=cobertura)

    ARQUIVO_SAIDA.parent.mkdir(parents=True, exist_ok=True)
    d.to_csv(ARQUIVO_SAIDA, index=False)

    positivos = int(d['fogo'].sum())
    print(f'\nConcluído em {(time.perf_counter() - comeco) / 60:.1f} min', flush=True)
    print(f'  {len(d):,} linhas | {positivos:,} com fogo ({positivos / len(d):.2%})')
    print(f'  {len(c.FEATURES)} features: {", ".join(c.FEATURES)}')
    print(f'  salvo em {ARQUIVO_SAIDA}')
    print('  próximo passo: python treinar_v2.py')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
