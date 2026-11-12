import { requestPrediction } from '@/core/services/predictionApi'

import type { ISimulationModel, Simulation, SimulationField, SimulationResponse } from './simulation.types'

/** Nome de cada variável na API, que fala português e snake_case. */
const apiNames: Record<SimulationField, string> = {
    biome: 'bioma',
    dryDays: 'dias_sem_chuva',
    rainfall: 'precipitacao',
    humidity: 'umidade',
    temperature: 'temperatura',
}

const fields = Object.keys(apiNames) as SimulationField[]

const mapByField = <T>(source: Record<string, T>) =>
    Object.fromEntries(fields.map(field => [field, source[apiNames[field]]])) as Record<SimulationField, T>

const toSimulation = (response: SimulationResponse): Simulation => ({
    input: {
        biome: response.entrada.bioma,
        dryDays: response.entrada.dias_sem_chuva,
        rainfall: response.entrada.precipitacao,
        humidity: response.entrada.umidade,
        temperature: response.entrada.temperatura,
    },
    fireRisk: response.risco_fogo,
    probability: response.probabilidade_de_incendio,
    curves: mapByField(response.curvas),
    ranges: mapByField(response.faixas),
})

export const getSimulation: ISimulationModel['getSimulation'] = async ({ model, ...input }) => {
    const query = Object.fromEntries(
        fields.filter(field => input[field] !== undefined).map(field => [apiNames[field], input[field]]),
    )

    const response = await requestPrediction<SimulationResponse>({
        path: `/simular/${encodeURIComponent(model)}`,
        query,
        // A simulação é interativa e barata: guardar respostas antigas só
        // atrasaria a próxima leitura.
        revalidate: 0,
    })

    return toSimulation(response)
}
