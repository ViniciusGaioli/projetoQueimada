import { heatRamp, riskLevels } from '@/modules/riskMap/riskMap.constants'
import type { RiskLevel } from '@/modules/riskMap/riskMap.types'

/**
 * Cor de uma probabilidade na rampa de calor.
 *
 * Devolve um `color-mix` entre as duas variáveis CSS vizinhas na rampa, em vez
 * de um hexadecimal: assim a interpolação acontece no browser, em espaço de cor
 * perceptual, e a célula acompanha a troca de tema sem nenhum JavaScript.
 */
export function toHeatColor(probability: number) {
    const clamped = Math.min(Math.max(probability, 0), 1)
    const position = clamped * (heatRamp.length - 1)

    const lower = Math.floor(position)
    const upper = Math.min(lower + 1, heatRamp.length - 1)
    const ratio = position - lower

    if (lower === upper) return `var(${heatRamp[lower]})`

    return `color-mix(in oklab, var(${heatRamp[upper]}) ${(ratio * 100).toFixed(1)}%, var(${heatRamp[lower]}))`
}

/** Faixa de leitura de uma probabilidade. */
export function toRiskLevel(probability: number): RiskLevel {
    return riskLevels.find(level => probability <= level.threshold) ?? riskLevels[riskLevels.length - 1]
}
