import type { Metadata } from 'next'

import { MapPage } from '@/modules/riskMap/components/pages'
import { modelParam } from '@/modules/riskMap/riskMap.constants'

export const metadata: Metadata = {
    title: 'Mapa de risco ao vivo · Projeto Queimada',
    description:
        'Mapa de calor do estado de São Paulo com a probabilidade de incêndio prevista pelo modelo para cada célula, a partir do clima lido ao vivo.',
}

interface MapaProps {
    searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function Mapa({ searchParams }: MapaProps) {
    // Ler `searchParams` já torna a página dinâmica, o que antes era papel do
    // `await connection()`: o `next build` não tenta mais gerar esta rota
    // estaticamente e chamar a API de predição, que não está no ar durante o
    // build. O cache do `fetch` continua valendo, então a API segue protegida
    // pelos 30 minutos de revalidação.
    const model = (await searchParams)[modelParam]

    return <MapPage model={Array.isArray(model) ? model[0] : model} />
}
