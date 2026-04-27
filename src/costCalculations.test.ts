import { calculatePrintCost } from './costCalculations';

describe('calculatePrintCost', () => {
  it('computes electricity, filament, and zero depreciation when disabled', () => {
    const r = calculatePrintCost(120, 50, 1, 0.2, 100, false, 0, 0);
    expect(r.electricityCost).toBeCloseTo(0.4, 5);   // 2h * 0.2kW * 1 = 0.4
    expect(r.filamentCost).toBeCloseTo(5, 5);        // 50g/1000 * 100 = 5
    expect(r.depreciationCost).toBe(0);
    expect(r.totalCost).toBeCloseTo(5.4, 5);
  });

  it('includes depreciation when enabled', () => {
    const r = calculatePrintCost(60, 0, 0, 0, 0, true, 8760, 1);
    // 1 year = 8760h. Cost 8760, lifespan 1y → 1/h. 1h print → 1.
    expect(r.depreciationCost).toBeCloseTo(1, 5);
  });

  it('returns zeros for a zero-time, zero-weight job', () => {
    const r = calculatePrintCost(0, 0, 1.36, 0.2, 100, false, 0, 0);
    expect(r.totalCost).toBe(0);
  });

  it('throws when any numeric input is NaN', () => {
    expect(() =>
      calculatePrintCost(NaN, 50, 1, 0.2, 100, false, 0, 0),
    ).toThrow(/invalid number/i);
  });
});
