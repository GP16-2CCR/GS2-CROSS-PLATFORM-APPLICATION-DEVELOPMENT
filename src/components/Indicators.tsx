import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/AppContext';
import { Alert, Confidence, Severity } from '../types';
import { formatPercent, formatSignedPercent } from '../utils/format';
import { AppText } from './AppText';

export const SEVERITY_LABEL: Record<Severity, string> = { critico: 'Crítico', atencao: 'Atenção', info: 'Informativo' };

export function useSeverityColors(severity: Severity) {
  const t = useTheme();
  return {
    critico: { fg: t.colors.danger, bg: t.colors.dangerBg, icon: 'alert-circle' as const },
    atencao: { fg: t.colors.warning, bg: t.colors.warningBg, icon: 'warning' as const },
    info: { fg: t.colors.info, bg: t.colors.infoBg, icon: 'information-circle' as const },
  }[severity];
}

/** Selo de severidade: ícone + texto + cor. */
export function SeverityBadge({ severity }: { severity: Severity }) {
  const t = useTheme();
  const c = useSeverityColors(severity);
  return (
    <View
      accessible
      accessibilityLabel={`Severidade: ${SEVERITY_LABEL[severity]}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        alignSelf: 'flex-start',
        paddingHorizontal: t.spacing.sm,
        paddingVertical: 2,
        borderRadius: t.radius.pill,
        backgroundColor: c.bg,
        borderWidth: 1,
        borderColor: c.fg,
      }}
    >
      <Ionicons name={c.icon} size={14} color={c.fg} />
      <AppText variant="caption" weight="bold" style={{ color: c.fg }}>
        {SEVERITY_LABEL[severity].toUpperCase()}
      </AppText>
    </View>
  );
}

/** Medidor de confiança com barra segmentada e rótulo textual. */
export function ConfidenceMeter({ confidence, showMethod }: { confidence: Confidence; showMethod?: boolean }) {
  const t = useTheme();
  const pct = Math.round(confidence.value * 100);
  const color =
    confidence.level === 'alta' ? t.colors.success : confidence.level === 'moderada' ? t.colors.warning : t.colors.danger;
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Confiança ${confidence.level}, ${pct} por cento`}
      accessibilityValue={{ min: 0, max: 100, now: pct }}
      style={{ gap: 4 }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <AppText variant="small" weight="medium">
          Confiança {confidence.level}
        </AppText>
        <AppText variant="small" weight="bold">
          {formatPercent(pct)}
        </AppText>
      </View>
      <View style={{ height: 10, borderRadius: 5, backgroundColor: t.colors.surfaceAlt, overflow: 'hidden', borderWidth: t.highContrast ? 1 : 0, borderColor: t.colors.border }}>
        <View style={{ width: `${pct}%`, height: '100%', backgroundColor: color }} />
      </View>
      {showMethod ? (
        <AppText variant="caption" tone="muted">
          {confidence.method}
        </AppText>
      ) : null}
    </View>
  );
}

type KpiProps = {
  label: string;
  value: string;
  unit: string;
  variation: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  /** true quando alta é algo ruim (consumo), para colorir a variação. */
  higherIsWorse?: boolean;
};

export function KpiCard({ label, value, unit, variation, icon, color, higherIsWorse = true }: KpiProps) {
  const t = useTheme();
  const up = variation > 0.05;
  const down = variation < -0.05;
  const bad = higherIsWorse ? up : down;
  const varColor = up || down ? (bad ? t.colors.danger : t.colors.success) : t.colors.textMuted;
  const arrow = up ? 'arrow-up' : down ? 'arrow-down' : 'remove';
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value} ${unit}. Variação de ${formatSignedPercent(variation)} em relação à média dos 7 dias anteriores.`}
      style={{
        flexBasis: '47%',
        flexGrow: 1,
        backgroundColor: t.colors.surface,
        borderRadius: t.radius.lg,
        borderWidth: t.highContrast ? 2 : 1,
        borderColor: t.colors.border,
        borderLeftWidth: 5,
        borderLeftColor: color,
        padding: t.spacing.md,
        gap: 2,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Ionicons name={icon} size={18} color={color} />
        <AppText variant="small" tone="muted" weight="medium" style={{ flexShrink: 1 }}>
          {label}
        </AppText>
      </View>
      <AppText variant="title" weight="bold">
        {value}
      </AppText>
      <AppText variant="caption" tone="muted">
        {unit}
      </AppText>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
        <Ionicons name={arrow} size={14} color={varColor} />
        <AppText variant="caption" weight="bold" style={{ color: varColor }}>
          {formatSignedPercent(variation)} vs. semana anterior
        </AppText>
      </View>
    </View>
  );
}

const SOURCE_LABEL: Record<Alert['dataSources'][number], string> = {
  sintetico: 'Dados sintéticos',
  'open-meteo': 'Open-Meteo (real)',
  'registros-de-campo': 'Registros de campo',
};

export function DataSourceTags({ sources }: { sources: Alert['dataSources'] }) {
  const t = useTheme();
  const unique = Array.from(new Set(sources));
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }} accessible accessibilityLabel={`Fontes: ${unique.map((s) => SOURCE_LABEL[s]).join(', ')}`}>
      {unique.map((s) => (
        <View
          key={s}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: t.radius.pill,
            backgroundColor: t.colors.surfaceAlt,
            borderWidth: 1,
            borderColor: t.colors.border,
          }}
        >
          <Ionicons
            name={s === 'sintetico' ? 'flask-outline' : s === 'open-meteo' ? 'cloud-outline' : 'clipboard-outline'}
            size={12}
            color={t.colors.textMuted}
          />
          <AppText variant="caption" tone="muted">
            {SOURCE_LABEL[s]}
          </AppText>
        </View>
      ))}
    </View>
  );
}
