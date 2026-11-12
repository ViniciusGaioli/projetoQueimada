import type { BaseError, BaseResponse } from '@/core/controllers/controllers.types'
import type { RiskMap, RiskMapQuery } from '@/core/models/riskMap'

import type { riskMapErrors } from './riskMap.errors'

type RiskMapErrorsKeys = keyof typeof riskMapErrors

export type RiskMapError = BaseError<(typeof riskMapErrors)[RiskMapErrorsKeys]>

export interface IRiskMapController {
    getRiskMap: (query: RiskMapQuery) => Promise<BaseResponse<RiskMap> | RiskMapError>
    getModels: () => Promise<BaseResponse<string[]> | RiskMapError>
}
