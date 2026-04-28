import { findPrinter, normalizePrinterName } from './lookup';

describe('normalizePrinterName', () => {
  it('lowercases and trims', () => {
    expect(normalizePrinterName('  X1 Carbon  ')).toBe('x1 carbon');
  });
  it('strips known producer prefixes', () => {
    expect(normalizePrinterName('Bambu Lab X1 Carbon')).toBe('x1 carbon');
    expect(normalizePrinterName('Original Prusa MK4S')).toBe('mk4s');
    expect(normalizePrinterName('Creality K1 Max')).toBe('k1 max');
  });
  it('strips trailing nozzle suffix', () => {
    expect(normalizePrinterName('Bambu Lab X1 Carbon 0.4 nozzle')).toBe('x1 carbon');
    expect(normalizePrinterName('Prusa MK4 0.6mm nozzle')).toBe('mk4');
  });
  it('collapses underscores and slashes to spaces', () => {
    expect(normalizePrinterName('X1/X1C')).toBe('x1 x1c');
    expect(normalizePrinterName('A1_mini')).toBe('a1 mini');
  });
});

describe('findPrinter', () => {
  it('matches BambuLab X1 Carbon by alias', () => {
    const r = findPrinter('Bambu Lab X1 Carbon 0.4 nozzle');
    expect(r?.id).toBe('bambulab-x1c');
  });
  it('matches Prusa MK4 by raw model', () => {
    expect(findPrinter('MK4')?.id).toBe('prusa-mk4');
  });
  it('matches Prusa MK4S as MK4 family', () => {
    expect(findPrinter('Original Prusa MK4S')?.id).toBe('prusa-mk4');
  });
  it('matches Bambu Lab P1S exactly', () => {
    expect(findPrinter('P1S')?.id).toBe('bambulab-p1s');
  });
  it('matches A1 mini before A1 (specificity)', () => {
    expect(findPrinter('Bambu Lab A1 mini')?.id).toBe('bambulab-a1-mini');
  });
  it('matches Voron 2.4 by partial', () => {
    expect(findPrinter('Voron 2.4')?.id).toBe('voron-2-4');
  });
  it('returns null for unknown printer', () => {
    expect(findPrinter('AcmeCo Whirlybird 9000')).toBeNull();
  });
  it('returns null for empty string', () => {
    expect(findPrinter('')).toBeNull();
  });
});
