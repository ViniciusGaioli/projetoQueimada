import type { SectionHeadingProps } from './SectionHeading.types'

export function SectionHeading({ children }: SectionHeadingProps) {
    return <h2 className="headline-type text-headline measure-wide">{children}</h2>
}
