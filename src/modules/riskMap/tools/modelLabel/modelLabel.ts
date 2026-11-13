import { modelMethodLabels } from '@/modules/riskMap/riskMap.constants'

/**
 * Nome legível de um modelo a partir da chave que a API usa.
 *
 * A chave é `{método}_{ano}`, como o `carregar_modelos` da API monta a partir
 * do nome do arquivo (`gb-2026.pkl` → `gb_2026`). Método desconhecido cai para
 * a própria sigla em maiúsculas, então um modelo novo aparece na interface sem
 * precisar passar por aqui primeiro.
 */
export function modelLabel(id: string) {
    const [method, year] = id.split('_')

    return {
        name: modelMethodLabels[method] ?? method.toUpperCase(),
        year: year ?? '',
    }
}

/** Ordena por nome legível: a API devolve na ordem do `glob`, que varia. */
export const sortModels = (ids: string[]) =>
    [...ids].sort((first, second) => modelLabel(first).name.localeCompare(modelLabel(second).name, 'pt-BR'))
