"""Treina o modelo novo e mede com corte temporal. Não sobrescreve nada antigo.

Uso:
    python treinar_v2.py [--teste-meses 3]

Três coisas mudam em relação ao `train.py`:

1. **Corte temporal em vez de embaralhado.** `train_test_split(random_state=42)`
   espalha dias vizinhos do mesmo município entre treino e teste; como o clima
   de ontem prediz o de hoje, o teste viraria consulta ao treino. Aqui treina-se
   no passado e testa-se no futuro, que é a pergunta real. Há também um corte
   espacial como segundo teste: treinar em uns municípios e testar em outros
   responde se o modelo generaliza para lugar novo.

2. **Gradient boosting em vez de processo gaussiano.** O GPC é O(n³): com 6.416
   pontos o pickle já tinha 330 MB e uma predição levava 780 ms. Com centenas de
   milhares de linhas a matriz do kernel não cabe em memória. Em dados tabulares
   o boosting de árvores é o estado da arte (Grinsztajn et al., NeurIPS 2022;
   Shwartz-Ziv e Armon, Information Fusion 2022), treina em segundos e o arquivo
   fica em kilobytes — o que também resolve o peso do modelo no deploy.

3. **PR-AUC e calibração em vez de acurácia.** Com ~5% de positivos, "nunca vai
   pegar fogo" acerta 95%: a acurácia não distingue modelo de chute. E o site
   pinta um mapa com a probabilidade, então ela precisa valer como
   probabilidade, não só ordenar — daí a calibração isotônica e o Brier.

A saída vai para `out/v2/`, separada dos modelos em produção.
"""

import json
import pickle
import sys
import time

import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.metrics import average_precision_score, brier_score_loss, roc_auc_score

import src.conjunto as c
import src.serie as s

ARQUIVO_CONJUNTO = s.PASTA_SAIDA / 'conjunto.csv'
ARQUIVO_MODELO = s.PASTA_SAIDA / 'modelo.pkl'
ARQUIVO_RELATORIO = s.PASTA_SAIDA / 'relatorio.json'

TESTE_MESES = 3


def _modelo():
    """Boosting com peso de classe, em vez de balancear o conjunto na mão.

    Balancear foi o que inflou o conjunto anterior para 47% de positivos. Aqui
    a prevalência fica como na natureza e o peso corrige o desequilíbrio dentro
    do ajuste.
    """
    return HistGradientBoostingClassifier(
        max_iter=400,
        learning_rate=0.06,
        max_leaf_nodes=31,
        min_samples_leaf=40,
        l2_regularization=1.0,
        early_stopping=True,
        validation_fraction=0.15,
        class_weight='balanced',
        random_state=42,
    )


def _medir(nome, y, p, aviso=print):
    base = float(np.mean(y))
    pr = average_precision_score(y, p)
    aviso(f'  {nome}')
    aviso(f'    PR-AUC  {pr:.4f}   (chute pela prevalência: {base:.4f})')
    aviso(f'    ROC-AUC {roc_auc_score(y, p):.4f}')
    aviso(f'    Brier   {brier_score_loss(y, p):.4f}')
    return {'pr_auc': float(pr), 'roc_auc': float(roc_auc_score(y, p)),
            'brier': float(brier_score_loss(y, p)), 'prevalencia': base, 'linhas': int(len(y))}


def _calibracao(y, p, faixas=5):
    """Previsto contra observado por faixa de probabilidade."""
    d = pd.DataFrame({'y': y, 'p': p})
    d['faixa'] = pd.qcut(d['p'], faixas, duplicates='drop')
    g = d.groupby('faixa', observed=True).agg(previsto=('p', 'mean'), observado=('y', 'mean'), n=('y', 'size'))
    return g.reset_index(drop=True).round(4)


def main():
    teste_meses = TESTE_MESES
    if '--teste-meses' in sys.argv:
        teste_meses = int(sys.argv[sys.argv.index('--teste-meses') + 1])

    if not ARQUIVO_CONJUNTO.exists():
        print(f'{ARQUIVO_CONJUNTO} não existe! Rode montar_conjunto.py primeiro.')
        return 1

    comeco = time.perf_counter()
    d = pd.read_csv(ARQUIVO_CONJUNTO, parse_dates=['dia'])
    print(f'{len(d):,} linhas | {d["fogo"].mean():.2%} com fogo | {d["lugar"].nunique()} lugares')
    print(f'{d["dia"].min().date()} a {d["dia"].max().date()}\n')

    X, y = d[c.FEATURES], d['fogo']
    relatorio = {'linhas': int(len(d)), 'prevalencia': float(y.mean()), 'features': c.FEATURES}

    # --- corte temporal: treina no passado, testa no futuro ---
    limite = d['dia'].max() - pd.DateOffset(months=teste_meses)
    futuro = d['dia'] > limite
    print(f'Corte temporal em {limite.date()}: treino {(~futuro).sum():,} | teste {futuro.sum():,}')

    modelo = _modelo().fit(X[~futuro], y[~futuro])
    relatorio['temporal'] = _medir('bruto', y[futuro], modelo.predict_proba(X[futuro])[:, 1])

    calibrado = CalibratedClassifierCV(_modelo(), method='isotonic', cv=3)
    calibrado.fit(X[~futuro], y[~futuro])
    p_cal = calibrado.predict_proba(X[futuro])[:, 1]
    relatorio['temporal_calibrado'] = _medir('calibrado', y[futuro], p_cal)

    print('\n  calibração (previsto x observado por faixa):')
    print(_calibracao(y[futuro].to_numpy(), p_cal).to_string(index=False))

    # --- corte espacial: generaliza para lugar que nunca viu? ---
    lugares = np.sort(d['lugar'].unique())
    reservados = set(lugares[::5])  # 20% dos municípios
    fora = d['lugar'].isin(reservados)
    print(f'\nCorte espacial: {len(reservados)} municípios reservados | teste {fora.sum():,} linhas')
    espacial = _modelo().fit(X[~fora], y[~fora])
    relatorio['espacial'] = _medir('lugares novos', y[fora], espacial.predict_proba(X[fora])[:, 1])

    # --- o que cada feature carrega, por permutação no teste futuro ---
    from sklearn.inspection import permutation_importance

    imp = permutation_importance(
        modelo, X[futuro], y[futuro], scoring='average_precision',
        n_repeats=5, random_state=42, n_jobs=-1,
    )
    ordem = np.argsort(imp.importances_mean)[::-1]
    print('\nImportância por permutação (queda no PR-AUC ao embaralhar):')
    for i in ordem:
        print(f'  {c.FEATURES[i]:14} {imp.importances_mean[i]:+.4f}')
    relatorio['importancia'] = {c.FEATURES[i]: float(imp.importances_mean[i]) for i in ordem}

    # --- modelo final: tudo, calibrado ---
    final = CalibratedClassifierCV(_modelo(), method='isotonic', cv=3).fit(X, y)
    ARQUIVO_MODELO.parent.mkdir(parents=True, exist_ok=True)
    with ARQUIVO_MODELO.open('wb') as arquivo:
        pickle.dump({'modelo': final, 'features': c.FEATURES}, arquivo)
    ARQUIVO_RELATORIO.write_text(json.dumps(relatorio, indent=2, ensure_ascii=False), encoding='utf-8')

    print(f'\nConcluído em {(time.perf_counter() - comeco) / 60:.1f} min')
    print(f'  modelo: {ARQUIVO_MODELO} ({ARQUIVO_MODELO.stat().st_size / 1e6:.2f} MB)')
    print(f'  relatório: {ARQUIVO_RELATORIO}')
    print('  os modelos em produção (gpc-2026.pkl, scaler-2026.pkl) não foram tocados')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
