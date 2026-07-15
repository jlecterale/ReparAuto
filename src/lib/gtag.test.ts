import { reportConversion } from '@/lib/gtag';

// reportConversion is a thin gtag wrapper, but the "not configured yet" guard and
// the event shape are worth pinning down so a missing label never fires a bogus
// conversion and a real one always carries send_to.

describe('reportConversion', () => {
  let gtag: jest.Mock;

  beforeEach(() => {
    gtag = jest.fn();
    (window as unknown as { gtag: jest.Mock }).gtag = gtag;
  });

  afterEach(() => {
    delete (window as unknown as { gtag?: unknown }).gtag;
  });

  it('fires a conversion event with the given send_to label', () => {
    reportConversion('AW-786052925/abc123');
    expect(gtag).toHaveBeenCalledWith('event', 'conversion', {
      send_to: 'AW-786052925/abc123',
    });
  });

  it('forwards optional value and currency', () => {
    reportConversion('AW-786052925/abc123', { value: 1, currency: 'EUR' });
    expect(gtag).toHaveBeenCalledWith('event', 'conversion', {
      send_to: 'AW-786052925/abc123',
      value: 1,
      currency: 'EUR',
    });
  });

  it('does not fire when the label is still a placeholder', () => {
    reportConversion('AW-786052925/REPLACE_CONTACT_LABEL');
    expect(gtag).not.toHaveBeenCalled();
  });

  it('does not fire when the label is empty', () => {
    reportConversion('');
    expect(gtag).not.toHaveBeenCalled();
  });
});
