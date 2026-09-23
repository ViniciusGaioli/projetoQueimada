import type { PipelineStep } from '@/modules/landing/landing.types'

export interface PipelineNodeProps {
    step: PipelineStep
    index: number
    isLast: boolean
}
