import React from 'react';
import { Pressable, Switch, TextInput, TextInputProps, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/AppContext';
import { MIN_TOUCH } from '../theme/tokens';
import { AppText } from './AppText';

type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  error?: string | null;
  helper?: string;
  required?: boolean;
  maxLength?: number;
};

/** Campo de texto com rótulo visível, ajuda, contador e mensagem de erro anunciada. */
export function TextField({ label, error, helper, required, value, maxLength, multiline, ...rest }: TextFieldProps) {
  const t = useTheme();
  const borderColor = error ? t.colors.danger : t.colors.border;
  return (
    <View style={{ gap: 4 }}>
      <AppText weight="medium">
        {label}
        {required ? <AppText tone="danger"> *</AppText> : null}
      </AppText>
      <TextInput
        {...rest}
        value={value}
        maxLength={maxLength}
        multiline={multiline}
        accessibilityLabel={`${label}${required ? ', obrigatório' : ''}`}
        accessibilityHint={error ? `Erro: ${error}` : helper}
        placeholderTextColor={t.colors.textMuted}
        style={{
          minHeight: multiline ? 110 : MIN_TOUCH,
          textAlignVertical: multiline ? 'top' : 'center',
          borderWidth: error || t.highContrast ? 2 : 1,
          borderColor,
          borderRadius: t.radius.md,
          paddingHorizontal: t.spacing.md,
          paddingVertical: t.spacing.sm,
          fontSize: t.font.body,
          color: t.colors.text,
          backgroundColor: t.colors.surface,
        }}
      />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: t.spacing.sm }}>
        <View style={{ flex: 1 }}>
          {error ? (
            <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }} accessibilityLiveRegion="polite" accessibilityRole="alert">
              <Ionicons name="alert-circle" size={14} color={t.colors.danger} />
              <AppText variant="caption" tone="danger" weight="medium" style={{ flexShrink: 1 }}>
                {error}
              </AppText>
            </View>
          ) : helper ? (
            <AppText variant="caption" tone="muted">
              {helper}
            </AppText>
          ) : null}
        </View>
        {maxLength ? (
          <AppText variant="caption" tone="muted" accessibilityLabel={`${(value ?? '').length} de ${maxLength} caracteres`}>
            {(value ?? '').length}/{maxLength}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

type ChipOption<T extends string> = { value: T; label: string; icon?: keyof typeof Ionicons.glyphMap };

type ChipGroupProps<T extends string> = {
  label: string;
  options: ChipOption<T>[];
  value: T | null;
  onChange: (v: T) => void;
  error?: string | null;
  required?: boolean;
};

/** Grupo de seleção única (semântica de radio para leitores de tela). */
export function ChipGroup<T extends string>({ label, options, value, onChange, error, required }: ChipGroupProps<T>) {
  const t = useTheme();
  return (
    <View style={{ gap: 6 }} accessibilityRole="radiogroup" accessibilityLabel={label}>
      <AppText weight="medium">
        {label}
        {required ? <AppText tone="danger"> *</AppText> : null}
      </AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm }}>
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <Pressable
              key={o.value}
              onPress={() => onChange(o.value)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={o.label}
              style={{
                minHeight: 40,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: t.spacing.md,
                borderRadius: t.radius.pill,
                borderWidth: 2,
                borderColor: selected ? t.colors.primary : t.colors.border,
                backgroundColor: selected ? t.colors.primary : t.colors.surface,
              }}
            >
              {selected ? (
                <Ionicons name="checkmark" size={16} color={t.colors.primaryText} />
              ) : o.icon ? (
                <Ionicons name={o.icon} size={16} color={t.colors.textMuted} />
              ) : null}
              <AppText variant="small" weight="medium" style={{ color: selected ? t.colors.primaryText : t.colors.text }}>
                {o.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      {error ? (
        <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }} accessibilityLiveRegion="polite">
          <Ionicons name="alert-circle" size={14} color={t.colors.danger} />
          <AppText variant="caption" tone="danger" weight="medium">
            {error}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

type ToggleRowProps = {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  icon: keyof typeof Ionicons.glyphMap;
};

export function ToggleRow({ label, description, value, onChange, icon }: ToggleRowProps) {
  const t = useTheme();
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      accessibilityHint={description}
      style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, minHeight: MIN_TOUCH }}
    >
      <Ionicons name={icon} size={22} color={t.colors.primary} />
      <View style={{ flex: 1 }}>
        <AppText weight="medium">{label}</AppText>
        {description ? (
          <AppText variant="small" tone="muted">
            {description}
          </AppText>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: t.colors.primary, false: t.colors.border }}
        thumbColor={t.colors.surface}
        importantForAccessibility="no"
        accessibilityElementsHidden
      />
    </Pressable>
  );
}
