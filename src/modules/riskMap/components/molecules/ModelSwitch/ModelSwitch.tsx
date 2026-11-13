import Link from 'next/link'

import { mapRoute, modelParam } from '@/modules/riskMap/riskMap.constants'
import { modelLabel, sortModels } from '@/modules/riskMap/tools'

import type { ModelSwitchProps } from './ModelSwitch.types'

/**
 * Troca o modelo que gera a página inteira.
 *
 * São links e não botões porque a predição acontece no servidor: a troca vira
 * uma URL (`/mapa?modelo=gb_2026`), o Server Component refaz o fetch dos dois
 * recortes e da simulação, e a página volta inteira pelo modelo novo. Como
 * consequência o estado fica compartilhável e sobrevive a recarregar a aba —
 * coisas que um estado de cliente não daria — e nada disso custa JavaScript.
 */
export function ModelSwitch({ models, current }: ModelSwitchProps) {
    return (
        <div className="shell flex flex-wrap items-center gap-x-6 gap-y-3 pt-24 pb-4">
            <span className="label-mono text-content-muted">Modelo</span>

            <nav aria-label="Modelo de predição" className="flex flex-wrap gap-2">
                {sortModels(models).map(id => {
                    const { name, year } = modelLabel(id)
                    const isActive = id === current

                    return (
                        <Link
                            key={id}
                            // Inclusive o ativo: apontar o ativo para `/mapa`
                            // limparia a URL, mas `/mapa` é o modelo padrão —
                            // clicar no chip já selecionado trocaria de modelo.
                            href={`${mapRoute}?${modelParam}=${encodeURIComponent(id)}`}
                            aria-current={isActive ? 'page' : undefined}
                            // As mesmas classes do FilterChip, que é um <button>
                            // e não serve para navegar.
                            className={`label-mono border px-3 py-1.5 transition-colors duration-200 ${
                                isActive
                                    ? 'border-accent text-accent'
                                    : 'border-rule-strong text-content-muted hover:border-content-faint hover:text-content'
                            }`}
                        >
                            {name}
                            {year && <span className="ml-1.5 text-content-faint">{year}</span>}
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}
