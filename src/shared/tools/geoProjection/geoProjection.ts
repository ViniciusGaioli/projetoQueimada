import type { GeoBox, Projection, ProjectionOptions } from './geoProjection.types'

/**
 * Projeção equirretangular com correção de cosseno na latitude central.
 *
 * Num recorte do tamanho de um estado, essa é a escolha certa: um grau de
 * longitude vale `cos(latitude)` grau de latitude em distância, e aplicar esse
 * fator único na longitude já corrige o achatamento de forma imperceptível no
 * recorte. Em troca, a grade continua sendo feita de retângulos de lado
 * constante, alinhados aos eixos, o que mantém o desenho das células trivial.
 *
 * Mercator só se justificaria num mapa de escala continental.
 */
export function createProjection(box: GeoBox, { width = 1000, padding = 0 }: ProjectionOptions = {}): Projection {
    const longitudeSpan = box.longitudeMax - box.longitudeMin
    const latitudeSpan = box.latitudeMax - box.latitudeMin

    const centerLatitude = (box.latitudeMax + box.latitudeMin) / 2
    const flattening = Math.cos((centerLatitude * Math.PI) / 180)

    const drawable = width - padding * 2
    const scale = drawable / (longitudeSpan * flattening)

    const height = latitudeSpan * scale + padding * 2

    return {
        width,
        height,
        project: ({ latitude, longitude }) => [
            padding + (longitude - box.longitudeMin) * flattening * scale,
            padding + (box.latitudeMax - latitude) * scale,
        ],
        scaleLongitude: degrees => degrees * flattening * scale,
        scaleLatitude: degrees => degrees * scale,
    }
}
