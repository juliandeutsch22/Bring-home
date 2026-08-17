// useAbgleich.ts — der Abgleich, an die App gehängt.
//
// Vier Anlässe, an denen abgeglichen wird, und für jeden gibt es einen Grund:
//  · beim Start — man öffnet die App und will sehen, was der andere getan hat.
//  · nach eigener Änderung — gesammelt, damit fünf Häkchen einen Durchgang
//    ergeben und nicht fünf.
//  · wenn die App zurück in den Vordergrund kommt — der klassische Fall: Handy
//    in die Tasche, im Laden wieder heraus.
//  · wenn der Server sich meldet (Realtime) — dafür ist er da.
//
// Nichts davon zeigt einen Ladebalken. Der Abgleich ist Hintergrundarbeit; die
// Liste ist immer sofort da, weil sie lokal liegt.
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { AppState } from 'react-native';

import { horche, plane, setzeMelder, synchronisiere } from './abgleich';
import { useHaushalt } from './haushalt';

export function useAbgleich(): void {
  const qc = useQueryClient();
  const id = useHaushalt((s) => s.id);
  const laden = useHaushalt((s) => s.laden);

  // Einmal beim Start: welchen Haushalt hat sich dieses Gerät gemerkt?
  useEffect(() => {
    void laden();
  }, [laden]);

  const lauf = useCallback(() => {
    void (async () => {
      // Neu gezeichnet wird nur, wenn wirklich etwas hereinkam — sonst zuckte
      // die Liste im Hintergrund, ohne dass sich etwas geändert hätte.
      if (await synchronisiere(id)) await qc.invalidateQueries();
    })();
  }, [id, qc]);

  useEffect(() => {
    setzeMelder(lauf);
    lauf();
    return () => setzeMelder(null);
  }, [lauf]);

  useEffect(() => {
    const anmeldung = AppState.addEventListener('change', (zustand) => {
      if (zustand === 'active') plane(0);
    });
    return () => anmeldung.remove();
  }, []);

  useEffect(() => {
    if (!id) return undefined;
    return horche(id, () => plane());
  }, [id]);
}
