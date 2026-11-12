export default function Loading() {
    return (
        <main className="shell flex min-h-[100svh] flex-col justify-center py-24">
            <p className="label-mono text-accent">Mapa ao vivo</p>

            <p className="headline-type text-headline measure-wide mt-6">Lendo o clima e prevendo o risco…</p>

            <p className="prose-lede measure mt-8">
                A API busca o histórico de precipitação de cada célula no Open-Meteo e roda a predição da grade inteira
                de uma vez. Na primeira leitura do dia isso leva alguns minutos.
            </p>
        </main>
    )
}
