import { DailyPoint, DemandCategory, Region, RegionSeries } from '../types';

/**
 * Gerador de dados SINTÉTICOS de consumo e demanda.
 * É determinístico: a mesma região no mesmo dia sempre gera a mesma série,
 * o que mantém os alertas estáveis e as decisões do gestor rastreáveis.
 */

export const HISTORY_DAYS = 30;

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** PRNG mulberry32 */
function createRng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function lastNDates(n: number, end: Date): Date[] {
  const out: Date[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(end.getDate() - i);
    out.push(d);
  }
  return out;
}

type SeriesOptions = {
  base: number;
  trend: number;
  noise: number;
  weekendFactor: number;
  rng: () => number;
  dates: Date[];
  spikeLastDays?: number;
  spikeFactor?: number;
};

function buildSeries(o: SeriesOptions): DailyPoint[] {
  return o.dates.map((d, i) => {
    const dow = d.getDay();
    const weekend = dow === 0 || dow === 6;
    const seasonal = weekend ? o.weekendFactor : 1;
    const noise = 1 + (o.rng() - 0.5) * 2 * o.noise;
    let value = o.base * (1 + o.trend * i) * seasonal * noise;
    if (o.spikeLastDays && o.spikeFactor && i >= o.dates.length - o.spikeLastDays) {
      value *= o.spikeFactor;
    }
    return { date: toDateKey(d), value: Math.round(value * 10) / 10 };
  });
}

const DEMAND_BASE_PER_10K: Record<DemandCategory, number> = {
  zeladoria: 1.6,
  saude: 2.4,
  iluminacao: 0.7,
  drenagem: 0.5,
};

export function generateRegionSeries(region: Region, today: Date = new Date()): RegionSeries {
  const dateKey = toDateKey(today);
  const rng = createRng(hashString(`${region.id}:${dateKey}`));
  const dates = lastNDates(HISTORY_DAYS, today);
  const p = region.profile;

  const waterBase = region.population * 0.15; // ~150 L/pessoa/dia
  const energyBase = region.population * 0.0045; // ~4,5 kWh/pessoa/dia
  const wasteBase = region.population * 0.00105; // ~1,05 kg/pessoa/dia

  const water = buildSeries({ base: waterBase, trend: p.waterTrend, noise: 0.025, weekendFactor: 0.95, rng, dates });
  const energy = buildSeries({ base: energyBase, trend: p.energyTrend, noise: 0.03, weekendFactor: 0.9, rng, dates });
  const waste = buildSeries({ base: wasteBase, trend: p.wasteTrend, noise: 0.05, weekendFactor: 1.08, rng, dates });

  const demand = {} as Record<DemandCategory, DailyPoint[]>;
  (Object.keys(DEMAND_BASE_PER_10K) as DemandCategory[]).forEach((cat) => {
    const base = (region.population / 10000) * DEMAND_BASE_PER_10K[cat];
    const spike = p.demandSpike === cat;
    demand[cat] = buildSeries({
      base,
      trend: 0,
      noise: 0.18,
      weekendFactor: cat === 'saude' ? 0.6 : 0.85,
      rng,
      dates,
      spikeLastDays: spike ? 3 : undefined,
      spikeFactor: spike ? 1.75 : undefined,
    }).map((pt) => ({ ...pt, value: Math.round(pt.value) }));
  });

  return {
    water,
    energy,
    waste,
    demand,
    capacity: {
      water: Math.round(waterBase * p.waterCapacityFactor),
      energy: Math.round(energyBase * p.energyCapacityFactor),
      waste: Math.round(wasteBase * p.wasteCapacityFactor),
    },
  };
}
