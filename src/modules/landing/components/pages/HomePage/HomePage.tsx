import {
    Architecture,
    DataSchema,
    Hero,
    Model,
    Problem,
    SiteHeader,
    TechStack,
} from '@/modules/landing/components/organisms'

export function HomePage() {
    return (
        <>
            <SiteHeader />

            <main>
                <Hero />
                <Problem />
                <Model />
                <DataSchema />
                <Architecture />
                <TechStack />
            </main>
        </>
    )
}
