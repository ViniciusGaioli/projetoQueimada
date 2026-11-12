import type { Simulation } from '@/core/models/simulation'
import type { SimulationPreset } from '@/modules/riskMap/riskMap.types'

export interface SimulatorSectionProps {
    /** Chave do modelo na API de predição. */
    model: string
    /** Primeira simulação, calculada no servidor para a seção não nascer vazia. */
    initial: Simulation
    /** Atalhos de condições, incluindo o que vem da serra. */
    presets: SimulationPreset[]
}
