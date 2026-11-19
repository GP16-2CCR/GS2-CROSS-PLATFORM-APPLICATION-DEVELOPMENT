import React from 'react';
import { Text, TextProps } from 'react-native';
import { useTheme } from '../context/AppContext';
import { Typography } from '../theme/tokens';

type Props = TextProps & {
  variant?: keyof Typography;
  tone?: 'default' | 'muted' | 'primary' | 'danger' | 'warning' | 'success' | 'info' | 'inverse';
  weight?: 'regular' | 'medium' | 'bold';
  center?: boolean;
};

/** Texto base do app: aplica a escala tipográfica (incl. modo "texto ampliado") e as cores do tema. */
export function AppText({ variant = 'body', tone = 'default', weight = 'regular', center, style, ...rest }: Props) {
  const t = useTheme();
  const color = {
    default: t.colors.text,
    muted: t.colors.textMuted,
    primary: t.colors.primary,
    danger: t.colors.danger,
    warning: t.colors.warning,
    success: t.colors.success,
    info: t.colors.info,
    inverse: t.colors.primaryText,
  }[tone];
  const fontWeight = weight === 'bold' ? '700' : weight === 'medium' ? '600' : '400';
  return (
    <Text
      {...rest}
      maxFontSizeMultiplier={1.6}
      style={[
        {
          color,
          fontSize: t.font[variant],
          lineHeight: Math.round(t.font[variant] * 1.35),
          fontWeight,
          textAlign: center ? 'center' : undefined,
        },
        style,
      ]}
    />
  );
}
