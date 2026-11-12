'use server'

import { revalidatePath } from 'next/cache'

import { mapRoute } from '@/modules/riskMap/riskMap.constants'

/**
 * Caso de uso da feature: descartar a resposta em cache da API de predição e
 * remontar a página com clima recém-lido.
 *
 * `revalidatePath` invalida o cache de dados da rota e já devolve o payload
 * novo na mesma navegação, então o botão não precisa mexer no router.
 */
export async function refreshRiskMap() {
    revalidatePath(mapRoute)
}
