import cssLogo from '@/modules/landing/assets/css.png'
import htmlLogo from '@/modules/landing/assets/html.png'
import pandasLogo from '@/modules/landing/assets/pandas.webp'
import pythonLogo from '@/modules/landing/assets/python.webp'
import reactLogo from '@/modules/landing/assets/react.webp'
import scikitLearnLogo from '@/modules/landing/assets/scikit-learn.webp'
import typescriptLogo from '@/modules/landing/assets/typescript.svg'

import type { ArchitectureNote, DataVariable, NavEntry, PipelineStep, StackLayer } from './landing.types'

export const project = {
    region: 'Serra da Paulista',
}

export const navigation: NavEntry[] = [
    { id: 'problema', label: 'Problema' },
    { id: 'modelo', label: 'Modelo' },
    { id: 'dados', label: 'Dados' },
    { id: 'decisoes', label: 'Decisões' },
    { id: 'tecnologias', label: 'Tecnologias' },
    { id: 'mapa', label: 'Mapa ao vivo', href: '/mapa', isHighlighted: true },
]

/**
 * Decisões de projeto e limitações, em tópicos. Cada uma traz o limite que a
 * motivou — e as últimas são limitações mesmo, não decisões: ficam na mesma
 * lista porque quem lê precisa das duas coisas juntas.
 */
export const architectureNotes: ArchitectureNote[] = [
    {
        title: 'Predição no servidor',
        detail:
            'O modelo ocupa 330 MB e compara cada consulta com 6.416 pontos de treino. Não cabe no navegador. ' +
            'Como o custo é quase todo fixo, uma predição e duzentas levam o mesmo tempo, então tudo é pedido ' +
            'em lote.',
    },
    {
        title: 'Navegador não acessa a API',
        detail:
            'Quem busca a previsão é o servidor da página. Isso dispensa CORS, mantém o endereço da API fora da ' +
            'internet e deixa o modelo acessível apenas pela rede interna.',
    },
    {
        title: 'Cache do clima',
        detail:
            'A grade de um dia custa centenas de chamadas ao Open-Meteo, que limita o uso por hora. O resultado ' +
            'é gravado em disco lote a lote e reaproveitado o dia inteiro; uma interrupção retoma de onde parou.',
    },
    {
        title: 'Aquecimento automático',
        detail:
            'Um processo à parte, que sobe junto com o site, verifica a cada 30 minutos se a grade do dia existe ' +
            'e a constrói quando falta. Sem ele, a montagem cairia sobre o primeiro visitante.',
    },
    {
        title: 'Mapas em SVG',
        detail:
            'Sem biblioteca de mapas. O contorno vem da malha do IBGE, é projetado no servidor e desce pronto; ' +
            'as células são retângulos e as cores são variáveis de CSS, então trocar o tema não recalcula nada.',
    },
    {
        title: 'Resolução das grades',
        detail:
            'Células de 22 km no estado e 2,8 km na serra. O custo cresce com o quadrado do refinamento, e a ' +
            'cota gratuita da API de clima é o teto: grades mais finas exigiriam plano pago.',
    },
    {
        title: 'Limitação: o índice é relativo',
        detail:
            'O número de 0 a 1 nos mapas é a saída do modelo reescalada dentro do recorte do dia. Ele compara ' +
            'regiões entre si no mesmo dia, não dias diferentes. A probabilidade crua fica visível na leitura ' +
            'de cada célula.',
    },
    {
        title: 'Limitação: o modelo está em revisão',
        detail:
            'As duas classes do treino foram construídas de formas diferentes, e o modelo aprendeu a distinguir ' +
            'a origem do dado em vez da física do fogo. Os números que a plataforma mostra hoje refletem esse ' +
            'problema. A infraestrutura não muda com a correção: basta trocar o arquivo do modelo.',
    },
    {
        title: 'Limitação: previsão fora de São Paulo',
        detail:
            'O recorte da serra entra em Minas Gerais, porque o maciço atravessa a divisa. O modelo foi treinado ' +
            'só com municípios paulistas, e a linha tracejada no mapa marca onde a previsão passa a extrapolar.',
    },
]

export const pipeline: PipelineStep[] = [
    {
        tool: 'BDQueimadas',
        title: 'Coleta',
        summary: 'Extração do histórico de focos detectados por satélite, recortado para os municípios da serra.',
    },
    {
        tool: 'pandas',
        title: 'Tratamento',
        summary:
            'Limpeza, remoção de registros incompletos, recorte geográfico e codificação das variáveis categóricas.',
    },
    {
        tool: 'scikit-learn',
        title: 'Treinamento',
        summary:
            'Regressão supervisionada ajustada sobre o risco de fogo, validada contra períodos que o modelo não viu.',
    },
    {
        tool: 'API',
        title: 'Inferência',
        summary: 'A plataforma envia a condição de um ponto no tempo e no espaço e recebe de volta o risco estimado.',
    },
    {
        tool: 'React',
        title: 'Leitura',
        summary: 'A interface traduz o número em faixa de risco, recomendação e contexto geográfico.',
    },
]

export const dataVariables: DataVariable[] = [
    {
        field: 'data_hora_gmt',
        label: 'Data / hora',
        type: 'timestamp',
        sample: '2025-09-03 17:20:00',
        group: 'temporal',
        note: 'Momento exato da detecção, em GMT. Carrega duas informações que o modelo aproveita: a estação do ano e a hora do dia em que o foco apareceu.',
    },
    {
        field: 'satelite',
        label: 'Satélite',
        type: 'categórica',
        sample: 'AQUA_M-T',
        group: 'observacao',
        note: 'Plataforma que registrou o foco. Cada satélite tem horário de passagem, resolução e sensibilidade próprios, e ignorar isso enviesa a contagem.',
    },
    {
        field: 'pais',
        label: 'País',
        type: 'categórica',
        sample: 'Brasil',
        group: 'espacial',
        note: 'Recorte de origem do registro. Constante neste projeto, mas mantido para que o mesmo pipeline sirva a bases maiores sem alteração.',
    },
    {
        field: 'estado',
        label: 'Estado',
        type: 'categórica',
        sample: 'São Paulo',
        group: 'espacial',
        note: 'Unidade federativa do foco. Define a jurisdição do órgão responsável pela resposta.',
    },
    {
        field: 'municipio',
        label: 'Município',
        type: 'categórica',
        sample: 'Atibaia',
        group: 'espacial',
        note: 'Menor recorte administrativo do registro. É a unidade em que a previsão vira decisão: é o município que aciona a brigada.',
    },
    {
        field: 'bioma',
        label: 'Bioma',
        type: 'categórica',
        sample: 'Mata Atlântica',
        group: 'ambiental',
        note: 'Tipo de vegetação predominante. Determina o material combustível disponível e a velocidade com que o fogo se propaga.',
    },
    {
        field: 'dias_sem_chuva',
        label: 'Dias sem chuva',
        type: 'inteiro · dias',
        sample: '24',
        group: 'ambiental',
        note: 'Há quanto tempo o terreno está seco. É o preditor mais forte da base: a curva de risco sobe de forma acentuada a partir de duas ou três semanas.',
    },
    {
        field: 'precipitacao',
        label: 'Precipitação',
        type: 'decimal · mm',
        sample: '0.0',
        group: 'ambiental',
        note: 'Chuva acumulada associada ao registro. Complementa a contagem de dias secos: pouca chuva em muitos dias não equivale a nenhuma chuva.',
    },
    {
        field: 'latitude',
        label: 'Latitude',
        type: 'decimal · graus',
        sample: '-23.2841',
        group: 'espacial',
        note: 'Posição do foco no eixo vertical do globo. Junto da longitude, permite agrupar focos recorrentes e desenhar o mapa de calor da serra.',
    },
    {
        field: 'longitude',
        label: 'Longitude',
        type: 'decimal · graus',
        sample: '-46.7519',
        group: 'espacial',
        note: 'Posição do foco no eixo horizontal do globo. Também é o que liga o registro a relevo, altitude e proximidade de área urbana.',
    },
    {
        field: 'risco_fogo',
        label: 'Risco de fogo',
        type: 'decimal · 0 a 1',
        sample: '0.87',
        group: 'alvo',
        note: 'Índice de risco calculado pelo INPE. É a variável-alvo da regressão: o modelo aprende a estimá-la a partir das outras dez, para conseguir respondê-la antes que o foco exista.',
    },
]

export const stackLayers: StackLayer[] = [
    {
        title: 'Interface',
        items: [
            { name: 'React', logo: reactLogo, role: 'Componentes e estado da página' },
            { name: 'TypeScript', logo: typescriptLogo, role: 'Contratos entre as camadas' },
            { name: 'Next.js', role: 'Rotas, renderização no servidor e cache de dados' },
            { name: 'Tailwind CSS', logo: cssLogo, role: 'Estilo por tokens, com tema claro e escuro' },
            { name: 'SVG', logo: htmlLogo, role: 'Os mapas e as curvas, desenhados sem biblioteca' },
        ],
    },
    {
        title: 'Modelo e dados',
        items: [
            { name: 'Python', logo: pythonLogo, role: 'Coleta, treino e predição' },
            { name: 'pandas', logo: pandasLogo, logoIsDark: true, role: 'Tratamento da base de focos' },
            { name: 'scikit-learn', logo: scikitLearnLogo, role: 'Treino e inferência do modelo' },
            { name: 'Flask', role: 'A API que serve a predição' },
        ],
    },
    {
        title: 'Dados externos',
        items: [
            { name: 'BDQueimadas · INPE', role: 'Histórico de focos de calor detectados por satélite' },
            { name: 'Open-Meteo', role: 'Clima ao vivo, histórico de precipitação e altitude' },
            { name: 'IBGE', role: 'Malha do estado e dos 658 municípios desenhados' },
        ],
    },
    {
        title: 'Infraestrutura',
        items: [
            { name: 'Docker Compose', role: 'Sobe site, API e aquecedor de cache juntos' },
            { name: 'Cache em disco', role: 'A grade do dia, gravada lote a lote' },
        ],
    },
]
