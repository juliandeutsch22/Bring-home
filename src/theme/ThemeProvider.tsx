// ThemeProvider.tsx — stellt das Farbschema bereit.
//
// „Bringe Home" ist AUSSCHLIESSLICH hell, unabhängig davon, was das Betriebssystem
// meldet. Das ist eine Gestaltungsentscheidung, keine fehlende Funktion: die
// Haut dieser App ist Marmor und Kalkstein, und ein Einkaufszettel ist ein
// heller Zettel. Die dunkle Fassung war aus der Schwester-App mitgekommen und
// nie für diese hier entworfen.
//
// Die dunklen Farbwerte bleiben in `theme.tokens.ts` und `skin.ts` stehen — sie
// kosten nichts und wären beim nächsten Sinneswandel sofort wieder da. Erreicht
// werden sie von hier aus aber NICHT: `useScheme()` gibt immer `light` zurück,
// und die vier Komponenten, die danach fragen (Backdrop, Glass, GlassButton,
// Type mit seinem Meißel), nehmen deshalb immer den hellen Zweig.
//
// Wer das je umdreht, muss an ZWEI Stellen ran: hier und in
// `scripts/pwa-huelle.mjs`, wo die Fläche hinter der App und die Farbe der
// iOS-Statusleiste stehen. Laufen die beiden auseinander, sitzt ein heller
// Zettel in einem dunklen Rahmen — und genau das war eben erst der Fehler.
import React, { createContext, useContext } from 'react';
import { useReducedMotion as useRNReducedMotion } from 'react-native-reanimated';

import { Colors, lightColors } from './theme.tokens';
import { useSettings } from './settings.store';

type Scheme = 'light' | 'dark';

type ThemeContextValue = {
  scheme: Scheme;
  colors: Colors;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Eine Konstante, kein Zustand — es gibt nichts umzuschalten. */
const HELL: ThemeContextValue = { scheme: 'light', colors: lightColors };

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <ThemeContext.Provider value={HELL}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}

/** Liefert die aufgelöste Farbpalette. Primärer Hook für Komponenten. */
export function useColors(): Colors {
  return useTheme().colors;
}

export function useScheme(): Scheme {
  return useTheme().scheme;
}

/**
 * „Bewegung reduzieren" bleibt eine echte Frage an das System — anders als das
 * Farbschema ist das keine Gestaltung, sondern eine Bitte des Nutzers, und die
 * wird beantwortet.
 */
export function useReducedMotion(): boolean {
  const osReduced = useRNReducedMotion();
  const motionPref = useSettings((s) => s.motionPref);
  if (motionPref === 'reduced') return true;
  if (motionPref === 'full') return false;
  return osReduced;
}
