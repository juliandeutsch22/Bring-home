// theme.tokens.ts — Single Source of Truth.
//
// Aus Stoa übernommen (siehe Style Guide, Teil A): die Skalen, die Schatten und
// die eiserne Regel sind thematisch neutral. Was bring-home eigen ist, steht in
// `skin.ts` — hier wird es nur eingesetzt.
//
// NIE Hex/px im Komponenten-Code hardcoden — immer diese Tokens importieren.
import { SKIN } from './skin';

// Typo-Größenskala
export const T = { xs: 10, sm: 13, md: 15, lg: 18, xl: 22, xxl: 28, hero: 40 } as const;

// Spacing-Skala (großzügig = ruhig). Screen-Padding horizontal = Spacing.lg.
export const Spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;

// Border-Radii
export const R = { xs: 7, sm: 10, md: 13, lg: 16, xl: 18, xxl: 24, pill: 999 } as const;

// DIE EISERNE REGEL: genau zwei Akzentfarben. Alle semantischen Rollen bilden
// darauf ab — es gibt KEIN drittes Alarm-Rot. Löschen und Warnung tragen
// denselben ruhigen Zweitton wie eine Info; die Oberfläche kann dadurch nicht
// schreien. Die Töne selbst kommen aus `skin.ts`.
//
// Die Slots heißen bewusst `accentA`/`accentB` statt nach ihrer Farbe: in Stoa
// hießen sie `teal` und `indigo` und waren längst keins von beidem mehr.
export const lightColors = {
  accentA: SKIN.hell.a,
  accentB: SKIN.hell.b,
  bg: SKIN.hell.bg,
  bg2: SKIN.hell.bg2,
  bg3: SKIN.hell.bg3,
  bg4: SKIN.hell.bg4,
  chip: SKIN.hell.chip,
  chipBorder: SKIN.hell.chipBorder,
  sunk: SKIN.hell.sunk,
  border: SKIN.hell.border,
  border2: SKIN.hell.border2,
  border3: SKIN.hell.border3,
  text: SKIN.hell.text,
  text2: SKIN.hell.text2,
  text3: SKIN.hell.text3,
  success: SKIN.hell.a,
  info: SKIN.hell.b,
  danger: SKIN.hell.b,
  warning: SKIN.hell.b,
};

export const darkColors: typeof lightColors = {
  accentA: SKIN.dunkel.a,
  accentB: SKIN.dunkel.b,
  bg: SKIN.dunkel.bg,
  bg2: SKIN.dunkel.bg2,
  bg3: SKIN.dunkel.bg3,
  bg4: SKIN.dunkel.bg4,
  chip: SKIN.dunkel.chip,
  chipBorder: SKIN.dunkel.chipBorder,
  sunk: SKIN.dunkel.sunk,
  border: SKIN.dunkel.border,
  border2: SKIN.dunkel.border2,
  border3: SKIN.dunkel.border3,
  text: SKIN.dunkel.text,
  text2: SKIN.dunkel.text2,
  text3: SKIN.dunkel.text3,
  success: SKIN.dunkel.a,
  info: SKIN.dunkel.b,
  danger: SKIN.dunkel.b,
  warning: SKIN.dunkel.b,
};

export type Colors = typeof lightColors;
export type ColorToken = keyof Colors;

// Schatten-Skala — Platten liegen flach auf dem Grund, sie schweben nicht.
// Hauchdünne Schatten; die Kante (Meißel-Grat) trägt die Plastizität.
export const Shadow = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 5, elevation: 1 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 },
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.09, shadowRadius: 12, elevation: 3 },
  glow: (c: string) => ({ shadowColor: c, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 3 }),
} as const;
