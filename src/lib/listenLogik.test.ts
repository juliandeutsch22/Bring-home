// listenLogik.test.ts — die Entscheidungen, an denen die App hängt.
import type { Artikel, Aufgabe, Zutat } from '@/data/types';
import { HAUSHALT } from '@/data/types';

import {
  fehlendeZutaten,
  findeArtikel,
  istOffen,
  kuerze,
  normalisiere,
  teileAufgaben,
  teileListe,
  wartet,
  zutatStatus,
} from './listenLogik';

const artikel = (p: Partial<Artikel> & { id: string; text: string }): Artikel => ({
  listeId: HAUSHALT,
  menge: null,
  erledigtAm: null,
  vonWem: null,
  sort: 0,
  updatedAt: '2026-08-17T10:00:00.000Z',
  deletedAt: null,
  ...p,
});

const zutat = (p: Partial<Zutat> & { id: string; text: string }): Zutat => ({
  wunschId: 'w1',
  menge: null,
  habenWir: false,
  sort: 0,
  updatedAt: '2026-08-17T10:00:00.000Z',
  deletedAt: null,
  ...p,
});

const aufgabe = (p: Partial<Aufgabe> & { id: string; titel: string }): Aufgabe => ({
  erledigtAm: null,
  person: null,
  wartetAuf: null,
  sort: 0,
  updatedAt: '2026-08-17T10:00:00.000Z',
  deletedAt: null,
  ...p,
});

describe('teileListe', () => {
  it('trennt, was noch zu holen ist, von dem, was im Wagen liegt', () => {
    const a = artikel({ id: '1', text: 'Milch' });
    const b = artikel({ id: '2', text: 'Brot', erledigtAm: '2026-08-17T11:00:00.000Z' });
    const { offen, imWagen } = teileListe([a, b]);
    expect(offen.map((x) => x.id)).toEqual(['1']);
    expect(imWagen.map((x) => x.id)).toEqual(['2']);
  });

  it('legt das zuletzt Abgehakte obenauf — ein Fehlgriff ist sofort greifbar', () => {
    const frueh = artikel({ id: '1', text: 'Brot', erledigtAm: '2026-08-17T11:00:00.000Z' });
    const spaet = artikel({ id: '2', text: 'Butter', erledigtAm: '2026-08-17T11:05:00.000Z' });
    expect(teileListe([frueh, spaet]).imWagen.map((x) => x.id)).toEqual(['2', '1']);
  });

  it('kommt mit einer leeren Liste klar', () => {
    expect(teileListe([])).toEqual({ offen: [], imWagen: [] });
  });
});

describe('normalisiere und findeArtikel', () => {
  it('hält Groß-, Klein- und Leerraum für dasselbe', () => {
    expect(normalisiere('  Voll  Milch ')).toBe('voll milch');
  });

  it('findet einen vorhandenen Artikel ungeachtet der Schreibweise', () => {
    const liste = [artikel({ id: '1', text: 'Milch' })];
    expect(findeArtikel(liste, '  MILCH ')?.id).toBe('1');
  });

  it('findet nichts, wenn es nichts gibt — das ist das Signal zum Anlegen', () => {
    expect(findeArtikel([artikel({ id: '1', text: 'Milch' })], 'Brot')).toBeUndefined();
  });
});

describe('zutatStatus', () => {
  const linsen = zutat({ id: 'z1', text: 'Linsen' });

  it('sagt „fehlt", wenn die Zutat nirgends steht', () => {
    expect(zutatStatus(linsen, [])).toBe('fehlt');
  });

  it('sagt „aufDerListe", wenn sie offen auf der Einkaufsliste steht', () => {
    expect(zutatStatus(linsen, [artikel({ id: 'a1', text: 'linsen' })])).toBe('aufDerListe');
  });

  it('sagt „imWagen", wenn sie schon abgehakt ist', () => {
    const gekauft = artikel({ id: 'a1', text: 'Linsen', erledigtAm: '2026-08-17T11:00:00.000Z' });
    expect(zutatStatus(linsen, [gekauft])).toBe('imWagen');
  });

  it('sticht mit „habenWir" alles andere aus — der Vorratsschrank schlägt die Liste', () => {
    const vorrat = zutat({ id: 'z2', text: 'Salz', habenWir: true });
    expect(zutatStatus(vorrat, [])).toBe('habenWir');
    expect(zutatStatus(vorrat, [artikel({ id: 'a1', text: 'Salz' })])).toBe('habenWir');
  });
});

describe('fehlendeZutaten', () => {
  const zutaten = [
    zutat({ id: 'z1', text: 'Linsen' }),
    zutat({ id: 'z2', text: 'Spätzle' }),
    zutat({ id: 'z3', text: 'Essig' }),
  ];

  it('lässt weg, was schon offen auf der Liste steht', () => {
    const liste = [artikel({ id: 'a1', text: 'linsen' })];
    expect(fehlendeZutaten(zutaten, liste).map((z) => z.id)).toEqual(['z2', 'z3']);
  });

  it('lässt auch Gekauftes weg — der Sammel-Knopf sammelt nur, was fehlt', () => {
    const liste = [artikel({ id: 'a1', text: 'Linsen', erledigtAm: '2026-08-17T11:00:00.000Z' })];
    expect(fehlendeZutaten(zutaten, liste).map((z) => z.id)).toEqual(['z2', 'z3']);
  });

  it('lässt weg, was ihr ohnehin immer dahabt', () => {
    const mitVorrat = [...zutaten, zutat({ id: 'z4', text: 'Salz', habenWir: true })];
    expect(fehlendeZutaten(mitVorrat, []).map((z) => z.id)).toEqual(['z1', 'z2', 'z3']);
  });

  it('gibt nichts zurück, wenn alles schon dasteht', () => {
    const liste = zutaten.map((z, i) => artikel({ id: `a${i}`, text: z.text }));
    expect(fehlendeZutaten(zutaten, liste)).toEqual([]);
  });
});

describe('teileAufgaben', () => {
  it('steckt jede Aufgabe in GENAU einen Abschnitt', () => {
    const offen = aufgabe({ id: '1', titel: 'Regal' });
    const wartend = aufgabe({ id: '2', titel: 'Heizung', wartetAuf: 'Termin' });
    const fertig = aufgabe({ id: '3', titel: 'Filter', erledigtAm: '2026-08-16T09:00:00.000Z' });
    const t = teileAufgaben([offen, wartend, fertig]);
    expect(t.offen.map((a) => a.id)).toEqual(['1']);
    expect(t.wartend.map((a) => a.id)).toEqual(['2']);
    expect(t.erledigt.map((a) => a.id)).toEqual(['3']);
  });

  it('zählt eine erledigte Wartende NICHT mehr als wartend', () => {
    const a = aufgabe({ id: '1', titel: 'Heizung', wartetAuf: 'Termin', erledigtAm: '2026-08-17T09:00:00.000Z' });
    expect(wartet(a)).toBe(false);
    expect(istOffen(a)).toBe(false);
    expect(teileAufgaben([a]).erledigt.map((x) => x.id)).toEqual(['1']);
  });

  it('hält ein leeres „wartet auf" nicht für ein Warten', () => {
    expect(wartet(aufgabe({ id: '1', titel: 'x', wartetAuf: '' }))).toBe(false);
  });
});

describe('kuerze', () => {
  const viele = Array.from({ length: 30 }, (_, i) => i);

  it('lässt kurze Listen ganz', () => {
    expect(kuerze([1, 2, 3], 12)).toEqual([[1, 2, 3], 0]);
  });

  it('kürzt und beziffert den Rest', () => {
    const [gezeigt, rest] = kuerze(viele, 12);
    expect(gezeigt).toHaveLength(12);
    expect(rest).toBe(18);
  });

  it('kommt mit genau der Grenze klar', () => {
    expect(kuerze(viele.slice(0, 12), 12)[1]).toBe(0);
  });
});
