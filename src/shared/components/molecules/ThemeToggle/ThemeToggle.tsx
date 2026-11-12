'use client'

import { themeAction, themeLabel } from './ThemeToggle.constants'
import { useThemeToggle } from './ThemeToggle.hook'

export function ThemeToggle() {
    const { theme, handleToggle } = useThemeToggle()

    return (
        <button
            type="button"
            onClick={handleToggle}
            aria-label={themeAction[theme]}
            className="group flex items-center gap-2.5 text-content-muted transition-colors duration-200 hover:text-content"
        >
            <svg aria-hidden viewBox="0 0 12 12" className="size-3 rotate-45">
                <rect x="1" y="1" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1" />
                <path d="M1 1H6V11H1Z" fill="currentColor" />
            </svg>
            <span className="label-mono transition-colors duration-200 group-hover:text-content">
                {themeLabel[theme]}
            </span>
        </button>
    )
}
