'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import type { CurvePoint, Simulation, SimulationField, SimulationInput } from '@/core/models/simulation'
import { simulationDebounce } from '@/modules/riskMap/riskMap.constants'
import { simulate } from '@/modules/riskMap/services'

import type { SimulatorSectionProps } from './SimulatorSection.types'

/** Probabilidade na curva, interpolada entre os dois pontos vizinhos. */
const readCurve = (curve: CurvePoint[], value: number) => {
    if (curve.length === 0) return undefined
    if (value <= curve[0][0]) return curve[0][1]
    if (value >= curve[curve.length - 1][0]) return curve[curve.length - 1][1]

    const next = curve.findIndex(point => point[0] >= value)
    const [beforeValue, beforeProbability] = curve[next - 1]
    const [afterValue, afterProbability] = curve[next]
    const ratio = (value - beforeValue) / (afterValue - beforeValue)

    return beforeProbability + (afterProbability - beforeProbability) * ratio
}

/** Variáveis que se afastaram do ponto que o servidor calculou. */
const driftedFields = (input: SimulationInput, base: SimulationInput) =>
    (Object.keys(input) as SimulationField[]).filter(field => input[field] !== base[field])

export function useSimulatorSection({ model, initial }: SimulatorSectionProps) {
    const [input, setInput] = useState<SimulationInput>(initial.input)
    const [result, setResult] = useState<Simulation>(initial)
    const [isPending, setIsPending] = useState(false)

    const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
    // Identifica a requisição mais recente: uma resposta atrasada não pode
    // sobrescrever outra mais nova.
    const requestId = useRef(0)

    useEffect(() => () => clearTimeout(timer.current), [])

    const scheduleRequest = useCallback(
        (next: SimulationInput) => {
            clearTimeout(timer.current)
            setIsPending(true)

            const id = ++requestId.current

            timer.current = setTimeout(async () => {
                const simulation = await simulate({ model, ...next })

                if (id !== requestId.current) return

                if (simulation) setResult(simulation)
                setIsPending(false)
            }, simulationDebounce)
        },
        [model],
    )

    const apply = useCallback(
        (next: SimulationInput) => {
            setInput(next)
            scheduleRequest(next)
        },
        [scheduleRequest],
    )

    const handleChange = useCallback(
        (field: SimulationField, value: number) => apply({ ...input, [field]: value }),
        [apply, input],
    )

    /**
     * Enquanto só uma variável se afastou do ponto que o servidor calculou, a
     * resposta já está na curva daquela variável: exata nos 41 pontos que a
     * API devolveu e interpolada entre eles — medimos um erro máximo de 0,015,
     * e só no trecho mais íngreme. A resposta do servidor corrige logo em
     * seguida.
     *
     * Com duas ou mais variáveis fora do lugar não há curva que cubra a
     * combinação, e o valor fica marcado como estimado até a próxima resposta.
     */
    const drifted = driftedFields(input, result.input)
    const fromCurve = drifted.length === 1 ? readCurve(result.curves[drifted[0]], input[drifted[0]]) : undefined

    return {
        curves: result.curves,
        fireRisk: result.fireRisk,
        handleChange,
        handlePreset: apply,
        input,
        isEstimated: drifted.length > 1,
        isPending,
        probability: drifted.length === 0 ? result.probability : (fromCurve ?? result.probability),
        ranges: result.ranges,
    }
}
