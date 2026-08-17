// settings.store.ts — die wenigen Dinge, die die App über sich selbst weiß.
//
// Bewusst klein gehalten: alles, was zu einer LISTE gehört, liegt in der
// Datenschicht, nicht hier. Hier steht nur, wie die App aussehen und sich
// bewegen soll.
// Ein `themePref` stand hier einmal. Es ist weg, seit die App fest hell ist
// (siehe `ThemeProvider.tsx`) — ein Schalter, den niemand bedienen kann und der
// nichts bewirkt, ist schlimmer als kein Schalter: er verspricht eine Funktion.
import { create } from 'zustand';

export type MotionPref = 'system' | 'full' | 'reduced';

type SettingsState = {
  motionPref: MotionPref;
  setMotionPref: (v: MotionPref) => void;
};

export const useSettings = create<SettingsState>((set) => ({
  motionPref: 'system',
  setMotionPref: (motionPref) => set({ motionPref }),
}));
