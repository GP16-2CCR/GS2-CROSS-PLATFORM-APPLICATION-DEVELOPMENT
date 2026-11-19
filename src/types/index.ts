export type DrainageRisk = 'baixa' | 'média' | 'alta';

export type Region = {
  id: string;
  name: string;
  city: string;
  kind: 'urbana' | 'rural';
  latitude: number;
  longitude: number;
  /** População aproximada (valor arredondado, apenas para escala dos dados sintéticos). */
  population: number;
  drainageRisk: DrainageRisk;
  /** Fração estimada da população em situação de vulnerabilidade (idosos, crianças, baixa renda). */
  vulnerableShare: number;
  /** Parâmetros dos geradores sintéticos (tendência diária e folga de capacidade). */
  profile: {
    waterTrend: number;
    waterCapacityFactor: number;
    energyTrend: number;
    energyCapacityFactor: number;
    wasteTrend: number;
    wasteCapacityFactor: number;
    demandSpike?: DemandCategory;
  };
};

export type DemandCategory = 'zeladoria' | 'saude' | 'iluminacao' | 'drenagem';

export const DEMAND_LABELS: Record<DemandCategory, string> = {
  zeladoria: 'Zeladoria',
  saude: 'Saúde (UBS)',
  iluminacao: 'Iluminação',
  drenagem: 'Drenagem',
};

export type DailyPoint = { date: string; value: number };

export type RegionSeries = {
  water: DailyPoint[]; // m³/dia
  energy: DailyPoint[]; // MWh/dia
  waste: DailyPoint[]; // t/dia
  demand: Record<DemandCategory, DailyPoint[]>; // chamados/dia
  capacity: { water: number; energy: number; waste: number };
};

export type WeatherDay = {
  date: string;
  tMax: number;
  tMin: number;
  precipitation: number; // mm
  precipitationProbability: number | null; // %
};

export type WeatherData = {
  regionId: string;
  days: WeatherDay[];
  /** Índice do primeiro dia de previsão (hoje) dentro de `days`. */
  todayIndex: number;
};

export type WeatherState = {
  status: 'idle' | 'loading' | 'success' | 'error';
  data: WeatherData | null;
  fetchedAt: string | null;
  fromCache: boolean;
  error: string | null;
};

export type AlertTheme = 'agua' | 'energia' | 'chuva' | 'calor' | 'residuos' | 'demanda';
export type Severity = 'info' | 'atencao' | 'critico';

export type Confidence = {
  /** 0 a 1 */
  value: number;
  level: 'baixa' | 'moderada' | 'alta';
  method: string;
};

export type Alert = {
  id: string;
  regionId: string;
  theme: AlertTheme;
  severity: Severity;
  title: string;
  summary: string;
  horizon: string;
  justification: string[];
  confidence: Confidence;
  limitations: string[];
  suggestedActions: string[];
  dataSources: ('sintetico' | 'open-meteo' | 'registros-de-campo')[];
};

export type DecisionKind = 'aprovar' | 'monitorar' | 'descartar';

export const DECISION_LABELS: Record<DecisionKind, string> = {
  aprovar: 'Encaminhar ação',
  monitorar: 'Adiar e monitorar',
  descartar: 'Descartar alerta',
};

export type Decision = {
  alertId: string;
  regionId: string;
  alertTitle: string;
  severity: Severity;
  kind: DecisionKind;
  action: string | null;
  rationale: string;
  managerRole: string;
  decidedAt: string;
};

export type ReportCategory = DemandCategory | 'agua' | 'energia' | 'residuos';

export const REPORT_CATEGORY_LABELS: Record<ReportCategory, string> = {
  agua: 'Água',
  energia: 'Energia',
  residuos: 'Resíduos',
  zeladoria: 'Zeladoria',
  saude: 'Saúde',
  iluminacao: 'Iluminação',
  drenagem: 'Drenagem',
};

export type Priority = 'baixa' | 'media' | 'alta';

export const PRIORITY_LABELS: Record<Priority, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
};

/** Registro de campo feito pelo gestor. Não contém dados pessoais de cidadãos. */
export type FieldReport = {
  id: string;
  regionId: string;
  category: ReportCategory;
  title: string;
  description: string;
  priority: Priority;
  estimatedAffected: number;
  createdAt: string;
};

export type Settings = {
  regionId: string;
  highContrast: boolean;
  largeText: boolean;
};
