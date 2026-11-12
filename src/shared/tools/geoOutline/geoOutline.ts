import type { Projection } from '@/shared/tools/geoProjection'

import type { GeoFeatureCollection, GeoRing } from './geoOutline.types'

/**
 * Converte os polígonos de um GeoJSON no atributo `d` de um `<path>` SVG,
 * usando a projeção recebida.
 *
 * Roda no servidor: o `d` resultante é ~8 KB de texto, contra os 13 KB do
 * GeoJSON mais o custo de percorrê-lo, então o browser recebe só o traçado
 * pronto e o arquivo de malha nunca entra no bundle do cliente.
 */
const ringToPath = (ring: GeoRing, projection: Projection, precision: number) =>
    ring
        .map(([longitude, latitude], index) => {
            const [x, y] = projection.project({ latitude, longitude })

            return `${index === 0 ? 'M' : 'L'}${x.toFixed(precision)} ${y.toFixed(precision)}`
        })
        .join('') + 'Z'

export function createOutlinePath(collection: GeoFeatureCollection, projection: Projection, precision = 1) {
    return collection.features
        .flatMap(({ geometry }) => {
            const polygons = (
                geometry.type === 'MultiPolygon' ? geometry.coordinates : [geometry.coordinates]
            ) as GeoRing[][]

            return polygons.flatMap(rings => rings.map(ring => ringToPath(ring, projection, precision)))
        })
        .join('')
}
