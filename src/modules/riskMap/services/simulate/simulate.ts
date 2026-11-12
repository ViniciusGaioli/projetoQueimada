'use server'

import { getSimulation } from '@/core/controllers/simulation'
import type { Simulation, SimulationInput } from '@/core/models/simulation'

/**
 * Caso de uso da feature: pedir uma simulação ao modelo.
 *
 * Devolve `null` em vez de propagar o erro — o simulador é interativo e uma
 * falha de rede no meio de um arraste não deve derrubar a seção; a interface
 * simplesmente segue mostrando a última resposta boa.
 */
export async function simulate(input: SimulationInput & { model: string }): Promise<Simulation | null> {
    const result = await getSimulation(input)

    return 'error' in result ? null : result.payload
}
