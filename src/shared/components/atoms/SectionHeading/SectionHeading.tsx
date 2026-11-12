import type { SectionHeadingProps } from './SectionHeading.types'

export function SectionHeading({ children }: SectionHeadingProps) {
    return (
        <h2 className="font-display text-[clamp(1.625rem,2.8vw,2.125rem)] leading-tight tracking-[-0.01em] text-content">
            {children}
        </h2>
    )
}
