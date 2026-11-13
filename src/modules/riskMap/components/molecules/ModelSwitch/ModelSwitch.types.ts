export interface ModelSwitchProps {
    /** Chaves dos modelos carregados na API, ex. `['gb_2026', 'gpc_2026']`. */
    models: string[]
    /** Chave do modelo em uso. */
    current: string
}
