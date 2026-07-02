/**
 * The draft photo store persists picked-but-not-yet-uploaded photo Files in
 * IndexedDB so a listing draft can restore them after a full page reload.
 * fake-indexeddb provides the IndexedDB implementation under jsdom.
 */
import { IDBFactory } from 'fake-indexeddb';
import { savePhotoFile, loadPhotoFiles, deletePhotoFiles } from '@/lib/draftPhotoStore';

const makeFile = (content: string, name = 'foto.jpg') =>
  new File([content], name, { type: 'image/jpeg' });

// jsdom's Blob lacks .arrayBuffer(); FileReader works everywhere.
const fileText = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });

describe('draftPhotoStore', () => {
  beforeEach(() => {
    // Fresh database per test — the store opens a connection per operation,
    // so swapping the factory fully isolates tests.
    globalThis.indexedDB = new IDBFactory();
  });

  it('returns an empty map when nothing was saved', async () => {
    const files = await loadPhotoFiles(['blob:a']);
    expect(files.size).toBe(0);
  });

  it('round-trips a photo file by key', async () => {
    await savePhotoFile('blob:a', makeFile('conteudo', 'frente.jpg'));
    const files = await loadPhotoFiles(['blob:a']);
    const file = files.get('blob:a');
    expect(file).toBeDefined();
    expect(file!.name).toBe('frente.jpg');
    expect(file!.type).toBe('image/jpeg');
    await expect(fileText(file!)).resolves.toBe('conteudo');
  });

  it('only returns the requested keys', async () => {
    await savePhotoFile('blob:a', makeFile('a'));
    await savePhotoFile('blob:b', makeFile('b'));
    const files = await loadPhotoFiles(['blob:b']);
    expect(files.size).toBe(1);
    expect(files.has('blob:b')).toBe(true);
  });

  it('deletes saved photos', async () => {
    await savePhotoFile('blob:a', makeFile('a'));
    await deletePhotoFiles(['blob:a']);
    const files = await loadPhotoFiles(['blob:a']);
    expect(files.size).toBe(0);
  });

  it('ignores null/undefined keys on delete', async () => {
    await expect(deletePhotoFiles([null, undefined, 'blob:missing'])).resolves.toBeUndefined();
  });

  it('drops entries older than the retention window', async () => {
    const realNow = Date.now();
    const nowSpy = jest.spyOn(Date, 'now');
    try {
      nowSpy.mockReturnValue(realNow - 31 * 24 * 60 * 60 * 1000);
      await savePhotoFile('blob:old', makeFile('velha'));
      nowSpy.mockReturnValue(realNow);
      await savePhotoFile('blob:new', makeFile('nova'));
      const files = await loadPhotoFiles(['blob:old', 'blob:new']);
      expect(files.has('blob:old')).toBe(false);
      expect(files.has('blob:new')).toBe(true);
    } finally {
      nowSpy.mockRestore();
    }
  });

  it('resolves gracefully when IndexedDB is unavailable', async () => {
    // @ts-expect-error — simulate a browser/context without IndexedDB.
    globalThis.indexedDB = undefined;
    await expect(savePhotoFile('blob:a', makeFile('a'))).resolves.toBeUndefined();
    await expect(loadPhotoFiles(['blob:a'])).resolves.toEqual(new Map());
    await expect(deletePhotoFiles(['blob:a'])).resolves.toBeUndefined();
  });
});
