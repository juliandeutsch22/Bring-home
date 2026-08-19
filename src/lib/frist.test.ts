// frist.test.ts — die Frist ist der einzige Grund, warum „Einen Moment …"
// wieder verschwindet. Stand vorher bei `haushalt.test.ts`, weil die Frist dort
// wohnte; sie wird inzwischen auch beim Verschicken einer Bitte gebraucht.
import { mitFrist } from './frist';

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
