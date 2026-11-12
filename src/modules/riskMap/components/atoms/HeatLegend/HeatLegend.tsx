import { riskLevels } from '@/modules/riskMap/riskMap.constants'
import { toHeatColor } from '@/modules/riskMap/tools'

import { legendSteps } from './HeatLegend.constants'
import type { HeatLegendProps } from './HeatLegend.types'

export function HeatLegend({ observed }: HeatLegendProps) {
    return (
        <div>
            <div className="flex items-end justify-between gap-6">
                <p className="label-mono">Índice de risco</p>
                <p className="label-mono tabular-nums">0.00 — 1.00</p>
            </div>

            <div aria-hidden className="mt-3 flex h-2.5 w-full">
                {legendSteps.map(step => (
                    <span key={step} className="flex-1" style={{ backgroundColor: toHeatColor(step) }} />
                ))}
            </div>

            <ul className="mt-3 flex justify-between">
                {riskLevels.map(level => (
                    <li key={level.label} className="label-mono">
                        {level.label}
                    </li>
                ))}
            </ul>

            {/* De onde vem o 0 e de onde vem o 1: sem isso, o índice pareceria
                uma probabilidade absoluta, que ele não é. */}
            <p className="mt-4 border-t border-rule pt-4 text-[0.8125rem] leading-relaxed text-content-muted">
                O índice reescala a saída do modelo para o intervalo previsto hoje, de{' '}
                <span className="font-mono text-content tabular-nums">{observed.min.toFixed(3)}</span> a{' '}
                <span className="font-mono text-content tabular-nums">{observed.max.toFixed(3)}</span>. Ele compara
                regiões no mesmo dia, não dias diferentes.
            </p>
        </div>
    )
}
