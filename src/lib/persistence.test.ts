import { loadSettings, saveSettings, SETTINGS_KEY, PersistedSettings } from './persistence';

const sample: PersistedSettings = {
  electricityCost: '1.36',
  printerPower: '0.2',
  filamentCost: '100',
  currency: 'PLN',
  showDepreciation: false,
  printerCost: '2800',
  printerLifespan: '5',
  selectedPrinterId: null,
};

beforeEach(() => localStorage.clear());

describe('persistence', () => {
  it('returns null when no settings stored', () => {
    expect(loadSettings()).toBeNull();
  });

  it('round-trips settings', () => {
    saveSettings(sample);
    expect(loadSettings()).toEqual(sample);
  });

  it('returns null on malformed JSON', () => {
    localStorage.setItem(SETTINGS_KEY, '{not json');
    expect(loadSettings()).toBeNull();
  });

  it('returns null on version mismatch', () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ v: 99, data: sample }));
    expect(loadSettings()).toBeNull();
  });

  it('does not throw if localStorage is disabled', () => {
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new Error('quota'); };
    expect(() => saveSettings(sample)).not.toThrow();
    Storage.prototype.setItem = orig;
  });
});
