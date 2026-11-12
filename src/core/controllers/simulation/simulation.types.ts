import type { BaseError, BaseResponse } from '@/core/controllers/controllers.types'
import type { Simulation, SimulationInput } from '@/core/models/simulation'

import type { simulationErrors } from './simulation.errors'

type SimulationErrorsKeys = keyof typeof simulationErrors

export type SimulationError = BaseError<(typeof simulationErrors)[SimulationErrorsKeys]>

export interface ISimulationController {
    getSimulation: (
        query: Partial<SimulationInput> & { model: string },
    ) => Promise<BaseResponse<Simulation> | SimulationError>
}
