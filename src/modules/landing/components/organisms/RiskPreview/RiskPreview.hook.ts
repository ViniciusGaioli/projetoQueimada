'use client'

import { useCallback, useMemo, useState } from 'react'

import { riskBands } from '@/modules/landing/landing.constants'

import { baselineRisk, biomeOptions, drynessCeiling, rainfallCeiling, rainfallDamping } from './RiskPreview.constants'

export function useRiskPreview() {
    const [dryDays, setDryDays] = useState(24)
    const [rainfall, setRainfall] = useState(0)
    const [biome, setBiome] = useState(biomeOptions[0].id)

    const score = useMemo(() => {
        const dryness = Math.min(dryDays / drynessCeiling, 1)
        const wetness = Math.min(rainfall / rainfallCeiling, 1)
        const weight = biomeOptions.find(option => option.id === biome)?.weight ?? 1
        const raw = (dryness * (1 - baselineRisk) + baselineRisk) * (1 - wetness * rainfallDamping) * weight

        return Math.min(Math.max(Number(raw.toFixed(2)), 0), 1)
    }, [dryDays, rainfall, biome])

    const band = useMemo(
        () => riskBands.find(item => score <= item.threshold) ?? riskBands[riskBands.length - 1],
        [score],
    )

    const inputVector = useMemo(
        () =>
            [
                '{',
                `    "dias_sem_chuva": ${dryDays},`,
                `    "precipitacao": ${rainfall.toFixed(1)},`,
                `    "bioma": "${biome}"`,
                '}',
            ].join('\n'),
        [dryDays, rainfall, biome],
    )

    const handleDryDaysChange = useCallback((value: string) => setDryDays(Number(value)), [])
    const handleRainfallChange = useCallback((value: string) => setRainfall(Number(value)), [])
    const handleBiomeChange = useCallback((value: string) => setBiome(value), [])

    return {
        band,
        bands: riskBands,
        biome,
        biomes: biomeOptions,
        dryDays,
        handleBiomeChange,
        handleDryDaysChange,
        handleRainfallChange,
        inputVector,
        rainfall,
        score,
    }
}
