'use client'

import { NavRail, ThemeToggle } from '@/modules/landing/components/molecules'

import { useSiteHeader } from './SiteHeader.hook'

export function SiteHeader() {
    const { activeId, isCondensed, entries } = useSiteHeader()

    return (
        <header
            className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${
                isCondensed ? 'border-rule bg-surface/85 backdrop-blur-md' : 'border-transparent'
            }`}
        >
            <div className="shell flex h-16 items-center justify-between gap-4 md:gap-8">
                <NavRail entries={entries} activeId={activeId} />

                <div className="shrink-0">
                    <ThemeToggle />
                </div>
            </div>
        </header>
    )
}
