/** Condições informadas pelo usuário. */
export interface SimulationInput {
    /** Fator de vegetação: 1.7 mata atlântica, 3 cerrado. */
    biome: number
    dryDays: number
    rainfall: number
    humidity: number
    temperature: number
}

/** Chave de uma variável simulável. */
export type SimulationField = keyof SimulationInput

/** Um ponto da curva de resposta: `[valor da variável, probabilidade]`. */
export type CurvePoint = [number, number]

export interface Simulation {
    /** As condições efetivamente usadas, já presas às faixas válidas. */
    input: SimulationInput
    /** Índice de risco de fogo do INPE calculado para essas condições. */
    fireRisk: number
    /** Probabilidade de incêndio que o modelo devolve. */
    probability: number
    /**
     * Para cada variável, como a probabilidade responde quando só ela varia.
     *
     * Vem junto porque é quase de graça: o custo de um `predict_proba` é
     * dominado pelo kernel contra os 6.416 pontos de treino, então 206 linhas
     * custam o mesmo que uma. É o que deixa o formulário responder sem rede.
     */
    curves: Record<SimulationField, CurvePoint[]>
    /** Mínimo e máximo de cada variável. */
    ranges: Record<SimulationField, [number, number]>
}

/** Resposta crua da API, em snake_case e português. */
export interface SimulationResponse {
    entrada: {
        bioma: number
        dias_sem_chuva: number
        precipitacao: number
        umidade: number
        temperatura: number
    }
    risco_fogo: number
    probabilidade_de_incendio: number
    curvas: Record<string, CurvePoint[]>
    faixas: Record<string, [number, number]>
}

export interface ISimulationModel {
    getSimulation: (input: Partial<SimulationInput> & { model: string }) => Promise<Simulation>
}
