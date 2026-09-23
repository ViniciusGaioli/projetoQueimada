import cssLogo from '@/modules/landing/assets/css.png'
import htmlLogo from '@/modules/landing/assets/html.png'
import pandasLogo from '@/modules/landing/assets/pandas.webp'
import pythonLogo from '@/modules/landing/assets/python.webp'
import reactLogo from '@/modules/landing/assets/react.webp'
import scikitLearnLogo from '@/modules/landing/assets/scikit-learn.webp'
import typescriptLogo from '@/modules/landing/assets/typescript.svg'

import type { DataVariable, NavEntry, PipelineStep, RiskBand, StackLayer } from './landing.types'

export const project = {
    region: 'Serra da Paulista',
}

export const navigation: NavEntry[] = [
    { id: 'problema', label: 'Problema' },
    { id: 'modelo', label: 'Modelo' },
    { id: 'dados', label: 'Dados' },
    { id: 'previa', label: 'Prévia' },
    { id: 'tecnologias', label: 'Tecnologias' },
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

export const riskBands: RiskBand[] = [
    { threshold: 0.3, label: 'Baixo', advice: 'Monitoramento de rotina. Sem restrição adicional.' },
    { threshold: 0.6, label: 'Moderado', advice: 'Atenção em áreas de borda e beira de estrada.' },
    { threshold: 0.85, label: 'Alto', advice: 'Brigada em prontidão. Queima controlada suspensa.' },
    { threshold: 1, label: 'Crítico', advice: 'Vigilância permanente e acesso restrito à área.' },
]

export const stackLayers: StackLayer[] = [
    {
        title: 'Interface',
        items: [
            { name: 'React', logo: reactLogo },
            { name: 'TypeScript', logo: typescriptLogo },
            { name: 'HTML', logo: htmlLogo },
            { name: 'CSS', logo: cssLogo },
        ],
    },
    {
        title: 'Modelo e dados',
        items: [
            { name: 'Python', logo: pythonLogo },
            { name: 'pandas', logo: pandasLogo, logoIsDark: true },
            { name: 'scikit-learn', logo: scikitLearnLogo },
        ],
    },
]
