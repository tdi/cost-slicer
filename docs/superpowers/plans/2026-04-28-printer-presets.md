# Printer Presets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace manual printer-power entry with a curated preset database — auto-fill power on G-code/.3mf import, plus a manual picker in Cost Settings — with material-aware values for BambuLab, Prusa, Creality, Voron, Anycubic, and Elegoo printers.

**Architecture:** Pure-data preset module (`src/printers/`) with a fuzzy-matching `findPrinter` function and a material-aware `resolvePower` function. UI: an MUI `Autocomplete` (grouped by producer) added to `SettingsCard` above the existing `printerPower` field; selecting a preset writes the resolved watts to state. On import, `App.tsx` runs `findPrinter` against the parsed `printerModel` and dispatches a power update before the existing import flow.

**Tech Stack:** React 18 + TypeScript + MUI v6 (Autocomplete). No new dependencies.

**Branch:** `feat/printer-presets` (already created off main).

---

## File Structure

**New files:**
- `src/printers/types.ts` — `PrinterPreset` interface, `MaterialKey` type.
- `src/printers/database.ts` — `printers: PrinterPreset[]` array.
- `src/printers/database.test.ts` — integrity tests (unique ids, valid power values).
- `src/printers/lookup.ts` — `findPrinter(name)` and `normalize(s)`.
- `src/printers/lookup.test.ts` — fuzzy match cases.
- `src/printers/power.ts` — `resolvePower(preset, material)`.
- `src/printers/power.test.ts` — material lookup + default fallback.
- `src/components/PrinterPicker.tsx` — Autocomplete component.

**Modified:**
- `src/state/formReducer.ts` — add `selectedPrinterId: string | null` field, clear it on manual `printerPower` edit.
- `src/App.tsx` — on import, run `findPrinter`/`resolvePower` and update power + selected id.
- `src/components/SettingsCard.tsx` — render `PrinterPicker` above `printerPower` NumberField; pipe new props.
- `src/lib/persistence.ts` — add `selectedPrinterId` to `PersistedSettings`.

**Removed:**
- `src/printerMatrix.ts` (superseded by `src/printers/database.ts`).

---

## Task 1: Preset types and BambuLab data

**Files:**
- Create: `src/printers/types.ts`
- Create: `src/printers/database.ts`
- Create: `src/printers/database.test.ts`

- [ ] **Step 1: Define types**

Create `src/printers/types.ts`:

```ts
export type MaterialKey = 'Default' | 'PLA' | 'PETG' | 'ABS' | 'PC' | 'TPU' | 'ASA' | 'NYLON';

export interface PrinterPreset {
  id: string;                                    // stable, kebab-case, unique
  producer: string;                              // group label
  model: string;                                 // display name
  aliases: string[];                             // strings found in gcode/3mf headers
  power: Partial<Record<MaterialKey, number>> & { Default: number }; // average steady-state watts
  enclosed?: boolean;                            // informational only
}
```

- [ ] **Step 2: Write failing integrity tests**

Create `src/printers/database.test.ts`:

```ts
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
```

- [ ] **Step 3: Run, expect failure (module missing)**

Run: `npm test -- --watchAll=false src/printers/database.test.ts`
Expected: cannot find module `./database`.

- [ ] **Step 4: Create the BambuLab section of the database**

Create `src/printers/database.ts`:

```ts
import { PrinterPreset } from './types';

export const printers: PrinterPreset[] = [
  // BambuLab — community measurements + manufacturer specs
  {
    id: 'bambulab-a1-mini',
    producer: 'BambuLab',
    model: 'A1 mini',
    aliases: ['A1 mini', 'A1mini', 'Bambu Lab A1 mini'],
    power: { Default: 78, PLA: 80, PETG: 75 },
  },
  {
    id: 'bambulab-a1',
    producer: 'BambuLab',
    model: 'A1',
    aliases: ['A1', 'Bambu Lab A1'],
    power: { Default: 105, PLA: 95, PETG: 100, ABS: 200, PC: 150 },
  },
  {
    id: 'bambulab-p1p',
    producer: 'BambuLab',
    model: 'P1P',
    aliases: ['P1P', 'Bambu Lab P1P'],
    power: { Default: 130, PLA: 110, PETG: 120, ABS: 170, PC: 160 },
  },
  {
    id: 'bambulab-p1s',
    producer: 'BambuLab',
    model: 'P1S',
    aliases: ['P1S', 'Bambu Lab P1S'],
    power: { Default: 125, PLA: 105, PETG: 115, ABS: 140, PC: 135 },
    enclosed: true,
  },
  {
    id: 'bambulab-x1c',
    producer: 'BambuLab',
    model: 'X1 Carbon',
    aliases: ['X1 Carbon', 'X1C', 'X1/X1C', 'Bambu Lab X1 Carbon', 'X1'],
    power: { Default: 125, PLA: 105, PETG: 115, ABS: 150, PC: 135 },
    enclosed: true,
  },
  {
    id: 'bambulab-x1e',
    producer: 'BambuLab',
    model: 'X1E',
    aliases: ['X1E', 'X1 Enterprise', 'Bambu Lab X1E'],
    power: { Default: 220, PLA: 185, PETG: 195, ABS: 260, PC: 230 },
    enclosed: true,
  },
  {
    id: 'bambulab-h2d',
    producer: 'BambuLab',
    model: 'H2D',
    aliases: ['H2D', 'Bambu Lab H2D'],
    power: { Default: 145, PLA: 130, PETG: 140, ABS: 200, PC: 180 },
    enclosed: true,
  },
];
```

- [ ] **Step 5: Run tests, all pass**

Run: `npm test -- --watchAll=false src/printers/database.test.ts`
Expected: 5 pass.

- [ ] **Step 6: Commit**

```bash
git add src/printers/types.ts src/printers/database.ts src/printers/database.test.ts
git commit -m "feat: add printer preset types and BambuLab database"
```

---

## Task 2: Add Prusa, Creality, Voron, Anycubic, Elegoo entries

**Files:**
- Modify: `src/printers/database.ts`

Real-world steady-state averages from community measurements. Manufacturer "max power" specs are nameplate ratings and are not useful for cost calculation; we want average current draw during a typical print at standard temperatures (PLA 215°C / 60°C bed).

- [ ] **Step 1: Append the remaining presets**

Open `src/printers/database.ts`. Append the following entries to the `printers` array (after the BambuLab block, before the closing `]`):

```ts
  // Prusa — community measurements (Original Prusa printers)
  {
    id: 'prusa-mini',
    producer: 'Prusa',
    model: 'MINI / MINI+',
    aliases: ['MINI', 'MINI+', 'Prusa MINI', 'Original Prusa MINI', 'Prusa MINI+'],
    power: { Default: 50, PLA: 40, PETG: 50, ABS: 80 },
  },
  {
    id: 'prusa-mk3s',
    producer: 'Prusa',
    model: 'MK3S+',
    aliases: ['MK3S', 'MK3S+', 'MK3', 'Prusa MK3S', 'Original Prusa MK3S+'],
    power: { Default: 90, PLA: 80, PETG: 90, ABS: 120 },
  },
  {
    id: 'prusa-mk4',
    producer: 'Prusa',
    model: 'MK4 / MK4S',
    aliases: ['MK4', 'MK4S', 'MK4IS', 'Prusa MK4', 'Original Prusa MK4', 'Original Prusa MK4S'],
    power: { Default: 115, PLA: 100, PETG: 110, ABS: 140 },
  },
  {
    id: 'prusa-xl',
    producer: 'Prusa',
    model: 'XL (single tool)',
    aliases: ['XL', 'Prusa XL', 'Original Prusa XL'],
    power: { Default: 165, PLA: 150, PETG: 160, ABS: 200 },
  },
  {
    id: 'prusa-xl-5tool',
    producer: 'Prusa',
    model: 'XL (5-tool)',
    aliases: ['XL 5-tool', 'XL 5T', 'Prusa XL 5T', 'Original Prusa XL 5-tool'],
    power: { Default: 245, PLA: 220, PETG: 230, ABS: 280 },
  },
  {
    id: 'prusa-core-one',
    producer: 'Prusa',
    model: 'CORE One',
    aliases: ['CORE One', 'CoreOne', 'Prusa CORE One', 'Original Prusa CORE One'],
    power: { Default: 150, PLA: 130, PETG: 140, ABS: 180, PC: 170 },
    enclosed: true,
  },

  // Creality
  {
    id: 'creality-ender3-v2',
    producer: 'Creality',
    model: 'Ender 3 V2 / Pro',
    aliases: ['Ender-3 V2', 'Ender 3 V2', 'Ender-3 Pro', 'Ender 3 Pro', 'Ender 3'],
    power: { Default: 125, PLA: 110, PETG: 120, ABS: 160 },
  },
  {
    id: 'creality-ender3-s1',
    producer: 'Creality',
    model: 'Ender 3 S1 series',
    aliases: ['Ender-3 S1', 'Ender 3 S1', 'Ender-3 S1 Pro', 'Ender-3 S1 Plus'],
    power: { Default: 150, PLA: 130, ABS: 180 },
  },
  {
    id: 'creality-k1',
    producer: 'Creality',
    model: 'K1 / K1C',
    aliases: ['K1', 'K1C', 'Creality K1', 'Creality K1C'],
    power: { Default: 160, PLA: 130, ABS: 200 },
    enclosed: true,
  },
  {
    id: 'creality-k1-max',
    producer: 'Creality',
    model: 'K1 Max',
    aliases: ['K1 Max', 'Creality K1 Max'],
    power: { Default: 230, PLA: 200, ABS: 280 },
    enclosed: true,
  },
  {
    id: 'creality-k2-plus',
    producer: 'Creality',
    model: 'K2 Plus',
    aliases: ['K2 Plus', 'Creality K2 Plus'],
    power: { Default: 260, PLA: 220, ABS: 320 },
    enclosed: true,
  },

  // Voron — community DIY/kit builds
  {
    id: 'voron-2-4',
    producer: 'Voron',
    model: 'Voron 2.4 (350mm)',
    aliases: ['Voron 2.4', 'Voron 2.4 350', 'V2.4'],
    power: { Default: 300, PLA: 250, PETG: 280, ABS: 350 },
    enclosed: true,
  },
  {
    id: 'voron-trident',
    producer: 'Voron',
    model: 'Voron Trident',
    aliases: ['Voron Trident', 'Trident'],
    power: { Default: 270, PLA: 220, PETG: 250, ABS: 320 },
    enclosed: true,
  },

  // Anycubic
  {
    id: 'anycubic-kobra-2',
    producer: 'Anycubic',
    model: 'Kobra 2 / 2 Pro / 2 Plus',
    aliases: ['Kobra 2', 'Kobra 2 Pro', 'Kobra 2 Plus', 'Anycubic Kobra 2'],
    power: { Default: 130, PLA: 110, PETG: 130 },
  },
  {
    id: 'anycubic-kobra-3',
    producer: 'Anycubic',
    model: 'Kobra 3',
    aliases: ['Kobra 3', 'Anycubic Kobra 3'],
    power: { Default: 140, PLA: 130, PETG: 150 },
  },

  // Elegoo
  {
    id: 'elegoo-neptune-4',
    producer: 'Elegoo',
    model: 'Neptune 4 / 4 Pro',
    aliases: ['Neptune 4', 'Neptune 4 Pro', 'Elegoo Neptune 4'],
    power: { Default: 150, PLA: 130, PETG: 150, ABS: 190 },
  },
  {
    id: 'elegoo-neptune-4-plus',
    producer: 'Elegoo',
    model: 'Neptune 4 Plus / Max',
    aliases: ['Neptune 4 Plus', 'Neptune 4 Max', 'Elegoo Neptune 4 Plus'],
    power: { Default: 210, PLA: 180, PETG: 210, ABS: 260 },
  },
```

- [ ] **Step 2: Run tests, all pass**

Run: `npm test -- --watchAll=false src/printers/database.test.ts`
Expected: 5 pass (more presets, same invariants).

- [ ] **Step 3: Commit**

```bash
git add src/printers/database.ts
git commit -m "feat: add Prusa, Creality, Voron, Anycubic, Elegoo presets"
```

---

## Task 3: Fuzzy lookup function

**Files:**
- Create: `src/printers/lookup.ts`
- Create: `src/printers/lookup.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/printers/lookup.test.ts`:

```ts
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
```

- [ ] **Step 2: Run, expect failure (module missing)**

Run: `npm test -- --watchAll=false src/printers/lookup.test.ts`

- [ ] **Step 3: Implement lookup**

Create `src/printers/lookup.ts`:

```ts
import { printers } from './database';
import { PrinterPreset } from './types';

const PRODUCER_PREFIXES = /\b(?:original prusa|prusa|bambu lab|bambulab|creality|anycubic|elegoo|voron)\b/g;

export function normalizePrinterName(input: string): string {
  return input
    .toLowerCase()
    .replace(PRODUCER_PREFIXES, '')
    .replace(/\s*\d+\.?\d*\s*(?:mm)?\s*nozzle\s*$/i, '')
    .replace(/[_/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function findPrinter(input: string): PrinterPreset | null {
  if (!input) return null;
  const norm = normalizePrinterName(input);
  if (!norm) return null;

  // Build candidates with normalized aliases, sorted longest-first for specificity.
  type Candidate = { preset: PrinterPreset; norm: string };
  const candidates: Candidate[] = [];
  for (const p of printers) {
    candidates.push({ preset: p, norm: normalizePrinterName(p.model) });
    for (const a of p.aliases) {
      candidates.push({ preset: p, norm: normalizePrinterName(a) });
    }
  }
  candidates.sort((a, b) => b.norm.length - a.norm.length);

  // Exact match first.
  for (const c of candidates) {
    if (c.norm === norm) return c.preset;
  }
  // Then substring match (input contains alias or vice versa).
  for (const c of candidates) {
    if (c.norm && (norm.includes(c.norm) || c.norm.includes(norm))) return c.preset;
  }
  return null;
}
```

- [ ] **Step 4: Run tests**

Run: `npm test -- --watchAll=false src/printers/lookup.test.ts`
Expected: 12 pass.

- [ ] **Step 5: Commit**

```bash
git add src/printers/lookup.ts src/printers/lookup.test.ts
git commit -m "feat: add fuzzy printer name lookup"
```

---

## Task 4: Material-aware power resolution

**Files:**
- Create: `src/printers/power.ts`
- Create: `src/printers/power.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/printers/power.test.ts`:

```ts
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
```

- [ ] **Step 2: Run, expect failure**

Run: `npm test -- --watchAll=false src/printers/power.test.ts`

- [ ] **Step 3: Implement**

Create `src/printers/power.ts`:

```ts
import { MaterialKey, PrinterPreset } from './types';

const MATERIAL_KEYS: MaterialKey[] = ['PLA', 'PETG', 'ABS', 'PC', 'TPU', 'ASA', 'NYLON'];

function extractMaterialKey(material: string): MaterialKey | null {
  const upper = material.toUpperCase();
  // Pick the first known material token that appears anywhere in the string,
  // preferring longer keys first (e.g. "NYLON" before "PLA" if both somehow present).
  const sorted = [...MATERIAL_KEYS].sort((a, b) => b.length - a.length);
  for (const key of sorted) {
    if (upper.includes(key)) return key;
  }
  return null;
}

export function resolvePower(preset: PrinterPreset, material: string | null): number {
  if (material) {
    const key = extractMaterialKey(material);
    if (key) {
      const watts = preset.power[key];
      if (watts != null) return watts;
    }
  }
  return preset.power.Default;
}
```

- [ ] **Step 4: Run tests**

Run: `npm test -- --watchAll=false src/printers/power.test.ts`
Expected: 5 pass.

- [ ] **Step 5: Commit**

```bash
git add src/printers/power.ts src/printers/power.test.ts
git commit -m "feat: add material-aware power resolver"
```

---

## Task 5: Persistence + reducer additions

**Files:**
- Modify: `src/lib/persistence.ts`
- Modify: `src/state/formReducer.ts`
- Modify: `src/state/formReducer.test.ts`

- [ ] **Step 1: Add `selectedPrinterId` to PersistedSettings**

In `src/lib/persistence.ts`, add to the `PersistedSettings` interface (after `printerLifespan`):

```ts
  selectedPrinterId: string | null;
```

(Final shape: same as before, with `selectedPrinterId: string | null` appended.)

- [ ] **Step 2: Update sample in persistence.test.ts**

Open `src/lib/persistence.test.ts`. Update the `sample` literal to add `selectedPrinterId: null`:

```ts
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
```

- [ ] **Step 3: Update FormState and initialState**

In `src/state/formReducer.ts`:

Add to `FormState` (after `importSource`):

```ts
  selectedPrinterId: string | null;
```

Add to `initialState` (after `importSource: null,`):

```ts
  selectedPrinterId: null,
```

In the `setField` case, when the field being set is `printerPower` AND the new value differs from the current value, clear `selectedPrinterId`. Replace the existing `setField` case body with:

```ts
    case 'setField': {
      const next = { ...state, [action.field]: action.value } as FormState;
      // Manually editing printerPower clears the picked preset.
      if (action.field === 'printerPower' && action.value !== state.printerPower) {
        next.selectedPrinterId = null;
      }
      return next;
    }
```

In the `clearImport` case body, leave `selectedPrinterId` alone (it's a setting, not a job field). No change needed there.

- [ ] **Step 4: Add a reducer test for the printer-id-clears behavior**

In `src/state/formReducer.test.ts`, add this test inside the existing `describe`:

```ts
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
```

- [ ] **Step 5: Run reducer + persistence tests**

Run: `npm test -- --watchAll=false src/state/formReducer.test.ts src/lib/persistence.test.ts`
Expected: all pass (6 reducer + 5 persistence).

- [ ] **Step 6: Commit**

```bash
git add src/lib/persistence.ts src/lib/persistence.test.ts src/state/formReducer.ts src/state/formReducer.test.ts
git commit -m "feat: track selectedPrinterId in state and persistence"
```

---

## Task 6: PrinterPicker component

**Files:**
- Create: `src/components/PrinterPicker.tsx`

- [ ] **Step 1: Implement PrinterPicker**

Create `src/components/PrinterPicker.tsx`:

```tsx
import { Autocomplete, Box, TextField, Typography } from '@mui/material';
import { printers } from '../printers/database';
import { PrinterPreset } from '../printers/types';

interface Props {
  selectedId: string | null;
  onSelect: (preset: PrinterPreset | null) => void;
}

const sortedPrinters = [...printers].sort((a, b) => {
  if (a.producer !== b.producer) return a.producer.localeCompare(b.producer);
  return a.model.localeCompare(b.model);
});

const PrinterPicker = ({ selectedId, onSelect }: Props) => {
  const value = sortedPrinters.find(p => p.id === selectedId) ?? null;

  return (
    <Autocomplete
      size="small"
      fullWidth
      options={sortedPrinters}
      groupBy={(p) => p.producer}
      getOptionLabel={(p) => p.model}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      value={value}
      onChange={(_, v) => onSelect(v)}
      renderInput={(params) => (
        <TextField {...params} label="Printer model" placeholder="Select to auto-fill power" />
      )}
      renderOption={(props, option) => (
        <Box component="li" {...props} key={option.id} sx={{ display: 'flex', justifyContent: 'space-between !important', gap: 2 }}>
          <Typography variant="body2">{option.model}</Typography>
          <Typography variant="caption" color="text.secondary">{option.power.Default} W avg</Typography>
        </Box>
      )}
      sx={{ mb: 1 }}
    />
  );
};

export default PrinterPicker;
```

- [ ] **Step 2: TypeScript check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/PrinterPicker.tsx
git commit -m "feat: add PrinterPicker autocomplete component"
```

---

## Task 7: Wire picker into SettingsCard, auto-detect into App.tsx

**Files:**
- Modify: `src/components/SettingsCard.tsx`
- Modify: `src/App.tsx`
- Delete: `src/printerMatrix.ts`

- [ ] **Step 1: Add PrinterPicker to SettingsCard props and UI**

Edit `src/components/SettingsCard.tsx`. Add to the imports:

```tsx
import PrinterPicker from './PrinterPicker';
import { PrinterPreset } from '../printers/types';
import { resolvePower } from '../printers/power';
```

Add two new props to the `Props` interface (after `onPrinterPowerChange`):

```ts
  selectedPrinterId: string | null;
  onPrinterSelect: (preset: PrinterPreset | null) => void;
  filamentType: string | null;
```

In the rendered JSX, place the `PrinterPicker` directly above the existing "Electricity rate"/"Printer power" Stack. Also wire the `onPrinterSelect` so that selecting a preset overwrites `printerPower` with the resolved kW. Replace the entire `<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>` block (the one with electricity + power) with:

```tsx
          <PrinterPicker
            selectedId={p.selectedPrinterId}
            onSelect={(preset) => {
              p.onPrinterSelect(preset);
              if (preset) {
                const watts = resolvePower(preset, p.filamentType);
                p.onPrinterPowerChange((watts / 1000).toFixed(3));
              }
            }}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <NumberField
              fullWidth
              label="Electricity rate"
              value={p.electricityCost}
              onChange={p.onElectricityCostChange}
              suffix={`${p.currency}/kWh`}
            />
            <NumberField
              fullWidth
              label="Printer power"
              value={p.printerPower}
              onChange={p.onPrinterPowerChange}
              suffix="kW"
            />
          </Stack>
```

- [ ] **Step 2: Update App.tsx wiring**

Open `src/App.tsx`. Add to the imports near the other gcode/printers imports:

```tsx
import { findPrinter } from './printers/lookup';
import { resolvePower } from './printers/power';
```

Pass three new props to `<SettingsCard ... />` (next to existing printer-related props):

```tsx
              selectedPrinterId={state.selectedPrinterId}
              onPrinterSelect={(preset) => dispatch({ type: 'setField', field: 'selectedPrinterId', value: preset?.id ?? null })}
              filamentType={state.filamentType}
```

Find the `FileDropZone`'s `onImport` prop. Replace its body so that, after the `import` action dispatch, we also try to auto-fill the printer power from the database. Replace this:

```tsx
              onImport={(job) => { setError(''); dispatch({ type: 'import', payload: job }); }}
```

with:

```tsx
              onImport={(job) => {
                setError('');
                dispatch({ type: 'import', payload: job });
                if (job.printerModel) {
                  const preset = findPrinter(job.printerModel);
                  if (preset) {
                    dispatch({ type: 'setField', field: 'selectedPrinterId', value: preset.id });
                    const watts = resolvePower(preset, job.filamentType);
                    dispatch({ type: 'setField', field: 'printerPower', value: (watts / 1000).toFixed(3) });
                    // setField above would have cleared selectedPrinterId; restore it.
                    dispatch({ type: 'setField', field: 'selectedPrinterId', value: preset.id });
                  }
                }
              }}
```

(Note: the third dispatch is intentional — `setField` for `printerPower` clears `selectedPrinterId` per Task 5's reducer logic, so we re-set it after the power update.)

Also update the `settingsFromState` helper to include the new field:

```tsx
const settingsFromState = (s: typeof initialState): PersistedSettings => ({
  electricityCost: s.electricityCost,
  printerPower: s.printerPower,
  filamentCost: s.filamentCost,
  currency: s.currency,
  showDepreciation: s.showDepreciation,
  printerCost: s.printerCost,
  printerLifespan: s.printerLifespan,
  selectedPrinterId: s.selectedPrinterId,
});
```

- [ ] **Step 3: Delete the old printerMatrix.ts**

Verify no references remain:

```bash
grep -rn "printerMatrix" src/ || echo "no references"
```

Expected: `no references`.

Then delete:

```bash
git rm src/printerMatrix.ts
```

- [ ] **Step 4: Full test suite**

Run: `CI=true npm test`
Expected: all suites pass.

- [ ] **Step 5: TypeScript check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: CI build**

Run: `CI=true npm run build`
Expected: build succeeds with no ESLint errors.

- [ ] **Step 7: Manual smoke test**

Run: `npm start`. In the browser:
- Open Cost Settings. Confirm "Printer model" picker is present, grouped by producer (BambuLab / Prusa / Creality / Voron / Anycubic / Elegoo).
- Pick "Bambu Lab P1S" → "Printer power" updates to `0.105` kW.
- Manually edit "Printer power" → picker switches back to empty.
- Drop `src/gcode/__fixtures__/prusaslicer.gcode` (printer_model = MK4) → picker shows "MK4 / MK4S" and power updates to `0.115` kW.
- Drop `src/gcode/__fixtures__/bambustudio.gcode` (printer_model = Bambu Lab X1 Carbon) → picker shows "X1 Carbon", power updates appropriately.
- Reload page → picker selection persists across reload.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: wire PrinterPicker into SettingsCard and auto-detect on import"
```

---

## Self-review

**Spec coverage:**
- BambuLab + Prusa + Creality + Voron + Anycubic + Elegoo data → Tasks 1, 2 ✅
- Material-aware (PLA/PETG/ABS/PC/Default) → Task 4, used in Tasks 6, 7 ✅
- Manual picker → Tasks 6, 7 ✅
- Auto-detect on import → Task 7 ✅
- Fuzzy alias matching ("MK4S" → MK4 family, "Bambu Lab X1 Carbon 0.4 nozzle" → X1C) → Task 3 ✅
- Persistence of picked preset → Task 5 ✅
- Manual power edit clears the preset → Task 5 ✅

**Placeholder scan:** None.

**Type consistency:** `PrinterPreset.power: Partial<Record<MaterialKey, number>> & { Default: number }`, used consistently across Tasks 1, 4, 6, 7. `findPrinter`, `resolvePower`, `normalizePrinterName` names match between tests and implementation. State field is `selectedPrinterId` everywhere.
