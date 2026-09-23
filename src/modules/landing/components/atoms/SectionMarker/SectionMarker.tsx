import type { SectionMarkerProps } from './SectionMarker.types'

export function SectionMarker({ index, title }: SectionMarkerProps) {
    return (
        <div className="flex items-baseline gap-3 lg:sticky lg:top-28 lg:flex-col lg:items-start lg:gap-3">
            <span className="label-mono text-accent">{index}</span>
            <span className="label-mono">{title}</span>
        </div>
    )
}
