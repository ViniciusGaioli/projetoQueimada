'use client'

import { MetaItem } from '@/modules/riskMap/components/atoms'
import { CitySearch } from '@/modules/riskMap/components/molecules'
import { citySection, readoutMeasures } from '@/modules/riskMap/riskMap.constants'
import { toHeatColor, toRiskLevel } from '@/modules/riskMap/tools'
import { SectionIntro } from '@/shared/components/molecules'

import { useCityLookupSection } from './CityLookupSection.hook'
import type { CityLookupSectionProps } from './CityLookupSection.types'

export function CityLookupSection({ cells, cityIndex, step, initialCity }: CityLookupSectionProps) {
    const { handleQueryChange, handleSelect, query, report, suggestions, selected } = useCityLookupSection({
        cells,
        cityIndex,
        step,
        initialCity,
    })

    const level = report && toRiskLevel(report.cell.score)
    const comparison = report && report.cell.score - report.average

    return (
        <section id="cidade" className="shell scroll-mt-24 border-t border-rule py-20 lg:py-24">
            <SectionIntro title={citySection.title}>{citySection.lead}</SectionIntro>

            <div className="mt-10 grid items-start gap-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-14">
                <CitySearch
                    query={query}
                    suggestions={suggestions}
                    selected={selected}
                    onQueryChange={handleQueryChange}
                    onSelect={handleSelect}
                />

                {report && level ? (
                    <div>
                        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-b border-rule pb-6">
                            <div className="flex items-end gap-5">
                                <span
                                    aria-hidden
                                    className="size-10 shrink-0"
                                    style={{ backgroundColor: toHeatColor(report.cell.score) }}
                                />

                                <p className="font-mono text-[clamp(2.5rem,6vw,3.5rem)] leading-[0.9] font-medium tracking-tight text-accent tabular-nums">
                                    {report.cell.score.toFixed(2)}
                                </p>
                            </div>

                            <p className="font-display text-2xl tracking-[-0.01em] text-content">{level.label}</p>
                        </div>

                        <p className="mt-5 text-[0.9375rem] leading-relaxed text-content-muted">{level.advice}</p>

                        <div className="mt-8 flex flex-wrap gap-x-12 gap-y-6">
                            <MetaItem label="Posição no estado">
                                {report.rank}º de {report.total}
                            </MetaItem>

                            <MetaItem label="Ante a média">
                                {comparison !== undefined && comparison >= 0 ? '+' : ''}
                                {comparison?.toFixed(2)}
                            </MetaItem>

                            <MetaItem label="Resolução">{(step * 111).toFixed(0)} km</MetaItem>
                        </div>

                        <dl className="mt-8 grid grid-cols-[minmax(0,1fr)_auto_2.25rem] items-baseline gap-x-3 gap-y-2.5 border-t border-rule pt-6 sm:grid-cols-[minmax(0,1fr)_auto_2.25rem_minmax(0,1fr)_auto_2.25rem] sm:gap-x-6">
                            {readoutMeasures
                                .filter(measure => report.cell[measure.key] !== null)
                                .map(measure => (
                                    <div key={measure.key} className="col-span-3 grid grid-cols-subgrid items-baseline">
                                        <dt className="text-[0.8125rem] text-content-muted">{measure.label}</dt>
                                        <dd className="text-right font-mono text-[0.8125rem] text-content tabular-nums">
                                            {report.cell[measure.key]?.toFixed(measure.decimals)}
                                        </dd>
                                        <dd className="font-mono text-[0.6875rem] tracking-wide text-content-faint">
                                            {measure.unit}
                                        </dd>
                                    </div>
                                ))}
                        </dl>

                        {report.neighbours.length > 0 && (
                            <div className="mt-8 border-t border-rule pt-6">
                                <p className="label-mono">
                                    A mesma célula cobre mais {report.neighbours.length}{' '}
                                    {report.neighbours.length === 1 ? 'município' : 'municípios'}
                                </p>

                                <p className="mt-2.5 text-[0.8125rem] leading-relaxed text-content-muted">
                                    {report.neighbours.join(', ')}
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="border border-rule border-dashed p-6">
                        <p className="label-mono">Nenhum município escolhido</p>
                        <p className="mt-4 text-[0.9375rem] leading-relaxed text-content-muted">
                            A busca cobre os municípios de São Paulo cobertos pela grade de hoje. Comece a digitar e
                            escolha um da lista.
                        </p>
                    </div>
                )}
            </div>
        </section>
    )
}
