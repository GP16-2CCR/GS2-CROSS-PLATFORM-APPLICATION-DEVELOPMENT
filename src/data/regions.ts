import { Region } from '../types';

/**
 * Territórios monitorados. Coordenadas reais (usadas na API de clima Open-Meteo);
 * população arredondada e perfis de consumo são SINTÉTICOS, apenas para demonstração.
 */
export const REGIONS: Region[] = [
  {
    id: 'centro-sp',
    name: 'Centro',
    city: 'São Paulo - SP',
    kind: 'urbana',
    latitude: -23.5505,
    longitude: -46.6333,
    population: 430000,
    drainageRisk: 'média',
    vulnerableShare: 0.22,
    profile: {
      waterTrend: 0.0008,
      waterCapacityFactor: 1.3,
      energyTrend: 0.001,
      energyCapacityFactor: 1.12,
      wasteTrend: 0.0015,
      wasteCapacityFactor: 1.25,
      demandSpike: 'zeladoria',
    },
  },
  {
    id: 'itaquera-sp',
    name: 'Itaquera',
    city: 'São Paulo - SP',
    kind: 'urbana',
    latitude: -23.54,
    longitude: -46.4567,
    population: 520000,
    drainageRisk: 'alta',
    vulnerableShare: 0.31,
    profile: {
      waterTrend: 0.0042,
      waterCapacityFactor: 1.1,
      energyTrend: 0.002,
      energyCapacityFactor: 1.25,
      wasteTrend: 0.001,
      wasteCapacityFactor: 1.3,
    },
  },
  {
    id: 'capao-sp',
    name: 'Capão Redondo',
    city: 'São Paulo - SP',
    kind: 'urbana',
    latitude: -23.672,
    longitude: -46.779,
    population: 275000,
    drainageRisk: 'alta',
    vulnerableShare: 0.36,
    profile: {
      waterTrend: 0.006,
      waterCapacityFactor: 1.16,
      energyTrend: 0.0035,
      energyCapacityFactor: 1.14,
      wasteTrend: 0.005,
      wasteCapacityFactor: 1.12,
      demandSpike: 'saude',
    },
  },
  {
    id: 'santana-sp',
    name: 'Santana',
    city: 'São Paulo - SP',
    kind: 'urbana',
    latitude: -23.5025,
    longitude: -46.625,
    population: 330000,
    drainageRisk: 'baixa',
    vulnerableShare: 0.18,
    profile: {
      waterTrend: 0.0005,
      waterCapacityFactor: 1.35,
      energyTrend: 0.0005,
      energyCapacityFactor: 1.35,
      wasteTrend: 0.0005,
      wasteCapacityFactor: 1.4,
    },
  },
  {
    id: 'parelheiros-sp',
    name: 'Parelheiros (zona rural)',
    city: 'São Paulo - SP',
    kind: 'rural',
    latitude: -23.827,
    longitude: -46.727,
    population: 140000,
    drainageRisk: 'média',
    vulnerableShare: 0.4,
    profile: {
      waterTrend: 0.003,
      waterCapacityFactor: 1.18,
      energyTrend: 0.0015,
      energyCapacityFactor: 1.2,
      wasteTrend: 0.004,
      wasteCapacityFactor: 1.08,
      demandSpike: 'drenagem',
    },
  },
];

export const DEFAULT_REGION_ID = 'itaquera-sp';

export function getRegion(id: string): Region {
  return REGIONS.find((r) => r.id === id) ?? REGIONS[0];
}
