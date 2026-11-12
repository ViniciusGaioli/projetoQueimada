import type { CityEntry } from '@/modules/riskMap/tools/cityIndex'
import type { ReferenceCity } from '@/modules/riskMap/riskMap.types'
import type { GeoBox, Projection } from '@/shared/tools/geoProjection'

export interface RegionOutlineInput {
    cities: CityEntry[]
    bounds: GeoBox
    projection: Projection
    /** Municípios que recebem destaque, por nome. */
    highlighted?: string[]
}

export interface RegionOutline {
    /** Atributo `d` com as divisas de todos os municípios visíveis. */
    path: string
    /** Rótulos a desenhar, só dos municípios centrados dentro do recorte. */
    markers: ReferenceCity[]
}
