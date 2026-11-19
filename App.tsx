import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './src/context/AppContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AppText } from './src/components/AppText';

function Root() {
  const { state, theme } = useApp();
  if (!state.hydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primary, gap: 12 }}>
        <ActivityIndicator size="large" color={theme.colors.primaryText} accessibilityLabel="Carregando dados salvos" />
        <AppText tone="inverse" weight="bold" variant="subtitle">
          Radar Territorial
        </AppText>
      </View>
    );
  }
  return <RootNavigator />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="light" />
        <Root />
      </AppProvider>
    </SafeAreaProvider>
  );
}
