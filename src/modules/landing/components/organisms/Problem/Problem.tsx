import Image from 'next/image'

import fireAboveTheRoad from '@/modules/landing/assets/fogo-aguas-da-prata1.webp'
import serraOnFire from '@/modules/landing/assets/fogo-aguas-da-pratagrande.webp'
import { SectionHeading, SectionMarker } from '@/modules/landing/components/atoms'
import { project } from '@/modules/landing/landing.constants'

export function Problem() {
    return (
        <section id="problema" className="shell section-grid scroll-mt-24 py-24 lg:py-32">
            <SectionMarker index="01" title="O problema" />

            <div className="flex flex-col gap-14">
                <SectionHeading>A previsão de risco existe. Sua menor célula cobre a serra inteira.</SectionHeading>

                <div className="grid items-center gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
                    <p className="text-[1.0625rem] leading-[1.7] text-content-muted">
                        A {project.region}, entre São João da Boa Vista e Águas da Prata, concentra focos recorrentes
                        todo ano, nos mesmos meses e quase sempre nos mesmos trechos. O que muda de um ano para o outro
                        não é a geografia, e sim quanto tempo o terreno passou seco antes da primeira faísca. Períodos
                        longos sem chuva, vegetação de baixa umidade e temperatura alta abrem uma janela em que basta
                        uma fonte de ignição para que o fogo suba a encosta com rapidez.
                    </p>

                    <figure>
                        <Image
                            src={serraOnFire}
                            alt="Incêndio em encosta de mata na serra, com fumaça densa subindo entre as árvores e os telhados de uma cidade logo abaixo."
                            placeholder="blur"
                            sizes="(min-width: 1024px) 28rem, 100vw"
                            className="h-auto w-full"
                        />

                        <figcaption className="label-mono mt-4">
                            A mata queima a poucos metros das primeiras casas.
                        </figcaption>
                    </figure>
                </div>

                <div className="grid items-start gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,0.68fr)_minmax(0,1fr)]">
                    <figure className="order-last lg:order-first">
                        <Image
                            src={fireAboveTheRoad}
                            alt="Fogo e fumaça em encosta de mata logo acima de uma estrada com quiosques, com cones de sinalização na pista e pessoas observando o avanço das chamas."
                            placeholder="blur"
                            sizes="(min-width: 1024px) 24rem, 100vw"
                            className="h-auto w-full"
                        />

                        <figcaption className="label-mono mt-4">
                            Da estrada, o avanço do fogo é acompanhado a olho nu.
                        </figcaption>
                    </figure>

                    <div className="flex flex-col gap-6 text-[1.0625rem] leading-[1.7] text-content-muted">
                        <p>
                            A resposta a isso não é improvisada nem puramente reativa. São Paulo mantém a Operação São
                            Paulo Sem Fogo e a Operação Estiagem, que concentram prevenção, monitoramento, controle e
                            combate entre junho e outubro e escalonam o estado em fases verde, amarela e vermelha
                            conforme a seca avança. Os focos detectados pelo satélite AQUA, do INPE, são recebidos e
                            trabalhados pela Polícia Militar Ambiental, com apoio de vistoria em campo e de drones com
                            câmera térmica. Na serra, o combate reúne o Corpo de Bombeiros e as defesas civis dos
                            municípios, com helicóptero da Polícia Militar quando o acesso por terra é difícil.
                        </p>

                        <p>
                            O dado também já é usado para antecipar, e não apenas para registrar o que queimou. O
                            próprio INPE calcula e prevê o risco de fogo a partir do número de dias seguidos sem chuva
                            dentro dos últimos 120 dias, combinado com temperatura máxima, umidade relativa mínima e o
                            tipo de vegetação. O índice sai diariamente, é previsto para os dias seguintes e é
                            exatamente a coluna de risco de fogo que acompanha cada linha do BDQueimadas.
                        </p>
                    </div>
                </div>

                <div className="measure-prose flex flex-col gap-6 text-[1.0625rem] leading-[1.7] text-content-muted">
                    <p>
                        O limite está na escala. O campo de precipitação, que é a componente de maior peso desse
                        cálculo, vem de um modelo global com resolução aproximada de 25 quilômetros. Uma célula desse
                        tamanho cobre a serra inteira e os municípios ao redor sem distinguir a vertente que recebeu
                        chuva da que ficou seca, e as fases da operação, da mesma forma, valem para regiões amplas. Quem
                        decide em que trecho posicionar a brigada hoje continua dependendo de leitura de campo e de
                        experiência acumulada.
                    </p>

                    <p>
                        É nesse intervalo que este projeto se coloca. Em vez de propor um índice novo, ele treina uma
                        regressão sobre o histórico da própria serra, para aprender como aquelas condições se traduziram
                        em risco naquele terreno específico e transformar uma leitura regional em uma leitura local.
                    </p>
                </div>
            </div>
        </section>
    )
}
