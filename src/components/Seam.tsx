// Seam.tsx — Trennung zwischen Abschnitten, in zwei Stufen:
//  'line' (Default)  — schlichte Haarlinie für gewöhnliche Trennungen.
//  'ornament'        — die Perforation, bewusst SPARSAM: höchstens einmal
//                      pro Tafel, für DIE Haupt-Trennung (z. B. vor
//                      „Erledigt"). Ornamente wirken durch Seltenheit.
import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';

import { useColors } from '@/theme/ThemeProvider';
import { Spacing } from '@/theme/theme.tokens';

export function Seam({
  marginVertical = Spacing.lg,
  variant = 'line',
}: {
  marginVertical?: number;
  variant?: 'ornament' | 'line';
}) {
  const colors = useColors();

  if (variant === 'line') {
    return <View style={{ marginVertical, height: 1, backgroundColor: colors.border }} />;
  }

  return (
    <View style={{ marginVertical, height: 10, opacity: 0.5 }}>
      <Svg width="100%" height="10">
        {/* Perforation — die Abrisskante eines Zettels. Stoas Mäander war
            griechisch; hier gehört das Ornament zum Papier. Wie dort gilt:
            höchstens EINMAL pro Tafel, sonst wird aus dem Schmuck ein Raster. */}
        <Defs>
          <Pattern id="perforation" patternUnits="userSpaceOnUse" width="9" height="10">
            <Circle cx="4.5" cy="5" r="1.5" fill={colors.accentA} />
          </Pattern>
        </Defs>
        <Rect x="0" y="0" width="100%" height="10" fill="url(#perforation)" />
      </Svg>
    </View>
  );
}
