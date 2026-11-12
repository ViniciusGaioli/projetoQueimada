'use client'

import { RiskMapSection } from '@/modules/riskMap/components/organisms'

import type { MapPageClientProps } from './MapPage.types'

export function MapPageClient({ view }: MapPageClientProps) {
    return <RiskMapSection {...view} />
}
