import type { NavRailProps } from './NavRail.types'

export function NavRail({ entries, activeId }: NavRailProps) {
    return (
        <nav
            aria-label="Seções da página"
            className="no-scrollbar flex min-w-0 items-center gap-x-4 overflow-x-auto md:gap-x-7"
        >
            {entries.map(entry => (
                <a
                    key={entry.id}
                    href={`#${entry.id}`}
                    aria-current={activeId === entry.id ? 'true' : undefined}
                    className={`label-mono accent-underline shrink-0 whitespace-nowrap transition-colors duration-200 ${
                        activeId === entry.id ? 'text-content' : 'hover:text-content'
                    }`}
                >
                    {entry.label}
                </a>
            ))}
        </nav>
    )
}
