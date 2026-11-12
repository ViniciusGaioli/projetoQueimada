import { SectionIntro } from '@/shared/components/molecules'
import { StackColumn } from '@/modules/landing/components/molecules'
import { stackLayers } from '@/modules/landing/landing.constants'

export function TechStack() {
    return (
        <section id="tecnologias" className="shell scroll-mt-24 border-t border-rule py-20 lg:py-24">
            <div>
                <SectionIntro title="Tecnologias">
                    As camadas conversam por formatos fixos, então trocar qualquer uma delas não obriga a reescrever as
                    outras. Os dados externos são todos públicos e de fonte oficial.
                </SectionIntro>

                <div className="mt-16 grid gap-x-16 gap-y-16 sm:grid-cols-2">
                    {stackLayers.map(layer => (
                        <StackColumn key={layer.title} layer={layer} />
                    ))}
                </div>
            </div>
        </section>
    )
}
