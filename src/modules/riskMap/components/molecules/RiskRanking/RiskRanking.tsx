'use client'

import { toHeatColor } from '@/modules/riskMap/tools'

import type { RiskRankingProps } from './RiskRanking.types'

export function RiskRanking({ cells, activeIndex, onActivate }: RiskRankingProps) {
    return (
        <div>
            <p className="label-mono">Maiores riscos agora</p>

            <ol className="mt-4 border-t border-rule">
                {cells.map((cell, position) => (
                    <li key={cell.index}>
                        <button
                            type="button"
                            onPointerEnter={() => onActivate(cell.index)}
                            onFocus={() => onActivate(cell.index)}
                            onClick={() => onActivate(cell.index)}
                            aria-current={activeIndex === cell.index ? 'true' : undefined}
                            className={`flex w-full items-center gap-4 border-b border-rule px-1 py-3 text-left transition-colors duration-200 ${
                                activeIndex === cell.index ? 'bg-surface-raised' : 'hover:bg-surface-raised'
                            }`}
                        >
                            <span className="label-mono w-4 shrink-0 tabular-nums">{position + 1}</span>

                            <span
                                aria-hidden
                                className="size-3 shrink-0"
                                style={{ backgroundColor: toHeatColor(cell.score) }}
                            />

                            <span className="min-w-0 flex-1 truncate text-[0.8125rem] text-content-muted">
                                {cell.label}
                            </span>

                            <span className="font-mono text-[0.8125rem] text-content tabular-nums">
                                {cell.score.toFixed(2)}
                            </span>
                        </button>
                    </li>
                ))}
            </ol>
        </div>
    )
}
