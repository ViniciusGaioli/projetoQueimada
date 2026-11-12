import type { RankedRiskCell } from '@/modules/riskMap/riskMap.types'

export interface RiskRankingProps {
    cells: RankedRiskCell[]
    activeIndex: number | null
    onActivate: (index: number | null) => void
}
