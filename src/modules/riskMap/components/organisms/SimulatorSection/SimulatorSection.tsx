'use client'

import { MetaItem } from '@/modules/riskMap/components/atoms'
import { SimulationField } from '@/modules/riskMap/components/molecules'
import { simulationFields, simulatorSection } from '@/modules/riskMap/riskMap.constants'
import { toRiskLevel } from '@/modules/riskMap/tools'
import { FilterChip } from '@/shared/components/atoms'
import { SectionIntro } from '@/shared/components/molecules'

import { useSimulatorSection } from './SimulatorSection.hook'
import type { SimulatorSectionProps } from './SimulatorSection.types'

export function SimulatorSection({ model, initial, presets }: SimulatorSectionProps) {
    const { curves, fireRisk, handleChange, handlePreset, input, isEstimated, isPending, probability, ranges } =
        useSimulatorSection({ model, initial, presets })

    const level = toRiskLevel(probability)

    return (
        <section id="simulacao" className="shell scroll-mt-24 border-t border-rule py-20 lg:py-24">
            <div>
                <SectionIntro title={simulatorSection.title}>{simulatorSection.lead}</SectionIntro>

                <div className="mt-10 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-12">
                    <div>
                        <div
                            role="group"
                            aria-label="Condições prontas"
                            className="flex flex-wrap gap-2 border-b border-rule pb-6"
                        >
                            {presets.map(preset => (
                                <FilterChip key={preset.id} onClick={() => handlePreset(preset.input)}>
                                    {preset.label}
                                </FilterChip>
                            ))}
                        </div>

                        <div className="mt-2 grid gap-2 sm:grid-cols-2 sm:gap-x-10">
                            {simulationFields.map(spec => (
                                <SimulationField
                                    key={spec.key}
                                    spec={spec}
                                    value={input[spec.key]}
                                    range={ranges[spec.key]}
                                    curve={curves[spec.key]}
                                    onChange={handleChange}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="border border-rule bg-surface-raised p-6">
                        <div className="flex items-baseline justify-between gap-4">
                            <p className="label-mono">Probabilidade</p>
                            {isPending && <p className="label-mono text-accent">calculando…</p>}
                        </div>

                        <p
                            className={`mt-5 font-mono text-[clamp(2.5rem,6.2vw,3.5rem)] leading-[0.9] font-medium tracking-tight text-accent tabular-nums transition-opacity duration-200 ${
                                isEstimated ? 'opacity-50' : ''
                            }`}
                        >
                            {probability.toFixed(3)}
                        </p>

                        <p className="mt-4 font-display text-2xl tracking-[-0.01em] text-content">{level.label}</p>

                        <div
                            role="meter"
                            aria-valuenow={Number(probability.toFixed(3))}
                            aria-valuemin={0}
                            aria-valuemax={1}
                            aria-label="Probabilidade de incêndio simulada"
                            className="relative mt-5 h-px w-full bg-rule-strong"
                        >
                            <span
                                className="absolute inset-y-0 left-0 bg-accent transition-[width] duration-150 ease-out"
                                style={{ width: `${probability * 100}%` }}
                            />
                        </div>

                        <p className="mt-5 text-[0.9375rem] leading-relaxed text-content-muted">{level.advice}</p>

                        <div className="mt-6 flex flex-wrap gap-x-10 gap-y-4 border-t border-rule pt-5">
                            <MetaItem label="Risco de fogo (INPE)">{fireRisk.toFixed(3)}</MetaItem>
                            <MetaItem label="Modelo">{model}</MetaItem>
                        </div>

                        <p className="mt-5 text-[0.75rem] leading-relaxed text-content-faint">
                            Aqui a probabilidade aparece crua, sem o índice de 0 a 1 dos mapas: não há um recorte para
                            comparar, só esta combinação de condições.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    )
}
