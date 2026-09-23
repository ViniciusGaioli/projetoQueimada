import Image from 'next/image'

import serraFromAbove from '@/modules/landing/assets/serra-da-paulista-sao-joao-da-boa-vista.webp'
import { project } from '@/modules/landing/landing.constants'

export function Hero() {
    return (
        <section id="topo" className="relative overflow-hidden">
            <div className="absolute inset-0 lg:left-auto lg:w-[56%]">
                <Image
                    src={serraFromAbove}
                    alt="Vista aérea da Serra da Paulista tomada pela fumaça, com um helicóptero sobrevoando a encosta queimada durante o combate ao incêndio."
                    priority
                    fill
                    sizes="(min-width: 1024px) 56vw, 100vw"
                    className="object-cover object-[25%_center]"
                />

                <span
                    aria-hidden
                    className="absolute inset-0 bg-linear-to-t from-surface via-surface/80 to-surface/40 lg:bg-linear-to-r lg:from-surface lg:via-surface/45 lg:to-surface/10"
                />
            </div>

            <div className="shell relative flex min-h-[100svh] flex-col justify-center pt-28 pb-24">
                <h1 className="display-type text-display max-w-[16ch]">
                    Risco de incêndio previsto <span className="text-accent">trecho a trecho</span>.
                </h1>

                <p className="prose-lede measure mt-10">
                    O modelo lê o histórico de focos de calor da {project.region} publicado pelo INPE e estima o risco a
                    partir das condições do terreno: dias sem chuva, precipitação, bioma, posição e época do ano.
                </p>

                <a
                    href="#modelo"
                    className="group mt-14 inline-flex items-center gap-3 self-start bg-accent-surface px-6 py-3.5 text-sm font-medium text-on-accent transition-colors duration-200 hover:bg-accent hover:text-surface"
                >
                    Entender o modelo
                    <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-1">
                        &rarr;
                    </span>
                </a>
            </div>
        </section>
    )
}
