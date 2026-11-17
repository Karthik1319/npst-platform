import type { BrandingCheck, BrandingConfig, BrandingPreset, BrandingStyle, ShadowDepth } from '@/types';

export const FONT_OPTIONS = [
  'Plus Jakarta Sans',
  'Inter',
  'Poppins',
  'IBM Plex Sans',
  'DM Sans',
  'Manrope',
  'Space Grotesk',
] as const;

export const SHADOW_MAP: Record<ShadowDepth, string> = {
  none: 'none',
  sm: '0 1px 2px rgba(15, 23, 42, 0.08)',
  md: '0 4px 14px rgba(15, 23, 42, 0.10)',
  lg: '0 12px 30px rgba(15, 23, 42, 0.16)',
};

export const COMPONENT_STYLE_LABELS: Record<BrandingStyle['componentStyle'], string> = {
  modern: 'Modern — soft shadows, medium radius',
  minimal: 'Minimal — flat surfaces, hairline borders',
  classic: 'Classic — squared corners, strong borders',
  rounded: 'Rounded — pill inputs, extra radius',
};

export const NPST_DEFAULT_STYLE: BrandingStyle = {
  primary: '#1E40AF',
  secondary: '#0EA5E9',
  accent: '#38BDF8',
  bg: '#F8FAFC',
  sidebarBg: '#0B132B',
  headerBg: '#FFFFFF',
  cardBg: '#FFFFFF',
  text: '#0F172A',
  borderColor: '#E2E8F0',
  button: '#1E40AF',
  buttonHover: '#1D4ED8',
  fontFamily: 'Plus Jakarta Sans',
  headingSize: 24,
  bodySize: 15,
  fontWeight: 600,
  lineHeight: 1.55,
  radius: 10,
  componentStyle: 'modern',
  shadow: 'md',
  tableStriped: false,
};

export const BUILT_IN_PRESETS: BrandingPreset[] = [
  { id: 'preset-npst', name: 'NPST Default', builtIn: true, style: NPST_DEFAULT_STYLE },
  {
    id: 'preset-light',
    name: 'Light Theme',
    builtIn: true,
    style: {
      ...NPST_DEFAULT_STYLE,
      primary: '#2563EB',
      secondary: '#64748B',
      accent: '#93C5FD',
      sidebarBg: '#FFFFFF',
      headerBg: '#FFFFFF',
      cardBg: '#FFFFFF',
      bg: '#F8FAFC',
      borderColor: '#E2E8F0',
      button: '#2563EB',
      buttonHover: '#1D4ED8',
      componentStyle: 'minimal',
      shadow: 'sm',
      fontFamily: 'Inter',
    },
  },
  {
    id: 'preset-dark',
    name: 'Dark Theme',
    builtIn: true,
    style: {
      ...NPST_DEFAULT_STYLE,
      primary: '#38BDF8',
      secondary: '#94A3B8',
      accent: '#818CF8',
      bg: '#0B132B',
      sidebarBg: '#060B1A',
      headerBg: '#0F172A',
      cardBg: '#111A33',
      text: '#E2E8F0',
      borderColor: '#1E293B',
      button: '#2563EB',
      buttonHover: '#1D4ED8',
      componentStyle: 'modern',
      shadow: 'md',
      fontFamily: 'Plus Jakarta Sans',
    },
  },
  {
    id: 'preset-corporate',
    name: 'Corporate Blue',
    builtIn: true,
    style: {
      ...NPST_DEFAULT_STYLE,
      primary: '#1D4ED8',
      secondary: '#1E3A8A',
      accent: '#60A5FA',
      bg: '#EEF2FF',
      sidebarBg: '#1E3A8A',
      headerBg: '#FFFFFF',
      cardBg: '#FFFFFF',
      borderColor: '#C7D2FE',
      button: '#1D4ED8',
      buttonHover: '#1E40AF',
      fontFamily: 'IBM Plex Sans',
      radius: 8,
      componentStyle: 'classic',
      shadow: 'sm',
    },
  },
  {
    id: 'preset-minimal',
    name: 'Modern Minimal',
    builtIn: true,
    style: {
      ...NPST_DEFAULT_STYLE,
      primary: '#0F172A',
      secondary: '#475569',
      accent: '#38BDF8',
      sidebarBg: '#FFFFFF',
      headerBg: '#FFFFFF',
      cardBg: '#FFFFFF',
      bg: '#FAFAF9',
      text: '#0F172A',
      borderColor: '#E7E5E4',
      button: '#0F172A',
      buttonHover: '#1E293B',
      fontFamily: 'DM Sans',
      radius: 4,
      componentStyle: 'minimal',
      shadow: 'none',
      fontWeight: 500,
    },
  },
];

function hexToRgb(hex: string): [number, number, number] {
  const raw = hex.replace('#', '').trim();
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw.padEnd(6, '0').slice(0, 6);
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return [0, 0, 0];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const hi = Math.max(la, lb) + 0.05;
  const lo = Math.min(la, lb) + 0.05;
  return Math.round((hi / lo) * 100) / 100;
}

/** Draft → Preview → Validate → Approve → Publish: the automated validation gate. */
export function validateBranding(style: BrandingStyle): BrandingCheck[] {
  const checks: BrandingCheck[] = [];
  const textOnBg = contrastRatio(style.text, style.bg);
  const textOnCard = contrastRatio(style.text, style.cardBg);
  const labelOnButton = contrastRatio('#FFFFFF', style.button);

  checks.push({
    level: textOnBg >= 3.5 ? 'pass' : 'warning',
    message:
      textOnBg >= 3.5
        ? `Text on page background contrast ${textOnBg}:1 meets the 3.5:1 threshold`
        : `Text on page background contrast is ${textOnBg}:1 — below the 3.5:1 accessibility threshold`,
  });
  checks.push({
    level: textOnCard >= 3.5 ? 'pass' : 'warning',
    message:
      textOnCard >= 3.5
        ? `Text on card surfaces contrast ${textOnCard}:1 meets the threshold`
        : `Text on card surfaces contrast is ${textOnCard}:1 — below the threshold`,
  });
  checks.push({
    level: labelOnButton >= 3 ? 'pass' : 'warning',
    message:
      labelOnButton >= 3
        ? `Button label contrast ${labelOnButton}:1 is readable on the primary button`
        : `Button label contrast is ${labelOnButton}:1 — consider a darker button color`,
  });
  checks.push({
    level: style.headingSize > style.bodySize ? 'pass' : 'warning',
    message:
      style.headingSize > style.bodySize
        ? `Typography scale is coherent (${style.headingSize}px headings over ${style.bodySize}px body)`
        : 'Heading font size should be larger than the body font size',
  });
  checks.push({
    level: style.lineHeight >= 1.3 ? 'pass' : 'warning',
    message:
      style.lineHeight >= 1.3
        ? `Line height ${style.lineHeight} keeps body copy readable`
        : `Line height ${style.lineHeight} is tight — 1.3 or above is recommended`,
  });
  return checks;
}

/** Strips metadata from a stored branding config, leaving the pure style tokens. */
export function extractStyle(config: BrandingConfig): BrandingStyle {
  return {
    primary: config.primary,
    secondary: config.secondary,
    accent: config.accent,
    bg: config.bg,
    sidebarBg: config.sidebarBg,
    headerBg: config.headerBg,
    cardBg: config.cardBg,
    text: config.text,
    borderColor: config.borderColor,
    button: config.button,
    buttonHover: config.buttonHover,
    fontFamily: config.fontFamily,
    headingSize: config.headingSize,
    bodySize: config.bodySize,
    fontWeight: config.fontWeight,
    lineHeight: config.lineHeight,
    radius: config.radius,
    componentStyle: config.componentStyle,
    shadow: config.shadow,
    tableStriped: config.tableStriped,
  };
}
