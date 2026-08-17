// settings.store.ts — die wenigen Dinge, die die App über sich selbst weiß.
//
// Bewusst klein gehalten: alles, was zu einer LISTE gehört, liegt in der
// Datenschicht, nicht hier. Hier steht nur, wie die App aussehen und sich
// bewegen soll.
import { create } from 'zustand';

export type ThemePref = 'system' | 'light' | 'dark';
export type MotionPref = 'system' | 'full' | 'reduced';

type SettingsState = {
  themePref: ThemePref;
  motionPref: MotionPref;
  setThemePref: (v: ThemePref) => void;
  setMotionPref: (v: MotionPref) => void;
};

export const useSettings = create<SettingsState>((set) => ({
  themePref: 'system',
  motionPref: 'system',
  setThemePref: (themePref) => set({ themePref }),
  setMotionPref: (motionPref) => set({ motionPref }),
}));
