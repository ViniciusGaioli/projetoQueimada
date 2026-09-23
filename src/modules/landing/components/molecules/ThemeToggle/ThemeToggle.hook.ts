'use client'

import { useCallback, useSyncExternalStore } from 'react'

import { defaultTheme, themeAttribute, themeStorageKey, type Theme } from '@/core/theme'

const subscribe = (onStoreChange: () => void) => {
    const observer = new MutationObserver(onStoreChange)

    observer.observe(document.documentElement, { attributes: true, attributeFilter: [themeAttribute] })

    return () => observer.disconnect()
}

const getSnapshot = (): Theme => (document.documentElement.getAttribute(themeAttribute) === 'light' ? 'light' : 'dark')

const getServerSnapshot = (): Theme => defaultTheme

const persistTheme = (theme: Theme) => {
    try {
        window.localStorage.setItem(themeStorageKey, theme)
    } catch {
        return
    }
}

export function useThemeToggle() {
    const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

    const handleToggle = useCallback(() => {
        const next: Theme = getSnapshot() === 'dark' ? 'light' : 'dark'

        document.documentElement.setAttribute(themeAttribute, next)
        persistTheme(next)
    }, [])

    return { theme, handleToggle }
}
