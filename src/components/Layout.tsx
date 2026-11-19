import React from 'react';
import { RefreshControl, ScrollView, StyleProp, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/AppContext';
import { AppText } from './AppText';

type ScreenProps = {
  children: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: StyleProp<ViewStyle>;
};

/** Container rolável padrão das telas. */
export function Screen({ children, refreshing, onRefresh, contentStyle }: ScreenProps) {
  const t = useTheme();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.colors.background }}
      contentContainerStyle={[{ padding: t.spacing.lg, paddingBottom: t.spacing.xxl * 2, gap: t.spacing.lg }, contentStyle]}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={t.colors.primary} colors={[t.colors.primary]} />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  );
}

type CardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

export function Card({ children, style, accessibilityLabel }: CardProps) {
  const t = useTheme();
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[
        {
          backgroundColor: t.colors.surface,
          borderRadius: t.radius.lg,
          borderWidth: t.highContrast ? 2 : 1,
          borderColor: t.colors.border,
          padding: t.spacing.lg,
          gap: t.spacing.sm,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

type SectionTitleProps = { title: string; subtitle?: string; right?: React.ReactNode };

export function SectionTitle({ title, subtitle, right }: SectionTitleProps) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: t.spacing.sm }}>
      <View style={{ flex: 1 }}>
        <AppText variant="subtitle" weight="bold" accessibilityRole="header">
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="small" tone="muted">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right}
    </View>
  );
}

type BannerProps = {
  tone: 'info' | 'warning' | 'danger' | 'success';
  title?: string;
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
  children?: React.ReactNode;
};

/** Faixa de aviso: cor + ícone + texto (nunca só cor). */
export function Banner({ tone, title, message, icon, children }: BannerProps) {
  const t = useTheme();
  const map = {
    info: { fg: t.colors.info, bg: t.colors.infoBg, icon: 'information-circle' as const },
    warning: { fg: t.colors.warning, bg: t.colors.warningBg, icon: 'warning' as const },
    danger: { fg: t.colors.danger, bg: t.colors.dangerBg, icon: 'alert-circle' as const },
    success: { fg: t.colors.success, bg: t.colors.successBg, icon: 'checkmark-circle' as const },
  }[tone];
  return (
    <View
      accessible
      accessibilityRole={tone === 'danger' ? 'alert' : 'text'}
      accessibilityLabel={`${title ? `${title}. ` : ''}${message}`}
      style={{
        flexDirection: 'row',
        gap: t.spacing.md,
        padding: t.spacing.md,
        borderRadius: t.radius.md,
        backgroundColor: map.bg,
        borderWidth: t.highContrast ? 2 : 1,
        borderColor: map.fg,
      }}
    >
      <Ionicons name={icon ?? map.icon} size={22} color={map.fg} />
      <View style={{ flex: 1, gap: 2 }}>
        {title ? (
          <AppText weight="bold" style={{ color: map.fg }}>
            {title}
          </AppText>
        ) : null}
        <AppText variant="small">{message}</AppText>
        {children}
      </View>
    </View>
  );
}

type EmptyStateProps = { icon: keyof typeof Ionicons.glyphMap; title: string; message: string; action?: React.ReactNode };

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  const t = useTheme();
  return (
    <View style={{ alignItems: 'center', padding: t.spacing.xl, gap: t.spacing.sm }} accessible accessibilityLabel={`${title}. ${message}`}>
      <Ionicons name={icon} size={48} color={t.colors.textMuted} />
      <AppText variant="subtitle" weight="bold" center>
        {title}
      </AppText>
      <AppText tone="muted" center>
        {message}
      </AppText>
      {action}
    </View>
  );
}
