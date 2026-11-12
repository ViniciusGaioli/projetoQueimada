import { curveHeight, curveWidth } from './ResponseCurve.constants'
import type { ResponseCurveProps } from './ResponseCurve.types'

/**
 * Como a probabilidade responde quando só esta variável muda.
 *
 * O eixo vertical é fixo de 0 a 1, não normalizado pela curva: o que importa
 * aqui é comparar a inclinação de uma variável com a das outras, e um eixo
 * elástico faria uma variação de 0,02 parecer igual a uma de 0,8.
 */
export function ResponseCurve({ points, value, range }: ResponseCurveProps) {
    const [min, max] = range
    const span = max - min || 1

    const toX = (input: number) => ((input - min) / span) * curveWidth
    const toY = (probability: number) => curveHeight - probability * curveHeight

    const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${toX(point[0])} ${toY(point[1])}`).join('')
    const area = `${path}L${toX(points[points.length - 1][0])} ${curveHeight}L${toX(points[0][0])} ${curveHeight}Z`

    return (
        <svg
            viewBox={`0 0 ${curveWidth} ${curveHeight}`}
            preserveAspectRatio="none"
            aria-hidden
            className="h-11 w-full"
        >
            <path d={area} fill="var(--color-accent)" opacity={0.12} />
            <path
                d={path}
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth={1.5}
                vectorEffect="non-scaling-stroke"
            />

            <line
                x1={toX(value)}
                x2={toX(value)}
                y1={0}
                y2={curveHeight}
                stroke="var(--color-content)"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    )
}
