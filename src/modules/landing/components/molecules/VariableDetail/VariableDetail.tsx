import type { VariableDetailProps } from './VariableDetail.types'

export function VariableDetail({ variable }: VariableDetailProps) {
    const isTarget = variable.group === 'alvo'

    return (
        <aside aria-live="polite" className="lg:sticky lg:top-28">
            <h3 className="font-display text-3xl font-medium tracking-tight text-content">{variable.label}</h3>

            <p className="mt-5 text-[0.9375rem] leading-relaxed text-content-muted">{variable.note}</p>

            <dl className="mt-8 grid grid-cols-2 gap-px border border-rule bg-rule">
                <div className="bg-surface px-4 py-3.5">
                    <dt className="label-mono">Tipo</dt>
                    <dd className="mt-1.5 font-mono text-sm text-content">{variable.type}</dd>
                </div>
                <div className="bg-surface px-4 py-3.5">
                    <dt className="label-mono">Exemplo</dt>
                    <dd className="mt-1.5 font-mono text-sm text-content">{variable.sample}</dd>
                </div>
            </dl>

            {isTarget && (
                <p className="mt-5 text-sm leading-relaxed text-content-muted">
                    Esta é a única coluna que o modelo <span className="text-content">não recebe</span> na hora de
                    prever. Ele aprende a reconstruí-la a partir das outras dez.
                </p>
            )}
        </aside>
    )
}
