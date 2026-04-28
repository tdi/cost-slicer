import { printers } from './database';

describe('printer database', () => {
  it('has at least one BambuLab entry', () => {
    expect(printers.filter(p => p.producer === 'BambuLab').length).toBeGreaterThan(0);
  });

  it('every preset has a unique id', () => {
    const ids = printers.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every preset has a positive Default power value', () => {
    for (const p of printers) {
      expect(p.power.Default).toBeGreaterThan(0);
      expect(p.power.Default).toBeLessThan(1000); // sanity cap
    }
  });

  it('every preset has at least one alias', () => {
    for (const p of printers) {
      expect(p.aliases.length).toBeGreaterThan(0);
    }
  });

  it('all per-material power values are positive when present', () => {
    for (const p of printers) {
      for (const [, v] of Object.entries(p.power)) {
        if (v != null) {
          expect(v).toBeGreaterThan(0);
          expect(v).toBeLessThan(1000);
        }
      }
    }
  });
});
