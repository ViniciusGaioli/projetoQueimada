import type { FlatRing } from '@/modules/riskMap/tools/cityIndex'

import { labelSpacing } from './regionOutline.constants'
import type { RegionOutline, RegionOutlineInput } from './regionOutline.types'

/** Converte um anel achatado `[lon, lat, …]` em um subcaminho fechado. */
const ringToPath = (ring: FlatRing, project: RegionOutlineInput['projection']['project'], precision: number) => {
    let path = ''

    for (let index = 0; index < ring.length; index += 2) {
        const [x, y] = project({ longitude: ring[index], latitude: ring[index + 1] })

        path += `${index === 0 ? 'M' : 'L'}${x.toFixed(precision)} ${y.toFixed(precision)}`
    }

    return `${path}Z`
}

/**
 * Divisas municipais e rótulos de um recorte aproximado.
 *
 * Num zoom regional o contorno do estado não serve de referência — ele mal
 * aparece. O que situa o olho são os municípios, que o projeto já carrega para
 * dizer o que cada célula cobre.
 *
 * Roda no servidor: devolve um `d` pronto e uma lista de nomes, de modo que a
 * malha não entra no bundle do cliente.
 */
export function buildRegionOutline({
    cities,
    bounds,
    projection,
    highlighted = [],
}: RegionOutlineInput): RegionOutline {
    // Desenha todo município que encosta no recorte, para a divisa não terminar
    // no ar na borda do mapa.
    const visible = cities.filter(
        ([, , , [latMin, lonMin, latMax, lonMax]]) =>
            latMax >= bounds.latitudeMin &&
            latMin <= bounds.latitudeMax &&
            lonMax >= bounds.longitudeMin &&
            lonMin <= bounds.longitudeMax,
    )

    const path = visible
        .flatMap(([, , , , rings]) => rings.map(ring => ringToPath(ring, projection.project, 1)))
        .join('')

    // Rotula só os municípios centrados dentro do recorte: os de borda teriam o
    // nome escrito fora do mapa.
    const candidates = visible
        .filter(
            ([, latitude, longitude]) =>
                latitude >= bounds.latitudeMin &&
                latitude <= bounds.latitudeMax &&
                longitude >= bounds.longitudeMin &&
                longitude <= bounds.longitudeMax,
        )
        .map(([name, latitude, longitude]) => {
            const [x, y] = projection.project({ latitude, longitude })

            return {
                name,
                latitude,
                longitude,
                x,
                y,
                isFocus: highlighted.includes(name),
                // O rótulo cresce para dentro do mapa, nunca para fora da borda.
                anchor: x > projection.width / 2 ? ('end' as const) : ('start' as const),
            }
        })
        // Os municípios em destaque entram primeiro e nunca são descartados.
        .sort((first, second) => Number(second.isFocus) - Number(first.isFocus))

    // Descarta rótulos que cairiam em cima de um já aceito. Sem isso, vizinhos
    // próximos escrevem um por cima do outro e nenhum dos dois se lê.
    const placed: typeof candidates = []

    candidates.forEach(candidate => {
        const collides = placed.some(
            other =>
                Math.abs(other.x - candidate.x) < labelSpacing.x && Math.abs(other.y - candidate.y) < labelSpacing.y,
        )

        if (!collides) placed.push(candidate)
    })

    const markers = placed.map(({ name, latitude, longitude, isFocus, anchor }) => ({
        name,
        latitude,
        longitude,
        isFocus,
        anchor,
    }))

    return { path, markers }
}
