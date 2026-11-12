import type { StaticImageData } from 'next/image'

export type DataGroup = 'temporal' | 'observacao' | 'espacial' | 'ambiental' | 'alvo'

export interface DataVariable {
    field: string
    label: string
    type: string
    sample: string
    group: DataGroup
    note: string
}

export interface StackItem {
    name: string
    /** Sem logo, o item sai como texto — nem toda ferramenta tem uma marca. */
    logo?: StaticImageData
    logoIsDark?: boolean
    /** O que essa peça faz aqui, quando não é óbvio pelo nome. */
    role?: string
}

export interface StackLayer {
    title: string
    items: StackItem[]
}

export interface PipelineStep {
    tool: string
    title: string
    summary: string
}

/** Uma decisão de arquitetura, com o motivo que a sustenta. */
export interface ArchitectureNote {
    title: string
    detail: string
}

export interface NavEntry {
    id: string
    label: string
    /** Destino externo à página. Sem ele, o item navega para a âncora `#id`. */
    href?: string
    /** Destaca o item como chamada principal. */
    isHighlighted?: boolean
}
