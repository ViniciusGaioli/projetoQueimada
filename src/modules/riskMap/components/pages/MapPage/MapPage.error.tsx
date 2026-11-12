import { SectionHeading } from '@/shared/components/atoms'

import type { MapPageErrorProps } from './MapPage.types'

export function MapPageError({ message }: MapPageErrorProps) {
    return (
        <section className="shell border-t border-rule pt-28 pb-24 lg:pt-36">
            <div>
                <SectionHeading>O mapa não pôde ser gerado agora.</SectionHeading>

                <p className="prose-lede measure-wide mt-8">{message}</p>

                <div className="mt-10 border border-rule bg-surface-raised p-6">
                    <p className="label-mono">O que verificar</p>

                    <ul className="mt-4 flex flex-col gap-3 text-[0.9375rem] leading-relaxed text-content-muted">
                        <li>
                            A API de predição precisa estar no ar:{' '}
                            <code className="font-mono text-content">python src/api.py</code> dentro de{' '}
                            <code className="font-mono text-content">api/</code>.
                        </li>
                        <li>
                            Os arquivos do modelo (<code className="font-mono text-content">gpc-2026.pkl</code> e{' '}
                            <code className="font-mono text-content">scaler-2026.pkl</code>) precisam estar em{' '}
                            <code className="font-mono text-content">api/out/</code>.
                        </li>
                        <li>
                            Montar a grade do zero consome centenas de chamadas do Open-Meteo e leva alguns minutos na
                            primeira vez do dia; depois o resultado fica em cache.
                        </li>
                    </ul>
                </div>
            </div>
        </section>
    )
}
