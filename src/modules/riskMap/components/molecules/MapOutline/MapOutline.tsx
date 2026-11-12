import type { MapOutlineProps } from './MapOutline.types'

export function MapOutline({ path, markers, projection, strokeWidth = 1.5, borderPath }: MapOutlineProps) {
    return (
        <>
            <path
                d={path}
                fill="none"
                stroke="var(--color-rule-strong)"
                strokeWidth={strokeWidth}
                strokeLinejoin="round"
                pointerEvents="none"
            />

            {borderPath && (
                <path
                    d={borderPath}
                    fill="none"
                    stroke="var(--color-content-muted)"
                    strokeWidth={3}
                    strokeDasharray="12 7"
                    strokeLinejoin="round"
                    pointerEvents="none"
                />
            )}

            <g pointerEvents="none">
                {markers.map(marker => {
                    const [x, y] = projection.project(marker)
                    const toStart = marker.anchor === 'end'

                    return (
                        <g key={marker.name}>
                            <rect
                                x={x - 2.5}
                                y={y - 2.5}
                                width={5}
                                height={5}
                                transform={`rotate(45 ${x} ${y})`}
                                fill={marker.isFocus ? 'var(--color-accent)' : 'var(--color-content)'}
                                stroke="var(--color-surface)"
                                strokeWidth={1.5}
                                paintOrder="stroke"
                            />

                            {/* Em telas estreitas o rótulo ficaria ilegível, já que
                                o texto acompanha a escala do viewBox. */}
                            <text
                                x={toStart ? x - 8 : x + 8}
                                y={y + 4}
                                textAnchor={toStart ? 'end' : 'start'}
                                fontSize={13}
                                letterSpacing={0.6}
                                className="hidden font-mono uppercase md:[display:inline]"
                                fill={marker.isFocus ? 'var(--color-accent)' : 'var(--color-content)'}
                                // Contorno na cor do fundo: o rótulo passa por cima de
                                // células de qualquer cor da rampa e continua legível.
                                stroke="var(--color-surface)"
                                strokeWidth={3}
                                strokeLinejoin="round"
                                paintOrder="stroke"
                            >
                                {marker.name}
                            </text>
                        </g>
                    )
                })}
            </g>
        </>
    )
}
