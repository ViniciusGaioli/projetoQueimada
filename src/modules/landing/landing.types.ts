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
    logo: StaticImageData
    logoIsDark?: boolean
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

export interface NavEntry {
    id: string
    label: string
}

export interface RiskBand {
    threshold: number
    label: string
    advice: string
}
