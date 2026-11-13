import type { RiskCell } from '@/core/models/riskMap'
import type { SimulationField, SimulationInput } from '@/core/models/simulation'

/** Faixa de leitura do índice, com a recomendação correspondente. */
export interface RiskLevel {
    threshold: number
    label: string
    advice: string
}

/** Cidade desenhada no mapa como referência geográfica. */
export interface ReferenceCity {
    name: string
    latitude: number
    longitude: number
    /** Destaca a cidade que é o recorte de estudo do projeto. */
    isFocus?: boolean
    /** Lado para o qual o rótulo cresce, quando o padrão esbarraria na borda. */
    anchor?: 'start' | 'end'
}

/** Célula com o índice original, para casar mapa, leitura e ranking. */
export interface IndexedRiskCell extends RiskCell {
    index: number
    /**
     * Índice de risco de 0 a 1: a probabilidade do modelo reescalada
     * proporcionalmente para o intervalo previsto no dia, de modo que a menor
     * célula seja 0 e a maior, 1. É o valor que o mapa pinta e que a interface
     * mostra; a probabilidade crua continua em `probability`.
     */
    score: number
}

/** Textos de uma seção de mapa. */
export interface RegionSection {
    /** Título da seção: curto e descritivo, não uma frase. */
    title: string
    lead: string
}

/** Item do ranking: a célula mais o nome pelo qual ela é conhecida. */
export interface RankedRiskCell extends IndexedRiskCell {
    /** Município principal da célula, ou a coordenada quando não há nenhum. */
    label: string
}

/** Um controle do simulador. */
export interface SimulationFieldSpec {
    key: SimulationField
    label: string
    unit: string
    step: number
    decimals: number
    /** Como essa variável chega ao modelo. */
    note: string
}

/** Conjunto de condições pronto, oferecido como atalho. */
export interface SimulationPreset {
    id: string
    label: string
    input: SimulationInput
}

/** O que a busca por município mostra. */
export interface CityReport {
    name: string
    cell: IndexedRiskCell
    /** Posição no ranking de municípios, do mais arriscado para o menos. */
    rank: number
    /** Total de municípios cobertos pela grade. */
    total: number
    /** Índice médio do recorte, para comparação. */
    average: number
    /** Outros municípios que dividem a mesma célula. */
    neighbours: string[]
}

export interface ProbabilityRange {
    min: number
    max: number
}
