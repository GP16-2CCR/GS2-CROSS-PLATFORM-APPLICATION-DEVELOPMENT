import {
  Alert,
  AlertTheme,
  Confidence,
  DEMAND_LABELS,
  DemandCategory,
  FieldReport,
  Region,
  RegionSeries,
  ReportCategory,
  Severity,
  WeatherData,
} from '../types';
import { clamp, linearRegression, mean, project, stdDev } from './stats';
import { formatNumber, formatPercent, formatShortDate } from '../utils/format';
import { toDateKey } from '../data/synthetic';

/**
 * Motor de alertas preditivos EXPLICÁVEIS.
 * Usa regras simples e auditáveis (regressão linear, z-score e limiares de chuva/calor)
 * em vez de modelos caixa-preta. Cada alerta informa justificativa, confiança
 * (e como ela foi calculada) e limitações. O app NUNCA executa ações: apenas
 * sugere opções para o gestor decidir.
 */

export const FORECAST_DAYS = 7;

export const SEVERITY_ORDER: Record<Severity, number> = { critico: 0, atencao: 1, info: 2 };

export function confidenceLevel(value: number): Confidence['level'] {
  if (value < 0.45) return 'baixa';
  if (value < 0.7) return 'moderada';
  return 'alta';
}

function makeConfidence(value: number, method: string): Confidence {
  const v = clamp(value, 0.1, 0.95);
  return { value: v, level: confidenceLevel(v), method };
}

const REPORT_TO_THEME: Record<ReportCategory, AlertTheme> = {
  agua: 'agua',
  energia: 'energia',
  residuos: 'residuos',
  drenagem: 'chuva',
  saude: 'demanda',
  zeladoria: 'demanda',
  iluminacao: 'demanda',
};

function recentReports(reports: FieldReport[], region: Region, theme: AlertTheme, category?: DemandCategory) {
  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
  return reports.filter(
    (r) =>
      r.regionId === region.id &&
      new Date(r.createdAt).getTime() >= weekAgo &&
      REPORT_TO_THEME[r.category] === theme &&
      (category ? r.category === category : true),
  );
}

function withFieldEvidence(alert: Alert, matches: FieldReport[]): Alert {
  if (matches.length === 0) return alert;
  const bonus = Math.min(0.1, 0.05 * matches.length);
  const value = clamp(alert.confidence.value + bonus, 0.1, 0.95);
  return {
    ...alert,
    justification: [
      ...alert.justification,
      `${matches.length} registro(s) de campo nos últimos 7 dias corroboram o sinal (+${Math.round(bonus * 100)} p.p. de confiança).`,
    ],
    confidence: {
      value,
      level: confidenceLevel(value),
      method: `${alert.confidence.method} Registros de campo recentes somam até +10 p.p.`,
    },
    dataSources: [...alert.dataSources, 'registros-de-campo'],
  };
}

function capacitySeverity(ratio: number, slope: number): Severity | null {
  if (ratio >= 1) return 'critico';
  if (ratio >= 0.9) return 'atencao';
  if (ratio >= 0.82 && slope > 0) return 'info';
  return null;
}

function trendConfidence(r2: number, n: number, horizonDays: number): Confidence {
  const value = 0.3 + 0.45 * r2 + 0.15 * Math.min(1, n / 30) - 0.02 * horizonDays;
  return makeConfidence(
    value,
    `Calculada a partir do ajuste da regressão linear (R² = ${formatNumber(r2, 2)}), do volume de dados (${n} dias) e do horizonte (${horizonDays} dias): 0,30 + 0,45·R² + 0,15·(n/30) − 0,02·horizonte.`,
  );
}

function forecastDays(weather: WeatherData | null) {
  if (!weather) return [];
  return weather.days.slice(weather.todayIndex, weather.todayIndex + FORECAST_DAYS);
}

export type MetricKey = 'water' | 'energy' | 'waste';

export type MetricProjection = {
  forecast: number[];
  peak: number;
  /** Fator multiplicativo aplicado pelo clima previsto (1 = sem ajuste). */
  climateFactor: number;
  hotDays: number;
  maxTemp: number;
  slope: number;
  r2: number;
  n: number;
};

/**
 * Projeção de 7 dias usada TANTO pelos alertas quanto pelos gráficos do painel,
 * garantindo que os números exibidos sejam os mesmos:
 * regressão linear × fator climático (água: +1,5% por dia ≥ 30 °C; energia: +2% por °C acima de 28 °C).
 */
export function projectMetric(metric: MetricKey, series: RegionSeries, weather: WeatherData | null): MetricProjection {
  const values = series[metric].map((p) => p.value);
  const reg = linearRegression(values);
  const fdays = forecastDays(weather);
  const temps = fdays.map((d) => d.tMax).filter(Number.isFinite);
  const maxTemp = temps.length ? Math.max(...temps) : NaN;
  const hotDays = fdays.filter((d) => d.tMax >= 30).length;
  let climateFactor = 1;
  if (metric === 'water') climateFactor = 1 + 0.015 * hotDays;
  if (metric === 'energy' && Number.isFinite(maxTemp)) climateFactor = 1 + 0.02 * Math.max(0, maxTemp - 28);
  const forecast = project(reg, FORECAST_DAYS).map((v) => v * climateFactor);
  return { forecast, peak: Math.max(...forecast), climateFactor, hotDays, maxTemp, slope: reg.slope, r2: reg.r2, n: reg.n };
}

type Ctx = {
  region: Region;
  series: RegionSeries;
  weather: WeatherData | null;
  reports: FieldReport[];
  dateKey: string;
};

const idFor = (ctx: Ctx, theme: string) => `${ctx.region.id}:${theme}:${ctx.dateKey}`;

function waterAlert(ctx: Ctx): Alert | null {
  const values = ctx.series.water.map((p) => p.value);
  const reg = linearRegression(values);
  const { peak, hotDays } = projectMetric('water', ctx.series, ctx.weather);
  const cap = ctx.series.capacity.water;
  const ratio = peak / cap;
  const severity = capacitySeverity(ratio, reg.slope);
  if (!severity) return null;
  const growth = (reg.slope / mean(values)) * 100;

  const justification = [
    `Consumo médio dos últimos 7 dias: ${formatNumber(mean(values.slice(-7)))} m³/dia.`,
    `Tendência de ${growth >= 0 ? 'alta' : 'queda'} de ${formatNumber(Math.abs(growth), 2)}% ao dia (regressão linear sobre ${reg.n} dias).`,
    `Pico projetado em 7 dias: ${formatNumber(peak)} m³/dia, ${formatPercent(ratio * 100)} da capacidade de abastecimento (${formatNumber(cap)} m³/dia).`,
  ];
  if (hotDays > 0) {
    justification.push(`${hotDays} dia(s) com máxima ≥ 30 °C previstos pela Open-Meteo (ajuste de +1,5% por dia quente).`);
  }

  const alert: Alert = {
    id: idFor(ctx, 'agua'),
    regionId: ctx.region.id,
    theme: 'agua',
    severity,
    title: severity === 'critico' ? 'Risco de desabastecimento de água' : 'Pressão crescente no abastecimento de água',
    summary: `Projeção indica uso de ${formatPercent(ratio * 100)} da capacidade nos próximos 7 dias.`,
    horizon: 'Próximos 7 dias',
    justification,
    confidence: trendConfidence(reg.r2, reg.n, FORECAST_DAYS),
    limitations: [
      'Série de consumo SINTÉTICA, gerada para demonstração; não representa medições reais da concessionária.',
      'A regressão linear não captura mudanças bruscas (vazamentos, rodízios, eventos).',
      'O ajuste por calor (+1,5%/dia quente) é uma premissa simplificada, não calibrada com dados locais.',
    ],
    suggestedActions: [
      'Solicitar à concessionária verificação de pressão e perdas na rede local',
      'Lançar campanha de uso consciente de água no território',
      'Mapear equipamentos públicos críticos (UBS, escolas) para priorização de caminhões-pipa',
    ],
    dataSources: hotDays > 0 ? ['sintetico', 'open-meteo'] : ['sintetico'],
  };
  return withFieldEvidence(alert, recentReports(ctx.reports, ctx.region, 'agua'));
}

function energyAlert(ctx: Ctx): Alert | null {
  const values = ctx.series.energy.map((p) => p.value);
  const reg = linearRegression(values);
  const { peak, maxTemp: maxT, climateFactor: heatFactor } = projectMetric('energy', ctx.series, ctx.weather);
  const cap = ctx.series.capacity.energy;
  const ratio = peak / cap;
  const severity = capacitySeverity(ratio, reg.slope);
  if (!severity) return null;

  const justification = [
    `Demanda média dos últimos 7 dias: ${formatNumber(mean(values.slice(-7)), 1)} MWh/dia.`,
    `Pico projetado: ${formatNumber(peak, 1)} MWh/dia, ${formatPercent(ratio * 100)} da capacidade estimada da rede local (${formatNumber(cap)} MWh/dia).`,
  ];
  if (Number.isFinite(maxT)) {
    justification.push(
      `Máxima prevista de ${formatNumber(maxT, 1)} °C (Open-Meteo): fator de climatização de ${formatNumber((heatFactor - 1) * 100, 1)}% aplicado.`,
    );
  } else {
    justification.push('Sem previsão de temperatura disponível: projeção feita apenas pela tendência histórica.');
  }

  const conf = trendConfidence(reg.r2, reg.n, FORECAST_DAYS);
  const alert: Alert = {
    id: idFor(ctx, 'energia'),
    regionId: ctx.region.id,
    theme: 'energia',
    severity,
    title: severity === 'critico' ? 'Sobrecarga provável na rede elétrica' : 'Demanda de energia próxima do limite',
    summary: `Pico projetado de ${formatPercent(ratio * 100)} da capacidade local.`,
    horizon: 'Próximos 7 dias',
    justification,
    confidence: Number.isFinite(maxT)
      ? conf
      : makeConfidence(conf.value - 0.1, `${conf.method} −10 p.p. por ausência de previsão de temperatura.`),
    limitations: [
      'Série de energia SINTÉTICA; a capacidade da rede é uma estimativa ilustrativa.',
      'Elasticidade de 2% por °C acima de 28 °C é uma premissa, não um parâmetro medido.',
      'Não considera manutenção programada nem geração distribuída (painéis solares).',
    ],
    suggestedActions: [
      'Comunicar a distribuidora sobre o risco de pico para reforço preventivo',
      'Recomendar ajuste de horários de climatização em prédios públicos',
      'Preparar plano de contingência para equipamentos de saúde com gerador',
    ],
    dataSources: Number.isFinite(maxT) ? ['sintetico', 'open-meteo'] : ['sintetico'],
  };
  return withFieldEvidence(alert, recentReports(ctx.reports, ctx.region, 'energia'));
}

function wasteAlert(ctx: Ctx): Alert | null {
  const values = ctx.series.waste.map((p) => p.value);
  const reg = linearRegression(values);
  const { peak } = projectMetric('waste', ctx.series, ctx.weather);
  const cap = ctx.series.capacity.waste;
  const ratio = peak / cap;
  const severity = capacitySeverity(ratio, reg.slope);
  if (!severity) return null;

  const alert: Alert = {
    id: idFor(ctx, 'residuos'),
    regionId: ctx.region.id,
    theme: 'residuos',
    severity,
    title: severity === 'critico' ? 'Coleta de resíduos acima da capacidade' : 'Geração de resíduos em alta',
    summary: `Geração projetada em ${formatPercent(ratio * 100)} da capacidade de coleta.`,
    horizon: 'Próximos 7 dias',
    justification: [
      `Geração média dos últimos 7 dias: ${formatNumber(mean(values.slice(-7)), 1)} t/dia.`,
      `Pico projetado: ${formatNumber(peak, 1)} t/dia frente a uma capacidade de coleta de ${formatNumber(cap)} t/dia.`,
      'Acúmulo de resíduos eleva risco de entupimento de bueiros e proliferação de vetores.',
    ],
    confidence: trendConfidence(reg.r2, reg.n, FORECAST_DAYS),
    limitations: [
      'Série de resíduos SINTÉTICA, com ruído alto por dia da semana.',
      'Capacidade de coleta considerada fixa; não inclui mutirões nem coleta extra.',
    ],
    suggestedActions: [
      'Solicitar reforço temporário de rota de coleta ao serviço de limpeza urbana',
      'Divulgar dias e horários de coleta para reduzir descarte irregular',
      'Vistoriar pontos viciados de descarte já conhecidos',
    ],
    dataSources: ['sintetico'],
  };
  return withFieldEvidence(alert, recentReports(ctx.reports, ctx.region, 'residuos'));
}

function demandAlerts(ctx: Ctx): Alert[] {
  const out: Alert[] = [];
  (Object.keys(ctx.series.demand) as DemandCategory[]).forEach((cat) => {
    const pts = ctx.series.demand[cat];
    const baseline = pts.slice(0, -3);
    const recent = pts.slice(-3);
    const isWeekend = (date: string) => {
      const [y, m, d] = date.split('-').map(Number);
      const dow = new Date(y, m - 1, d).getDay();
      return dow === 0 || dow === 6;
    };
    const wdMean = mean(baseline.filter((p) => !isWeekend(p.date)).map((p) => p.value));
    const weMean = mean(baseline.filter((p) => isWeekend(p.date)).map((p) => p.value));
    const ref = (date: string) => (isWeekend(date) ? weMean : wdMean) || 1;
    const baseRatios = baseline.map((p) => p.value / ref(p.date));
    const recentRatios = recent.map((p) => p.value / ref(p.date));
    const sd = stdDev(baseRatios) || 0.1;
    const z = (mean(recentRatios) - 1) / (sd / Math.sqrt(recent.length));
    const excessRatio = mean(recentRatios) - 1;
    if (z < 2.5 || excessRatio < 0.25) return;
    const severity: Severity = z >= 4 ? 'critico' : 'atencao';
    const excess = (mean(recentRatios) - 1) * 100;
    const conf = makeConfidence(
      0.45 + 0.05 * Math.min(6, z - 2.5),
      `Baseada na intensidade da anomalia (z = ${formatNumber(z, 1)}) contra ${baseline.length} dias de linha de base: 0,45 + 0,05·(z − 2,5), limitada a 0,75.`,
    );
    conf.value = Math.min(conf.value, 0.75);
    conf.level = confidenceLevel(conf.value);

    const alert: Alert = {
      id: idFor(ctx, `demanda-${cat}`),
      regionId: ctx.region.id,
      theme: 'demanda',
      severity,
      title: `Pico atípico de chamados: ${DEMAND_LABELS[cat]}`,
      summary: `Últimos 3 dias ${formatNumber(excess, 0)}% acima do esperado para o período.`,
      horizon: 'Agora e próximos 3 dias',
      justification: [
        `Chamados nos últimos 3 dias: ${recent.map((p) => `${formatShortDate(p.date)}: ${p.value}`).join(', ')}.`,
        `Média esperada (ajustada por dia útil/fim de semana): ${formatNumber(wdMean, 0)} em dias úteis e ${formatNumber(weMean, 0)} aos fins de semana.`,
        `Desvio de ${formatNumber(z, 1)} desvios-padrão em relação à linha de base de ${baseline.length} dias.`,
      ],
      confidence: conf,
      limitations: [
        'Contagem de chamados SINTÉTICA, sem desagregação por motivo.',
        'Picos podem refletir mudanças no canal de atendimento, e não aumento real do problema.',
        'Não há informação sobre chamados duplicados.',
      ],
      suggestedActions:
        cat === 'saude'
          ? ['Avaliar ampliação temporária do horário da UBS de referência', 'Acionar vigilância epidemiológica para investigar causa', 'Reforçar triagem e orientação por canais oficiais']
          : cat === 'drenagem'
            ? ['Programar limpeza preventiva de bocas de lobo', 'Vistoriar córregos e pontos históricos de alagamento', 'Alertar Defesa Civil local para monitoramento']
            : cat === 'iluminacao'
              ? ['Priorizar vistoria noturna das vias com mais chamados', 'Solicitar manutenção à concessionária de iluminação']
              : ['Direcionar equipe de zeladoria aos pontos com mais chamados', 'Revisar fila de ordens de serviço em aberto'],
      dataSources: ['sintetico'],
    };
    out.push(withFieldEvidence(alert, recentReports(ctx.reports, ctx.region, 'demanda', cat)));
  });
  return out;
}

function rainAlert(ctx: Ctx): Alert | null {
  const days = forecastDays(ctx.weather);
  if (days.length === 0) return null;
  let maxDay = days[0];
  days.forEach((d) => {
    if (d.precipitation > maxDay.precipitation) maxDay = d;
  });
  let max3 = 0;
  let max3Start = 0;
  for (let i = 0; i < days.length; i++) {
    const s = days.slice(i, i + 3).reduce((a, d) => a + d.precipitation, 0);
    if (s > max3) {
      max3 = s;
      max3Start = i;
    }
  }
  let lvl = 0;
  if (maxDay.precipitation >= 15 || max3 >= 30) lvl = 1;
  if (maxDay.precipitation >= 30 || max3 >= 60) lvl = 2;
  if (maxDay.precipitation >= 50 || max3 >= 90) lvl = 3;
  if (lvl === 0) return null;
  if (ctx.region.drainageRisk === 'alta') lvl = Math.min(3, lvl + 1);
  if (ctx.region.drainageRisk === 'baixa') lvl -= 1;
  if (lvl <= 0) return null;
  const severity: Severity = lvl >= 3 ? 'critico' : lvl === 2 ? 'atencao' : 'info';

  const daysAhead = Math.max(0, days.indexOf(maxDay));
  const prob = maxDay.precipitationProbability ?? 50;
  const conf = makeConfidence(
    (prob / 100) * (1 - 0.06 * daysAhead),
    `Probabilidade de chuva informada pela Open-Meteo (${formatNumber(prob)}%) reduzida em 6 p.p. relativos por dia de antecedência (${daysAhead} dia(s)).`,
  );

  const alert: Alert = {
    id: idFor(ctx, 'chuva'),
    regionId: ctx.region.id,
    theme: 'chuva',
    severity,
    title: severity === 'info' ? 'Chuva relevante prevista' : 'Risco de alagamentos',
    summary: `Até ${formatNumber(maxDay.precipitation, 1)} mm em ${formatShortDate(maxDay.date)}; ${formatNumber(max3, 1)} mm em 3 dias.`,
    horizon: 'Próximos 7 dias',
    justification: [
      `Maior acumulado diário previsto: ${formatNumber(maxDay.precipitation, 1)} mm em ${formatShortDate(maxDay.date)} (probabilidade ${maxDay.precipitationProbability ?? '—'}%).`,
      `Maior acumulado em 3 dias: ${formatNumber(max3, 1)} mm a partir de ${formatShortDate(days[max3Start].date)}.`,
      `Vulnerabilidade de drenagem do território: ${ctx.region.drainageRisk} (ajusta o nível do alerta).`,
    ],
    confidence: conf,
    limitations: [
      'Previsão de modelo meteorológico global/regional: chuvas convectivas localizadas podem não ser capturadas.',
      'A vulnerabilidade de drenagem é uma classificação ilustrativa, não um mapa oficial de risco.',
      'O alerta não substitui os avisos oficiais da Defesa Civil.',
    ],
    suggestedActions: [
      'Avisar a Defesa Civil e equipes de zeladoria para prontidão',
      'Programar limpeza de bocas de lobo nas áreas de maior risco',
      'Preparar comunicação preventiva aos moradores de áreas de risco',
    ],
    dataSources: ['open-meteo'],
  };
  return withFieldEvidence(alert, recentReports(ctx.reports, ctx.region, 'chuva'));
}

function heatAlert(ctx: Ctx): Alert | null {
  const days = forecastDays(ctx.weather);
  if (days.length === 0) return null;
  let run = 0;
  let bestRun = 0;
  let bestEnd = -1;
  days.forEach((d, i) => {
    run = d.tMax >= 32 ? run + 1 : 0;
    if (run > bestRun) {
      bestRun = run;
      bestEnd = i;
    }
  });
  const maxT = Math.max(...days.map((d) => d.tMax).filter(Number.isFinite));
  let severity: Severity | null = null;
  if (bestRun >= 2) severity = 'atencao';
  if (bestRun >= 3 || maxT >= 35) severity = 'critico';
  if (!severity) return null;
  const startIdx = bestRun > 0 ? bestEnd - bestRun + 1 : days.findIndex((d) => d.tMax === maxT);
  const vulnerable = Math.round(ctx.region.population * ctx.region.vulnerableShare);

  return {
    id: idFor(ctx, 'calor'),
    regionId: ctx.region.id,
    theme: 'calor',
    severity,
    title: 'Onda de calor prevista',
    summary: `${bestRun} dia(s) seguidos ≥ 32 °C; máxima de ${formatNumber(maxT, 1)} °C.`,
    horizon: 'Próximos 7 dias',
    justification: [
      `Sequência de ${bestRun} dia(s) com máxima ≥ 32 °C a partir de ${formatShortDate(days[Math.max(0, startIdx)].date)}.`,
      `Temperatura máxima prevista no período: ${formatNumber(maxT, 1)} °C (Open-Meteo).`,
      `Cerca de ${formatNumber(vulnerable)} pessoas em grupos vulneráveis no território (estimativa agregada).`,
    ],
    confidence: makeConfidence(
      0.85 - 0.07 * Math.max(0, startIdx),
      `Previsões de temperatura são mais estáveis que as de chuva: 0,85 − 0,07 por dia de antecedência (${Math.max(0, startIdx)} dia(s)).`,
    ),
    limitations: [
      'Temperatura de ponto de grade: ilhas de calor urbanas podem ser mais quentes.',
      'O total de pessoas vulneráveis é uma estimativa agregada ilustrativa, sem identificação individual.',
    ],
    suggestedActions: [
      'Abrir pontos de hidratação e climatização em equipamentos públicos',
      'Orientar UBS para atenção a idosos e crianças',
      'Ajustar horários de atividades ao ar livre em escolas',
    ],
    dataSources: ['open-meteo'],
  };
}

export type AlertInput = {
  region: Region;
  series: RegionSeries;
  weather: WeatherData | null;
  reports: FieldReport[];
  today?: Date;
};

export function generateAlerts(input: AlertInput): Alert[] {
  const weather = input.weather && input.weather.regionId === input.region.id ? input.weather : null;
  const ctx: Ctx = {
    region: input.region,
    series: input.series,
    weather,
    reports: input.reports,
    dateKey: toDateKey(input.today ?? new Date()),
  };
  const all = [
    waterAlert(ctx),
    energyAlert(ctx),
    wasteAlert(ctx),
    rainAlert(ctx),
    heatAlert(ctx),
    ...demandAlerts(ctx),
  ].filter((a): a is Alert => a !== null);
  return all.sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || b.confidence.value - a.confidence.value,
  );
}
