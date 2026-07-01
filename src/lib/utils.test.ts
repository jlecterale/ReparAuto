import { getYoutubeId, getYoutubeEmbedUrl, isValidYoutubeUrl, toggleInList, parsePositiveInt, formatMessageTime } from '@/lib/utils';

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

describe('toggleInList', () => {
  it('adds an item that is not in the list', () => {
    expect(toggleInList(['a', 'b'], 'c')).toEqual(['a', 'b', 'c']);
  });

  it('removes an item that is already in the list', () => {
    expect(toggleInList(['a', 'b', 'c'], 'b')).toEqual(['a', 'c']);
  });

  it('does not mutate the original list', () => {
    const original = ['a'];
    toggleInList(original, 'b');
    toggleInList(original, 'a');
    expect(original).toEqual(['a']);
  });

  it('works on an empty list', () => {
    expect(toggleInList([], 'x')).toEqual(['x']);
  });
});

describe('parsePositiveInt', () => {
  it('parses a positive integer string', () => {
    expect(parsePositiveInt('5')).toBe(5);
    expect(parsePositiveInt(' 120 ')).toBe(120);
  });

  it('returns null for empty or whitespace input', () => {
    expect(parsePositiveInt('')).toBeNull();
    expect(parsePositiveInt('   ')).toBeNull();
  });

  it('returns null for zero, negatives and non-numbers', () => {
    expect(parsePositiveInt('0')).toBeNull();
    expect(parsePositiveInt('-3')).toBeNull();
    expect(parsePositiveInt('abc')).toBeNull();
  });

  it('truncates decimals to an integer', () => {
    expect(parsePositiveInt('4.9')).toBe(4);
  });
});

// Chat message timestamps: WhatsApp-style compact display — time only for
// today, "Ontem" for yesterday, full date for anything older.
describe('formatMessageTime', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 6, 1, 15, 30)); // 01/07/2026 15:30 local
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows only the time for a message sent today', () => {
    expect(formatMessageTime(new Date(2026, 6, 1, 9, 5))).toBe('09:05');
  });

  it('marks a message sent yesterday with "Ontem"', () => {
    expect(formatMessageTime(new Date(2026, 5, 30, 22, 15))).toBe('Ontem, 22:15');
  });

  it('shows the full date for anything older than yesterday', () => {
    expect(formatMessageTime(new Date(2026, 5, 29, 8, 0))).toBe('29/06/2026, 08:00');
    expect(formatMessageTime(new Date(2025, 11, 24, 18, 45))).toBe('24/12/2025, 18:45');
  });

  it('accepts Firestore Timestamp-like objects', () => {
    const asDate = new Date(2026, 6, 1, 12, 0);
    expect(formatMessageTime({ toDate: () => asDate })).toBe('12:00');
    expect(formatMessageTime({ seconds: Math.floor(asDate.getTime() / 1000) })).toBe('12:00');
  });

  it('accepts ISO strings like the sibling date formatters', () => {
    expect(formatMessageTime('2026-07-01T12:00:00')).toBe('12:00');
  });

  it('returns empty for a missing timestamp (pending server write)', () => {
    expect(formatMessageTime(null)).toBe('');
    expect(formatMessageTime(undefined)).toBe('');
  });
});
