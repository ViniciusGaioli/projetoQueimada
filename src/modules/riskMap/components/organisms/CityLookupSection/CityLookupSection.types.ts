import type { IndexedRiskCell } from '@/modules/riskMap/riskMap.types'

export interface CityLookupSectionProps {
    /** Células do recorte do estado, já com o índice de risco. */
    cells: IndexedRiskCell[]
    /** De cada município para a célula que o cobre. */
    cityIndex: Record<string, number>
    /** Lado da célula em graus, para dizer a resolução ao usuário. */
    step: number
    /** Município sugerido na abertura. */
    initialCity?: string
}
