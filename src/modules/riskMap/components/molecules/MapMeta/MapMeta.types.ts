import type { RiskMap } from '@/core/models/riskMap'

export interface MapMetaProps {
    map: RiskMap
    cellCount: number
    isRefreshing: boolean
    onRefresh: () => void
}
