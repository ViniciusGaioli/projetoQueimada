import type { CurvePoint } from '@/core/models/simulation'

export interface ResponseCurveProps {
    /** Pontos `[valor, probabilidade]` devolvidos pela API. */
    points: CurvePoint[]
    /** Valor atual da variável, marcado sobre a curva. */
    value: number
    /** Faixa da variável, para posicionar no eixo horizontal. */
    range: [number, number]
}
