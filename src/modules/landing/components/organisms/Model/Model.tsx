import { SectionIntro } from '@/shared/components/molecules'
import { PipelineNode } from '@/modules/landing/components/molecules'
import { pipeline } from '@/modules/landing/landing.constants'

export function Model() {
    return (
        <section id="modelo" className="shell scroll-mt-24 border-t border-rule py-20 lg:py-24">
            <div>
                <SectionIntro title="Como o modelo é construído">
                    O BDQueimadas já publica, para cada foco detectado, o índice de risco calculado pelo INPE. O modelo
                    aprende a relação entre esse índice e as condições que o cercam. Treinado, ele responde à pergunta
                    inversa: dadas estas condições, qual seria o risco, mesmo onde ainda não há foco algum.
                </SectionIntro>

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
