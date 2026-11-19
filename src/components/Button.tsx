import React from 'react';
import { ActivityIndicator, Pressable, StyleProp, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/AppContext';
import { MIN_TOUCH } from '../theme/tokens';
import { AppText } from './AppText';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  loading?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
};

export function Button({ label, onPress, variant = 'primary', icon, disabled, loading, accessibilityHint, style, compact }: Props) {
  const t = useTheme();
  const palette = {
    primary: { bg: t.colors.primary, fg: t.colors.primaryText, border: t.colors.primary },
    secondary: { bg: t.colors.surface, fg: t.colors.primary, border: t.colors.primary },
    danger: { bg: t.colors.danger, fg: '#FFFFFF', border: t.colors.danger },
    ghost: { bg: 'transparent', fg: t.colors.primary, border: 'transparent' },
  }[variant];
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      hitSlop={compact ? 6 : 0}
      style={({ pressed }) => [
        {
          minHeight: compact ? 40 : MIN_TOUCH,
          paddingHorizontal: compact ? t.spacing.md : t.spacing.lg,
          borderRadius: t.radius.md,
          backgroundColor: palette.bg,
          borderWidth: variant === 'ghost' ? 0 : 2,
          borderColor: palette.border,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: inactive ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
        {loading ? <ActivityIndicator color={palette.fg} /> : icon ? <Ionicons name={icon} size={20} color={palette.fg} /> : null}
        <AppText weight="bold" style={{ color: palette.fg }} variant={compact ? 'small' : 'body'}>
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}
