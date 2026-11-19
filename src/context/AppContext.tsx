import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { generateAlerts } from '../analytics/alerts';
import { DEFAULT_REGION_ID, getRegion } from '../data/regions';
import { generateRegionSeries } from '../data/synthetic';
import {
  clearAllData,
  loadPersistedState,
  saveDecisions,
  saveReports,
  saveSettings,
  saveWeatherCache,
  WeatherCache,
} from '../services/storage';
import { fetchWeather } from '../services/weatherApi';
import { buildTheme, Theme } from '../theme/tokens';
import {
  Alert,
  Decision,
  FieldReport,
  Region,
  RegionSeries,
  Settings,
  WeatherData,
  WeatherState,
} from '../types';

/**
 * Estado global do app (Context API + useReducer).
 * - settings, decisions, reports e weatherCache são persistidos no AsyncStorage;
 * - séries sintéticas e alertas são DERIVADOS (useMemo), nunca duplicados no estado.
 */

type State = {
  hydrated: boolean;
  settings: Settings;
  decisions: Record<string, Decision>;
  reports: FieldReport[];
  weatherCache: WeatherCache;
  weather: WeatherState;
};

type Action =
  | { type: 'HYDRATE'; payload: Omit<State, 'hydrated' | 'weather'> }
  | { type: 'SET_REGION'; regionId: string }
  | { type: 'SET_SETTING'; key: 'highContrast' | 'largeText'; value: boolean }
  | { type: 'WEATHER_LOADING' }
  | { type: 'WEATHER_SUCCESS'; data: WeatherData; fetchedAt: string }
  | { type: 'WEATHER_ERROR'; error: string }
  | { type: 'SAVE_DECISION'; decision: Decision }
  | { type: 'REMOVE_DECISION'; alertId: string }
  | { type: 'ADD_REPORT'; report: FieldReport }
  | { type: 'REMOVE_REPORT'; id: string }
  | { type: 'RESET' };

const emptyWeather: WeatherState = { status: 'idle', data: null, fetchedAt: null, fromCache: false, error: null };

const defaultSettings: Settings = { regionId: DEFAULT_REGION_ID, highContrast: false, largeText: false };

const initialState: State = {
  hydrated: false,
  settings: defaultSettings,
  decisions: {},
  reports: [],
  weatherCache: {},
  weather: emptyWeather,
};

function weatherFromCache(cache: WeatherCache, regionId: string): WeatherState {
  const entry = cache[regionId];
  if (!entry) return emptyWeather;
  return { status: 'success', data: entry.data, fetchedAt: entry.fetchedAt, fromCache: true, error: null };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'HYDRATE':
      return {
        ...state,
        ...action.payload,
        hydrated: true,
        weather: weatherFromCache(action.payload.weatherCache, action.payload.settings.regionId),
      };
    case 'SET_REGION':
      if (action.regionId === state.settings.regionId) return state;
      return {
        ...state,
        settings: { ...state.settings, regionId: action.regionId },
        weather: weatherFromCache(state.weatherCache, action.regionId),
      };
    case 'SET_SETTING':
      return { ...state, settings: { ...state.settings, [action.key]: action.value } };
    case 'WEATHER_LOADING':
      return { ...state, weather: { ...state.weather, status: 'loading', error: null } };
    case 'WEATHER_SUCCESS':
      if (action.data.regionId !== state.settings.regionId) {
        // resposta atrasada de outra região: só atualiza o cache
        return {
          ...state,
          weatherCache: { ...state.weatherCache, [action.data.regionId]: { data: action.data, fetchedAt: action.fetchedAt } },
        };
      }
      return {
        ...state,
        weatherCache: { ...state.weatherCache, [action.data.regionId]: { data: action.data, fetchedAt: action.fetchedAt } },
        weather: { status: 'success', data: action.data, fetchedAt: action.fetchedAt, fromCache: false, error: null },
      };
    case 'WEATHER_ERROR': {
      const cached = state.weatherCache[state.settings.regionId];
      return {
        ...state,
        weather: cached
          ? { status: 'success', data: cached.data, fetchedAt: cached.fetchedAt, fromCache: true, error: action.error }
          : { ...emptyWeather, status: 'error', error: action.error },
      };
    }
    case 'SAVE_DECISION':
      return { ...state, decisions: { ...state.decisions, [action.decision.alertId]: action.decision } };
    case 'REMOVE_DECISION': {
      const next = { ...state.decisions };
      delete next[action.alertId];
      return { ...state, decisions: next };
    }
    case 'ADD_REPORT':
      return { ...state, reports: [action.report, ...state.reports] };
    case 'REMOVE_REPORT':
      return { ...state, reports: state.reports.filter((r) => r.id !== action.id) };
    case 'RESET':
      return { ...initialState, hydrated: true };
    default:
      return state;
  }
}

type AppContextValue = {
  state: State;
  theme: Theme;
  region: Region;
  series: RegionSeries;
  alerts: Alert[];
  pendingAlerts: Alert[];
  setRegion: (id: string) => void;
  setSetting: (key: 'highContrast' | 'largeText', value: boolean) => void;
  refreshWeather: () => Promise<void>;
  saveDecision: (d: Decision) => void;
  removeDecision: (alertId: string) => void;
  addReport: (r: FieldReport) => void;
  removeReport: (id: string) => void;
  resetAll: () => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const requestId = useRef(0);

  // 1) Carrega dados persistidos
  useEffect(() => {
    loadPersistedState().then((p) => {
      dispatch({
        type: 'HYDRATE',
        payload: {
          settings: { ...defaultSettings, ...(p.settings ?? {}) },
          decisions: p.decisions,
          reports: p.reports,
          weatherCache: p.weatherCache,
        },
      });
    });
  }, []);

  // 2) Persiste cada fatia quando muda (após hidratar)
  useEffect(() => {
    if (state.hydrated) saveSettings(state.settings);
  }, [state.hydrated, state.settings]);
  useEffect(() => {
    if (state.hydrated) saveDecisions(state.decisions);
  }, [state.hydrated, state.decisions]);
  useEffect(() => {
    if (state.hydrated) saveReports(state.reports);
  }, [state.hydrated, state.reports]);
  useEffect(() => {
    if (state.hydrated) saveWeatherCache(state.weatherCache);
  }, [state.hydrated, state.weatherCache]);

  const region = useMemo(() => getRegion(state.settings.regionId), [state.settings.regionId]);

  const refreshWeather = useCallback(async () => {
    const id = ++requestId.current;
    dispatch({ type: 'WEATHER_LOADING' });
    try {
      const data = await fetchWeather(region);
      dispatch({ type: 'WEATHER_SUCCESS', data, fetchedAt: new Date().toISOString() });
    } catch (e) {
      if (id === requestId.current) {
        dispatch({ type: 'WEATHER_ERROR', error: e instanceof Error ? e.message : 'Erro ao consultar clima.' });
      }
    }
  }, [region]);

  // 3) Busca clima sempre que a região muda
  useEffect(() => {
    if (state.hydrated) refreshWeather();
  }, [state.hydrated, refreshWeather]);

  const series = useMemo(() => generateRegionSeries(region), [region]);

  const alerts = useMemo(
    () => generateAlerts({ region, series, weather: state.weather.data, reports: state.reports }),
    [region, series, state.weather.data, state.reports],
  );

  const pendingAlerts = useMemo(() => alerts.filter((a) => !state.decisions[a.id]), [alerts, state.decisions]);

  const theme = useMemo(
    () => buildTheme(state.settings.highContrast, state.settings.largeText),
    [state.settings.highContrast, state.settings.largeText],
  );

  const resetAll = useCallback(async () => {
    await clearAllData();
    dispatch({ type: 'RESET' });
  }, []);

  const value: AppContextValue = {
    state,
    theme,
    region,
    series,
    alerts,
    pendingAlerts,
    setRegion: (id) => dispatch({ type: 'SET_REGION', regionId: id }),
    setSetting: (key, v) => dispatch({ type: 'SET_SETTING', key, value: v }),
    refreshWeather,
    saveDecision: (decision) => dispatch({ type: 'SAVE_DECISION', decision }),
    removeDecision: (alertId) => dispatch({ type: 'REMOVE_DECISION', alertId }),
    addReport: (report) => dispatch({ type: 'ADD_REPORT', report }),
    removeReport: (id) => dispatch({ type: 'REMOVE_REPORT', id }),
    resetAll,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp deve ser usado dentro de <AppProvider>.');
  return ctx;
}

export function useTheme(): Theme {
  return useApp().theme;
}
