// (tabs)/_layout.tsx — drei Punkte, mehr braucht es nicht.
//
// Einkauf ist der Grund, warum es die App gibt, und steht deshalb links.
// Essen füttert den Einkauf (ein Gericht wird zu Zutaten), Wohnung ist das,
// was daneben liegen bleibt.
import { Tabs } from 'expo-router';
import React from 'react';

import { GlassTabBar } from '@/components/GlassTabBar';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <GlassTabBar {...props} />}>
      <Tabs.Screen name="einkauf" options={{ title: 'Einkauf' }} />
      <Tabs.Screen name="essen" options={{ title: 'Essen' }} />
      <Tabs.Screen name="wohnung" options={{ title: 'Wohnung' }} />
    </Tabs>
  );
}
