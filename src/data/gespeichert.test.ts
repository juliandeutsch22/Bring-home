// gespeichert.test.ts — die Grabstein-Hygiene.
//
// Die einzige Entscheidung in `gespeichert.ts`, die schiefgehen kann: wann ein
// Grabstein selbst verschwinden darf. Zu früh, und ein gelöschter Eintrag kommt
// beim nächsten Abgleich zurück. Nie, und der Bestand wächst für immer.
import type { Artikel } from './types';
import { HAUSHALT } from './types';

import { GRABSTEIN_TAGE, ohneAlteGrabsteine } from './gespeichert';

const JETZT = new Date('2026-08-17T12:00:00.000Z');
const vorTagen = (n: number) => new Date(JETZT.getTime() - n * 86400000).toISOString();

const artikel = (p: Partial<Artikel> & { id: string }): Artikel => ({
  listeId: HAUSHALT,
  text: 'Milch',
  menge: null,
  erledigtAm: null,
  vorratAb: null,
  vonWem: null,
  sort: 0,
  updatedAt: vorTagen(1),
  deletedAt: null,
  ...p,
});

describe('ohneAlteGrabsteine', () => {
  it('lässt Lebendiges immer stehen, egal wie alt', () => {
    const alt = artikel({ id: '1', updatedAt: vorTagen(900) });
    expect(ohneAlteGrabsteine([alt], JETZT).map((a) => a.id)).toEqual(['1']);
  });

  it('behält frische Grabsteine — das andere Gerät hat sie vielleicht noch nicht gesehen', () => {
    const frisch = artikel({ id: '1', deletedAt: vorTagen(GRABSTEIN_TAGE - 1) });
    expect(ohneAlteGrabsteine([frisch], JETZT)).toHaveLength(1);
  });

  it('räumt alte Grabsteine ab', () => {
    const alt = artikel({ id: '1', deletedAt: vorTagen(GRABSTEIN_TAGE + 1) });
    expect(ohneAlteGrabsteine([alt], JETZT)).toEqual([]);
  });

  it('behält einen unlesbaren Zeitstempel, statt zu raten', () => {
    // Im Zweifel lieber eine Zeile zu viel als ein Löschen, das wieder auftaucht.
    const kaputt = artikel({ id: '1', deletedAt: 'gestern' });
    expect(ohneAlteGrabsteine([kaputt], JETZT)).toHaveLength(1);
  });

  it('trennt gemischte Bestände richtig', () => {
    const bestand = [
      artikel({ id: 'lebt' }),
      artikel({ id: 'frisch-tot', deletedAt: vorTagen(2) }),
      artikel({ id: 'alt-tot', deletedAt: vorTagen(200) }),
    ];
    expect(ohneAlteGrabsteine(bestand, JETZT).map((a) => a.id)).toEqual(['lebt', 'frisch-tot']);
  });
});
