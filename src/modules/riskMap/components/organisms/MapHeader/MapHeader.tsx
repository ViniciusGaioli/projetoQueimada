import Link from 'next/link'

import { ThemeToggle } from '@/shared/components/molecules'

export function MapHeader() {
    return (
        <header className="fixed inset-x-0 top-0 z-50 border-b border-rule bg-surface/85 backdrop-blur-md">
            <div className="shell flex h-16 items-center justify-between gap-4 md:gap-8">
                <nav aria-label="Navegação principal" className="flex min-w-0 items-center gap-x-4 md:gap-x-7">
                    <Link
                        href="/"
                        className="label-mono accent-underline shrink-0 whitespace-nowrap transition-colors duration-200 hover:text-content"
                    >
                        &larr; Projeto
                    </Link>

                    <span aria-current="page" className="label-mono shrink-0 whitespace-nowrap text-content">
                        Mapa ao vivo
                    </span>
                </nav>

                <div className="shrink-0">
                    <ThemeToggle />
                </div>
            </div>
        </header>
    )
}
