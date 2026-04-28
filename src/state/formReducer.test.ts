import { formReducer, initialState, FormState } from './formReducer';

describe('formReducer', () => {
  it('updates a single field', () => {
    const next = formReducer(initialState, { type: 'setField', field: 'filamentWeight', value: '42' });
    expect(next.filamentWeight).toBe('42');
  });

  it('hydrates settings from persistence without touching job fields', () => {
    const stateWithJob: FormState = { ...initialState, filamentWeight: '99' };
    const next = formReducer(stateWithJob, {
      type: 'hydrate',
      payload: {
        electricityCost: '0.30', printerPower: '0.15', filamentCost: '80',
        currency: 'USD', showDepreciation: true, printerCost: '1500', printerLifespan: '4',
        selectedPrinterId: null,
      },
    });
    expect(next.electricityCost).toBe('0.30');
    expect(next.currency).toBe('USD');
    expect(next.filamentWeight).toBe('99');
  });

  it('imports a parsed job, populating job fields and source', () => {
    const next = formReducer(initialState, {
      type: 'import',
      payload: {
        flavor: 'PrusaSlicer',
        printTime: { hours: 1, minutes: 23 },
        filamentWeightGrams: 47.2,
        filamentWeightEstimated: false,
        filamentType: 'PLA',
        printerModel: 'MK4',
        thumbnailDataUrl: null,
      },
    });
    expect(next.printTime).toEqual({ hours: 1, minutes: 23 });
    expect(next.filamentWeight).toBe('47.2');
    expect(next.filamentType).toBe('PLA');
    expect(next.printerModel).toBe('MK4');
    expect(next.importSource).toBe('PrusaSlicer');
  });

  it('clears selectedPrinterId when printerPower is manually edited', () => {
    const stateWithPreset: FormState = { ...initialState, printerPower: '0.105', selectedPrinterId: 'bambulab-x1c' };
    const next = formReducer(stateWithPreset, { type: 'setField', field: 'printerPower', value: '0.200' });
    expect(next.printerPower).toBe('0.200');
    expect(next.selectedPrinterId).toBeNull();
  });

  it('does not clear selectedPrinterId when other fields change', () => {
    const stateWithPreset: FormState = { ...initialState, selectedPrinterId: 'bambulab-x1c' };
    const next = formReducer(stateWithPreset, { type: 'setField', field: 'filamentCost', value: '120' });
    expect(next.selectedPrinterId).toBe('bambulab-x1c');
  });

  it('clearImport resets job-only fields', () => {
    const imported = formReducer(initialState, {
      type: 'import',
      payload: { flavor: 'PrusaSlicer', printTime: { hours: 1, minutes: 0 }, filamentWeightGrams: 10, filamentWeightEstimated: false, filamentType: null, printerModel: null, thumbnailDataUrl: null },
    });
    const cleared = formReducer(imported, { type: 'clearImport' });
    expect(cleared.importSource).toBeNull();
    expect(cleared.filamentWeight).toBe('');
    expect(cleared.printTime).toEqual({ hours: 0, minutes: 0 });
  });
});
