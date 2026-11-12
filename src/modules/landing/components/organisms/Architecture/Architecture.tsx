import { architectureNotes } from '@/modules/landing/landing.constants'
import { SectionIntro } from '@/shared/components/molecules'

export function Architecture() {
    return (
        <section id="decisoes" className="shell scroll-mt-24 border-t border-rule py-20 lg:py-24">
            <SectionIntro title="Decisões de projeto e limitações">
                O tamanho do modelo, a cota da API de clima e a resolução real dos dados definiram como a plataforma foi
                construída. Abaixo, o que foi decidido e o que ficou de fora.
            </SectionIntro>

            <ol className="mt-4 grid lg:grid-cols-2 lg:gap-x-12">
                {architectureNotes.map((note, index) => (
                    <li
                        key={note.title}
                        className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-4 border-b border-rule py-5"
                    >
                        <span className="label-mono pt-0.5 tabular-nums">{String(index + 1).padStart(2, '0')}</span>

                        <div>
                            <h3 className="text-[0.9375rem] font-medium text-content">{note.title}</h3>
                            <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-content-muted">{note.detail}</p>
                        </div>
                    </li>
                ))}
            </ol>
        </section>
    )
}
