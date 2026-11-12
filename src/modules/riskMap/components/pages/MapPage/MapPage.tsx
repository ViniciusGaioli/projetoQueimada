import { getRiskMap } from '@/core/controllers/riskMap'
import { getSimulation } from '@/core/controllers/simulation'
import type { RiskMap } from '@/core/models/riskMap'
import type { SimulationInput } from '@/core/models/simulation'
import municipios from '@/modules/riskMap/assets/municipios.json'
import saoPaulo from '@/modules/riskMap/assets/saoPaulo.geo.json'
import { MapHeader, SimulatorSection } from '@/modules/riskMap/components/organisms'
import {
    canvasPadding,
    canvasWidth,
    defaultModel,
    focusCities,
    referenceCities,
    regions,
    regionSections,
    simulationPresets,
} from '@/modules/riskMap/riskMap.constants'
import { buildRegionOutline, groupCitiesByCell, type CityEntry } from '@/modules/riskMap/tools'
import { createOutlinePath, type GeoFeatureCollection } from '@/shared/tools/geoOutline'
import { createProjection } from '@/shared/tools/geoProjection'

import { MapPageClient } from './MapPage.client'
import { MapPageError } from './MapPage.error'
import type { MapPageProps, RegionView } from './MapPage.types'

const cities = municipios as CityEntry[]

/**
 * Monta o que o cliente precisa para desenhar um recorte.
 *
 * Tudo que depende de geometria pesada acontece aqui, no servidor: o contorno
 * vira um `d` pronto e os municípios viram nomes agrupados por célula. Nem a
 * malha do estado nem a dos 645 municípios entram no bundle do browser.
 */
function toRegionView(map: RiskMap): RegionView {
    const projection = createProjection(map.bounds, { width: canvasWidth, padding: canvasPadding })
    const isState = map.region === 'estado'

    // No estado, o contorno é o do estado e os rótulos são capitais regionais.
    // Aproximado, o que situa o olho são as divisas e os nomes dos municípios.
    const { path, markers } = isState
        ? { path: createOutlinePath(saoPaulo as GeoFeatureCollection, projection), markers: referenceCities }
        : buildRegionOutline({ cities, bounds: map.bounds, projection, highlighted: focusCities })

    return {
        map,
        section: regionSections[map.region as (typeof regions)[number]],
        outline: path,
        markers,
        outlineWidth: isState ? 1.5 : 1,
        citiesByCell: groupCitiesByCell(map.cells, map.step, cities),
        // O recorte da serra atravessa a divisa com Minas, e a linha precisa
        // aparecer: é onde a predição passa a cair fora do estado de onde vieram
        // os dados de treino.
        borderPath: isState ? undefined : createOutlinePath(saoPaulo as GeoFeatureCollection, projection),
    }
}

/** Mediana de uma grandeza entre as células, resistente a um extremo solto. */
const median = (values: number[]) => {
    const sorted = [...values].sort((first, second) => first - second)

    return sorted[Math.floor(sorted.length / 2)]
}

/**
 * Condições típicas de um recorte, para o simulador começar de algo real em vez
 * de um conjunto de números inventado.
 */
function toPresetInput(map: RiskMap): SimulationInput {
    return {
        biome: 2.5,
        dryDays: Math.round(median(map.cells.map(cell => cell.drynessPeriod))),
        rainfall: Number(median(map.cells.map(cell => cell.rainfall)).toFixed(1)),
        temperature: Number(median(map.cells.map(cell => cell.temperature)).toFixed(1)),
        humidity: Math.round(median(map.cells.map(cell => cell.humidity))),
    }
}

/** Server Component: busca um recorte e prepara o desenho dele. */
export async function MapPage({ model = defaultModel }: MapPageProps) {
    const results = await Promise.all(regions.map(region => getRiskMap({ model, region })))

    const views = results.flatMap(result => ('error' in result ? [] : [toRegionView(result.payload)]))
    const failure = results.find(result => 'error' in result)

    // O simulador começa nas condições medianas da serra, ligando-o aos mapas
    // acima em vez de abrir com números arbitrários.
    const serra = views.find(view => view.map.region === 'serra')
    const serraInput = serra && toPresetInput(serra.map)

    const presets = serraInput
        ? [{ id: 'serra', label: 'Serra agora', input: serraInput }, ...simulationPresets]
        : simulationPresets

    const simulation = await getSimulation({ model, ...presets[0].input })

    return (
        <>
            <MapHeader />
            <main>
                {views.map(view => (
                    <MapPageClient key={view.map.region} view={view} />
                ))}

                {!('error' in simulation) && (
                    <SimulatorSection model={model} initial={simulation.payload} presets={presets} />
                )}

                {failure && 'error' in failure && <MapPageError message={failure.error} />}
            </main>
        </>
    )
}
