'use client'

import { SectionIntro } from '@/shared/components/molecules'
import { VariableDetail, VariableRow } from '@/modules/landing/components/molecules'

import { useDataSchema } from './DataSchema.hook'

export function DataSchema() {
    const { activeField, activeVariable, handleSelectField, variables } = useDataSchema()

    return (
        <section id="dados" className="shell scroll-mt-24 border-t border-rule py-20 lg:py-24">
            <div>
                <SectionIntro title="Os dados de entrada">
                    É esse o formato que sai do BDQueimadas e entra no pipeline. Dez colunas são o que o modelo recebe;
                    a décima primeira é o que ele precisa devolver.
                </SectionIntro>

                <div className="mt-14 grid gap-x-14 gap-y-12 lg:grid-cols-[minmax(0,1fr)_21rem]">
                    <div>
                        <div className="grid grid-cols-[1fr_auto] gap-x-4 border-b border-rule-strong pb-3 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,0.8fr)_minmax(0,1fr)]">
                            <span className="label-mono px-2">Coluna</span>
                            <span className="label-mono px-2 text-right sm:text-left">Tipo</span>
                            <span className="label-mono hidden px-2 text-right sm:block">Exemplo</span>
                        </div>

                        {variables.map(variable => (
                            <VariableRow
                                key={variable.field}
                                variable={variable}
                                isActive={variable.field === activeField}
                                onSelect={handleSelectField}
                            />
                        ))}
                    </div>

                    <VariableDetail variable={activeVariable} />
                </div>
            </div>
        </section>
    )
}
