import type { ComponentProps } from 'react'

export interface RangeControlProps extends Omit<ComponentProps<'input'>, 'type'> {
    label: string
    readout: string
}
