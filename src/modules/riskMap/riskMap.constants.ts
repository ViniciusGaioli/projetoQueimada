import type { ReferenceCity, RegionSection, RiskLevel, SimulationFieldSpec, SimulationPreset } from './riskMap.types'

/** Rota da página, usada também para invalidar o cache ao atualizar. */
export const mapRoute = '/mapa'

/** Modelo pedido à API. A chave é `{método}_{ano}`, como a API registra. */
export const defaultModel = 'gpc_2026'

/** Recortes mostrados na página, na ordem em que aparecem. */
export const regions = ['estado', 'serra'] as const

/** Textos de cada seção de mapa. */
export const regionSections: Record<(typeof regions)[number], RegionSection> = {
    estado: {
        title: 'Mapa de risco do estado',
        lead:
            'Cada quadrado é um ponto do estado com clima lido ao vivo do Open-Meteo. O modelo recebe bioma, ' +
            'período de secura, precipitação e risco de fogo daquele ponto e devolve a probabilidade de haver ' +
            'foco de calor. A cor é essa saída reescalada para um índice de 0 a 1, em que 0 é o ponto menos ' +
            'arriscado do recorte e 1, o mais arriscado.',
    },
    serra: {
        title: 'Serra da Paulista em detalhe',
        lead:
            'O recorte de estudo do projeto, com células de 2,8 km em vez de 22. Os limites não foram ' +
            'escolhidos no olho: a altitude de 934 pontos foi amostrada ponto a ponto, e o terreno acima de ' +
            '1.000 m se concentra aqui, chegando a 1.536 m. A serra é a borda paulista do maciço vulcânico de ' +
            'Poços de Caldas e atravessa a divisa, então o mapa não para em São Paulo — a linha tracejada ' +
            'marca onde a predição passa a cair fora do estado de onde vieram os dados de treino.',
    },
}

/** Sistema de coordenadas do SVG. A altura sai da projeção. */
export const canvasWidth = 1000
export const canvasPadding = 6

/** Quantas células o ranking lista. */
export const rankingSize = 8

/**
 * Rampa de calor, do menor risco ao maior. São nomes de variáveis CSS, definidas
 * em `core/assets/global.css` para os dois temas: a célula interpola entre duas
 * delas com `color-mix`, então trocar o tema não exige recalcular nada.
 */
export const heatRamp = ['--heat-0', '--heat-1', '--heat-2', '--heat-3', '--heat-4']

/**
 * Faixas do índice de risco. Valem sobre o índice normalizado de 0 a 1, não
 * sobre a probabilidade crua do modelo.
 */
/** Municípios que o projeto estuda, destacados no mapa aproximado. */
export const focusCities = ['São João da Boa Vista', 'Águas da Prata']

export const riskLevels: RiskLevel[] = [
    { threshold: 0.3, label: 'Baixo', advice: 'Monitoramento de rotina. Sem restrição adicional.' },
    { threshold: 0.6, label: 'Moderado', advice: 'Atenção em áreas de borda e beira de estrada.' },
    { threshold: 0.85, label: 'Alto', advice: 'Brigada em prontidão. Queima controlada suspensa.' },
    { threshold: 1, label: 'Crítico', advice: 'Vigilância permanente e acesso restrito à área.' },
]

/**
 * Uma cidade de referência por mesorregião do IBGE, com a coordenada real do
 * centro do município. Serve para o olho se situar: o mapa é do modelo, não um
 * atlas, então é uma por região e não mais que isso.
 */
export const referenceCities: ReferenceCity[] = [
    { name: 'Franca', latitude: -20.5561, longitude: -47.3812, anchor: 'start' },
    { name: 'S. J. do Rio Preto', latitude: -20.7973, longitude: -49.3576, anchor: 'start' },
    { name: 'Araçatuba', latitude: -21.1126, longitude: -50.5753, anchor: 'start' },
    { name: 'Ribeirão Preto', latitude: -21.2138, longitude: -47.8219, anchor: 'start' },
    { name: 'Araraquara', latitude: -21.7921, longitude: -48.1811, anchor: 'start' },
    { name: 'Pres. Prudente', latitude: -21.9924, longitude: -51.3422, anchor: 'start' },
    { name: 'Marília', latitude: -22.1776, longitude: -49.982, anchor: 'start' },
    { name: 'Bauru', latitude: -22.2547, longitude: -49.1248, anchor: 'start' },
    { name: 'Assis', latitude: -22.6022, longitude: -50.4215, anchor: 'start' },
    { name: 'Piracicaba', latitude: -22.724, longitude: -47.7825, anchor: 'end' },
    { name: 'Campinas', latitude: -22.8823, longitude: -47.0453, anchor: 'start' },
    { name: 'S. J. dos Campos', latitude: -23.0908, longitude: -45.9277, anchor: 'start' },
    { name: 'Sorocaba', latitude: -23.4635, longitude: -47.4471, anchor: 'end' },
    { name: 'Itapetininga', latitude: -23.6436, longitude: -48.1207, anchor: 'end' },
    { name: 'São Paulo', latitude: -23.6469, longitude: -46.65, anchor: 'start' },
    { name: 'Santos', latitude: -23.868, longitude: -46.2907, anchor: 'start' },
    { name: 'Registro', latitude: -24.5036, longitude: -47.8208, anchor: 'start' },
    // Centro do terreno acima de 1.000 m do lado paulista, calculado a partir
    // de 934 pontos de altitude amostrados na API de elevação do Open-Meteo.
    { name: 'Serra da Paulista', latitude: -21.786, longitude: -46.703, isFocus: true, anchor: 'start' },
]

/**
 * Grandezas da leitura de uma célula, na ordem em que aparecem.
 *
 * A unidade é curta de propósito: ela ocupa uma coluna de largura fixa ao lado
 * do número, e qualquer coisa mais longa que isso quebraria a linha e desfaria
 * o alinhamento. O que não cabe aqui vai para o rótulo.
 */
export const readoutMeasures = [
    { key: 'probability', label: 'Probabilidade do modelo', unit: '', decimals: 3 },
    { key: 'fireRisk', label: 'Risco de fogo (INPE)', unit: '', decimals: 2 },
    { key: 'altitude', label: 'Altitude', unit: 'm', decimals: 0 },
    { key: 'drynessPeriod', label: 'Período de secura', unit: 'dias', decimals: 0 },
    { key: 'rainfall', label: 'Precipitação no dia', unit: 'mm', decimals: 1 },
    { key: 'temperature', label: 'Temperatura média', unit: '°C', decimals: 1 },
    { key: 'humidity', label: 'Umidade média', unit: '%', decimals: 0 },
] as const

/**
 * Espera antes de pedir uma nova simulação ao servidor, em ms.
 *
 * A resposta leva ~1,2 s, quase toda em custo fixo do modelo. Enquanto ela não
 * chega, a interface lê o valor na curva — então esta espera serve só para não
 * disparar uma requisição por pixel arrastado.
 */
export const simulationDebounce = 350

/**
 * Sufixo que o asset de municípios usa para os de fora de São Paulo.
 *
 * Eles existem para desenhar o recorte da serra, que atravessa a divisa. Ficam
 * fora da busca: a grade do estado não os cobre, e eles só aparecem nela
 * grudados à célula paulista vizinha — o clima seria de outro lugar.
 */
export const outOfStateSuffix = ' (MG)'

/** Município que a busca abre por padrão: o recorte de estudo do projeto. */
export const studyCity = 'São João da Boa Vista'

/** Textos da seção de busca por município. */
export const citySection: RegionSection = {
    title: 'A sua cidade',
    lead:
        'Procure um município e veja a previsão de hoje para ele, as condições que a geraram e onde ' +
        'ele está em relação ao resto do estado. Os números saem da mesma grade do mapa acima — ' +
        'nenhuma consulta nova é feita.',
}

/** Quantos municípios a busca sugere de uma vez. */
export const citySuggestions = 8

/** Textos da seção de simulação. */
export const simulatorSection: RegionSection = {
    title: 'Simulação manual',
    lead:
        'Mude o tempo e veja o modelo responder. Cada controle traz a curva de como a probabilidade ' +
        'reage quando só aquela variável muda. A curva vem junto da predição porque custa quase nada — o ' +
        'peso está em comparar com os 6.416 pontos de treino, não em quantos pontos se pede — e é ela que ' +
        'faz o número acompanhar o controle deslizante sem esperar a rede.',
}

/**
 * Controles do simulador, na ordem em que aparecem.
 *
 * `step` é o passo do controle deslizante. Temperatura e umidade não entram no
 * modelo direto: elas alimentam a fórmula de risco de fogo do INPE, que é uma
 * das quatro features. Por isso aparecem agrupadas depois das entradas diretas.
 */
export const simulationFields: SimulationFieldSpec[] = [
    {
        key: 'dryDays',
        label: 'Dias sem chuva',
        unit: 'dias',
        step: 1,
        decimals: 0,
        note: 'Entra direto no modelo e também na fórmula do INPE.',
    },
    {
        key: 'rainfall',
        label: 'Precipitação do dia',
        unit: 'mm',
        step: 0.5,
        decimals: 1,
        note: 'Entra direto no modelo.',
    },
    {
        key: 'temperature',
        label: 'Temperatura',
        unit: '°C',
        step: 0.5,
        decimals: 1,
        note: 'Chega ao modelo pelo risco de fogo do INPE.',
    },
    {
        key: 'humidity',
        label: 'Umidade relativa',
        unit: '%',
        step: 1,
        decimals: 0,
        note: 'Chega ao modelo pelo risco de fogo do INPE.',
    },
    {
        key: 'biome',
        label: 'Vegetação',
        unit: '',
        step: 0.1,
        decimals: 1,
        note: '1,7 é mata atlântica; 3,0 é cerrado. O treino só viu esses dois.',
    },
]

/**
 * Pontos de partida. O primeiro é o padrão; "Serra agora" é preenchido no
 * servidor com a mediana das condições do recorte da serra, ligando esta seção
 * às duas de cima.
 */
export const simulationPresets: SimulationPreset[] = [
    {
        id: 'seca',
        label: 'Pico da seca',
        input: { dryDays: 60, rainfall: 0, temperature: 33, humidity: 25, biome: 3 },
    },
    {
        id: 'chuva',
        label: 'Verão chuvoso',
        input: { dryDays: 2, rainfall: 18, temperature: 26, humidity: 85, biome: 1.7 },
    },
]
