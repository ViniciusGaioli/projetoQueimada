"""Mantém o cache de clima das grades sempre pronto, sem agendador externo.

Montar uma grade do zero leva minutos e consome boa parte da cota horária do
Open-Meteo. Sem este aquecimento, essa espera cai sobre o primeiro visitante do
dia — e, se a cota estiver estourada, ele vê dados de ontem ou a tela de erro.

Modos:

    python aquecer.py              # monta o que faltar e sai
    python aquecer.py --vigiar     # fica em pé, reconferindo de tempos em tempos

O modo `--vigiar` é o que sobe junto com o site: é um serviço como outro
qualquer do compose, não uma tarefa agendada na máquina de alguém. Ele não
precisa saber que horas são nem em que fuso está — a cada ciclo simplesmente
pergunta "o cache de hoje existe?" e, se não existir, monta. Isso o torna imune
a virada de dia, reinício de container, falha de rede e estouro de cota: na
próxima volta ele tenta de novo, retomando de onde a tentativa anterior parou.

Variáveis de ambiente:

    REGIOES_GRADE     regiões a aquecer, separadas por vírgula (padrão: todas)
    INTERVALO_VIGIA   segundos entre conferências no modo --vigiar (padrão: 1800)
"""

import os
import sys
import time
from datetime import date, datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent / 'src'))

import mapa as mp  # noqa: E402

INTERVALO_VIGIA = int(os.environ.get('INTERVALO_VIGIA', 1800))


def _agora():
    return f'{datetime.now():%Y-%m-%d %H:%M:%S}'


def _regioes():
    escolhidas = os.environ.get('REGIOES_GRADE')

    if not escolhidas:
        return list(mp.REGIOES)

    return [nome.strip() for nome in escolhidas.split(',') if nome.strip() in mp.REGIOES]


def aquecer(regiao):
    """Garante o cache do dia para a região. True se está pronto ao fim."""
    dia = date.today()
    passo = mp.REGIOES[regiao]['passo']

    if mp._arquivo_de_cache(regiao, passo, dia).exists():
        return True

    print(f'[{_agora()}] montando {regiao} de {dia} com passo {passo}°', flush=True)

    try:
        grade = mp.calcular_grade_em_cache(dia, regiao)
    except mp.ClimaIndisponivel as erro:
        # O progresso parcial ficou gravado; o próximo ciclo retoma dali.
        print(f'[{_agora()}] {regiao} falhou, tentará de novo: {erro}', flush=True)
        return False

    print(f'[{_agora()}] {regiao} pronto: {len(grade)} células', flush=True)
    return True


def ciclo(regioes):
    """Uma passada por todas as regiões. True se todas estão prontas."""
    # A menor primeiro: se a cota acabar no meio, o recorte barato já ficou de
    # pé, e o mais caro retoma do parcial na volta seguinte.
    ordenadas = sorted(regioes, key=lambda nome: -mp.REGIOES[nome]['passo'])

    return all([aquecer(regiao) for regiao in ordenadas])


def main():
    regioes = _regioes()
    vigiar = '--vigiar' in sys.argv

    if not vigiar:
        return 0 if ciclo(regioes) else 1

    print(
        f'[{_agora()}] vigiando {", ".join(regioes)} a cada {INTERVALO_VIGIA}s',
        flush=True,
    )

    while True:
        try:
            ciclo(regioes)
        except Exception as erro:  # noqa: BLE001 - o vigia não pode morrer
            print(f'[{_agora()}] erro inesperado: {erro!r}', flush=True)

        time.sleep(INTERVALO_VIGIA)


if __name__ == '__main__':
    raise SystemExit(main())
