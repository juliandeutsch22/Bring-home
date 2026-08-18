// nachklang.ts — der kurze Moment zwischen „angetippt" und „weg".
//
// Das Problem: hakt man etwas ab, verschwindet die Zeile SOFORT aus der Liste
// und taucht im Wagen wieder auf. Der Haken, der die Handlung eigentlich
// quittiert, war nie zu sehen — er wurde im selben Bild abgebaut, in dem er
// hätte anspringen sollen. Übrig blieb: etwas ist verschwunden, und man muss
// glauben, dass es das Richtige war.
//
// Also erst füllen, dann fortschaffen. Der Haken läuft an (`Dur.press + 60`
// = 150 ms), bleibt einen Wimpernschlag stehen, und danach erst geht die Zeile.
// Zusammen bleibt es unter den 300 ms, die für UI-Bewegung gelten — es fühlt
// sich nicht wie Warten an, sondern wie eine Quittung.
//
// Bewusst KEINE Ausnahme für „Bewegung reduzieren": das hier ist keine
// Animation, sondern eine Zustandsanzeige. Wer Bewegung abbestellt hat, sieht
// den Haken hart anspringen — und danach immer noch, dass er da war.
import { useCallback, useEffect, useRef, useState } from 'react';

import { Dur } from '@/theme/motion.tokens';

/** Füllen (150 ms) plus ein Wimpernschlag zum Lesen. */
export const NACHKLANG_MS = Dur.press + 60 + 90;

export function useNachklang(verzoegerung: number = NACHKLANG_MS) {
  /** Wer gerade quittiert wird — die Zeile zeigt sich so lange als „an". */
  const [markiert, setMarkiert] = useState<ReadonlySet<string>>(() => new Set());
  const uhren = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Beim Abbau alles abräumen: sonst feuert ein `setState` in einen Bildschirm,
  // den es nicht mehr gibt — und die Mutation liefe für eine Liste, die
  // niemand mehr ansieht.
  useEffect(() => {
    const laufende = uhren.current;
    return () => {
      for (const u of laufende.values()) clearTimeout(u);
      laufende.clear();
    };
  }, []);

  const anstossen = useCallback(
    (id: string, dann: () => void) => {
      // Ein zweiter Tipp auf dieselbe Zeile startet nichts Neues. Ohne das
      // liefe die Handlung doppelt — beim Abhaken harmlos, beim Umschalten
      // nicht: es wäre sofort wieder rückgängig.
      if (uhren.current.has(id)) return;
      setMarkiert((m) => new Set(m).add(id));
      const uhr = setTimeout(() => {
        uhren.current.delete(id);
        setMarkiert((m) => {
          const n = new Set(m);
          n.delete(id);
          return n;
        });
        dann();
      }, verzoegerung);
      uhren.current.set(id, uhr);
    },
    [verzoegerung],
  );

  return { markiert, anstossen };
}
