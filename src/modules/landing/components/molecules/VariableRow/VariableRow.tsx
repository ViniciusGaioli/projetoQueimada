import type { VariableRowProps } from './VariableRow.types'

export function VariableRow({ variable, isActive, onSelect }: VariableRowProps) {
    const isTarget = variable.group === 'alvo'

    return (
        <button
            type="button"
            onClick={() => onSelect(variable.field)}
            aria-pressed={isActive}
            className={`group grid w-full grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-1 border-b border-rule py-3.5 text-left transition-colors duration-200 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,0.8fr)_minmax(0,1fr)] ${
                isActive ? 'bg-surface-raised' : 'hover:bg-surface-raised'
            }`}
        >
            <span className="flex items-center gap-2.5 px-2 font-mono text-sm text-content">
                <span
                    aria-hidden
                    className={`size-1 shrink-0 ${isTarget || isActive ? 'bg-accent' : 'bg-content-faint'}`}
                />
                {variable.field}
            </span>
            <span className="label-mono px-2 text-right sm:text-left">{variable.type}</span>
            <span className="col-span-2 px-2 font-mono text-sm text-content-faint group-hover:text-content-muted sm:col-span-1 sm:text-right">
                {variable.sample}
            </span>
        </button>
    )
}
