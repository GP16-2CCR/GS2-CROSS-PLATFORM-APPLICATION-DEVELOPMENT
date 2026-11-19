import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import { RootStackParamList } from '../navigation/types';
import { AppText } from '../components/AppText';
import { Banner, Card, Screen, SectionTitle } from '../components/Layout';
import { BarList, ChartLegend, LineChart, WeatherStrip } from '../components/Charts';
import { KpiCard } from '../components/Indicators';
import { AlertCard } from '../components/AlertCard';
import { Button } from '../components/Button';
import { ChipGroup } from '../components/FormControls';
import { FORECAST_DAYS } from '../analytics/alerts';
import { linearRegression, mean, pctChange, project } from '../analytics/stats';
import { DEMAND_LABELS, DemandCategory } from '../types';
import { formatNumber, formatPercent, formatShortDate, timeAgo } from '../utils/format';

type Metric = 'water' | 'energy' | 'waste';

const METRIC_INFO: Record<Metric, { label: string; unit: string; decimals: number }> = {
  water: { label: 'Água', unit: 'm³/dia', decimals: 0 },
  energy: { label: 'Energia', unit: 'MWh/dia', decimals: 1 },
  waste: { label: 'Resíduos', unit: 't/dia', decimals: 1 },
};

export function DashboardScreen() {
  const { theme: t, region, series, alerts, pendingAlerts, state, refreshWeather } = useApp();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [metric, setMetric] = useState<Metric>('water');
  const weather = state.weather;

  const kpis = useMemo(() => {
    const kpi = (pts: { value: number }[]) => {
      const vals = pts.map((p) => p.value);
      const last = vals[vals.length - 1];
      const prevWeek = mean(vals.slice(-8, -1));
      return { last, variation: pctChange(last, prevWeek) };
    };
    const cats = Object.keys(series.demand) as DemandCategory[];
    const demandTotal = series.water.map((_, i) => ({ value: cats.reduce((acc, c) => acc + series.demand[c][i].value, 0) }));
    return { water: kpi(series.water), energy: kpi(series.energy), waste: kpi(series.waste), demand: kpi(demandTotal) };
  }, [series]);

  const chart = useMemo(() => {
    const pts = series[metric];
    const values = pts.map((p) => p.value);
    const reg = linearRegression(values);
    const forecast = project(reg, FORECAST_DAYS);
    const cap = series.capacity[metric];
    const peak = Math.max(...forecast);
    return { values, forecast, cap, peak, start: pts[0].date, end: pts[pts.length - 1].date };
  }, [series, metric]);

  const demandBars = useMemo(() => {
    const flagged = new Set(alerts.filter((a) => a.theme === 'demanda').map((a) => a.id.split(':')[1].replace('demanda-', '')));
    return (Object.keys(series.demand) as DemandCategory[]).map((c) => ({
      label: DEMAND_LABELS[c],
      value: series.demand[c].slice(-3).reduce((acc, p) => acc + p.value, 0),
      highlight: flagged.has(c),
    }));
  }, [series, alerts]);

  const forecastDays = weather.data ? weather.data.days.slice(weather.data.todayIndex, weather.data.todayIndex + FORECAST_DAYS) : [];
  const counts = {
    critico: alerts.filter((a) => a.severity === 'critico').length,
    atencao: alerts.filter((a) => a.severity === 'atencao').length,
    info: alerts.filter((a) => a.severity === 'info').length,
  };
  const info = METRIC_INFO[metric];
  const goAlerts = () => navigation.navigate('Tabs', { screen: 'Alertas' });

  return (
    <Screen refreshing={weather.status === 'loading'} onRefresh={refreshWeather}>
      {/* Território */}
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.colors.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={region.kind === 'rural' ? 'leaf' : 'business'} size={22} color={t.colors.primaryText} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="caption" tone="muted" weight="bold">
              TERRITÓRIO MONITORADO
            </AppText>
            <AppText variant="title" weight="bold" accessibilityRole="header">
              {region.name}
            </AppText>
            <AppText variant="small" tone="muted">
              {region.city} · ~{formatNumber(region.population)} hab. · drenagem {region.drainageRisk}
            </AppText>
          </View>
        </View>
        <Button label="Trocar território" icon="swap-horizontal" variant="secondary" compact onPress={() => navigation.navigate('RegionPicker')} />
      </Card>

      {/* Resumo de alertas */}
      <Pressable
        onPress={goAlerts}
        accessibilityRole="button"
        accessibilityLabel={`${counts.critico} alertas críticos, ${counts.atencao} de atenção e ${counts.info} informativos. ${pendingAlerts.length} aguardando decisão.`}
        accessibilityHint="Abre a lista de alertas"
        style={{ flexDirection: 'row', gap: t.spacing.sm }}
      >
        {(
          [
            ['critico', 'Críticos', t.colors.danger, t.colors.dangerBg, 'alert-circle'],
            ['atencao', 'Atenção', t.colors.warning, t.colors.warningBg, 'warning'],
            ['info', 'Informativos', t.colors.info, t.colors.infoBg, 'information-circle'],
          ] as const
        ).map(([key, label, fg, bg, icon]) => (
          <View key={key} style={{ flex: 1, backgroundColor: bg, borderRadius: t.radius.md, padding: t.spacing.md, borderWidth: t.highContrast ? 2 : 1, borderColor: fg, alignItems: 'center' }}>
            <Ionicons name={icon} size={20} color={fg} />
            <AppText variant="title" weight="bold" style={{ color: fg }}>
              {counts[key]}
            </AppText>
            <AppText variant="caption" weight="medium" center>
              {label}
            </AppText>
          </View>
        ))}
      </Pressable>

      {pendingAlerts.length > 0 ? (
        <View style={{ gap: t.spacing.sm }}>
          <SectionTitle title="Prioridades do dia" subtitle={`${pendingAlerts.length} alerta(s) aguardando sua decisão`} />
          {pendingAlerts.slice(0, 2).map((a) => (
            <AlertCard key={a.id} alert={a} onPress={() => navigation.navigate('AlertDetail', { alertId: a.id })} />
          ))}
          {pendingAlerts.length > 2 ? <Button label={`Ver todos os ${alerts.length} alertas`} variant="ghost" onPress={goAlerts} /> : null}
        </View>
      ) : (
        <Banner tone="success" title="Sem pendências" message="Todos os alertas deste território já têm uma decisão registrada ou não há riscos projetados." />
      )}

      {/* Indicadores */}
      <SectionTitle title="Indicadores de hoje" subtitle="Comparação com a média dos 7 dias anteriores" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm }}>
        <KpiCard label="Água" value={formatNumber(kpis.water.last)} unit="m³/dia" variation={kpis.water.variation} icon="water" color={t.colors.chartWater} />
        <KpiCard label="Energia" value={formatNumber(kpis.energy.last, 1)} unit="MWh/dia" variation={kpis.energy.variation} icon="flash" color={t.colors.chartEnergy} />
        <KpiCard label="Resíduos" value={formatNumber(kpis.waste.last, 1)} unit="t/dia" variation={kpis.waste.variation} icon="trash" color={t.colors.chartWaste} />
        <KpiCard label="Chamados" value={formatNumber(kpis.demand.last)} unit="chamados/dia" variation={kpis.demand.variation} icon="people" color={t.colors.chartDemand} />
      </View>

      {/* Clima (API real) */}
      <Card>
        <SectionTitle
          title="Clima — próximos 7 dias"
          subtitle={
            weather.fetchedAt
              ? `Open-Meteo · atualizado ${timeAgo(weather.fetchedAt)}${weather.fromCache ? ' (cache)' : ''}`
              : 'Open-Meteo'
          }
          right={weather.status === 'loading' ? <ActivityIndicator color={t.colors.primary} accessibilityLabel="Carregando clima" /> : null}
        />
        {weather.error && weather.data ? (
          <Banner tone="warning" title="Sem conexão com a API" message={`Exibindo a última previsão salva. ${weather.error}`} />
        ) : null}
        {forecastDays.length > 0 ? (
          <WeatherStrip days={forecastDays} />
        ) : weather.status === 'error' ? (
          <View style={{ gap: t.spacing.sm }}>
            <Banner tone="danger" title="Clima indisponível" message={`${weather.error ?? ''} Alertas de chuva e calor ficam desativados até a próxima atualização.`} />
            <Button label="Tentar novamente" icon="refresh" variant="secondary" onPress={refreshWeather} />
          </View>
        ) : (
          <AppText tone="muted">Carregando previsão…</AppText>
        )}
      </Card>

      {/* Tendência */}
      <Card>
        <SectionTitle title="Tendência e projeção" subtitle="30 dias de histórico + 7 dias projetados (regressão linear)" />
        <ChipGroup<Metric>
          label="Indicador exibido"
          value={metric}
          onChange={setMetric}
          options={[
            { value: 'water', label: 'Água', icon: 'water' },
            { value: 'energy', label: 'Energia', icon: 'flash' },
            { value: 'waste', label: 'Resíduos', icon: 'trash' },
          ]}
        />
        <LineChart
          values={chart.values}
          forecast={chart.forecast}
          reference={{ value: chart.cap, label: 'capacidade' }}
          color={metric === 'water' ? t.colors.chartWater : metric === 'energy' ? t.colors.chartEnergy : t.colors.chartWaste}
          unit={info.unit}
          startLabel={formatShortDate(chart.start)}
          endLabel="+7 dias"
          accessibilityLabel={`Gráfico de ${info.label}: de ${formatNumber(chart.values[0], info.decimals)} a ${formatNumber(chart.values[chart.values.length - 1], info.decimals)} ${info.unit} nos últimos 30 dias. Pico projetado de ${formatNumber(chart.peak, info.decimals)} ${info.unit}, ${formatPercent((chart.peak / chart.cap) * 100)} da capacidade de ${formatNumber(chart.cap)} ${info.unit}.`}
        />
        <ChartLegend
          items={[
            { label: 'Histórico', color: metric === 'water' ? t.colors.chartWater : metric === 'energy' ? t.colors.chartEnergy : t.colors.chartWaste },
            { label: 'Projeção', color: t.colors.textMuted, dashed: true },
            { label: 'Capacidade', color: t.colors.danger, dashed: true },
          ]}
        />
        <AppText variant="small" tone="muted">
          Pico projetado: {formatNumber(chart.peak, info.decimals)} {info.unit} ({formatPercent((chart.peak / chart.cap) * 100)} da capacidade).
        </AppText>
      </Card>

      {/* Demanda por serviços */}
      <Card>
        <SectionTitle title="Demanda por serviços" subtitle="Chamados nos últimos 3 dias por categoria" />
        <BarList items={demandBars} color={t.colors.chartDemand} unit="chamados" />
        <AppText variant="caption" tone="muted">
          Barras em vermelho indicam volume anormal em relação à linha de base.
        </AppText>
      </Card>

      <Banner
        tone="info"
        icon="flask-outline"
        title="Sobre os dados"
        message="Consumo de água, energia, resíduos e chamados são dados SINTÉTICOS gerados para demonstração. O clima vem da API pública Open-Meteo (dados reais). Nenhum dado pessoal de cidadãos é usado."
      />
    </Screen>
  );
}
