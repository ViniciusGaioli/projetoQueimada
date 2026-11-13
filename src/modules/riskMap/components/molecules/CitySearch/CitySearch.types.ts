export interface CitySearchProps {
    /** Texto digitado. */
    query: string
    /** Sugestões já filtradas pelo hook. */
    suggestions: string[]
    /** Município escolhido, se houver. */
    selected?: string
    onQueryChange: (query: string) => void
    onSelect: (city: string) => void
}
