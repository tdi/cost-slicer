import { resolvePower } from './power';
import { PrinterPreset } from './types';

const sample: PrinterPreset = {
  id: 'sample',
  producer: 'Test',
  model: 'Sample',
  aliases: ['Sample'],
  power: { Default: 100, PLA: 80, PETG: 90, ABS: 130 },
};

describe('resolvePower', () => {
  it('returns Default when material is null', () => {
    expect(resolvePower(sample, null)).toBe(100);
  });
  it('returns the per-material value when present', () => {
    expect(resolvePower(sample, 'PLA')).toBe(80);
    expect(resolvePower(sample, 'ABS')).toBe(130);
  });
  it('handles vendor-prefixed material names like "Bambu PLA Basic"', () => {
    expect(resolvePower(sample, 'Bambu PLA Basic')).toBe(80);
    expect(resolvePower(sample, 'Generic PETG')).toBe(90);
  });
  it('falls back to Default for unknown materials', () => {
    expect(resolvePower(sample, 'TPU')).toBe(100);
    expect(resolvePower(sample, 'wax')).toBe(100);
  });
  it('is case-insensitive', () => {
    expect(resolvePower(sample, 'pla')).toBe(80);
    expect(resolvePower(sample, 'pEtG')).toBe(90);
  });
});
