import { SectionHeading, SectionMarker } from '@/modules/landing/components/atoms'
import { StackColumn } from '@/modules/landing/components/molecules'
import { stackLayers } from '@/modules/landing/landing.constants'

export function TechStack() {
    return (
        <section id="tecnologias" className="shell section-grid scroll-mt-24 py-24 lg:py-32">
            <SectionMarker index="05" title="Tecnologias" />

            <div>
                <SectionHeading>Estrutura de página separada da estrutura de backend.</SectionHeading>

                <p className="prose-lede measure-wide mt-8">
                    As duas camadas conversam por um formato fixo, o mesmo descrito na seção anterior. Trocar qualquer
                    um dos lados não obriga a reescrever o outro.
                </p>

                <div className="mt-16 grid gap-x-16 gap-y-16 lg:grid-cols-2">
                    {stackLayers.map(layer => (
                        <StackColumn key={layer.title} layer={layer} />
                    ))}
                </div>
            </div>
        </section>
    )
}
