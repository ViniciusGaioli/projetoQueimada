import Image from 'next/image'

import type { StackColumnProps } from './StackColumn.types'

export function StackColumn({ layer }: StackColumnProps) {
    return (
        <div>
            <h3 className="border-b border-rule-strong pb-4 font-display text-xl font-medium tracking-tight text-content">
                {layer.title}
            </h3>

            <ul>
                {layer.items.map(item => (
                    <li
                        key={item.name}
                        className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-x-5 border-b border-rule py-4"
                    >
                        <span className="flex h-7 items-center justify-center">
                            <Image
                                src={item.logo}
                                alt=""
                                unoptimized
                                className={`max-h-7 w-auto object-contain ${item.logoIsDark ? 'logo-invert-on-dark' : ''}`}
                            />
                        </span>

                        <span className="font-mono text-sm text-accent">{item.name}</span>
                    </li>
                ))}
            </ul>
        </div>
    )
}
