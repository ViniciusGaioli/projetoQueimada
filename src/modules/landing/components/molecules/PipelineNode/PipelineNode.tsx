import type { PipelineNodeProps } from './PipelineNode.types'

export function PipelineNode({ step, index, isLast }: PipelineNodeProps) {
    return (
        <li className="relative flex gap-6 pb-10 lg:flex-col lg:gap-5 lg:pb-0">
            <div className="flex flex-col items-center lg:w-full lg:flex-row lg:items-center">
                <span className="relative z-10 size-2 shrink-0 rotate-45 bg-accent" />
                {!isLast && (
                    <span
                        aria-hidden
                        className="w-px flex-1 bg-linear-to-b from-rule-strong to-rule lg:h-px lg:w-full lg:bg-linear-to-r"
                    />
                )}
            </div>

            <div className="-mt-1 flex-1 lg:mt-0 lg:pr-8">
                <p className="label-mono text-accent">
                    {String(index + 1).padStart(2, '0')} · {step.tool}
                </p>
                <h3 className="mt-2.5 font-display text-2xl font-medium tracking-tight text-content">{step.title}</h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-content-muted">{step.summary}</p>
            </div>
        </li>
    )
}
