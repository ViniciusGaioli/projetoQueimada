import type { ReactNode } from 'react'

export interface SectionIntroProps {
    title: string
    /** Texto de abertura. Fica ao lado do título nas telas largas. */
    children?: ReactNode
}
