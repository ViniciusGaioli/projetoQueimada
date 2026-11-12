/** Par `[longitude, latitude]`, a ordem que o GeoJSON usa. */
export type GeoCoordinate = number[]

export type GeoRing = GeoCoordinate[]

/**
 * Geometria de GeoJSON na forma frouxa em que ela chega de um arquivo externo:
 * o aninhamento de `coordinates` depende de `type`, então quem consome é que
 * estreita, em vez de o tipo prometer uma garantia que o arquivo não dá.
 */
export interface GeoGeometry {
    type: string
    /** `Polygon` é uma lista de anéis; `MultiPolygon`, uma lista de polígonos. */
    coordinates: unknown
}

export interface GeoFeature {
    geometry: GeoGeometry
}

export interface GeoFeatureCollection {
    features: GeoFeature[]
}
