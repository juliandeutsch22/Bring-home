// repositories.test.ts — wo Neues landet, und dass der Rest liegen bleibt.
//
// Die Richtung ist keine Kosmetik: neue Punkte OBEN erscheinen direkt unter dem
// Eingabefeld, wo das Auge ohnehin ist — der Eintrag quittiert sich damit
// selbst. Unten stand er bei einer längeren Liste außerhalb des Bildes, und man
// musste glauben, dass er angekommen ist.
import { InMemoryAblage } from './repositories';
import type { Artikel } from './types';
import { HAUSHALT } from './types';

type Neu = { text: string };

const baue = (e: Neu, sort: number): Artikel => ({
  id: e.text,
  listeId: HAUSHALT,
  text: e.text,
  menge: null,
  erledigtAm: null,
  vonWem: null,
  sort,
  updatedAt: '2026-08-17T10:00:00.000Z',
  deletedAt: null,
});

const nachSort = (a: Artikel, b: Artikel) => a.sort - b.sort;

const reihe = async (ablage: InMemoryAblage<Artikel, Neu>, namen: string[]) => {
  for (const t of namen) await ablage.anlegen({ text: t });
  return (await ablage.alle()).map((a) => a.text);
};

describe('InMemoryAblage: wohin kommt Neues', () => {
  it('setzt Neues nach oben, wenn die Ablage das so will', async () => {
    const ablage = new InMemoryAblage<Artikel, Neu>(baue, nachSort, true);
    expect(await reihe(ablage, ['Milch', 'Brot', 'Käse'])).toEqual(['Käse', 'Brot', 'Milch']);
  });

  it('hängt sonst hinten an — für Zutaten, die in Rezeptreihenfolge kommen', async () => {
    const ablage = new InMemoryAblage<Artikel, Neu>(baue, nachSort);
    expect(await reihe(ablage, ['Milch', 'Brot', 'Käse'])).toEqual(['Milch', 'Brot', 'Käse']);
  });

  it('lässt die vorhandene Reihenfolge in Ruhe', async () => {
    // Das Neue setzt sich DANEBEN, nicht mittendrin: alles andere behält seinen
    // Platz zueinander, egal wie oft etwas dazukommt.
    const ablage = new InMemoryAblage<Artikel, Neu>(baue, nachSort, true);
    await reihe(ablage, ['A', 'B']);
    expect(await reihe(ablage, ['C'])).toEqual(['C', 'B', 'A']);
    expect(await reihe(ablage, ['D'])).toEqual(['D', 'C', 'B', 'A']);
  });

  it('kommt mit einer leeren Ablage klar', async () => {
    // `Math.min(...[])` wäre Infinity — deshalb steht überall eine 0 als Anker.
    const ablage = new InMemoryAblage<Artikel, Neu>(baue, nachSort, true);
    const erster = await ablage.anlegen({ text: 'Milch' });
    expect(Number.isFinite(erster.sort)).toBe(true);
  });
});
