'use server'

import { getSimulation as getSimulationModel } from '@/core/models/simulation'
import { PredictionApiError } from '@/core/services/predictionApi'

import { simulationErrors } from './simulation.errors'
import type { ISimulationController } from './simulation.types'

export const getSimulation: ISimulationController['getSimulation'] = async query => {
    if (!query.model) return { error: simulationErrors.modelIsRequired }

    try {
        return { message: 'Simulação concluída', payload: await getSimulationModel(query) }
    } catch (error) {
        if (!(error instanceof PredictionApiError)) throw error

        if (error.status === 404) return { error: simulationErrors.modelNotFound }
        if (error.status === undefined) return { error: simulationErrors.apiUnreachable }

        return { error: simulationErrors.simulationFailed }
    }
}
