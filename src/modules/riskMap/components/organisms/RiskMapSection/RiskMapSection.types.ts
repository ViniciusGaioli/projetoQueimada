import type { RiskMap } from '@/core/models/riskMap'
import type { ReferenceCity, RegionSection } from '@/modules/riskMap/riskMap.types'

export interface RiskMapSectionProps {
    map: RiskMap
    /** Textos da seção, de `regionSections`. */
    section: RegionSection
    /** Atributo `d` do contorno, projetado no servidor. */
    outline: string
    /** Cidades rotuladas sobre o mapa. */
    markers: ReferenceCity[]
    /** Municípios de cada célula, alinhado por índice com `map.cells`. */
    citiesByCell: string[][]
    /** Espessura do contorno; o zoom pede divisas mais finas. */
    outlineWidth?: number
    /** Divisa estadual, quando o recorte atravessa uma. */
    borderPath?: string
}
