import { NavigatorScreenParams } from '@react-navigation/native';

export type TabParamList = {
  Painel: undefined;
  Alertas: undefined;
  Registros: { segment?: 'decisoes' | 'campo' } | undefined;
  Ajustes: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  AlertDetail: { alertId: string };
  NewReport: undefined;
  RegionPicker: undefined;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
