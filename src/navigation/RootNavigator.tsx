import React from 'react';
import { DefaultTheme, LinkingOptions, NavigationContainer, Theme as NavTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { RootStackParamList, TabParamList } from './types';
import { DashboardScreen } from '../screens/DashboardScreen';
import { AlertsScreen } from '../screens/AlertsScreen';
import { AlertDetailScreen } from '../screens/AlertDetailScreen';
import { RecordsScreen } from '../screens/RecordsScreen';
import { NewReportScreen } from '../screens/NewReportScreen';
import { RegionPickerScreen } from '../screens/RegionPickerScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

/** Deep links (também usados como URLs na versão web). */
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['radarterritorial://'],
  config: {
    screens: {
      Tabs: {
        screens: { Painel: '', Alertas: 'alertas', Registros: 'registros', Ajustes: 'ajustes' },
      },
      AlertDetail: 'alerta/:alertId',
      NewReport: 'novo-registro',
      RegionPicker: 'territorio',
    },
  },
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const TAB_ICONS: Record<keyof TabParamList, [keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap]> = {
  Painel: ['grid', 'grid-outline'],
  Alertas: ['notifications', 'notifications-outline'],
  Registros: ['document-text', 'document-text-outline'],
  Ajustes: ['settings', 'settings-outline'],
};

function Tabs() {
  const { theme: t, pendingAlerts, region } = useApp();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: t.colors.primary },
        headerTintColor: t.colors.primaryText,
        headerTitleStyle: { fontWeight: '700', fontSize: t.font.subtitle },
        tabBarActiveTintColor: t.colors.primary,
        tabBarInactiveTintColor: t.colors.textMuted,
        tabBarStyle: { backgroundColor: t.colors.surface, borderTopColor: t.colors.border, borderTopWidth: t.highContrast ? 2 : 1 },
        tabBarLabelStyle: { fontSize: Math.min(14, t.font.caption), fontWeight: '600' },
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons name={TAB_ICONS[route.name][focused ? 0 : 1]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen
        name="Painel"
        component={DashboardScreen}
        options={{ title: 'Radar Territorial', tabBarLabel: 'Painel', tabBarAccessibilityLabel: 'Painel com indicadores e gráficos' }}
      />
      <Tab.Screen
        name="Alertas"
        component={AlertsScreen}
        options={{
          title: `Alertas · ${region.name}`,
          tabBarLabel: 'Alertas',
          tabBarBadge: pendingAlerts.length > 0 ? pendingAlerts.length : undefined,
          tabBarBadgeStyle: { backgroundColor: t.colors.danger, color: '#FFFFFF' },
          tabBarAccessibilityLabel: `Alertas, ${pendingAlerts.length} aguardando decisão`,
        }}
      />
      <Tab.Screen name="Registros" component={RecordsScreen} options={{ title: 'Registros', tabBarAccessibilityLabel: 'Histórico de decisões e registros de campo' }} />
      <Tab.Screen name="Ajustes" component={SettingsScreen} options={{ title: 'Ajustes e privacidade', tabBarLabel: 'Ajustes' }} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { theme: t } = useApp();
  const navTheme: NavTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: t.colors.primary,
      background: t.colors.background,
      card: t.colors.surface,
      text: t.colors.text,
      border: t.colors.border,
      notification: t.colors.danger,
    },
  };
  return (
    <NavigationContainer theme={navTheme} linking={linking}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: t.colors.primary },
          headerTintColor: t.colors.primaryText,
          headerTitleStyle: { fontWeight: '700' },
          headerBackButtonDisplayMode: 'minimal',
        }}
      >
        <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
        <Stack.Screen name="AlertDetail" component={AlertDetailScreen} options={{ title: 'Detalhe do alerta' }} />
        <Stack.Screen name="NewReport" component={NewReportScreen} options={{ title: 'Novo registro de campo', presentation: 'modal' }} />
        <Stack.Screen name="RegionPicker" component={RegionPickerScreen} options={{ title: 'Escolher território' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
