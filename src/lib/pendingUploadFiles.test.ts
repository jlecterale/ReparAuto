/**
 * pendingUploadFiles bridges the in-session Map of picked photo Files with the
 * IndexedDB draft photo store, so drafted photos survive a full page reload.
 */
import { IDBFactory } from 'fake-indexeddb';
import pendingUploadFiles, {
  registerPendingFile,
  releasePendingFiles,
  restoreDraftPhotos,
  isRestorableFoto,
} from '@/lib/pendingUploadFiles';

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

// jsdom does not implement object URLs.
let urlCounter = 0;
beforeAll(() => {
  URL.createObjectURL = jest.fn(() => `blob:mock-${++urlCounter}`);
  URL.revokeObjectURL = jest.fn();
});

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
  pendingUploadFiles.clear();
});

/** Wipes the in-session Map, as a full page reload would. */
const simulateReload = () => pendingUploadFiles.clear();

describe('registerPendingFile', () => {
  it('registers the file in the in-session Map', async () => {
    const file = makeFile('a');
    await registerPendingFile('blob:a', file);
    expect(pendingUploadFiles.get('blob:a')).toBe(file);
    expect(isRestorableFoto('blob:a')).toBe(true);
  });

  it('persists the file so it survives a reload', async () => {
    await registerPendingFile('blob:a', makeFile('persistida'));
    simulateReload();
    const { fotos, lostCount } = await restoreDraftPhotos(['blob:a']);
    expect(lostCount).toBe(0);
    expect(fotos).toHaveLength(1);
    const recovered = pendingUploadFiles.get(fotos[0]);
    expect(recovered).toBeDefined();
    await expect(fileText(recovered!)).resolves.toBe('persistida');
  });
});

describe('restoreDraftPhotos', () => {
  it('keeps non-blob entries (https URLs, emojis) as-is, in order', async () => {
    const saved = ['https://exemplo.com/a.jpg', '🚗'];
    const { fotos, lostCount } = await restoreDraftPhotos(saved);
    expect(fotos).toEqual(saved);
    expect(lostCount).toBe(0);
  });

  it('keeps live blob entries still present in the Map', async () => {
    const file = makeFile('viva');
    await registerPendingFile('blob:viva', file);
    const { fotos, lostCount } = await restoreDraftPhotos(['blob:viva']);
    expect(fotos).toEqual(['blob:viva']);
    expect(lostCount).toBe(0);
  });

  it('re-keys a recovered photo and preserves the original order', async () => {
    await registerPendingFile('blob:morta', makeFile('recuperada'));
    simulateReload();
    const saved = ['https://exemplo.com/a.jpg', 'blob:morta', '🚗'];
    const { fotos, lostCount } = await restoreDraftPhotos(saved);
    expect(lostCount).toBe(0);
    expect(fotos).toHaveLength(3);
    expect(fotos[0]).toBe('https://exemplo.com/a.jpg');
    expect(fotos[2]).toBe('🚗');
    expect(fotos[1]).toMatch(/^blob:/);
    expect(pendingUploadFiles.has(fotos[1])).toBe(true);
  });

  // Angle tags (vista 360) are keyed by photo string; the draft restore needs
  // the old → new pairing to move tags onto the re-keyed blob URLs.
  it('reports each re-keyed photo as a rename pair', async () => {
    await registerPendingFile('blob:morta', makeFile('recuperada'));
    simulateReload();
    const { fotos, renames } = await restoreDraftPhotos(['blob:morta', '🚗']);
    expect(renames).toEqual([{ from: 'blob:morta', to: fotos[0] }]);
  });

  it('reports no renames for pass-through and lost photos', async () => {
    await registerPendingFile('blob:viva', makeFile('viva'));
    const { renames } = await restoreDraftPhotos([
      'blob:viva',
      'blob:desconhecida',
      'https://exemplo.com/a.jpg',
    ]);
    expect(renames).toEqual([]);
  });

  it('counts photos it cannot recover and drops them', async () => {
    const { fotos, lostCount } = await restoreDraftPhotos(['blob:desconhecida', '🚗']);
    expect(fotos).toEqual(['🚗']);
    expect(lostCount).toBe(1);
  });

  it('keeps a recovered photo restorable on a subsequent reload', async () => {
    await registerPendingFile('blob:a', makeFile('duas-vezes'));
    simulateReload();
    const first = await restoreDraftPhotos(['blob:a']);
    simulateReload();
    const second = await restoreDraftPhotos(first.fotos);
    expect(second.lostCount).toBe(0);
    const recovered = pendingUploadFiles.get(second.fotos[0]);
    await expect(fileText(recovered!)).resolves.toBe('duas-vezes');
  });
});

describe('releasePendingFiles', () => {
  it('frees the in-session file and revokes its URL', async () => {
    await registerPendingFile('blob:a', makeFile('a'));
    await releasePendingFiles(['blob:a']);
    expect(pendingUploadFiles.has('blob:a')).toBe(false);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:a');
  });

  it('purges the persisted copy so a discarded draft cannot be recovered', async () => {
    await registerPendingFile('blob:a', makeFile('a'));
    await releasePendingFiles(['blob:a']);
    simulateReload();
    const { lostCount } = await restoreDraftPhotos(['blob:a']);
    expect(lostCount).toBe(1);
  });

  it('purges persisted copies of already-dead blob URLs (post-reload discard)', async () => {
    await registerPendingFile('blob:a', makeFile('a'));
    simulateReload();
    await releasePendingFiles(['blob:a']);
    const { lostCount } = await restoreDraftPhotos(['blob:a']);
    expect(lostCount).toBe(1);
  });

  it('ignores null/undefined and non-blob entries', async () => {
    await expect(releasePendingFiles([null, undefined, 'https://exemplo.com/a.jpg'])).resolves.toBeUndefined();
  });
});
