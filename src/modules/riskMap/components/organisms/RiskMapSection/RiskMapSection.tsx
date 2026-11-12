'use client'

import { HeatLegend } from '@/modules/riskMap/components/atoms'
import { CellReadout, MapMeta, MapOutline, RiskGrid, RiskRanking } from '@/modules/riskMap/components/molecules'
import { SectionIntro } from '@/shared/components/molecules'

import { useRiskMapSection } from './RiskMapSection.hook'
import type { RiskMapSectionProps } from './RiskMapSection.types'

export function RiskMapSection({
    map,
    section,
    outline,
    markers,
    citiesByCell,
    outlineWidth,
    borderPath,
}: RiskMapSectionProps) {
    const {
        activeCell,
        activeCities,
        activeIndex,
        average,
        cells,
        clipId,
        handleHover,
        handlePin,
        handleRefresh,
        isPinned,
        isRefreshing,
        observed,
        projection,
        ranking,
    } = useRiskMapSection({ map, section, outline, markers, citiesByCell })

    return (
        <section id={map.region} className="shell scroll-mt-24 border-t border-rule py-20 lg:py-24">
            <div>
                <SectionIntro title={section.title}>{section.lead}</SectionIntro>

                <div className="mt-10">
                    <MapMeta map={map} cellCount={cells.length} isRefreshing={isRefreshing} onRefresh={handleRefresh} />
                </div>

                <div className="mt-10 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-12">
                    <div>
                        <svg
                            viewBox={`0 0 ${projection.width} ${projection.height}`}
                            role="img"
                            aria-label={`Mapa de risco de ${map.regionName} com ${cells.length} células, em índice de 0 a 1. Índice médio de ${average.toFixed(2)}.`}
                            className={`w-full transition-opacity duration-300 ${isRefreshing ? 'opacity-40' : ''}`}
                        >
                            <defs>
                                {/* Recorta a grade no contorno: as células das
                                    bordas têm centro dentro da área, mas
                                    passariam do traçado. */}
                                <clipPath id={clipId}>
                                    <path d={outline} />
                                </clipPath>
                            </defs>

                            <g clipPath={`url(#${clipId})`}>
                                <RiskGrid
                                    cells={cells}
                                    projection={projection}
                                    step={map.step}
                                    activeIndex={activeIndex}
                                    onActivate={handleHover}
                                />
                            </g>

                            <MapOutline
                                path={outline}
                                markers={markers}
                                projection={projection}
                                strokeWidth={outlineWidth}
                                borderPath={borderPath}
                            />
                        </svg>

                        <div className="mt-8">
                            <HeatLegend observed={observed} />
                        </div>
                    </div>

                    <div className="flex flex-col gap-10">
                        {activeCell ? (
                            <CellReadout cell={activeCell} cities={activeCities} isPinned={isPinned} />
                        ) : (
                            <div className="border border-rule border-dashed p-6">
                                <p className="label-mono">Leitura da célula</p>
                                <p className="mt-4 text-[0.9375rem] leading-relaxed text-content-muted">
                                    Passe o ponteiro sobre o mapa, ou escolha uma célula na lista abaixo, para ver o
                                    índice, os municípios contidos nela e as condições que geraram a previsão.
                                </p>
                            </div>
                        )}

                        <RiskRanking cells={ranking} activeIndex={activeIndex} onActivate={handlePin} />
                    </div>
                </div>
            </div>
        </section>
    )
}
