// index.tsx — Einstieg: direkt in den Einkauf. Das ist der Grund, warum es die
// App gibt; alles andere sucht man bewusst auf.
import { Redirect } from 'expo-router';
import React from 'react';

export default function Index() {
  return <Redirect href="/einkauf" />;
}
