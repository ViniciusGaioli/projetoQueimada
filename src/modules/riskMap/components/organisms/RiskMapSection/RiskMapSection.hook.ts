'use client'

import { useCallback, useId, useMemo, useState, useTransition } from 'react'

import { canvasPadding, canvasWidth, rankingSize } from '@/modules/riskMap/riskMap.constants'
import type { RankedRiskCell } from '@/modules/riskMap/riskMap.types'
import { refreshRiskMap } from '@/modules/riskMap/services'
import { toIndexedCells } from '@/modules/riskMap/tools'
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

    /**
     * Índice de 0 a 1 por célula, e os extremos de probabilidade que ele
     * reescala. A conta vive em `tools/riskScale` porque a busca por município
     * precisa chegar ao mesmo número.
     */
    const { cells, observed } = useMemo(() => toIndexedCells(map.cells), [map.cells])

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
