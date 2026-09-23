import type { RangeControlProps } from './RangeControl.types'

export function RangeControl({ label, readout, id, className = '', ...props }: RangeControlProps) {
    return (
        <div className={className}>
            <div className="flex items-baseline justify-between gap-4">
                <label htmlFor={id} className="label-mono">
                    {label}
                </label>
                <output htmlFor={id} className="font-mono text-sm text-content">
                    {readout}
                </output>
            </div>

            <input id={id} type="range" className="range-control mt-2.5" {...props} />
        </div>
    )
}
