// abgleich.test.ts — die zwei Stellen, an denen der Abgleich Daten verlieren
// könnte, wenn man sich vertut.
import type { Artikel } from './types';
import { HAUSHALT } from './types';

import { iso, zuUebernehmende } from './abgleich';

const artikel = (p: Partial<Artikel> & { id: string; updatedAt: string }): Artikel => ({
  listeId: HAUSHALT,
  text: 'Milch',
  menge: null,
  erledigtAm: null,
  vonWem: null,
  sort: 0,
  deletedAt: null,
  ...p,
});

describe('iso', () => {
  it('macht aus der Postgres-Schreibweise dieselbe wie im Client', () => {
    // Derselbe Moment, zwei Schreibweisen. Als Zeichenkette verglichen wären
    // sie verschieden — und verglichen wird beim Abgleich ständig.
    expect(iso('2026-08-17T12:00:00.123456+00:00')).toBe('2026-08-17T12:00:00.123Z');
    expect(iso('2026-08-17T12:00:00.123Z')).toBe('2026-08-17T12:00:00.123Z');
  });

  it('macht aus Unsinn den Urzeitpunkt, statt zu werfen', () => {
    // Ein einzelner kaputter Zeitstempel darf nicht den ganzen Durchgang
    // abbrechen — er verliert dann eben jeden Vergleich.
    expect(iso('kein Datum')).toBe(new Date(0).toISOString());
  });
});

describe('zuUebernehmende', () => {
  it('nimmt, was es hier noch gar nicht gibt', () => {
    const fremd = artikel({ id: 'a1', updatedAt: '2026-08-17T12:00:00.000Z' });
    expect(zuUebernehmende([fremd], []).map((a) => a.id)).toEqual(['a1']);
  });

  it('nimmt den neueren von beiden', () => {
    const fremd = artikel({ id: 'a1', updatedAt: '2026-08-17T12:00:00.000Z', text: 'Hafermilch' });
    const meins = artikel({ id: 'a1', updatedAt: '2026-08-17T11:00:00.000Z' });
    expect(zuUebernehmende([fremd], [meins]).map((a) => a.text)).toEqual(['Hafermilch']);
  });

  it('lässt eine gerade getippte Änderung stehen', () => {
    // Der Fall, der wehtut: man ändert etwas, während der Abgleich läuft. Der
    // fremde Satz ist älter und darf nicht darüber.
    const fremd = artikel({ id: 'a1', updatedAt: '2026-08-17T11:00:00.000Z', text: 'Milch' });
    const meins = artikel({ id: 'a1', updatedAt: '2026-08-17T12:00:00.000Z', text: 'Hafermilch' });
    expect(zuUebernehmende([fremd], [meins])).toEqual([]);
  });

  it('hält Gleichstand nicht für neuer', () => {
    // Der Wasserstand hat einen Sicherheitssaum, es kommen also regelmäßig
    // Sätze zurück, die man selbst geschickt hat. Die sind kein Ereignis.
    const gleich = '2026-08-17T12:00:00.000Z';
    expect(zuUebernehmende([artikel({ id: 'a1', updatedAt: gleich })], [artikel({ id: 'a1', updatedAt: gleich })])).toEqual([]);
  });

  it('erkennt denselben Moment in beiden Schreibweisen', () => {
    const fremd = artikel({ id: 'a1', updatedAt: iso('2026-08-17T12:00:00.123456+00:00') });
    const meins = artikel({ id: 'a1', updatedAt: '2026-08-17T12:00:00.123Z' });
    expect(zuUebernehmende([fremd], [meins])).toEqual([]);
  });

  it('übernimmt auch einen Grabstein — sonst käme das Gelöschte zurück', () => {
    const grab = artikel({ id: 'a1', updatedAt: '2026-08-17T12:00:00.000Z', deletedAt: '2026-08-17T12:00:00.000Z' });
    const meins = artikel({ id: 'a1', updatedAt: '2026-08-17T11:00:00.000Z' });
    expect(zuUebernehmende([grab], [meins])[0]?.deletedAt).not.toBeNull();
  });
});
