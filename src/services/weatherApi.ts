import { Region, WeatherData, WeatherDay } from '../types';
import { toDateKey } from '../data/synthetic';

/**
 * Cliente da API pública Open-Meteo (https://open-meteo.com/).
 * Não exige chave e não recebe nenhum dado pessoal: apenas as coordenadas
 * do território selecionado.
 */
const BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const TIMEOUT_MS = 12000;

type OpenMeteoResponse = {
  daily?: {
    time: string[];
    temperature_2m_max: (number | null)[];
    temperature_2m_min: (number | null)[];
    precipitation_sum: (number | null)[];
    precipitation_probability_max?: (number | null)[];
  };
  error?: boolean;
  reason?: string;
};

export function buildWeatherUrl(region: Region): string {
  const params = [
    `latitude=${region.latitude}`,
    `longitude=${region.longitude}`,
    'daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max',
    'past_days=7',
    'forecast_days=7',
    'timezone=America%2FSao_Paulo',
  ];
  return `${BASE_URL}?${params.join('&')}`;
}

export async function fetchWeather(region: Region): Promise<WeatherData> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(buildWeatherUrl(region), { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`A API de clima respondeu com status ${res.status}.`);
    }
    const json = (await res.json()) as OpenMeteoResponse;
    if (json.error || !json.daily) {
      throw new Error(json.reason ?? 'Resposta da API de clima sem dados diários.');
    }
    const d = json.daily;
    const days: WeatherDay[] = d.time.map((date, i) => ({
      date,
      tMax: d.temperature_2m_max[i] ?? NaN,
      tMin: d.temperature_2m_min[i] ?? NaN,
      precipitation: d.precipitation_sum[i] ?? 0,
      precipitationProbability: d.precipitation_probability_max?.[i] ?? null,
    }));
    const todayKey = toDateKey(new Date());
    const idx = days.findIndex((day) => day.date === todayKey);
    return { regionId: region.id, days, todayIndex: idx >= 0 ? idx : Math.min(7, days.length - 1) };
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error('Tempo esgotado ao consultar a API de clima. Verifique sua conexão.');
    }
    if (e instanceof Error) throw e;
    throw new Error('Falha desconhecida ao consultar a API de clima.');
  } finally {
    clearTimeout(timer);
  }
}
