import { GUIDES, GUIDE_CATEGORIES, getGuideBySlug } from '@/data/guias';

describe('guides content integrity', () => {
  it('has at least four guides', () => {
    expect(GUIDES.length).toBeGreaterThanOrEqual(4);
  });

  it('uses unique, url-safe slugs', () => {
    const slugs = GUIDES.map((g) => g.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    slugs.forEach((slug) => expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/));
  });

  it('keeps meta descriptions within SEO bounds (50–160 chars)', () => {
    GUIDES.forEach((g) => {
      expect(g.description.length).toBeGreaterThanOrEqual(50);
      expect(g.description.length).toBeLessThanOrEqual(160);
    });
  });

  it('gives every guide a valid category, reading time and dated revision', () => {
    GUIDES.forEach((g) => {
      expect(Object.keys(GUIDE_CATEGORIES)).toContain(g.category);
      expect(g.readingMinutes).toBeGreaterThan(0);
      expect(Number.isNaN(Date.parse(g.updatedAt))).toBe(false);
    });
  });

  it('gives every guide an intro and non-empty sections', () => {
    GUIDES.forEach((g) => {
      expect(g.intro.length).toBeGreaterThan(0);
      expect(g.sections.length).toBeGreaterThanOrEqual(3);
      g.sections.forEach((section) => {
        expect(section.heading.trim()).not.toBe('');
        const hasContent =
          (section.paragraphs?.length ?? 0) > 0 || (section.bullets?.length ?? 0) > 0;
        expect(hasContent).toBe(true);
      });
    });
  });

  it('never mentions the internal project name in user-facing text', () => {
    const allText = JSON.stringify(GUIDES);
    expect(allText).not.toMatch(/ReparAuto/i);
  });
});

describe('getGuideBySlug', () => {
  it('finds a guide by its slug', () => {
    const first = GUIDES[0];
    expect(getGuideBySlug(first.slug)).toBe(first);
  });

  it('returns undefined for an unknown slug', () => {
    expect(getGuideBySlug('nao-existe')).toBeUndefined();
  });
});
