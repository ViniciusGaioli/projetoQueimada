'use server'

import { getModels as getModelsModel, getRiskMap as getRiskMapModel } from '@/core/models/riskMap'
import { PredictionApiError } from '@/core/services/predictionApi'

import { riskMapErrors } from './riskMap.errors'
import type { IRiskMapController, RiskMapError } from './riskMap.types'

/**
 * Traduz a falha de infraestrutura na mensagem que o usuário lê. Qualquer erro
 * que não seja da API de predição sobe, porque aí é defeito nosso, não do
 * ambiente.
 */
const toRiskMapError = (error: unknown, fallback: string): RiskMapError => {
    if (!(error instanceof PredictionApiError)) throw error

    if (error.status === 404) return { error: riskMapErrors.modelNotFound }
    if (error.status === 503) return { error: riskMapErrors.weatherUnavailable }
    if (error.status === undefined) return { error: riskMapErrors.apiUnreachable }

    return { error: fallback }
}

export const getRiskMap: IRiskMapController['getRiskMap'] = async query => {
    if (!query.model) return { error: riskMapErrors.modelIsRequired }

    try {
        return {
            message: 'Mapa de risco carregado com sucesso',
            payload: await getRiskMapModel(query),
        }
    } catch (error) {
        return toRiskMapError(error, riskMapErrors.mapNotLoaded)
    }
}

export const getModels: IRiskMapController['getModels'] = async () => {
    try {
        return { message: 'Modelos carregados com sucesso', payload: await getModelsModel() }
    } catch (error) {
        return toRiskMapError(error, riskMapErrors.apiUnreachable)
    }
}
