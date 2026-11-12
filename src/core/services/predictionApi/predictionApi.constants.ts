/**
 * Endereço da API de predição em Python (Flask). Só é lido no servidor, então a
 * variável não leva o prefixo `NEXT_PUBLIC_`: o browser nunca fala com ela
 * direto, o que dispensa CORS e mantém a API fora da internet pública.
 */
export const predictionApiUrl = process.env.PREDICTION_API_URL ?? 'http://127.0.0.1:5000'

/**
 * A grade inteira passa por um `predict_proba` de um GaussianProcessClassifier
 * com 6.416 pontos de treino e, quando o cache do dia está frio, por centenas de
 * chamadas ao Open-Meteo. Daí o tempo generoso.
 */
export const predictionApiTimeout = 180_000

/** Tempo que a resposta da API fica no cache de dados do Next. */
export const predictionApiRevalidate = 1_800
