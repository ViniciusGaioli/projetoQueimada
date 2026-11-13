'use client'

import { useId } from 'react'

import type { CitySearchProps } from './CitySearch.types'

export function CitySearch({ query, suggestions, selected, onQueryChange, onSelect }: CitySearchProps) {
    const id = useId()
    const listId = `${id}-lista`
    const isOpen = suggestions.length > 0 && query.trim().length > 0 && query !== selected

    return (
        <div className="relative">
            <label htmlFor={id} className="label-mono">
                Município
            </label>

            <input
                id={id}
                type="text"
                value={query}
                onChange={event => onQueryChange(event.target.value)}
                placeholder="Digite o nome da cidade"
                autoComplete="off"
                role="combobox"
                aria-expanded={isOpen}
                aria-controls={listId}
                aria-autocomplete="list"
                className="mt-2.5 w-full border-b border-rule-strong bg-transparent pb-2.5 font-display text-2xl tracking-[-0.01em] text-content placeholder:text-content-faint focus:border-accent focus:outline-none"
            />

            {isOpen && (
                <ul
                    id={listId}
                    role="listbox"
                    className="absolute inset-x-0 top-full z-20 mt-1 max-h-72 overflow-y-auto border border-rule bg-surface-raised"
                >
                    {suggestions.map(city => (
                        <li key={city} role="option" aria-selected={city === selected}>
                            <button
                                type="button"
                                onClick={() => onSelect(city)}
                                className="w-full px-4 py-2.5 text-left text-[0.9375rem] text-content-muted transition-colors duration-150 hover:bg-surface hover:text-content"
                            >
                                {city}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
