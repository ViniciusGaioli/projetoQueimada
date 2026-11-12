import type { Metadata } from 'next'
import { connection } from 'next/server'

import { MapPage } from '@/modules/riskMap/components/pages'

export const metadata: Metadata = {
    title: 'Mapa de risco ao vivo · Projeto Queimada',
    description:
        'Mapa de calor do estado de São Paulo com a probabilidade de incêndio prevista pelo modelo para cada célula, a partir do clima lido ao vivo.',
}

export default async function Mapa() {
    // Interrompe o prerender: sem isso o `next build` tentaria gerar esta
    // página estaticamente e chamaria a API de predição, que não está no ar
    // durante o build — o deploy nasceria com a tela de erro congelada.
    //
    // Ao contrário de `dynamic = 'force-dynamic'`, isto não desliga o cache do
    // `fetch`: a API continua protegida pelos 30 minutos de revalidação.
    await connection()

    return <MapPage />
}
