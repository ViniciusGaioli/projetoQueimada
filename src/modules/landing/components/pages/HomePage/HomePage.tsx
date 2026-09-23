import {
    DataSchema,
    Hero,
    Model,
    Problem,
    RiskPreview,
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
                <RiskPreview />
                <TechStack />
            </main>
        </>
    )
}
