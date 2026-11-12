'use client'

import { MetaItem } from '@/modules/riskMap/components/atoms'

import type { MapMetaProps } from './MapMeta.types'

const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

const formatDate = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR')

/**
 * Lado da célula em quilômetros. O grau não serve de leitura — 0.025° vira
 * "0.03°" arredondado e não diz nada a ninguém.
 */
const formatCellSide = (degrees: number) => {
    const km = degrees * 111

    return `${km.toLocaleString('pt-BR', { maximumFractionDigits: km < 10 ? 1 : 0 })} km`
}

export function MapMeta({ map, cellCount, isRefreshing, onRefresh }: MapMetaProps) {
    return (
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6 border-y border-rule py-5">
            <MetaItem label="Modelo">{map.model}</MetaItem>
            <MetaItem label={map.isStale ? 'Clima de' : 'Dia previsto'}>
                {formatDate(map.date)}
                {map.isStale && <span className="ml-2 text-accent">defasado</span>}
            </MetaItem>
            <MetaItem label="Clima lido às">{formatTime(map.generatedAt)}</MetaItem>
            <MetaItem label="Células">{cellCount}</MetaItem>
            <MetaItem label="Lado da célula">{formatCellSide(map.step)}</MetaItem>

            <button
                type="button"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="label-mono accent-underline text-content transition-colors duration-200 hover:text-accent disabled:text-content-faint"
            >
                {isRefreshing ? 'Atualizando…' : 'Atualizar'}
            </button>
        </div>
    )
}
