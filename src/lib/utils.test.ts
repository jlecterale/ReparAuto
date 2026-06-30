import { getYoutubeId, getYoutubeEmbedUrl, isValidYoutubeUrl } from '@/lib/utils';

// The car-ad / workshop YouTube feature: accept the link forms a user is likely
// to paste and turn them into a privacy-friendly nocookie embed. The video id is
// the canonical 11-character YouTube id.
const ID = 'dQw4w9WgXcQ';

describe('getYoutubeId', () => {
  it('extracts the id from a standard watch URL', () => {
    expect(getYoutubeId(`https://www.youtube.com/watch?v=${ID}`)).toBe(ID);
  });

  it('extracts the id from a watch URL with extra query params before v', () => {
    expect(getYoutubeId(`https://www.youtube.com/watch?feature=share&v=${ID}`)).toBe(ID);
  });

  it('extracts the id from a youtu.be short link', () => {
    expect(getYoutubeId(`https://youtu.be/${ID}`)).toBe(ID);
  });

  it('extracts the id from an embed URL', () => {
    expect(getYoutubeId(`https://www.youtube.com/embed/${ID}`)).toBe(ID);
  });

  it('extracts the id from a shorts URL', () => {
    expect(getYoutubeId(`https://www.youtube.com/shorts/${ID}`)).toBe(ID);
  });

  it('extracts the id from a live URL', () => {
    expect(getYoutubeId(`https://www.youtube.com/live/${ID}`)).toBe(ID);
  });

  it('ignores surrounding whitespace', () => {
    expect(getYoutubeId(`  https://youtu.be/${ID}  `)).toBe(ID);
  });

  it('returns null for null, undefined and empty/blank input', () => {
    expect(getYoutubeId(null)).toBeNull();
    expect(getYoutubeId(undefined)).toBeNull();
    expect(getYoutubeId('')).toBeNull();
    expect(getYoutubeId('   ')).toBeNull();
  });

  it('returns null for a non-YouTube URL', () => {
    expect(getYoutubeId('https://vimeo.com/123456789')).toBeNull();
  });

  it('returns null when the id is the wrong length', () => {
    expect(getYoutubeId('https://youtu.be/tooShort')).toBeNull();
  });
});

describe('getYoutubeEmbedUrl', () => {
  it('builds a nocookie embed URL from a recognizable link', () => {
    expect(getYoutubeEmbedUrl(`https://www.youtube.com/watch?v=${ID}`)).toBe(
      `https://www.youtube-nocookie.com/embed/${ID}`,
    );
  });

  it('returns null for an unrecognizable link', () => {
    expect(getYoutubeEmbedUrl('https://example.com')).toBeNull();
    expect(getYoutubeEmbedUrl(null)).toBeNull();
  });
});

describe('isValidYoutubeUrl', () => {
  it('is true for a recognizable YouTube link', () => {
    expect(isValidYoutubeUrl(`https://youtu.be/${ID}`)).toBe(true);
  });

  it('is false for anything else', () => {
    expect(isValidYoutubeUrl('not a url')).toBe(false);
    expect(isValidYoutubeUrl(undefined)).toBe(false);
  });
});
