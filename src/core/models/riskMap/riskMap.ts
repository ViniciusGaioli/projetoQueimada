import { requestPrediction } from '@/core/services/predictionApi'

import type { IRiskMapModel, RiskMap, RiskMapResponse } from './riskMap.types'

/**
 * Model do mapa de risco: pede a grade à API de predição e traduz a resposta
 * (snake_case, português) para o formato do domínio. É a única fronteira em que
 * os nomes da API aparecem; do Controller para cima só existe `RiskMap`.
 */
const toRiskMap = (response: RiskMapResponse): RiskMap => ({
    model: response.modelo,
    region: response.regiao,
    regionName: response.nome_da_regiao,
    date: response.data,
    isStale: response.defasado ?? false,
    generatedAt: response.gerado_em,
    step: response.passo,
    bounds: {
        latitudeMin: response.limites.latitude_min,
        latitudeMax: response.limites.latitude_max,
        longitudeMin: response.limites.longitude_min,
        longitudeMax: response.limites.longitude_max,
    },
    cells: response.celulas.map(cell => ({
        latitude: cell.latitude,
        longitude: cell.longitude,
        altitude: cell.altitude,
        probability: cell.probabilidade_de_incendio,
        fireRisk: cell.risco_fogo,
        drynessPeriod: cell.periodo_de_secura,
        rainfall: cell.precipitacao,
        temperature: cell.temperatura,
        humidity: cell.umidade,
    })),
})

export const getRiskMap: IRiskMapModel['getRiskMap'] = async ({ model, region, date }) => {
    const response = await requestPrediction<RiskMapResponse>({
        path: `/mapa/${encodeURIComponent(model)}`,
        query: { regiao: region, data: date },
    })

    return toRiskMap(response)
}

export const getModels: IRiskMapModel['getModels'] = async () => requestPrediction<string[]>({ path: '/modelos/' })
