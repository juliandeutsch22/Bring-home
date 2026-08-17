// _layout.tsx — die Wurzel: Schriften laden, Theme bereitstellen, Router.
import { CormorantGaramond_700Bold, useFonts } from '@expo-google-fonts/cormorant-garamond';
import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { plane } from '@/data/abgleich';
import { useAbgleich } from '@/data/useAbgleich';
import { serviceWorkerAnmelden } from '@/lib/serviceWorker';
import { ThemeProvider } from '@/theme/ThemeProvider';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
  // EINE Stelle, an der jede geglückte Änderung den Abgleich anstößt. Das in
  // jeden Hook einzeln zu schreiben hieße, es irgendwann irgendwo zu vergessen
  // — und dann bliebe genau ein Handgriff auf dem Gerät liegen.
  mutationCache: new MutationCache({ onSuccess: () => plane() }),
});

// Einmal beim Start, außerhalb der Komponente: die Anmeldung gehört nicht in
// einen Render-Durchlauf, und zweimal anmelden wäre folgenlos, aber unsauber.
serviceWorkerAnmelden();

export default function RootLayout() {
  // Die Display-Schrift trägt jede Überschrift. Bis sie da ist, wird nichts
  // gezeigt — ein kurzer Sprung von der System- auf die Display-Schrift wäre
  // genau die Art Zappeln, die diese Gestaltung vermeidet.
  const [fontsGeladen] = useFonts({ CormorantGaramond_700Bold });
  if (!fontsGeladen) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <Inhalt />
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Eine eigene Komponente, weil `useAbgleich` den QueryClient braucht — und der
 * steht erst UNTER dem Provider zur Verfügung, nicht daneben.
 */
function Inhalt() {
  useAbgleich();
  return <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />;
}
