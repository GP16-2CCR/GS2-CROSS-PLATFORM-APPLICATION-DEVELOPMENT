import React from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import { RootStackParamList } from '../navigation/types';
import { AppText } from '../components/AppText';
import { Screen } from '../components/Layout';
import { REGIONS } from '../data/regions';
import { formatNumber, formatPercent } from '../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'RegionPicker'>;

export function RegionPickerScreen({ navigation }: Props) {
  const { theme: t, region, setRegion } = useApp();
  return (
    <Screen>
      <AppText tone="muted">Escolha o território que deseja monitorar. Os alertas e gráficos serão recalculados.</AppText>
      <View accessibilityRole="radiogroup" style={{ gap: t.spacing.sm }}>
        {REGIONS.map((r) => {
          const selected = r.id === region.id;
          return (
            <Pressable
              key={r.id}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={`${r.name}, ${r.city}, ${r.kind}. População aproximada ${formatNumber(r.population)}. Risco de drenagem ${r.drainageRisk}.`}
              onPress={() => {
                setRegion(r.id);
                navigation.goBack();
              }}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: t.spacing.md,
                padding: t.spacing.lg,
                borderRadius: t.radius.lg,
                backgroundColor: t.colors.surface,
                borderWidth: selected ? 3 : t.highContrast ? 2 : 1,
                borderColor: selected ? t.colors.primary : t.colors.border,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Ionicons name={r.kind === 'rural' ? 'leaf-outline' : 'business-outline'} size={26} color={t.colors.primary} />
              <View style={{ flex: 1 }}>
                <AppText weight="bold">{r.name}</AppText>
                <AppText variant="small" tone="muted">
                  {r.city} · {r.kind === 'rural' ? 'Comunidade rural' : 'Área urbana'}
                </AppText>
                <AppText variant="caption" tone="muted">
                  ~{formatNumber(r.population)} hab. · drenagem {r.drainageRisk} · {formatPercent(r.vulnerableShare * 100)} vulneráveis
                </AppText>
              </View>
              <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={24} color={t.colors.primary} />
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}
