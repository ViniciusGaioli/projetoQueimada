import type { Metadata, Viewport } from 'next'
import { Archivo, Bricolage_Grotesque, JetBrains_Mono } from 'next/font/google'

import { defaultTheme, themeBootstrapScript } from '@/core/theme'

import '@/core/assets/global.css'

const bricolage = Bricolage_Grotesque({
    subsets: ['latin'],
    axes: ['opsz', 'wdth'],
    variable: '--font-bricolage',
    display: 'swap',
})

const archivo = Archivo({
    subsets: ['latin'],
    axes: ['wdth'],
    variable: '--font-archivo',
    display: 'swap',
})

const jetBrainsMono = JetBrains_Mono({
    subsets: ['latin'],
    variable: '--font-jetbrains',
    display: 'swap',
})

export const metadata: Metadata = {
    title: 'Previsão de risco de fogo na Serra da Paulista',
    description:
        'Plataforma de monitoramento e previsão de risco de incêndio na Serra da Paulista, a partir dos dados públicos de focos de calor do BDQueimadas (INPE) e de um modelo de regressão.',
    keywords: ['queimadas', 'INPE', 'BDQueimadas', 'risco de fogo', 'Serra da Paulista', 'regressão', 'monitoramento'],
    authors: [{ name: 'Projeto Queimada' }],
    openGraph: {
        title: 'Previsão de risco de fogo na Serra da Paulista',
        description:
            'Antes da fumaça, existe um padrão. Monitoramento e previsão de risco de incêndio a partir dos dados do INPE.',
        locale: 'pt_BR',
        type: 'website',
    },
}

export const viewport: Viewport = {
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#f6f3ec' },
        { media: '(prefers-color-scheme: dark)', color: '#08080a' },
    ],
    colorScheme: 'dark light',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
    return (
        <html
            lang="pt-BR"
            data-theme={defaultTheme}
            data-scroll-behavior="smooth"
            suppressHydrationWarning
            className={`${bricolage.variable} ${archivo.variable} ${jetBrainsMono.variable} h-full antialiased`}
        >
            <head>
                <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
            </head>
            <body className="flex min-h-full flex-col">{children}</body>
        </html>
    )
}
