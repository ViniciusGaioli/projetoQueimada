/** Uma célula da grade, já traduzida para o domínio. */
export interface RiskCell {
    latitude: number
    longitude: number
    /** Probabilidade de incêndio prevista pelo modelo, de 0 a 1. */
    probability: number
    /** Índice de risco de fogo do INPE calculado para o ponto. */
    fireRisk: number
    /** Altitude do ponto, em metros. */
    altitude: number | null
    /** Período de secura (PSE), em dias equivalentes. */
    drynessPeriod: number
    /** Precipitação do dia, em mm. */
    rainfall: number
    /** Temperatura média do dia, em °C. */
    temperature: number
    /** Umidade relativa média do dia, em %. */
    humidity: number
}

export interface GeoBounds {
    latitudeMin: number
    latitudeMax: number
    longitudeMin: number
    longitudeMax: number
}

export interface RiskMap {
    /** Identificador do modelo que gerou a predição, ex. `gpc_2026`. */
    model: string
    /** Recorte geográfico pedido à API, ex. `estado` ou `serra`. */
    region: string
    /** Nome do recorte para leitura humana, ex. `Serra da Paulista`. */
    regionName: string
    /** Dia previsto, em ISO (`2026-11-11`). */
    date: string
    /**
     * Verdadeiro quando o clima de hoje não pôde ser montado e a API caiu para
     * o de um dia anterior. `date` diz de qual dia os dados são.
     */
    isStale: boolean
    /** Momento em que a API montou a grade, em ISO com fuso. */
    generatedAt: string
    /** Lado da célula, em graus. */
    step: number
    bounds: GeoBounds
    cells: RiskCell[]
}

export interface RiskMapQuery {
    model: string
    /** Recorte geográfico. A região define o passo da grade. */
    region?: string
    date?: string
}

/** Resposta crua da API em Python, em snake_case e português. */
export interface RiskMapResponse {
    modelo: string
    regiao: string
    nome_da_regiao: string
    data: string
    defasado: boolean
    gerado_em: string
    passo: number
    limites: {
        latitude_min: number
        latitude_max: number
        longitude_min: number
        longitude_max: number
    }
    celulas: {
        latitude: number
        longitude: number
        altitude: number | null
        probabilidade_de_incendio: number
        risco_fogo: number
        periodo_de_secura: number
        precipitacao: number
        temperatura: number
        umidade: number
    }[]
}

export interface IRiskMapModel {
    getRiskMap: (query: RiskMapQuery) => Promise<RiskMap>
    getModels: () => Promise<string[]>
}
