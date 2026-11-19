import React, { useState } from 'react';
import { Linking, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import { RootStackParamList } from '../navigation/types';
import { AppText } from '../components/AppText';
import { Banner, Card, Screen, SectionTitle } from '../components/Layout';
import { ToggleRow } from '../components/FormControls';
import { Button } from '../components/Button';

function Item({ icon, text }: { icon: React.ComponentProps<typeof Ionicons>['name']; text: string }) {
  const { theme: t } = useApp();
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <Ionicons name={icon} size={18} color={t.colors.primary} style={{ marginTop: 2 }} />
      <AppText variant="small" style={{ flex: 1 }}>
        {text}
      </AppText>
    </View>
  );
}

export function SettingsScreen() {
  const { theme: t, state, setSetting, region, resetAll } = useApp();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  return (
    <Screen>
      <Card>
        <SectionTitle title="Acessibilidade" />
        <ToggleRow
          icon="contrast-outline"
          label="Alto contraste"
          description="Cores mais fortes e bordas reforçadas"
          value={state.settings.highContrast}
          onChange={(v) => setSetting('highContrast', v)}
        />
        <ToggleRow
          icon="text-outline"
          label="Texto ampliado"
          description="Aumenta o tamanho das fontes em 20%"
          value={state.settings.largeText}
          onChange={(v) => setSetting('largeText', v)}
        />
        <AppText variant="caption" tone="muted">
          O app também respeita o tamanho de fonte do sistema e oferece rótulos para leitores de tela (TalkBack/VoiceOver).
        </AppText>
      </Card>

      <Card>
        <SectionTitle title="Território" subtitle={`Atual: ${region.name}`} />
        <Button label="Trocar território" icon="map-outline" variant="secondary" onPress={() => navigation.navigate('RegionPicker')} />
      </Card>

      <Card>
        <SectionTitle title="Privacidade (LGPD)" />
        <Item icon="people-outline" text="Usamos apenas dados AGREGADOS por território. Nenhum cidadão é identificado." />
        <Item icon="phone-portrait-outline" text="Decisões, registros e preferências ficam somente neste dispositivo (armazenamento local). Não há servidor nem conta." />
        <Item icon="shield-checkmark-outline" text="Os formulários bloqueiam CPF, e-mail, telefone e endereço com número em campos de texto livre." />
        <Item icon="cloud-outline" text="A única chamada externa é à Open-Meteo, enviando apenas as coordenadas do território (nunca a localização do usuário)." />
        <Item icon="trash-outline" text="Você pode apagar todos os dados locais a qualquer momento." />
        {resetDone ? <Banner tone="success" message="Todos os dados locais foram apagados." /> : null}
        {confirmReset ? (
          <View style={{ gap: t.spacing.sm }}>
            <Banner tone="danger" title="Tem certeza?" message="Isso apaga decisões, registros de campo, preferências e cache de clima deste dispositivo. Não pode ser desfeito." />
            <View style={{ flexDirection: 'row', gap: t.spacing.sm }}>
              <Button label="Cancelar" variant="secondary" style={{ flex: 1 }} onPress={() => setConfirmReset(false)} />
              <Button
                label="Apagar tudo"
                variant="danger"
                style={{ flex: 1 }}
                onPress={async () => {
                  await resetAll();
                  setConfirmReset(false);
                  setResetDone(true);
                }}
              />
            </View>
          </View>
        ) : (
          <Button
            label="Apagar dados locais"
            icon="trash-outline"
            variant="danger"
            onPress={() => {
              setResetDone(false);
              setConfirmReset(true);
            }}
          />
        )}
      </Card>

      <Card>
        <SectionTitle title="Fontes de dados" />
        <Item icon="cloud-outline" text="Clima (temperatura e chuva, 7 dias passados + 7 de previsão): Open-Meteo, API pública e gratuita — dados reais." />
        <Item icon="flask-outline" text="Consumo de água, energia, resíduos e chamados de serviços: dados SINTÉTICOS gerados no app para demonstração." />
        <Item icon="map-outline" text="Coordenadas dos territórios: reais. População e capacidades: valores aproximados/ilustrativos." />
        <Button label="Abrir site da Open-Meteo" icon="open-outline" variant="ghost" onPress={() => Linking.openURL('https://open-meteo.com/')} />
      </Card>

      <Card>
        <SectionTitle title="Sobre" />
        <AppText variant="small">
          Radar Territorial v1.0 — Global Solution 2026.2, FIAP · Cross-Platform Application Development.
        </AppText>
        <AppText variant="small" tone="muted">
          Hector van Tol Taver (RM562881) · Juan Gigliotti da Cunha (RM563253) · Raissa Fabrício Lima (RM563772)
        </AppText>
      </Card>
    </Screen>
  );
}
