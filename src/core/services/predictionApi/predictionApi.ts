import { predictionApiRevalidate, predictionApiTimeout, predictionApiUrl } from './predictionApi.constants'
import { PredictionApiError, type PredictionApiErrorBody, type PredictionApiRequest } from './predictionApi.types'

/**
 * Service de infraestrutura: fala HTTP com a API de predição em Python e
 * devolve JSON já parseado. Não sabe nada sobre risco de fogo, mapa ou célula,
 * essa tradução é responsabilidade do Model.
 *
 * Lança `PredictionApiError` em qualquer falha (rede, timeout, status de erro),
 * para o Controller traduzir em mensagem de usuário.
 */
export async function requestPrediction<T>({ path, query, revalidate }: PredictionApiRequest): Promise<T> {
    const url = new URL(path, predictionApiUrl)

    Object.entries(query ?? {}).forEach(([key, value]) => {
        if (value !== undefined) url.searchParams.set(key, String(value))
    })

    let response: Response

    try {
        response = await fetch(url, {
            signal: AbortSignal.timeout(predictionApiTimeout),
            next: { revalidate: revalidate ?? predictionApiRevalidate },
        })
    } catch (error) {
        const isTimeout = error instanceof Error && error.name === 'TimeoutError'

        throw new PredictionApiError(
            isTimeout ? 'A API de predição não respondeu no tempo esperado' : 'A API de predição está inacessível',
        )
    }

    if (!response.ok) {
        const body: PredictionApiErrorBody = await response.json().catch(() => ({}))

        throw new PredictionApiError(body.erro ?? `A API de predição respondeu ${response.status}`, response.status)
    }

    return response.json() as Promise<T>
}
