import type { MetaItemProps } from './MetaItem.types'

export function MetaItem({ label, children }: MetaItemProps) {
    return (
        <div>
            <p className="label-mono">{label}</p>
            <p className="mt-1.5 font-mono text-[0.8125rem] text-content tabular-nums">{children}</p>
        </div>
    )
}
