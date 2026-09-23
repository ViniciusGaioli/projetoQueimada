import type { DataVariable } from '@/modules/landing/landing.types'

export interface VariableRowProps {
    variable: DataVariable
    isActive: boolean
    onSelect: (field: string) => void
}
