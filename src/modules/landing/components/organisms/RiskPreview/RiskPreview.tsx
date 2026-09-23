'use client'

import { FilterChip, SectionHeading, SectionMarker } from '@/modules/landing/components/atoms'
import { RangeControl, RiskScale } from '@/modules/landing/components/molecules'

import { useRiskPreview } from './RiskPreview.hook'

export function RiskPreview() {
    const {
        band,
        bands,
        biome,
        biomes,
        dryDays,
        handleBiomeChange,
        handleDryDaysChange,
        handleRainfallChange,
        inputVector,
        rainfall,
        score,
    } = useRiskPreview()

    return (
        <section id="previa" className="shell section-grid scroll-mt-24 py-24 lg:py-32">
            <SectionMarker index="04" title="Prévia" />

            <div>
                <SectionHeading>A resposta é um índice de 0 a 1, com faixa e recomendação.</SectionHeading>

                <p className="prose-lede measure-wide mt-8">
                    Mova as condições do terreno abaixo e acompanhe como o valor se desloca na escala.
                </p>

                <div className="mt-14 grid gap-x-16 gap-y-14 border border-rule bg-surface-raised p-7 sm:p-10 lg:grid-cols-2">
                    <div>
                        <div className="flex flex-col gap-8">
                            <RangeControl
                                id="preview-dias-sem-chuva"
                                label="dias_sem_chuva"
                                readout={`${dryDays} dias`}
                                min={0}
                                max={60}
                                step={1}
                                value={dryDays}
                                onChange={event => handleDryDaysChange(event.target.value)}
                            />

                            <RangeControl
                                id="preview-precipitacao"
                                label="precipitacao"
                                readout={`${rainfall.toFixed(1)} mm`}
                                min={0}
                                max={40}
                                step={0.5}
                                value={rainfall}
                                onChange={event => handleRainfallChange(event.target.value)}
                            />

                            <div>
                                <p className="label-mono">bioma</p>
                                <div className="mt-3.5 flex flex-wrap gap-2">
                                    {biomes.map(option => (
                                        <FilterChip
                                            key={option.id}
                                            isActive={biome === option.id}
                                            onClick={() => handleBiomeChange(option.id)}
                                        >
                                            {option.id}
                                        </FilterChip>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <pre className="mt-10 overflow-x-auto font-mono text-xs leading-relaxed text-content-faint">
                            {inputVector}
                        </pre>
                    </div>

                    <RiskScale score={score} band={band} bands={bands} />
                </div>

                <p className="mt-6 text-sm leading-relaxed text-content-faint">
                    <span className="text-accent">Demonstração de interface.</span> O número acima vem de uma fórmula
                    ilustrativa, não do modelo treinado. Serve para mostrar o formato da resposta enquanto a regressão
                    está em desenvolvimento.
                </p>
            </div>
        </section>
    )
}
