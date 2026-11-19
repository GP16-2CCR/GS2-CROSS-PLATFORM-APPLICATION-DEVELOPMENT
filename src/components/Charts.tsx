import React, { useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/AppContext';
import { WeatherDay } from '../types';
import { formatNumber, formatShortDate, formatWeekday } from '../utils/format';
import { AppText } from './AppText';

type LineChartProps = {
  /** Série histórica */
  values: number[];
  /** Série projetada (continua após o histórico, desenhada tracejada) */
  forecast?: number[];
  /** Linha horizontal de referência (ex.: capacidade) */
  reference?: { value: number; label: string };
  color: string;
  height?: number;
  unit: string;
  startLabel: string;
  endLabel: string;
  /** Descrição textual completa para leitores de tela */
  accessibilityLabel: string;
};

/**
 * Gráfico de linhas próprio em SVG (sem bibliotecas de terceiros):
 * histórico sólido, projeção tracejada e linha de capacidade.
 */
export function LineChart({ values, forecast = [], reference, color, height = 180, unit, startLabel, endLabel, accessibilityLabel }: LineChartProps) {
  const t = useTheme();
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const all = [...values, ...forecast, ...(reference ? [reference.value] : [])];
  const rawMin = Math.min(...all);
  const rawMax = Math.max(...all);
  const pad = (rawMax - rawMin) * 0.12 || rawMax * 0.1 || 1;
  const min = rawMin - pad;
  const max = rawMax + pad;
  const left = 8;
  const right = 8;
  const top = 14;
  const bottom = 22;
  const total = values.length + forecast.length;
  const innerW = Math.max(1, width - left - right);
  const innerH = height - top - bottom;
  const x = (i: number) => left + (total <= 1 ? 0 : (i / (total - 1)) * innerW);
  const y = (v: number) => top + innerH - ((v - min) / (max - min)) * innerH;

  const histPath = values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const areaPath = values.length
    ? `${histPath} L${x(values.length - 1).toFixed(1)},${top + innerH} L${x(0).toFixed(1)},${top + innerH} Z`
    : '';
  const fcPoints = forecast.length ? [values[values.length - 1], ...forecast] : [];
  const fcPath = fcPoints
    .map((v, k) => `${k === 0 ? 'M' : 'L'}${x(values.length - 1 + k).toFixed(1)},${y(v).toFixed(1)}`)
    .join(' ');

  return (
    <View onLayout={onLayout} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel} style={{ height }}>
      {width > 0 ? (
        <Svg width={width} height={height}>
          {[0, 0.5, 1].map((f) => (
            <Line key={f} x1={left} x2={width - right} y1={top + innerH * f} y2={top + innerH * f} stroke={t.colors.chartGrid} strokeWidth={1} />
          ))}
          {forecast.length > 0 ? (
            <Rect x={x(values.length - 1)} y={top} width={Math.max(0, width - right - x(values.length - 1))} height={innerH} fill={t.colors.surfaceAlt} opacity={0.6} />
          ) : null}
          <Path d={areaPath} fill={color} opacity={0.12} />
          <Path d={histPath} stroke={color} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
          {fcPath ? <Path d={fcPath} stroke={color} strokeWidth={2.5} fill="none" strokeDasharray="6,5" /> : null}
          {values.length > 0 ? <Circle cx={x(values.length - 1)} cy={y(values[values.length - 1])} r={4} fill={color} /> : null}
          {reference ? (
            <>
              <Line x1={left} x2={width - right} y1={y(reference.value)} y2={y(reference.value)} stroke={t.colors.danger} strokeWidth={1.5} strokeDasharray="3,3" />
              <SvgText x={left + 4} y={y(reference.value) - 4} fontSize={11} fill={t.colors.danger} fontWeight="bold">
                {reference.label}
              </SvgText>
            </>
          ) : null}
          <SvgText x={width - right} y={top - 2} fontSize={10} fill={t.colors.textMuted} textAnchor="end">
            {`${formatNumber(max)} ${unit}`}
          </SvgText>
          <SvgText x={left} y={height - 6} fontSize={10} fill={t.colors.textMuted}>
            {startLabel}
          </SvgText>
          <SvgText x={width - right} y={height - 6} fontSize={10} fill={t.colors.textMuted} textAnchor="end">
            {endLabel}
          </SvgText>
          {forecast.length > 0 ? (
            <SvgText x={x(values.length - 1) + 4} y={top + 12} fontSize={10} fill={t.colors.textMuted}>
              previsão
            </SvgText>
          ) : null}
        </Svg>
      ) : null}
    </View>
  );
}

export function ChartLegend({ items }: { items: { label: string; color: string; dashed?: boolean }[] }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.md }} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      {items.map((it) => (
        <View key={it.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View
            style={{
              width: 18,
              height: 0,
              borderTopWidth: 3,
              borderColor: it.color,
              borderStyle: it.dashed ? 'dashed' : 'solid',
            }}
          />
          <AppText variant="caption" tone="muted">
            {it.label}
          </AppText>
        </View>
      ))}
    </View>
  );
}

type BarItem = { label: string; value: number; highlight?: boolean };

/** Barras horizontais acessíveis (cada barra é lida com rótulo e valor). */
export function BarList({ items, color, unit }: { items: BarItem[]; color: string; unit: string }) {
  const t = useTheme();
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <View style={{ gap: t.spacing.sm }}>
      {items.map((it) => (
        <View key={it.label} accessible accessibilityLabel={`${it.label}: ${formatNumber(it.value)} ${unit}${it.highlight ? ', acima do normal' : ''}`} style={{ gap: 4 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <AppText variant="small" weight="medium">
                {it.label}
              </AppText>
              {it.highlight ? <Ionicons name="trending-up" size={14} color={t.colors.danger} /> : null}
            </View>
            <AppText variant="small" weight="bold">
              {formatNumber(it.value)} {unit}
            </AppText>
          </View>
          <View style={{ height: 12, borderRadius: 6, backgroundColor: t.colors.surfaceAlt, overflow: 'hidden' }}>
            <View style={{ width: `${(it.value / max) * 100}%`, height: '100%', borderRadius: 6, backgroundColor: it.highlight ? t.colors.danger : color }} />
          </View>
        </View>
      ))}
    </View>
  );
}

/** Faixa com a previsão do tempo dos próximos dias (dados reais da Open-Meteo). */
export function WeatherStrip({ days }: { days: WeatherDay[] }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      {days.map((d, i) => {
        const rainy = d.precipitation >= 5;
        const hot = d.tMax >= 32;
        const icon = rainy ? 'rainy' : hot ? 'sunny' : 'partly-sunny';
        return (
          <View
            key={d.date}
            accessible
            accessibilityLabel={`${i === 0 ? 'Hoje' : formatWeekday(d.date)}, ${formatShortDate(d.date)}: máxima ${formatNumber(d.tMax)} graus, mínima ${formatNumber(d.tMin)} graus, chuva ${formatNumber(d.precipitation, 1)} milímetros`}
            style={{ alignItems: 'center', gap: 2, flex: 1 }}
          >
            <AppText variant="caption" weight="bold">
              {i === 0 ? 'Hoje' : formatWeekday(d.date)}
            </AppText>
            <Ionicons name={icon} size={20} color={rainy ? t.colors.chartWater : hot ? t.colors.chartEnergy : t.colors.textMuted} />
            <AppText variant="caption" weight="bold">
              {formatNumber(d.tMax)}°
            </AppText>
            <AppText variant="caption" tone="muted">
              {formatNumber(d.tMin)}°
            </AppText>
            <AppText variant="caption" tone="info">
              {formatNumber(d.precipitation, 0)}mm
            </AppText>
          </View>
        );
      })}
    </View>
  );
}
