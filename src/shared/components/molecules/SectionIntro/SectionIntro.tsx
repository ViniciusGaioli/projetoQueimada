import { SectionHeading } from '@/shared/components/atoms'

import type { SectionIntroProps } from './SectionIntro.types'

/**
 * Abertura de seção: título à esquerda, texto à direita, régua embaixo.
 *
 * As duas colunas existem para ocupar a largura do container. Numa coluna só, o
 * texto para na metade da tela e o resto fica vazio.
 */
export function SectionIntro({ title, children }: SectionIntroProps) {
    return (
        <div className="grid gap-x-12 gap-y-4 border-b border-rule pb-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
            <SectionHeading>{title}</SectionHeading>

            {children && <p className="text-[0.9375rem] leading-relaxed text-content-muted">{children}</p>}
        </div>
    )
}
