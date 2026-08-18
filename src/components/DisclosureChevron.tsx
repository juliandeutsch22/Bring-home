// DisclosureChevron.tsx — Auf/Zu-Pfeil, der beim Öffnen weich um 90° dreht
// (statt hart zwischen zwei Icons zu springen). Reduced-Motion → sofort.
import { ChevronRight } from 'lucide-react-native';
import React, { useEffect } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Dur, Ease } from '@/theme/motion.tokens';
import { useReducedMotion } from '@/theme/ThemeProvider';

export function DisclosureChevron({
  open,
  size = 16,
  color,
  strokeWidth = 2,
}: {
  open: boolean;
  size?: number;
  color: string;
  strokeWidth?: number;
}) {
  const reduced = useReducedMotion();
  const p = useSharedValue(open ? 1 : 0);

  useEffect(() => {
    const target = open ? 1 : 0;
    // Dauer und Kurve aus den Tokens — vorher standen hier 180 ms und eine
    // eigene Kubik-Kurve, die es sonst nirgends in der App gibt.
    p.value = reduced ? target : withTiming(target, { duration: Dur.popover, easing: Ease.out });
  }, [open, reduced, p]);

  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${p.value * 90}deg` }] }));

  return (
    <Animated.View style={style}>
      <ChevronRight size={size} color={color} strokeWidth={strokeWidth} />
    </Animated.View>
  );
}
