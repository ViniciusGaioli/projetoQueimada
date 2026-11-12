import type { IndexedRiskCell } from '@/modules/riskMap/riskMap.types'
import type { Projection } from '@/shared/tools/geoProjection'

export interface RiskGridProps {
    cells: IndexedRiskCell[]
    projection: Projection
    /** Lado da célula, em graus. */
    step: number
    activeIndex: number | null
    onActivate: (index: number | null) => void
}
