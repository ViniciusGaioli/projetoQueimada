import type { ReferenceCity } from '@/modules/riskMap/riskMap.types'
import type { Projection } from '@/shared/tools/geoProjection'

export interface MapOutlineProps {
    /** Atributo `d` do contorno, já projetado no servidor. */
    path: string
    /** Cidades rotuladas sobre o mapa. */
    markers: ReferenceCity[]
    projection: Projection
    /** Espessura do traço; o zoom pede divisas mais finas que o do estado. */
    strokeWidth?: number
    /**
     * Divisa estadual, quando o recorte atravessa uma. Sai tracejada e mais
     * forte que as divisas municipais: é a linha a partir da qual o modelo
     * passa a prever fora do estado de onde vieram os dados de treino.
     */
    borderPath?: string
}
