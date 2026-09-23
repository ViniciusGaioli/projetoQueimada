import type { RiskScaleProps } from './RiskScale.types'

export function RiskScale({ score, band, bands }: RiskScaleProps) {
    return (
        <div>
            <div className="flex items-end justify-between gap-6">
                <div>
                    <p className="label-mono">Risco estimado</p>
                    <p className="mt-3 font-display text-[clamp(3.5rem,9vw,5.5rem)] leading-[0.85] font-semibold tracking-tighter text-accent tabular-nums">
                        {score.toFixed(2)}
                    </p>
                </div>
                <p className="pb-2 font-display text-2xl font-medium tracking-tight text-content">{band.label}</p>
            </div>

            <div
                role="meter"
                aria-valuenow={Number(score.toFixed(2))}
                aria-valuemin={0}
                aria-valuemax={1}
                aria-label="Risco de fogo estimado"
                className="relative mt-7 h-px w-full bg-rule-strong"
            >
                <span
                    className="absolute inset-y-0 left-0 bg-accent transition-[width] duration-500 ease-out"
                    style={{ width: `${score * 100}%` }}
                />
                <span
                    aria-hidden
                    className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-accent transition-[left] duration-500 ease-out"
                    style={{ left: `${score * 100}%` }}
                />
            </div>

            <ul className="mt-4 flex justify-between">
                {bands.map(item => (
                    <li key={item.label} className={`label-mono ${item.label === band.label ? 'text-content' : ''}`}>
                        {item.label}
                    </li>
                ))}
            </ul>

            <p className="mt-8 border-t border-rule pt-5 text-[0.9375rem] leading-relaxed text-content-muted">
                {band.advice}
            </p>
        </div>
    )
}
