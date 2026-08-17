// _layout.tsx — die Wurzel: Schriften laden, Theme bereitstellen, Router.
import { Fraunces_600SemiBold, useFonts } from '@expo-google-fonts/fraunces';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider } from '@/theme/ThemeProvider';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

export default function RootLayout() {
  // Die Display-Schrift trägt jede Überschrift. Bis sie da ist, wird nichts
  // gezeigt — ein kurzer Sprung von System- auf Fraunces-Schrift wäre genau
  // die Art Zappeln, die diese Gestaltung vermeidet.
  const [fontsGeladen] = useFonts({ Fraunces_600SemiBold });
  if (!fontsGeladen) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
