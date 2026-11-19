import AsyncStorage from '@react-native-async-storage/async-storage';
import { Decision, FieldReport, Settings, WeatherData } from '../types';

/**
 * Persistência local (AsyncStorage). Tudo fica apenas no dispositivo do gestor:
 * nada é enviado a servidores, e o usuário pode apagar tudo nos Ajustes.
 */
const PREFIX = '@radar-territorial/v1/';

export const STORAGE_KEYS = {
  settings: `${PREFIX}settings`,
  decisions: `${PREFIX}decisions`,
  reports: `${PREFIX}reports`,
  weatherCache: `${PREFIX}weather-cache`,
} as const;

export type WeatherCacheEntry = { data: WeatherData; fetchedAt: string };
export type WeatherCache = Record<string, WeatherCacheEntry>;

export type PersistedState = {
  settings: Settings | null;
  decisions: Record<string, Decision>;
  reports: FieldReport[];
  weatherCache: WeatherCache;
};

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Falha de escrita não deve derrubar o app; o estado em memória continua válido.
  }
}

export async function loadPersistedState(): Promise<PersistedState> {
  const [settings, decisions, reports, weatherCache] = await Promise.all([
    readJson<Settings | null>(STORAGE_KEYS.settings, null),
    readJson<Record<string, Decision>>(STORAGE_KEYS.decisions, {}),
    readJson<FieldReport[]>(STORAGE_KEYS.reports, []),
    readJson<WeatherCache>(STORAGE_KEYS.weatherCache, {}),
  ]);
  return { settings, decisions, reports, weatherCache };
}

export const saveSettings = (s: Settings) => writeJson(STORAGE_KEYS.settings, s);
export const saveDecisions = (d: Record<string, Decision>) => writeJson(STORAGE_KEYS.decisions, d);
export const saveReports = (r: FieldReport[]) => writeJson(STORAGE_KEYS.reports, r);
export const saveWeatherCache = (c: WeatherCache) => writeJson(STORAGE_KEYS.weatherCache, c);

export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  } catch {
    // ignora
  }
}
