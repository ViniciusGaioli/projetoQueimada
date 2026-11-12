export interface PredictionApiRequest {
    path: string
    query?: Record<string, string | number | undefined>
    revalidate?: number
}

/** Formato de erro que a API devolve nos status 4xx e 5xx. */
export interface PredictionApiErrorBody {
    erro?: string
}

export class PredictionApiError extends Error {
    constructor(
        message: string,
        readonly status?: number,
    ) {
        super(message)
        this.name = 'PredictionApiError'
    }
}
