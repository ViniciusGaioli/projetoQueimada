'use client'

import { useId } from 'react'

import { ResponseCurve } from '@/modules/riskMap/components/atoms'
import { RangeControl } from '@/shared/components/molecules'

import type { SimulationFieldProps } from './SimulationField.types'

export function SimulationField({ spec, value, range, curve, onChange }: SimulationFieldProps) {
    const id = useId()
    const [min, max] = range

    return (
        <div className="border-t border-rule pt-5">
            <RangeControl
                id={id}
                label={spec.label}
                readout={`${value.toFixed(spec.decimals)}${spec.unit && ` ${spec.unit}`}`}
                min={min}
                max={max}
                step={spec.step}
                value={value}
                onChange={event => onChange(spec.key, Number(event.target.value))}
            />

            {curve.length > 0 && (
                <div className="mt-3">
                    <ResponseCurve points={curve} value={value} range={range} />
                </div>
            )}

            <p className="mt-2 text-[0.75rem] leading-snug text-content-faint">{spec.note}</p>
        </div>
    )
}
