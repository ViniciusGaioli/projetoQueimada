import type { RiskCell } from '@/core/models/riskMap'

import type { CityEntry, FlatRing } from './cityIndex.types'

/**
 * Chave da célula que contém uma coordenada.
 *
 * A grade do backend põe os centros em `m * passo + passo / 2`, com `m`
 * inteiro, então `floor(coordenada / passo)` devolve o mesmo `m` tanto para o
 * centro da célula quanto para qualquer ponto dentro dela — inclusive no
 * hemisfério sul, onde `floor` continua consistente e `round` não seria. A
 * folga de 1e-9 protege contra o erro de ponto flutuante na divisão.
 */
const toKey = (latitude: number, longitude: number, step: number) =>
    `${Math.floor(latitude / step + 1e-9)}|${Math.floor(longitude / step + 1e-9)}`

/** Ray casting sobre os anéis achatados do município. */
const isInside = (latitude: number, longitude: number, rings: FlatRing[]) => {
    let inside = false

    rings.forEach(ring => {
        const points = ring.length / 2

        for (let index = 0; index < points; index += 1) {
            const next = (index + 1) % points
            const x1 = ring[index * 2]
            const y1 = ring[index * 2 + 1]
            const x2 = ring[next * 2]
            const y2 = ring[next * 2 + 1]

            if (y1 > latitude === y2 > latitude) continue

            if (longitude < x1 + ((latitude - y1) * (x2 - x1)) / (y2 - y1)) inside = !inside
        }
    })

    return inside
}

/**
 * Para cada célula da grade, os municípios que ela cobre.
 *
 * Um município entra na célula por dois caminhos: o centro da célula cai dentro
 * do seu território, ou o centro do município cai dentro da célula. O primeiro
 * garante que nenhuma célula fique vazia — os municípios ladrilham o estado —, e
 * o segundo pega os municípios pequenos demais para conter o centro de qualquer
 * célula.
 *
 * Roda no servidor: a malha dos 645 municípios fica fora do bundle do cliente,
 * que recebe apenas os nomes já agrupados.
 */
export function groupCitiesByCell(cells: RiskCell[], step: number, cities: CityEntry[]): string[][] {
    const cellByKey = new Map<string, number>()

    cells.forEach((cell, index) => {
        cellByKey.set(toKey(cell.latitude, cell.longitude, step), index)
    })

    const grouped: Set<string>[] = cells.map(() => new Set())

    cities.forEach(([name, latitude, longitude, [latMin, lonMin, latMax, lonMax], rings]) => {
        let assigned = false
        const centerIndex = cellByKey.get(toKey(latitude, longitude, step))

        if (centerIndex !== undefined) {
            grouped[centerIndex].add(name)
            assigned = true
        }

        // A caixa envolvente descarta de imediato a quase totalidade dos pares
        // célula × município, deixando o ray casting só para os candidatos.
        cells.forEach((cell, index) => {
            if (cell.latitude < latMin || cell.latitude > latMax) return
            if (cell.longitude < lonMin || cell.longitude > lonMax) return

            if (isInside(cell.latitude, cell.longitude, rings)) {
                grouped[index].add(name)
                assigned = true
            }
        })

        if (assigned) return

        // Sobram os municípios de divisa, pequenos demais para conter o centro
        // de alguma célula e cujo próprio centro cai numa célula que a grade não
        // tem, porque o centro dela ficou fora do estado. Sem esta rede, eles
        // simplesmente não existiriam no mapa — Águas da Prata, metade da região
        // de estudo do projeto, é um deles em grades mais grossas.
        let nearest = -1
        let smallest = Infinity

        cells.forEach((cell, index) => {
            const distance = (cell.latitude - latitude) ** 2 + (cell.longitude - longitude) ** 2

            if (distance < smallest) {
                smallest = distance
                nearest = index
            }
        })

        // Um passo de folga: encosta na célula vizinha, nunca numa longe.
        if (nearest >= 0 && smallest <= (step * 1.5) ** 2) grouped[nearest].add(name)
    })

    return grouped.map(names => [...names].sort((first, second) => first.localeCompare(second, 'pt-BR')))
}
