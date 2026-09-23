import type { RiskBand } from '@/modules/landing/landing.types'

export interface RiskScaleProps {
    score: number
    band: RiskBand
    bands: RiskBand[]
}
