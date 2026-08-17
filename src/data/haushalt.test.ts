// haushalt.test.ts — die zwei reinen Teile des Teilens.
//
// `lesbar` steht hier nicht zufällig unter Test: eine Meldung, die in die
// falsche Richtung zeigt, kostet mehr Zeit als gar keine. Genau das ist einmal
// passiert — „Keine Verbindung zum Server", während die Verbindung tadellos war
// und nur ein Schalter im Dashboard fehlte.
import { lesbar, mitFrist, normalisiereCode } from './haushalt';

describe('normalisiereCode', () => {
  it('liest großzügig — der Code wird vorgelesen und abgetippt', () => {
    expect(normalisiereCode(' k7m-p2 qr ')).toBe('K7MP2QR');
  });

  it('lässt einen sauberen Code unangetastet', () => {
    expect(normalisiereCode('K7MP2QRS')).toBe('K7MP2QRS');
  });
});

describe('lesbar', () => {
  it('nennt beim abgeschalteten Anbieter den Schalter, nicht das Netz', () => {
    const e = Object.assign(new Error('Anonymous sign-ins are disabled'), { code: 'anonymous_provider_disabled' });
    const satz = lesbar(e);
    expect(satz).toContain('Anonymous sign-ins');
    expect(satz).not.toContain('Kein Netz');
  });

  it('erkennt den Anbieter auch nur am Text, ohne Code', () => {
    expect(lesbar(new Error('Anonymous sign-ins are disabled'))).toContain('Authentication');
  });

  it('sagt beim falschen Code, dass er falsch ist', () => {
    expect(lesbar(new Error('unbekannter Code'))).toContain('Vertippt');
  });

  it('schickt bei fehlender Spalte in den SQL-Editor', () => {
    expect(lesbar(new Error('column zutaten.haben_wir does not exist'))).toContain('SQL-Editor');
  });

  it('unterscheidet Schweigen von Ablehnung', () => {
    expect(lesbar(new Error('Der Server antwortet nicht.'))).toContain('antwortet nicht');
    expect(lesbar(new Error('Failed to fetch'))).toContain('Kein Netz');
  });

  it('reicht Unbekanntes im Wortlaut durch, statt es zu verschlucken', () => {
    // Eine fremde englische Meldung ist unschön — aber sie lässt sich
    // nachschlagen, und „irgendwas ging schief" nicht.
    expect(lesbar(new Error('teapot 418'))).toBe('teapot 418');
  });

  // Der Fall, der es bis auf den Bildschirm geschafft hat: ein Supabase-Fehler
  // ist ein EINFACHES OBJEKT, keine `Error`-Instanz. `String(e)` ergibt darauf
  // „[object Object]" — und genau das stand dann da, wo die Erklärung stehen
  // sollte.
  it('liest ein einfaches Fehlerobjekt statt „[object Object]" zu zeigen', () => {
    const postgrest = {
      code: '42883',
      details: null,
      hint: 'No function matches the given name and argument types.',
      message: 'function gen_random_bytes(integer) does not exist',
    };
    const satz = lesbar(postgrest);
    expect(satz).not.toContain('[object Object]');
    expect(satz).toContain('gen_random_bytes');
    expect(satz).toContain('SQL-Editor');
  });

  it('erkennt den abgeschalteten Anbieter auch am Feld `error_code`', () => {
    // So kommt er vom Auth-Endpunkt: kein `code`, sondern `error_code`, und
    // die Meldung heißt `msg` statt `message`.
    const auth = { code: 422, error_code: 'anonymous_provider_disabled', msg: 'so nicht' };
    expect(lesbar(auth)).toContain('Anonymous sign-ins');
  });

  it('gibt zur Not das ganze Objekt aus, statt zu schweigen', () => {
    expect(lesbar({ seltsam: true })).toContain('seltsam');
  });
});

describe('mitFrist', () => {
  it('gibt durch, was rechtzeitig kommt', async () => {
    await expect(mitFrist(Promise.resolve('da'), 50)).resolves.toBe('da');
  });

  it('bricht ab, wenn nie etwas kommt', async () => {
    // Der eigentliche Fall: ein Netz, das nicht ablehnt, sondern schweigt.
    // Ohne Frist stünde „Einen Moment …" bis zum Wegwischen der App.
    await expect(mitFrist(new Promise(() => {}), 20)).rejects.toThrow('antwortet nicht');
  });

  it('reicht einen echten Fehler unverändert weiter', async () => {
    await expect(mitFrist(Promise.reject(new Error('abgelehnt')), 50)).rejects.toThrow('abgelehnt');
  });
});
