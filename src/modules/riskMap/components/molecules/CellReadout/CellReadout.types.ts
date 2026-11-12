import type { IndexedRiskCell } from '@/modules/riskMap/riskMap.types'

export interface CellReadoutProps {
    cell: IndexedRiskCell
    /** Municípios que a célula cobre. */
    cities: string[]
    /** Verdadeiro quando a célula veio de um clique, não do ponteiro. */
    isPinned?: boolean
}
