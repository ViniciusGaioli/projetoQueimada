import type { ProbabilityRange } from '@/modules/riskMap/riskMap.types'

export interface HeatLegendProps {
    /** Extremos de probabilidade previstos no dia, que o índice reescala. */
    observed: ProbabilityRange
}
