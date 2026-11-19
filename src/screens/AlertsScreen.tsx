import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import { RootStackParamList } from '../navigation/types';
import { AlertCard } from '../components/AlertCard';
import { ChipGroup } from '../components/FormControls';
import { Banner, EmptyState, Screen } from '../components/Layout';
import { AppText } from '../components/AppText';
import { Severity } from '../types';

type StatusFilter = 'pendentes' | 'decididos' | 'todos';
type SeverityFilter = Severity | 'todas';

export function AlertsScreen() {
  const { theme: t, alerts, state, region, refreshWeather } = useApp();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [status, setStatus] = useState<StatusFilter>('pendentes');
  const [severity, setSeverity] = useState<SeverityFilter>('todas');

  const filtered = useMemo(
    () =>
      alerts.filter((a) => {
        const decided = !!state.decisions[a.id];
        if (status === 'pendentes' && decided) return false;
        if (status === 'decididos' && !decided) return false;
        if (severity !== 'todas' && a.severity !== severity) return false;
        return true;
      }),
    [alerts, state.decisions, status, severity],
  );

  return (
    <Screen refreshing={state.weather.status === 'loading'} onRefresh={refreshWeather}>
      <Banner
        tone="info"
        icon="hand-left-outline"
        title="Você decide"
        message="Os alertas são projeções com incerteza. Nenhuma ação é executada automaticamente: abra o alerta, avalie a justificativa e registre sua decisão."
      />
      <View style={{ gap: t.spacing.md }}>
        <ChipGroup<StatusFilter>
          label="Situação"
          value={status}
          onChange={setStatus}
          options={[
            { value: 'pendentes', label: 'Pendentes' },
            { value: 'decididos', label: 'Decididos' },
            { value: 'todos', label: 'Todos' },
          ]}
        />
        <ChipGroup<SeverityFilter>
          label="Severidade"
          value={severity}
          onChange={setSeverity}
          options={[
            { value: 'todas', label: 'Todas' },
            { value: 'critico', label: 'Crítico', icon: 'alert-circle' },
            { value: 'atencao', label: 'Atenção', icon: 'warning' },
            { value: 'info', label: 'Informativo', icon: 'information-circle' },
          ]}
        />
      </View>
      <AppText variant="small" tone="muted" accessibilityLiveRegion="polite">
        {filtered.length} alerta(s) em {region.name}
      </AppText>
      {filtered.length === 0 ? (
        <EmptyState
          icon="shield-checkmark-outline"
          title="Nenhum alerta neste filtro"
          message={alerts.length === 0 ? 'Não há riscos projetados para este território no horizonte analisado.' : 'Altere os filtros para ver outros alertas.'}
        />
      ) : (
        filtered.map((a) => (
          <AlertCard key={a.id} alert={a} decision={state.decisions[a.id]} onPress={() => navigation.navigate('AlertDetail', { alertId: a.id })} />
        ))
      )}
    </Screen>
  );
}
