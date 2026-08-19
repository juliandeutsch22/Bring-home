// mitteilungen.test.ts — der Satz, der auf dem Sperrbildschirm ankommt.
//
// Der Rest der Datei (Erlaubnis, Abo, Senden) hängt an Browser-APIs und einem
// erreichbaren Server und wird deshalb hier nicht geprüft. Der Text hängt an
// nichts — und er ist der Teil, den die andere Person wirklich liest.
import { BITTE_NAMEN, VAPID_OEFFENTLICH, bitteText } from './mitteilungen';

describe('VAPID_OEFFENTLICH', () => {
  // Warum das geprüft wird: der Schlüssel wird aus einem Terminal KOPIERT, und
  // ein abgeschnittenes oder umgebrochenes Stück sieht auf den ersten Blick aus
  // wie ein Schlüssel. Der Fehler zeigt sich sonst erst auf einem fremden
  // Gerät, beim Anmelden zum Push — also genau dort, wo man ihn nicht sieht.
  it('ist ein vollständiger P-256-Punkt in base64url', () => {
    expect(VAPID_OEFFENTLICH).toMatch(/^[A-Za-z0-9_-]+$/);
    const roh = Buffer.from(VAPID_OEFFENTLICH, 'base64url');
    // 65 Bytes: ein Kennbyte (0x04, „unkomprimiert") plus zweimal 32 Byte
    // Koordinate. Alles andere lehnt der Push-Dienst ab.
    expect(roh.length).toBe(65);
    expect(roh[0]).toBe(0x04);
  });
});

describe('bitteText', () => {
  it('nennt die Sachen beim Namen, statt „es gibt Neues" zu raunen', () => {
    // Wer im Supermarkt steht, soll die App nicht erst öffnen müssen.
    expect(bitteText(['Milch', 'Brot'])).toBe('Bitte auf dem Heimweg mitnehmen: Milch, Brot');
  });

  it('kommt mit einer einzigen Sache klar', () => {
    expect(bitteText(['Milch'])).toBe('Bitte auf dem Heimweg mitnehmen: Milch');
  });

  it('kürzt lange Listen und beziffert den Rest', () => {
    // Eine Mitteilung wird nach zwei Zeilen abgeschnitten: lieber vier Namen und
    // eine Zahl als acht, von denen man vier nicht sieht.
    const viele = ['Milch', 'Brot', 'Käse', 'Butter', 'Eier', 'Salat'];
    expect(bitteText(viele)).toBe('Bitte auf dem Heimweg mitnehmen: Milch, Brot, Käse, Butter und 2 mehr');
  });

  it('kürzt genau an der Grenze noch nicht', () => {
    const genau = Array.from({ length: BITTE_NAMEN }, (_, i) => `Ding ${i + 1}`);
    expect(bitteText(genau)).not.toContain('mehr');
  });
});
