'use client'

import { useCallback, useMemo, type PointerEvent } from 'react'

import type { RiskGridProps } from './RiskGrid.types'

/**
 * Pré-calcula a geometria de cada célula e resolve qual delas está sob o
 * ponteiro. Os retângulos são recalculados só quando a grade ou a projeção
 * mudam, nunca a cada passagem do mouse.
 */
export function useRiskGrid({ cells, projection, step, activeIndex, onActivate }: RiskGridProps) {
    const rects = useMemo(() => {
        const width = projection.scaleLongitude(step)
        const height = projection.scaleLatitude(step)

        return cells.map(cell => {
            const [x, y] = projection.project(cell)

            return {
                index: cell.index,
                score: cell.score,
                x: x - width / 2,
                y: y - height / 2,
                width,
                height,
            }
        })
    }, [cells, projection, step])

    const activeRect = useMemo(
        () => (activeIndex === null ? undefined : rects.find(rect => rect.index === activeIndex)),
        [activeIndex, rects],
    )

    const handlePointerOver = useCallback(
        (event: PointerEvent<SVGGElement>) => {
            const index = (event.target as SVGElement).dataset?.index

            if (index !== undefined) onActivate(Number(index))
        },
        [onActivate],
    )

    const handlePointerLeave = useCallback(() => onActivate(null), [onActivate])

    return { rects, activeRect, handlePointerOver, handlePointerLeave }
}
