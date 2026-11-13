'use client'

import { useCallback, useMemo, useState } from 'react'

import { citySuggestions } from '@/modules/riskMap/riskMap.constants'
import type { CityReport, IndexedRiskCell } from '@/modules/riskMap/riskMap.types'

import type { CityLookupSectionProps } from './CityLookupSection.types'

/** Minúsculas e sem acento, para a busca tolerar "sao joao" e "São João". */
const normalize = (text: string) =>
    text
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLocaleLowerCase('pt-BR')
        .trim()

export function useCityLookupSection({ cells, cityIndex, initialCity }: CityLookupSectionProps) {
    const [query, setQuery] = useState(initialCity ?? '')
    const [selected, setSelected] = useState<string | undefined>(initialCity)

    /** Nomes com a forma normalizada ao lado, calculada uma vez só. */
    const catalog = useMemo(() => Object.keys(cityIndex).map(name => ({ name, search: normalize(name) })), [cityIndex])

    const suggestions = useMemo(() => {
        const term = normalize(query)

        if (!term) return []

        // Quem começa com o termo aparece antes de quem apenas o contém:
        // digitar "sao" deve oferecer "São Paulo" antes de "Bom Jesus dos
        // Perdões".
        const starts: string[] = []
        const contains: string[] = []

        catalog.forEach(city => {
            if (city.search.startsWith(term)) starts.push(city.name)
            else if (city.search.includes(term)) contains.push(city.name)
        })

        return [...starts, ...contains].slice(0, citySuggestions)
    }, [catalog, query])

    /**
     * Ranking dos municípios pelo índice da célula que os cobre. Empates são
     * frequentes — vários municípios dividem uma célula de 22 km —, então
     * municípios na mesma célula recebem a mesma posição.
     */
    const ranking = useMemo(() => {
        const scores = Object.values(cityIndex).map(cell => cells[cell]?.score ?? 0)
        const sorted = [...scores].sort((first, second) => second - first)

        return {
            total: scores.length,
            average: scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0,
            positionOf: (score: number) => sorted.findIndex(value => value <= score) + 1,
        }
    }, [cells, cityIndex])

    const report = useMemo<CityReport | undefined>(() => {
        if (!selected) return undefined

        const index = cityIndex[selected]
        const cell: IndexedRiskCell | undefined = index === undefined ? undefined : cells[index]

        if (!cell) return undefined

        return {
            name: selected,
            cell,
            rank: ranking.positionOf(cell.score),
            total: ranking.total,
            average: ranking.average,
            neighbours: Object.keys(cityIndex)
                .filter(name => name !== selected && cityIndex[name] === index)
                .sort((first, second) => first.localeCompare(second, 'pt-BR')),
        }
    }, [cells, cityIndex, ranking, selected])

    const handleQueryChange = useCallback((value: string) => {
        setQuery(value)
        setSelected(undefined)
    }, [])

    const handleSelect = useCallback((city: string) => {
        setQuery(city)
        setSelected(city)
    }, [])

    return { handleQueryChange, handleSelect, query, report, selected, suggestions }
}
