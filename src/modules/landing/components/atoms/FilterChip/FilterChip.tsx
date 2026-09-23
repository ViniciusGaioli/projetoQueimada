import type { FilterChipProps } from './FilterChip.types'

export function FilterChip({ isActive = false, className = '', ...props }: FilterChipProps) {
    return (
        <button
            type="button"
            aria-pressed={isActive}
            className={`label-mono border px-3 py-1.5 transition-colors duration-200 ${
                isActive
                    ? 'border-accent text-accent'
                    : 'border-rule-strong text-content-muted hover:border-content-faint hover:text-content'
            } ${className}`}
            {...props}
        />
    )
}
