'use client'

import { useCallback, useId, useMemo, useState, useTransition } from 'react'

import { canvasPadding, canvasWidth, rankingSize } from '@/modules/riskMap/riskMap.constants'
import type { IndexedRiskCell, RankedRiskCell } from '@/modules/riskMap/riskMap.types'
import { refreshRiskMap } from '@/modules/riskMap/services'
import { createProjection } from '@/shared/tools/geoProjection'

import type { RiskMapSectionProps } from './RiskMapSection.types'

export function useRiskMapSection({ map, citiesByCell }: RiskMapSectionProps) {
    const clipId = useId()

    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
    const [pinnedIndex, setPinnedIndex] = useState<number | null>(null)
    const [isRefreshing, startRefresh] = useTransition()

    /**
     * A mesma projeção que o servidor usou para traçar o contorno: as duas saem
     * dos mesmos limites e das mesmas constantes de canvas, então a grade cai
     * exatamente sobre o desenho do estado.
     */
    const projection = useMemo(
        () => createProjection(map.bounds, { width: canvasWidth, padding: canvasPadding }),
        [map.bounds],
    )

    /** Extremos de probabilidade previstos no dia, que o índice reescala. */
    const observed = useMemo(() => {
        const probabilities = map.cells.map(cell => cell.probability)

        return {
            min: probabilities.length ? Math.min(...probabilities) : 0,
            max: probabilities.length ? Math.max(...probabilities) : 1,
        }
    }, [map.cells])

    /**
     * O índice de risco é a probabilidade reescalada proporcionalmente para
     * `[0, 1]`: a célula de menor probabilidade do dia vira 0 e a de maior,
     * 1. O modelo devolve valores comprimidos numa faixa estreita, em que a
     * diferença entre uma região e outra fica ilegível.
     */
    const cells = useMemo<IndexedRiskCell[]>(() => {
        const span = observed.max - observed.min

        return map.cells.map((cell, index) => ({
            ...cell,
            index,
            score: span === 0 ? 0 : (cell.probability - observed.min) / span,
        }))
    }, [map.cells, observed])

    /**
     * O ranking é lido por quem quer saber *onde* está o risco, e um par de
     * coordenadas não responde isso. Usa o município da célula; a coordenada só
     * aparece nas poucas células sem nenhum.
     */
    const ranking = useMemo<RankedRiskCell[]>(
        () =>
            [...cells]
                .sort((first, second) => second.score - first.score)
                .slice(0, rankingSize)
                .map(cell => ({
                    ...cell,
                    label: citiesByCell[cell.index]?.[0] ?? `${cell.latitude.toFixed(2)}, ${cell.longitude.toFixed(2)}`,
                })),
        [cells, citiesByCell],
    )

    const activeIndex = hoveredIndex ?? pinnedIndex
    const activeCell = activeIndex === null ? undefined : cells[activeIndex]
    const activeCities = activeIndex === null ? [] : (citiesByCell[activeIndex] ?? [])

    const average = useMemo(
        () => (cells.length ? cells.reduce((sum, cell) => sum + cell.score, 0) / cells.length : 0),
        [cells],
    )

    const handleHover = useCallback((index: number | null) => setHoveredIndex(index), [])

    const handlePin = useCallback((index: number | null) => {
        setHoveredIndex(index)
        setPinnedIndex(index)
    }, [])

    const handleRefresh = useCallback(() => startRefresh(() => refreshRiskMap()), [])

    return {
        activeCell,
        activeCities,
        activeIndex,
        average,
        cells,
        clipId,
        handleHover,
        handlePin,
        handleRefresh,
        isPinned: hoveredIndex === null && pinnedIndex !== null,
        isRefreshing,
        observed,
        projection,
        ranking,
    }
}
