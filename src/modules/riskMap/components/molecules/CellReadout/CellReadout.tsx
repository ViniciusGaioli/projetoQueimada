import { readoutMeasures } from '@/modules/riskMap/riskMap.constants'
import { toRiskLevel } from '@/modules/riskMap/tools'

import type { CellReadoutProps } from './CellReadout.types'

const formatCoordinate = (value: number, positive: string, negative: string) =>
    `${Math.abs(value).toFixed(2)}° ${value >= 0 ? positive : negative}`

export function CellReadout({ cell, cities, isPinned }: CellReadoutProps) {
    const level = toRiskLevel(cell.score)

    return (
        <div className="border border-rule bg-surface-raised p-6">
            <p className="label-mono">{isPinned ? 'Célula fixada' : 'Célula'}</p>
            <p className="mt-1.5 font-mono text-[0.8125rem] text-content-muted tabular-nums">
                {formatCoordinate(cell.latitude, 'N', 'S')} · {formatCoordinate(cell.longitude, 'L', 'O')}
            </p>

            <div className="mt-5 flex items-end justify-between gap-4">
                <p className="font-mono text-[clamp(2.5rem,6.2vw,3.5rem)] leading-[0.9] font-medium tracking-tight text-accent tabular-nums">
                    {cell.score.toFixed(2)}
                </p>
                <p className="pb-1 font-display text-2xl tracking-[-0.01em] text-content">{level.label}</p>
            </div>

            <div
                role="meter"
                aria-valuenow={Number(cell.score.toFixed(2))}
                aria-valuemin={0}
                aria-valuemax={1}
                aria-label="Índice de risco da célula"
                className="relative mt-5 h-px w-full bg-rule-strong"
            >
                <span
                    className="absolute inset-y-0 left-0 bg-accent transition-[width] duration-300 ease-out"
                    style={{ width: `${cell.score * 100}%` }}
                />
            </div>

            <p className="mt-5 text-[0.9375rem] leading-relaxed text-content-muted">{level.advice}</p>

            <div className="mt-6 border-t border-rule pt-5">
                <p className="label-mono">
                    {cities.length === 0
                        ? 'Fora do território municipal'
                        : `${cities.length} ${cities.length === 1 ? 'município' : 'municípios'}`}
                </p>

                {cities.length > 0 && (
                    <p className="mt-2.5 text-[0.8125rem] leading-relaxed text-content">{cities.join(', ')}</p>
                )}
            </div>

            {/* Três colunas fixas: rótulo elástico, número alinhado à direita e
                unidade começando sempre na mesma coluna. Com os valores soltos
                num flex, cada linha terminava numa posição diferente e as
                unidades mais longas quebravam. */}
            <dl className="mt-6 grid grid-cols-[minmax(0,1fr)_auto_2.25rem] items-baseline gap-x-3 gap-y-2.5 border-t border-rule pt-5">
                {/* Uma grandeza ausente não vira travessão solto: a célula pode
                    vir de um cache montado antes de o campo existir. */}
                {readoutMeasures
                    .filter(measure => cell[measure.key] !== null && cell[measure.key] !== undefined)
                    .map(measure => (
                        <div key={measure.key} className="col-span-3 grid grid-cols-subgrid items-baseline">
                            <dt className="text-[0.8125rem] text-content-muted">{measure.label}</dt>
                            <dd className="text-right font-mono text-[0.8125rem] text-content tabular-nums">
                                {cell[measure.key]?.toFixed(measure.decimals)}
                            </dd>
                            <dd className="font-mono text-[0.6875rem] tracking-wide text-content-faint">
                                {measure.unit}
                            </dd>
                        </div>
                    ))}
            </dl>
        </div>
    )
}
