'use client'

import { toHeatColor } from '@/modules/riskMap/tools'

import { useRiskGrid } from './RiskGrid.hook'
import type { RiskGridProps } from './RiskGrid.types'

export function RiskGrid({ cells, projection, step, activeIndex, onActivate }: RiskGridProps) {
    const { rects, activeRect, handlePointerOver, handlePointerLeave } = useRiskGrid({
        cells,
        projection,
        step,
        activeIndex,
        onActivate,
    })

    return (
        <>
            {/* Um só handler no grupo, em vez de um por célula: a grade tem
                centenas de retângulos e o alvo vem do próprio evento. */}
            <g onPointerOver={handlePointerOver} onPointerLeave={handlePointerLeave}>
                {rects.map(rect => (
                    <rect
                        key={rect.index}
                        data-index={rect.index}
                        x={rect.x}
                        y={rect.y}
                        width={rect.width}
                        height={rect.height}
                        fill={toHeatColor(rect.score)}
                        shapeRendering="crispEdges"
                    />
                ))}
            </g>

            {activeRect && (
                <rect
                    x={activeRect.x}
                    y={activeRect.y}
                    width={activeRect.width}
                    height={activeRect.height}
                    fill="none"
                    stroke="var(--color-content)"
                    strokeWidth={2}
                    pointerEvents="none"
                />
            )}
        </>
    )
}
