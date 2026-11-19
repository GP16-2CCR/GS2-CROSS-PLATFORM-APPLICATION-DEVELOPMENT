/**
 * Tokens de design do Radar Territorial.
 * A identidade visual usa um azul-petróleo institucional (confiança, serviço público)
 * com um âmbar de destaque (atenção). Todo estado de severidade também carrega
 * ícone + texto, nunca apenas cor (acessibilidade).
 */

export type Palette = {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryText: string;
  accent: string;
  info: string;
  infoBg: string;
  warning: string;
  warningBg: string;
  danger: string;
  dangerBg: string;
  success: string;
  successBg: string;
  chartWater: string;
  chartEnergy: string;
  chartWaste: string;
  chartDemand: string;
  chartGrid: string;
  focus: string;
};

export const defaultPalette: Palette = {
  background: '#F3F6F8',
  surface: '#FFFFFF',
  surfaceAlt: '#E8EEF2',
  border: '#D3DCE3',
  text: '#10222E',
  textMuted: '#4A5E6B',
  primary: '#0B4F6C',
  primaryText: '#FFFFFF',
  accent: '#F2A900',
  info: '#1D5FA8',
  infoBg: '#E3EEFA',
  warning: '#8A5A00',
  warningBg: '#FFF3D6',
  danger: '#B3261E',
  dangerBg: '#FCE8E6',
  success: '#1E6B3A',
  successBg: '#E3F4E8',
  chartWater: '#1D7FB8',
  chartEnergy: '#C77700',
  chartWaste: '#5B6B2F',
  chartDemand: '#7A3E9D',
  chartGrid: '#DCE3E8',
  focus: '#F2A900',
};

/** Paleta de alto contraste (relação mínima ~7:1 para textos). */
export const highContrastPalette: Palette = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#F0F0F0',
  border: '#000000',
  text: '#000000',
  textMuted: '#1F1F1F',
  primary: '#002B3D',
  primaryText: '#FFFFFF',
  accent: '#7A5200',
  info: '#00336E',
  infoBg: '#FFFFFF',
  warning: '#5C3B00',
  warningBg: '#FFFFFF',
  danger: '#7A0000',
  dangerBg: '#FFFFFF',
  success: '#004D1F',
  successBg: '#FFFFFF',
  chartWater: '#00336E',
  chartEnergy: '#7A3F00',
  chartWaste: '#2E3A00',
  chartDemand: '#4A0072',
  chartGrid: '#9E9E9E',
  focus: '#000000',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999,
};

/** Área mínima de toque recomendada (WCAG / Material: 44–48 dp). */
export const MIN_TOUCH = 48;

const baseFont = {
  caption: 12,
  small: 14,
  body: 16,
  subtitle: 18,
  title: 22,
  display: 30,
};

export type Typography = typeof baseFont;

export function buildTypography(scale: number): Typography {
  return {
    caption: Math.round(baseFont.caption * scale),
    small: Math.round(baseFont.small * scale),
    body: Math.round(baseFont.body * scale),
    subtitle: Math.round(baseFont.subtitle * scale),
    title: Math.round(baseFont.title * scale),
    display: Math.round(baseFont.display * scale),
  };
}

export type Theme = {
  colors: Palette;
  font: Typography;
  spacing: typeof spacing;
  radius: typeof radius;
  highContrast: boolean;
};

export function buildTheme(highContrast: boolean, largeText: boolean): Theme {
  return {
    colors: highContrast ? highContrastPalette : defaultPalette,
    font: buildTypography(largeText ? 1.2 : 1),
    spacing,
    radius,
    highContrast,
  };
}
