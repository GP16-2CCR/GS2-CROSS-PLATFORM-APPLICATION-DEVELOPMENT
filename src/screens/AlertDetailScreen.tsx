import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import { RootStackParamList } from '../navigation/types';
import { AppText } from '../components/AppText';
import { Banner, Card, EmptyState, Screen, SectionTitle } from '../components/Layout';
import { ConfidenceMeter, DataSourceTags, SeverityBadge } from '../components/Indicators';
import { THEME_ICON } from '../components/AlertCard';
import { ChipGroup, TextField } from '../components/FormControls';
import { Button } from '../components/Button';
import { DECISION_LABELS, DecisionKind } from '../types';
import { DecisionForm, FormErrors, hasErrors, validateDecision } from '../utils/validation';
import { formatDateTime } from '../utils/format';
import { MIN_TOUCH } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'AlertDetail'>;

function BulletList({ items, icon, color }: { items: string[]; icon: React.ComponentProps<typeof Ionicons>['name']; color: string }) {
  return (
    <View style={{ gap: 8 }}>
      {items.map((it, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
          <Ionicons name={icon} size={16} color={color} style={{ marginTop: 3 }} />
          <AppText variant="small" style={{ flex: 1 }}>
            {it}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const emptyForm: DecisionForm = { kind: null, action: null, rationale: '', managerRole: '', acknowledged: false };

export function AlertDetailScreen({ route, navigation }: Props) {
  const { theme: t, alerts, state, saveDecision, removeDecision } = useApp();
  const alert = alerts.find((a) => a.id === route.params.alertId);
  const decision = state.decisions[route.params.alertId];

  const [form, setForm] = useState<DecisionForm>(emptyForm);
  const [touched, setTouched] = useState<Partial<Record<keyof DecisionForm, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const errors = useMemo(() => validateDecision(form), [form]);
  const visibleError = (k: keyof DecisionForm): string | null => ((touched[k] || submitted) && errors[k] ? errors[k]! : null);
  const update = <K extends keyof DecisionForm>(k: K, v: DecisionForm[K]) => {
    setForm((f) => ({ ...f, [k]: v, ...(k === 'kind' && v !== 'aprovar' ? { action: null } : {}) }));
    setTouched((tc) => ({ ...tc, [k]: true }));
  };

  if (!alert) {
    return (
      <Screen>
        <EmptyState
          icon="archive-outline"
          title="Alerta não está mais ativo"
          message="Os alertas são recalculados diariamente e por território. Esta projeção não está mais vigente."
        />
        {decision ? (
          <Banner tone="info" title={`Decisão registrada: ${DECISION_LABELS[decision.kind]}`} message={`${decision.alertTitle} — ${formatDateTime(decision.decidedAt)}. Justificativa: ${decision.rationale}`} />
        ) : null}
        <Button label="Voltar" icon="arrow-back" onPress={() => navigation.goBack()} />
      </Screen>
    );
  }

  const submit = () => {
    setSubmitted(true);
    const e: FormErrors<DecisionForm> = validateDecision(form);
    if (hasErrors(e) || !form.kind) return;
    saveDecision({
      alertId: alert.id,
      regionId: alert.regionId,
      alertTitle: alert.title,
      severity: alert.severity,
      kind: form.kind,
      action: form.kind === 'aprovar' ? form.action : null,
      rationale: form.rationale.trim(),
      managerRole: form.managerRole.trim(),
      decidedAt: new Date().toISOString(),
    });
    setJustSaved(true);
    setForm(emptyForm);
    setTouched({});
    setSubmitted(false);
  };

  return (
    <Screen>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
          <Ionicons name={THEME_ICON[alert.theme]} size={22} color={t.colors.primary} />
          <SeverityBadge severity={alert.severity} />
        </View>
        <AppText variant="title" weight="bold" accessibilityRole="header">
          {alert.title}
        </AppText>
        <AppText>{alert.summary}</AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="calendar-outline" size={16} color={t.colors.textMuted} />
          <AppText variant="small" tone="muted">
            Horizonte: {alert.horizon}
          </AppText>
        </View>
        <DataSourceTags sources={alert.dataSources} />
      </Card>

      <Banner
        tone="warning"
        icon="hand-left"
        title="Apoio à decisão, não decisão automática"
        message="O Radar Territorial não aciona equipes, não envia comunicados e não altera serviços. As opções abaixo são sugestões; a decisão e a responsabilidade são do gestor."
      />

      <Card>
        <SectionTitle title="Por que este alerta?" subtitle="Justificativa calculada a partir dos dados" />
        <BulletList items={alert.justification} icon="analytics-outline" color={t.colors.primary} />
      </Card>

      <Card>
        <SectionTitle title="Nível de confiança" />
        <ConfidenceMeter confidence={alert.confidence} showMethod />
      </Card>

      <Card>
        <SectionTitle title="Limitações" subtitle="O que este alerta NÃO considera" />
        <BulletList items={alert.limitations} icon="alert-circle-outline" color={t.colors.warning} />
      </Card>

      <Card>
        <SectionTitle title="Opções de ação sugeridas" subtitle="Nada é executado sem a sua decisão" />
        <BulletList items={alert.suggestedActions} icon="arrow-forward-circle-outline" color={t.colors.success} />
      </Card>

      {justSaved && decision ? (
        <Banner tone="success" title="Decisão registrada" message="A decisão foi salva no histórico deste dispositivo (aba Registros)." />
      ) : null}

      {decision ? (
        <Card accessibilityLabel="Decisão registrada">
          <SectionTitle title="Decisão do gestor" subtitle={formatDateTime(decision.decidedAt)} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="checkmark-done-circle" size={22} color={t.colors.success} />
            <AppText weight="bold">{DECISION_LABELS[decision.kind]}</AppText>
          </View>
          {decision.action ? <AppText variant="small">Ação encaminhada: {decision.action}</AppText> : null}
          <AppText variant="small">Justificativa: {decision.rationale}</AppText>
          <AppText variant="small" tone="muted">
            Responsável: {decision.managerRole}
          </AppText>
          <Button
            label="Revisar decisão"
            icon="create-outline"
            variant="secondary"
            accessibilityHint="Remove a decisão atual para registrar uma nova"
            onPress={() => {
              setJustSaved(false);
              removeDecision(alert.id);
            }}
          />
        </Card>
      ) : (
        <Card>
          <SectionTitle title="Registrar decisão" subtitle="Campos marcados com * são obrigatórios" />
          <ChipGroup<DecisionKind>
            label="Decisão"
            required
            value={form.kind}
            onChange={(v) => update('kind', v)}
            error={visibleError('kind')}
            options={[
              { value: 'aprovar', label: DECISION_LABELS.aprovar, icon: 'send-outline' },
              { value: 'monitorar', label: DECISION_LABELS.monitorar, icon: 'eye-outline' },
              { value: 'descartar', label: DECISION_LABELS.descartar, icon: 'close-circle-outline' },
            ]}
          />
          {form.kind === 'aprovar' ? (
            <ChipGroup<string>
              label="Ação a encaminhar"
              required
              value={form.action}
              onChange={(v) => update('action', v)}
              error={visibleError('action')}
              options={alert.suggestedActions.map((a) => ({ value: a, label: a }))}
            />
          ) : null}
          <TextField
            label="Justificativa da decisão"
            required
            multiline
            maxLength={400}
            value={form.rationale}
            onChangeText={(v) => setForm((f) => ({ ...f, rationale: v }))}
            onBlur={() => setTouched((tc) => ({ ...tc, rationale: true }))}
            error={visibleError('rationale')}
            helper="Explique o motivo. Não inclua dados pessoais de cidadãos."
            placeholder="Ex.: Tendência confirmada pela equipe local; priorizar UBS e escolas."
          />
          <TextField
            label="Cargo ou setor responsável"
            required
            maxLength={60}
            value={form.managerRole}
            onChangeText={(v) => setForm((f) => ({ ...f, managerRole: v }))}
            onBlur={() => setTouched((tc) => ({ ...tc, managerRole: true }))}
            error={visibleError('managerRole')}
            helper="Identificação funcional, não pessoal (ex.: Coordenação de Zeladoria)."
            placeholder="Ex.: Subprefeitura - Coordenação de Obras"
          />
          <Pressable
            onPress={() => update('acknowledged', !form.acknowledged)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: form.acknowledged }}
            accessibilityLabel="Li a justificativa, o nível de confiança e as limitações deste alerta"
            style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, minHeight: MIN_TOUCH }}
          >
            <Ionicons name={form.acknowledged ? 'checkbox' : 'square-outline'} size={26} color={visibleError('acknowledged') ? t.colors.danger : t.colors.primary} />
            <AppText variant="small" style={{ flex: 1 }}>
              Li a justificativa, o nível de confiança e as limitações deste alerta.
            </AppText>
          </Pressable>
          {visibleError('acknowledged') ? (
            <AppText variant="caption" tone="danger" weight="medium">
              {visibleError('acknowledged')}
            </AppText>
          ) : null}
          <Button
            label="Salvar decisão"
            icon="save-outline"
            onPress={submit}
            disabled={submitted && hasErrors(errors)}
            accessibilityHint={hasErrors(errors) ? 'Há campos obrigatórios pendentes' : 'Registra a decisão no histórico'}
          />
          {hasErrors(errors) ? (
            <AppText variant="caption" tone="muted" center>
              Preencha todos os campos obrigatórios para salvar.
            </AppText>
          ) : null}
        </Card>
      )}
    </Screen>
  );
}
