export const SETTINGS_KEY = 'cost-slicer:settings:v1';
const VERSION = 1;

export type Currency = 'PLN' | 'USD' | 'EUR' | 'GBP';

export interface PersistedSettings {
  electricityCost: string;
  printerPower: string;
  filamentCost: string;
  currency: Currency;
  showDepreciation: boolean;
  printerCost: string;
  printerLifespan: string;
  selectedPrinterId: string | null;
}

export function loadSettings(): PersistedSettings | null {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.v === VERSION && parsed.data) {
      return parsed.data as PersistedSettings;
    }
    // Backward path: original write used flat object. Treat as v1 if shape matches.
    if (parsed && typeof parsed.electricityCost === 'string') {
      return parsed as PersistedSettings;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveSettings(s: PersistedSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ v: VERSION, data: s }));
  } catch {
    /* storage disabled or full — ignore */
  }
}
