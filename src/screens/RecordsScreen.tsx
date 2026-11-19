import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import { RootStackParamList, TabParamList } from '../navigation/types';
import { AppText } from '../components/AppText';
import { Card, EmptyState, Screen, SectionTitle } from '../components/Layout';
import { ChipGroup } from '../components/FormControls';
import { Button } from '../components/Button';
import { SeverityBadge } from '../components/Indicators';
import { getRegion } from '../data/regions';
import { DECISION_LABELS, PRIORITY_LABELS, REPORT_CATEGORY_LABELS } from '../types';
import { formatDateTime, formatNumber } from '../utils/format';

type Segment = 'decisoes' | 'campo';

export function RecordsScreen() {
  const { theme: t, state, removeDecision, removeReport } = useApp();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<TabParamList, 'Registros'>>();
  const [segment, setSegment] = useState<Segment>(route.params?.segment ?? 'decisoes');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (route.params?.segment) setSegment(route.params.segment);
  }, [route.params?.segment]);

  const decisions = useMemo(
    () => Object.values(state.decisions).sort((a, b) => b.decidedAt.localeCompare(a.decidedAt)),
    [state.decisions],
  );

  return (
    <Screen>
      <ChipGroup<Segment>
        label="Exibir"
        value={segment}
        onChange={(v) => {
          setSegment(v);
          setConfirmId(null);
        }}
        options={[
          { value: 'decisoes', label: `Decisões (${decisions.length})`, icon: 'checkmark-done-outline' },
          { value: 'campo', label: `Registros de campo (${state.reports.length})`, icon: 'clipboard-outline' },
        ]}
      />

      {segment === 'decisoes' ? (
        <>
          <SectionTitle title="Histórico de decisões" subtitle="Trilha de auditoria das decisões tomadas a partir dos alertas" />
          {decisions.length === 0 ? (
            <EmptyState icon="document-text-outline" title="Nenhuma decisão registrada" message="Abra um alerta e registre sua decisão para que ela apareça aqui." />
          ) : (
            decisions.map((d) => (
              <Card key={d.alertId}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <SeverityBadge severity={d.severity} />
                  <AppText variant="caption" tone="muted">
                    {formatDateTime(d.decidedAt)}
                  </AppText>
                </View>
                <AppText weight="bold">{d.alertTitle}</AppText>
                <AppText variant="small" tone="muted">
                  {getRegion(d.regionId).name} · {d.managerRole}
                </AppText>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="checkmark-done-circle" size={18} color={t.colors.success} />
                  <AppText variant="small" weight="bold">
                    {DECISION_LABELS[d.kind]}
                  </AppText>
                </View>
                {d.action ? <AppText variant="small">Ação: {d.action}</AppText> : null}
                <AppText variant="small">"{d.rationale}"</AppText>
                {confirmId === d.alertId ? (
                  <View style={{ flexDirection: 'row', gap: t.spacing.sm }}>
                    <Button label="Cancelar" variant="secondary" compact style={{ flex: 1 }} onPress={() => setConfirmId(null)} />
                    <Button label="Confirmar exclusão" variant="danger" compact style={{ flex: 1 }} onPress={() => removeDecision(d.alertId)} />
                  </View>
                ) : (
                  <Button label="Excluir decisão" icon="trash-outline" variant="ghost" compact onPress={() => setConfirmId(d.alertId)} />
                )}
              </Card>
            ))
          )}
        </>
      ) : (
        <>
          <SectionTitle
            title="Registros de campo"
            subtitle="Observações da equipe local. Registros recentes aumentam a confiança de alertas relacionados."
          />
          <Button label="Novo registro de campo" icon="add-circle-outline" onPress={() => navigation.navigate('NewReport')} />
          {state.reports.length === 0 ? (
            <EmptyState icon="clipboard-outline" title="Nenhum registro" message="Registre observações de campo (sem dados pessoais) para enriquecer a análise." />
          ) : (
            state.reports.map((r) => (
              <Card key={r.id}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <AppText variant="caption" weight="bold" tone="primary">
                    {REPORT_CATEGORY_LABELS[r.category].toUpperCase()} · PRIORIDADE {PRIORITY_LABELS[r.priority].toUpperCase()}
                  </AppText>
                  <AppText variant="caption" tone="muted">
                    {formatDateTime(r.createdAt)}
                  </AppText>
                </View>
                <AppText weight="bold">{r.title}</AppText>
                <AppText variant="small">{r.description}</AppText>
                <AppText variant="small" tone="muted">
                  {getRegion(r.regionId).name} · ~{formatNumber(r.estimatedAffected)} pessoas afetadas (estimativa)
                </AppText>
                {confirmId === r.id ? (
                  <View style={{ flexDirection: 'row', gap: t.spacing.sm }}>
                    <Button label="Cancelar" variant="secondary" compact style={{ flex: 1 }} onPress={() => setConfirmId(null)} />
                    <Button label="Confirmar exclusão" variant="danger" compact style={{ flex: 1 }} onPress={() => removeReport(r.id)} />
                  </View>
                ) : (
                  <Button label="Excluir registro" icon="trash-outline" variant="ghost" compact onPress={() => setConfirmId(r.id)} />
                )}
              </Card>
            ))
          )}
        </>
      )}
    </Screen>
  );
}
