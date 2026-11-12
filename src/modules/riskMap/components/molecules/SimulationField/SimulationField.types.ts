import type { CurvePoint, SimulationField as FieldKey } from '@/core/models/simulation'
import type { SimulationFieldSpec } from '@/modules/riskMap/riskMap.types'

export interface SimulationFieldProps {
    spec: SimulationFieldSpec
    value: number
    range: [number, number]
    curve: CurvePoint[]
    onChange: (field: FieldKey, value: number) => void
}
