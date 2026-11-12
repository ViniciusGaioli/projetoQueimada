export interface GeoBox {
    latitudeMin: number
    latitudeMax: number
    longitudeMin: number
    longitudeMax: number
}

export interface GeoPoint {
    latitude: number
    longitude: number
}

export interface ProjectionOptions {
    /** Largura do sistema de coordenadas de saída (unidades do `viewBox`). */
    width?: number
    /** Margem interna, nas mesmas unidades. */
    padding?: number
}

export interface Projection {
    width: number
    height: number
    /** Converte uma coordenada geográfica em `[x, y]` do `viewBox`. */
    project: (point: GeoPoint) => [number, number]
    /** Converte uma extensão em graus de longitude em largura de `viewBox`. */
    scaleLongitude: (degrees: number) => number
    /** Converte uma extensão em graus de latitude em altura de `viewBox`. */
    scaleLatitude: (degrees: number) => number
}
