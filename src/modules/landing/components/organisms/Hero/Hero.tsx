import Image from 'next/image'
import Link from 'next/link'

import serraFromAbove from '@/modules/landing/assets/serra-da-paulista-sao-joao-da-boa-vista.webp'

export function Hero() {
    return (
        <section id="topo" className="relative isolate flex min-h-[86svh] items-end overflow-hidden">
            <Image
                src={serraFromAbove}
                alt="Vista aérea da Serra da Paulista tomada pela fumaça, com um helicóptero sobrevoando a encosta queimada durante o combate ao incêndio."
                priority
                fill
                sizes="100vw"
                className="-z-10 object-cover object-[30%_center]"
            />

            {/* Escurecimento discreto sob o texto, não um gradiente sobre a foto
                inteira: a imagem continua legível e o bloco de texto se sustenta
                sozinho pela caixa. */}
            <span
                aria-hidden
                className="absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-linear-to-t from-surface/90 to-transparent"
            />

            {/* O menu fica transparente no topo da página; sobre a fumaça clara
                desta foto ele sumiria sem esta faixa. */}
            <span
                aria-hidden
                className="absolute inset-x-0 top-0 -z-10 h-28 bg-linear-to-b from-surface/80 to-transparent"
            />

            <div className="shell w-full pt-32 pb-12">
                <div className="max-w-[46rem] border-l-2 border-accent bg-surface/80 p-7 backdrop-blur-sm sm:p-9">
                    <h1 className="font-display text-[clamp(2.125rem,4.4vw,3.5rem)] leading-[1.06] tracking-[-0.015em] text-content">
                        Previsão de risco de incêndio na Serra da Paulista
                    </h1>

                    <p className="mt-5 text-[1.0625rem] leading-[1.7] text-content-muted">
                        Uma plataforma que lê o clima de cada trecho da serra e estima, ponto a ponto, a chance de haver
                        foco de calor. Os dados são públicos: focos do INPE, clima do Open-Meteo, malha do IBGE.
                    </p>

                    <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
                        <Link
                            href="/mapa"
                            className="group inline-flex items-center gap-3 bg-accent-surface px-6 py-3.5 text-sm font-medium text-on-accent transition-colors duration-200 hover:bg-accent hover:text-surface"
                        >
                            Abrir o mapa
                            <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-1">
                                &rarr;
                            </span>
                        </Link>

                        <a href="#problema" className="label-mono accent-underline text-content">
                            Ler a documentação
                        </a>
                    </div>
                </div>
            </div>
        </section>
    )
}
