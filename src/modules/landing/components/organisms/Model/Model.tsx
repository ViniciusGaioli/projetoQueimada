import { SectionHeading, SectionMarker } from '@/modules/landing/components/atoms'
import { PipelineNode } from '@/modules/landing/components/molecules'
import { pipeline } from '@/modules/landing/landing.constants'

export function Model() {
    return (
        <section id="modelo" className="shell section-grid scroll-mt-24 py-24 lg:py-32">
            <SectionMarker index="02" title="O modelo" />

            <div>
                <SectionHeading>Do arquivo do INPE ao risco estimado, em cinco etapas.</SectionHeading>

                <p className="prose-lede measure-wide mt-8">
                    O BDQueimadas já publica, para cada foco detectado, o índice de risco calculado pelo INPE. O modelo
                    aprende a relação entre esse índice e as condições que o cercam. Treinado, ele responde à pergunta
                    inversa: dadas estas condições, qual seria o risco, mesmo onde ainda não há foco algum.
                </p>

                <ol className="mt-16 lg:grid lg:grid-cols-5 lg:gap-0">
                    {pipeline.map((step, index) => (
                        <PipelineNode
                            key={step.title}
                            step={step}
                            index={index}
                            isLast={index === pipeline.length - 1}
                        />
                    ))}
                </ol>

                <p className="measure-wide mt-14 text-sm leading-relaxed text-content-faint">
                    O recorte geográfico é fixo e o histórico é reprocessado a cada atualização da base pública, de modo
                    que o modelo seja reavaliado contra dados que ele nunca viu durante o treino.
                </p>
            </div>
        </section>
    )
}
