import React from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/AppContext';
import { Alert, AlertTheme, Decision, DECISION_LABELS } from '../types';
import { AppText } from './AppText';
import { ConfidenceMeter, SEVERITY_LABEL, SeverityBadge, useSeverityColors } from './Indicators';

export const THEME_ICON: Record<AlertTheme, keyof typeof Ionicons.glyphMap> = {
  agua: 'water',
  energia: 'flash',
  chuva: 'rainy',
  calor: 'thermometer',
  residuos: 'trash',
  demanda: 'people',
};

type Props = { alert: Alert; decision?: Decision; onPress: () => void };

export function AlertCard({ alert, decision, onPress }: Props) {
  const t = useTheme();
  const c = useSeverityColors(alert.severity);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Alerta ${SEVERITY_LABEL[alert.severity]}: ${alert.title}. ${alert.summary}. Confiança ${alert.confidence.level}. ${decision ? `Decisão registrada: ${DECISION_LABELS[decision.kind]}.` : 'Aguardando decisão do gestor.'}`}
      accessibilityHint="Abre a justificativa, limitações e o formulário de decisão"
      style={({ pressed }) => ({
        backgroundColor: t.colors.surface,
        borderRadius: t.radius.lg,
        borderWidth: t.highContrast ? 2 : 1,
        borderColor: t.colors.border,
        borderLeftWidth: 6,
        borderLeftColor: c.fg,
        padding: t.spacing.lg,
        gap: t.spacing.sm,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: t.spacing.sm }}>
        <SeverityBadge severity={alert.severity} />
        {decision ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="checkmark-done" size={16} color={t.colors.success} />
            <AppText variant="caption" tone="success" weight="bold">
              {DECISION_LABELS[decision.kind]}
            </AppText>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="time-outline" size={16} color={t.colors.textMuted} />
            <AppText variant="caption" tone="muted" weight="bold">
              Aguardando decisão
            </AppText>
          </View>
        )}
      </View>
      <View style={{ flexDirection: 'row', gap: t.spacing.md, alignItems: 'flex-start' }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={THEME_ICON[alert.theme]} size={22} color={c.fg} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <AppText weight="bold">{alert.title}</AppText>
          <AppText variant="small" tone="muted">
            {alert.summary}
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={20} color={t.colors.textMuted} />
      </View>
      <ConfidenceMeter confidence={alert.confidence} />
    </Pressable>
  );
}
