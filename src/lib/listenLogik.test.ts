// listenLogik.test.ts — die Entscheidungen, an denen die App hängt.
import type { Artikel, Aufgabe, Wunsch, Zutat } from '@/data/types';
import { HAUSHALT } from '@/data/types';

import {
  RHYTHMEN,
  fehlendeZutaten,
  findeArtikel,
  imVorratSeit,
  istKochbar,
  istOffen,
  kuerze,
  naechsteFaelligkeit,
  naechsterStand,
  normalisiere,
  ruht,
  teileAufgaben,
  teileListe,
  teileWuensche,
  wartet,
  wiederIn,
  wiederkehrend,
  zutatStatus,
} from './listenLogik';

const artikel = (p: Partial<Artikel> & { id: string; text: string }): Artikel => ({
  listeId: HAUSHALT,
  menge: null,
  erledigtAm: null,
  vorratAb: null,
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
  rhythmusTage: null,
  faelligAb: null,
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
    expect(teileListe([])).toEqual({ offen: [], imWagen: [], imVorrat: [] });
  });

  it('zählt Eingeräumtes NICHT mehr zum Wagen', () => {
    // Der Fall, an dem die ganze Bahn hängt: `erledigtAm` bleibt beim
    // Einräumen stehen. Wer nur danach fragt, hätte den Artikel an zwei Orten
    // zugleich — oder, je nach Reihenfolge der Filter, an keinem.
    const a = artikel({
      id: '1',
      text: 'Milch',
      erledigtAm: '2026-08-17T11:00:00.000Z',
      vorratAb: '2026-08-17T12:00:00.000Z',
    });
    const { offen, imWagen, imVorrat } = teileListe([a]);
    expect(offen).toEqual([]);
    expect(imWagen).toEqual([]);
    expect(imVorrat.map((x) => x.id)).toEqual(['1']);
  });

  it('legt das zuletzt Eingeräumte im Vorrat obenauf', () => {
    const alt = artikel({ id: '1', text: 'Reis', erledigtAm: 'x', vorratAb: '2026-08-10T09:00:00.000Z' });
    const neu = artikel({ id: '2', text: 'Nudeln', erledigtAm: 'x', vorratAb: '2026-08-17T09:00:00.000Z' });
    expect(teileListe([alt, neu]).imVorrat.map((x) => x.id)).toEqual(['2', '1']);
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

  it('sagt „imVorrat", wenn sie eingeräumt wurde', () => {
    const eingeraeumt = artikel({
      id: 'a1',
      text: 'Linsen',
      erledigtAm: '2026-08-17T11:00:00.000Z',
      vorratAb: '2026-08-17T12:00:00.000Z',
    });
    expect(zutatStatus(linsen, [eingeraeumt])).toBe('imVorrat');
  });

  it('lässt DA SEIN das GEPLANTE ausstechen, wenn es beides gibt', () => {
    // Der Normalfall, seit es den Vorrat gibt: Eine Packung steht im Schrank,
    // und auf der Liste steht Nachschub. Wer hier den Listen-Eintrag gewinnen
    // ließe, erklärte ein Gericht für unkochbar, WEIL jemand nachbestellt hat.
    const imSchrank = artikel({
      id: 'a1',
      text: 'Linsen',
      erledigtAm: '2026-08-10T11:00:00.000Z',
      vorratAb: '2026-08-10T12:00:00.000Z',
    });
    const nachschub = artikel({ id: 'a2', text: 'Linsen' });
    expect(zutatStatus(linsen, [imSchrank, nachschub])).toBe('imVorrat');
    // Und andersherum sortiert, damit es nicht am Zufall der Reihenfolge hängt.
    expect(zutatStatus(linsen, [nachschub, imSchrank])).toBe('imVorrat');
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

describe('istKochbar', () => {
  const zutaten = [zutat({ id: 'z1', text: 'Linsen' }), zutat({ id: 'z2', text: 'Spätzle' })];
  const gekauft = (id: string, text: string) =>
    artikel({ id, text, erledigtAm: '2026-08-17T11:00:00.000Z' });

  it('zählt Gekauftes als vorhanden — es liegt im Wagen', () => {
    expect(istKochbar(zutaten, [gekauft('a1', 'Linsen'), gekauft('a2', 'Spätzle')])).toBe(true);
  });

  it('zählt „haben wir da" als vorhanden', () => {
    const mitVorrat = [zutat({ id: 'z1', text: 'Salz', habenWir: true }), zutat({ id: 'z2', text: 'Öl', habenWir: true })];
    expect(istKochbar(mitVorrat, [])).toBe(true);
  });

  it('lässt „auf der Liste" NICHT gelten — das ist geplant, nicht da', () => {
    // Der Fall, der den Haken vorher zu Unrecht gesetzt hat: vor dem Herd hat
    // man von einem Eintrag auf einer Einkaufsliste nichts.
    expect(istKochbar(zutaten, [artikel({ id: 'a1', text: 'Linsen' }), gekauft('a2', 'Spätzle')])).toBe(false);
  });

  it('reicht eine fehlende Zutat, und es ist nicht kochbar', () => {
    expect(istKochbar(zutaten, [gekauft('a1', 'Linsen')])).toBe(false);
  });

  it('hält ein Gericht OHNE Zutaten nicht für kochbar', () => {
    // Sonst trüge jeder frisch eingetragene Wunsch sofort einen Haken, und das
    // Zeichen hieße nur noch „hat keine Zutaten".
    expect(istKochbar([], [])).toBe(false);
  });

  it('überlebt das Einräumen des Wagens — der Grund, warum es den Vorrat gibt', () => {
    // Vorher LÖSCHTE das Leeren des Wagens, und genau hier kippte der Haken
    // zurück: Am Samstag gekauft, am Sonntag wieder „fehlt".
    const eingeraeumt = (id: string, text: string) =>
      artikel({ id, text, erledigtAm: '2026-08-15T11:00:00.000Z', vorratAb: '2026-08-15T12:00:00.000Z' });
    expect(istKochbar(zutaten, [eingeraeumt('a1', 'Linsen'), eingeraeumt('a2', 'Spätzle')])).toBe(true);
  });
});

describe('imVorratSeit', () => {
  const JETZT = new Date('2026-08-17T12:00:00.000Z');
  const seit = (iso: string) =>
    imVorratSeit(artikel({ id: 'a1', text: 'Milch', erledigtAm: 'x', vorratAb: iso }), JETZT);

  it('zählt in TAGEN, nicht in Datum', () => {
    expect(seit('2026-08-14T09:00:00.000Z')).toBe('seit 3 Tagen');
  });

  it('kennt heute und gestern beim Namen', () => {
    expect(seit('2026-08-17T08:00:00.000Z')).toBe('seit heute');
    expect(seit('2026-08-16T22:00:00.000Z')).toBe('seit gestern');
  });

  it('rechnet in KALENDERTAGEN, nicht in 24-Stunden-Schritten', () => {
    // 14 Stunden her, aber gestern: „seit heute" wäre schlicht falsch.
    expect(seit('2026-08-16T22:00:00.000Z')).toBe('seit gestern');
  });

  it('sagt bei einem Zeitpunkt in der Zukunft nicht „seit in 2 Tagen"', () => {
    // Eine vorgehende Uhr auf dem anderen Gerät reicht dafür schon.
    expect(seit('2026-08-19T09:00:00.000Z')).toBe('seit heute');
  });

  it('bleibt still, wenn nichts dasteht', () => {
    expect(imVorratSeit(artikel({ id: 'a1', text: 'Milch' }), JETZT)).toBe('');
    expect(seit('kein Datum')).toBe('');
  });
});

describe('teileWuensche', () => {
  const wunsch = (p: Partial<Wunsch> & { id: string; gericht: string }): Wunsch => ({
    notiz: null,
    vonWem: null,
    erledigtAm: null,
    sort: 0,
    updatedAt: '2026-08-17T10:00:00.000Z',
    deletedAt: null,
    ...p,
  });

  it('trennt Offenes von Gekochtem', () => {
    const a = wunsch({ id: '1', gericht: 'Carbonara' });
    const b = wunsch({ id: '2', gericht: 'Linsen', erledigtAm: '2026-08-17T18:00:00.000Z' });
    const t = teileWuensche([a, b]);
    expect(t.offen.map((w) => w.id)).toEqual(['1']);
    expect(t.gekocht.map((w) => w.id)).toEqual(['2']);
  });

  it('legt zuletzt Gekochtes obenauf — ein Fehlgriff ist sofort greifbar', () => {
    const frueh = wunsch({ id: '1', gericht: 'A', erledigtAm: '2026-08-16T18:00:00.000Z' });
    const spaet = wunsch({ id: '2', gericht: 'B', erledigtAm: '2026-08-17T18:00:00.000Z' });
    expect(teileWuensche([frueh, spaet]).gekocht.map((w) => w.id)).toEqual(['2', '1']);
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

describe('Wiederholungen', () => {
  // Ein fester Zeitpunkt, damit die Tests nicht davon abhängen, wann sie
  // laufen — sonst schlägt einer davon irgendwann um Mitternacht fehl.
  const jetzt = new Date(2026, 7, 20, 14, 30); // 20.08.2026, 14:30 Ortszeit

  it('legt den nächsten Termin auf den Tagesbeginn, nicht auf die Uhrzeit', () => {
    const ab = new Date(naechsteFaelligkeit(7, jetzt));
    expect(ab.getDate()).toBe(27);
    expect(ab.getHours()).toBe(0);
    expect(ab.getMinutes()).toBe(0);
  });

  it('nimmt eine abgehakte wiederkehrende Aufgabe NICHT ins Archiv', () => {
    // Sonst stünden dort nach einem Jahr zweiundfünfzig „Müll rausbringen".
    const a = aufgabe({ id: '1', titel: 'Müll', rhythmusTage: 7 });
    const stand = naechsterStand(a, jetzt);
    expect(stand.erledigtAm).toBeUndefined();
    expect(stand.faelligAb).toBe(naechsteFaelligkeit(7, jetzt));
  });

  it('hakt eine einmalige Aufgabe ganz normal ab', () => {
    const a = aufgabe({ id: '1', titel: 'Regal aufbauen' });
    expect(naechsterStand(a, jetzt).erledigtAm).toBe(jetzt.toISOString());
  });

  it('holt eine ruhende Aufgabe auf Antippen sofort zurück', () => {
    const a = aufgabe({ id: '1', titel: 'Müll', rhythmusTage: 7, faelligAb: naechsteFaelligkeit(7, jetzt) });
    expect(ruht(a, jetzt)).toBe(true);
    expect(naechsterStand(a, jetzt)).toEqual({ faelligAb: null });
  });

  it('öffnet Erledigtes wieder, auch wenn ein Rhythmus daranhängt', () => {
    const a = aufgabe({ id: '1', titel: 'Müll', rhythmusTage: 7, erledigtAm: '2026-08-19T09:00:00.000Z' });
    expect(naechsterStand(a, jetzt)).toEqual({ erledigtAm: null });
  });

  it('lässt eine ruhende Aufgabe am Fälligkeitstag wieder auftauchen', () => {
    const a = aufgabe({ id: '1', titel: 'Müll', rhythmusTage: 7, faelligAb: naechsteFaelligkeit(7, jetzt) });
    const spaeter = new Date(2026, 7, 27, 7, 0); // derselbe Tag, früh
    expect(ruht(a, spaeter)).toBe(false);
    expect(istOffen(a, spaeter)).toBe(true);
  });

  it('steckt Ruhendes in seinen eigenen Abschnitt, nicht ins Offene', () => {
    const ruhig = aufgabe({ id: '1', titel: 'Müll', rhythmusTage: 7, faelligAb: naechsteFaelligkeit(7, jetzt) });
    const jetztFaellig = aufgabe({ id: '2', titel: 'Abwasch', rhythmusTage: 1 });
    const t = teileAufgaben([ruhig, jetztFaellig], jetzt);
    expect(t.ruhend.map((a) => a.id)).toEqual(['1']);
    expect(t.offen.map((a) => a.id)).toEqual(['2']);
  });

  it('lässt Warten vor Ruhen gehen — genau EIN Abschnitt', () => {
    const a = aufgabe({
      id: '1',
      titel: 'Heizung',
      wartetAuf: 'Termin',
      rhythmusTage: 30,
      faelligAb: naechsteFaelligkeit(30, jetzt),
    });
    const t = teileAufgaben([a], jetzt);
    expect(t.wartend.map((x) => x.id)).toEqual(['1']);
    expect(t.ruhend).toHaveLength(0);
    expect(t.offen).toHaveLength(0);
  });

  it('hält einen unlesbaren Termin für FÄLLIG statt für ewig ruhend', () => {
    // Im Zweifel lieber eine Zeile zu viel auf der Liste als eine Aufgabe, die
    // unsichtbar liegen bleibt und nie wieder auftaucht.
    const a = aufgabe({ id: '1', titel: 'Müll', rhythmusTage: 7, faelligAb: 'kaputt' });
    expect(ruht(a, jetzt)).toBe(false);
    expect(istOffen(a, jetzt)).toBe(true);
  });

  it('kommt mit Datensätzen von vor der Migration klar', () => {
    // Ältere Einträge im Gerätespeicher tragen die Felder gar nicht — sie
    // kommen als `undefined` aus dem JSON, nicht als null.
    const alt = { ...aufgabe({ id: '1', titel: 'Regal' }), rhythmusTage: undefined, faelligAb: undefined } as unknown as Aufgabe;
    expect(wiederkehrend(alt)).toBe(false);
    expect(ruht(alt, jetzt)).toBe(false);
    expect(istOffen(alt, jetzt)).toBe(true);
    expect(naechsterStand(alt, jetzt).erledigtAm).toBe(jetzt.toISOString());
  });

  it('sagt in Tagen, wann es wieder dran ist', () => {
    const a = aufgabe({ id: '1', titel: 'Müll', faelligAb: naechsteFaelligkeit(3, jetzt) });
    expect(wiederIn(a, jetzt)).toBe('wieder in 3 Tagen');
    expect(wiederIn(aufgabe({ id: '2', titel: 'x', faelligAb: naechsteFaelligkeit(1, jetzt) }), jetzt)).toBe('wieder morgen');
  });

  it('bietet keinen Rhythmus an, der sich sofort selbst wieder stellt', () => {
    for (const r of RHYTHMEN) {
      if (r.tage !== null) expect(r.tage).toBeGreaterThan(0);
    }
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
