import React, { useMemo, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import { RootStackParamList } from '../navigation/types';
import { Banner, Card, Screen } from '../components/Layout';
import { ChipGroup, TextField } from '../components/FormControls';
import { Button } from '../components/Button';
import { AppText } from '../components/AppText';
import { REGIONS } from '../data/regions';
import { Priority, PRIORITY_LABELS, REPORT_CATEGORY_LABELS, ReportCategory } from '../types';
import { FormErrors, hasErrors, ReportForm, validateReport } from '../utils/validation';

type Props = NativeStackScreenProps<RootStackParamList, 'NewReport'>;

export function NewReportScreen({ navigation }: Props) {
  const { addReport, region } = useApp();
  const [form, setForm] = useState<ReportForm>({
    regionId: region.id,
    category: null,
    priority: null,
    title: '',
    description: '',
    estimatedAffected: '',
  });
  const [touched, setTouched] = useState<Partial<Record<keyof ReportForm, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);

  const errors = useMemo(() => validateReport(form), [form]);
  const err = (k: keyof ReportForm) => ((touched[k] || submitted) && errors[k] ? errors[k]! : null);
  const set = <K extends keyof ReportForm>(k: K, v: ReportForm[K], touch = false) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (touch) setTouched((tc) => ({ ...tc, [k]: true }));
  };
  const blur = (k: keyof ReportForm) => () => setTouched((tc) => ({ ...tc, [k]: true }));

  const submit = () => {
    setSubmitted(true);
    const e: FormErrors<ReportForm> = validateReport(form);
    if (hasErrors(e) || !form.regionId || !form.category || !form.priority) return;
    addReport({
      id: `rep-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      regionId: form.regionId,
      category: form.category,
      priority: form.priority,
      title: form.title.trim(),
      description: form.description.trim(),
      estimatedAffected: Number(form.estimatedAffected),
      createdAt: new Date().toISOString(),
    });
    navigation.navigate('Tabs', { screen: 'Registros', params: { segment: 'campo' } });
  };

  return (
    <Screen>
      <Banner
        tone="info"
        icon="lock-closed-outline"
        title="Privacidade dos cidadãos"
        message="Registre apenas informações agregadas sobre o território. Não informe nomes, CPF, telefone, e-mail ou endereço com número — o formulário bloqueia esses dados."
      />
      <Card>
        <ChipGroup<string>
          label="Território"
          required
          value={form.regionId}
          onChange={(v) => set('regionId', v, true)}
          error={err('regionId')}
          options={REGIONS.map((r) => ({ value: r.id, label: r.name }))}
        />
        <ChipGroup<ReportCategory>
          label="Categoria"
          required
          value={form.category}
          onChange={(v) => set('category', v, true)}
          error={err('category')}
          options={(Object.keys(REPORT_CATEGORY_LABELS) as ReportCategory[]).map((c) => ({ value: c, label: REPORT_CATEGORY_LABELS[c] }))}
        />
        <ChipGroup<Priority>
          label="Prioridade"
          required
          value={form.priority}
          onChange={(v) => set('priority', v, true)}
          error={err('priority')}
          options={(Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => ({ value: p, label: PRIORITY_LABELS[p] }))}
        />
        <TextField
          label="Título"
          required
          maxLength={80}
          value={form.title}
          onChangeText={(v) => set('title', v)}
          onBlur={blur('title')}
          error={err('title')}
          placeholder="Ex.: Bueiros obstruídos próximos ao córrego"
          returnKeyType="next"
        />
        <TextField
          label="Descrição"
          required
          multiline
          maxLength={500}
          value={form.description}
          onChangeText={(v) => set('description', v)}
          onBlur={blur('description')}
          error={err('description')}
          helper="Descreva a situação observada, sem identificar pessoas."
          placeholder="Ex.: Equipe observou acúmulo de lixo em 4 bocas de lobo na região do córrego, com risco de alagamento."
        />
        <TextField
          label="Pessoas afetadas (estimativa)"
          required
          keyboardType="number-pad"
          maxLength={7}
          value={form.estimatedAffected}
          onChangeText={(v) => set('estimatedAffected', v)}
          onBlur={blur('estimatedAffected')}
          error={err('estimatedAffected')}
          helper="Número aproximado. Use 0 se não souber."
        />
        <Button label="Salvar registro" icon="save-outline" onPress={submit} disabled={submitted && hasErrors(errors)} />
        {hasErrors(errors) ? (
          <AppText variant="caption" tone="muted" center>
            Preencha todos os campos obrigatórios (*) para salvar.
          </AppText>
        ) : null}
      </Card>
    </Screen>
  );
}
