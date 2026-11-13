import type { RiskMap } from '@/core/models/riskMap'
import type { ReferenceCity, RegionSection } from '@/modules/riskMap/riskMap.types'

export interface MapPageProps {
    /**
     * Chave do modelo na API de predição, vinda da URL. Valor desconhecido —
     * ou ausente — cai no `defaultModel`.
     */
    model?: string
}

/** Tudo o que o cliente precisa para desenhar um recorte. */
export interface RegionView {
    map: RiskMap
    section: RegionSection
    outline: string
    markers: ReferenceCity[]
    outlineWidth: number
    citiesByCell: string[][]
    borderPath?: string
}

export interface MapPageClientProps {
    view: RegionView
}

export interface MapPageErrorProps {
    message: string
}
