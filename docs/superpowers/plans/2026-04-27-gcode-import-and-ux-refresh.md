# Cost Slicer — G-code Import, UX Refresh, and SEO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add drag-drop G-code import (auto-fill print time/weight/printer/material) to Cost Slicer, refresh layout and theme, persist user settings, and add full SEO metadata.

**Architecture:** Client-side only CRA SPA. New `src/gcode/` module with pure parser + per-slicer profile registry. New presentational components (`FileDropZone`, `ResultCard`, `SettingsCard`) replace inline rendering in `App.tsx`. Form state migrated from sibling `useState` to a single `useReducer`. Settings persisted via a typed `localStorage` wrapper. SEO via `public/index.html` static tags + `react-helmet-async` for dynamic title.

**Tech Stack:** React 18 + TypeScript 4.9 + MUI v6 + react-scripts 5 + Jest/RTL + `react-helmet-async` (new dependency).

**Spec:** `docs/superpowers/specs/2026-04-27-gcode-import-and-ux-refresh-design.md`

---

## File Structure

**New files:**
- `src/gcode/types.ts` — `ParsedJob`, `ParseError`, `SlicerFlavor`, `RawMetadata`.
- `src/gcode/slicerProfiles.ts` — detector + extractor registry.
- `src/gcode/gcodeParser.ts` — `parseGcode(text)` orchestrator.
- `src/gcode/__fixtures__/prusaslicer.gcode`, `orcaslicer.gcode`, `bambustudio.gcode`, `cura.gcode`, `supersliceer.gcode`, `unknown.gcode`, `cura_length_only.gcode` — minimal real header/footer slices.
- `src/gcode/gcodeParser.test.ts` — table-driven tests.
- `src/lib/persistence.ts` — `loadSettings`, `saveSettings`.
- `src/lib/persistence.test.ts`.
- `src/components/FileDropZone.tsx`.
- `src/components/FileDropZone.test.tsx`.
- `src/components/ResultCard.tsx`.
- `src/components/ResultCard.test.tsx`.
- `src/components/SettingsCard.tsx`.
- `src/components/JobInputsCard.tsx`.
- `src/components/Footer.tsx`.
- `src/state/formReducer.ts` — `formReducer`, `initialState`, action types.
- `src/state/formReducer.test.ts`.
- `public/og-image.png` (1200×630 placeholder, replaced before ship).
- `public/robots.txt`.
- `public/sitemap.xml`.

**Modified:**
- `src/App.tsx` — orchestration only.
- `src/theme.ts` — terracotta accent, typography, shape tokens.
- `src/costCalculations.ts` — minor: NaN guards.
- `src/costCalculations.test.ts` (new).
- `src/index.tsx` — wrap with `HelmetProvider`.
- `public/index.html` — full SEO + JSON-LD.
- `public/manifest.json` — name, theme color.
- `package.json` — add `react-helmet-async`.

**Removed:**
- `src/PrinterSelector.tsx` (dead code, never imported).

---

## Task 1: Project hygiene — clean dead code, add calculator tests

**Files:**
- Delete: `src/PrinterSelector.tsx`
- Create: `src/costCalculations.test.ts`
- Modify: `src/costCalculations.ts` (NaN guards)

- [ ] **Step 1: Verify `PrinterSelector.tsx` is unused**

Run: `grep -rn "PrinterSelector" src/`
Expected: only `src/PrinterSelector.tsx` itself appears. If anything else, stop and reconcile.

- [ ] **Step 2: Delete the dead component**

```bash
git rm src/PrinterSelector.tsx
```

- [ ] **Step 3: Write failing tests for `calculatePrintCost`**

Create `src/costCalculations.test.ts`:

```ts
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
```

- [ ] **Step 4: Run tests, confirm the NaN test fails**

Run: `npm test -- --watchAll=false src/costCalculations.test.ts`
Expected: 3 pass, 1 fail (NaN guard not yet implemented).

- [ ] **Step 5: Add NaN guards to `calculatePrintCost`**

Replace `src/costCalculations.ts` body with:

```ts
export interface CostBreakdown {
  electricityCost: number;
  filamentCost: number;
  depreciationCost: number;
  totalCost: number;
}

const guard = (n: number, name: string): number => {
  if (!Number.isFinite(n)) {
    throw new Error(`Invalid number for ${name}.`);
  }
  return n;
};

export const calculatePrintCost = (
  printTimeMinutes: number,
  filamentWeightGrams: number,
  electricityCost: number,
  printerPower: number,
  filamentCost: number,
  showDepreciation: boolean,
  printerCost: number,
  printerLifespan: number,
): CostBreakdown => {
  const t = guard(printTimeMinutes, 'print time') / 60;
  const w = guard(filamentWeightGrams, 'filament weight');
  const ec = guard(electricityCost, 'electricity cost');
  const pp = guard(printerPower, 'printer power');
  const fc = guard(filamentCost, 'filament cost');

  const electricity = t * pp * ec;
  const filament = (w / 1000) * fc;

  let depreciation = 0;
  if (showDepreciation) {
    const pc = guard(printerCost, 'printer cost');
    const pl = guard(printerLifespan, 'printer lifespan');
    if (pl > 0) depreciation = (pc / (pl * 365 * 24)) * t;
  }

  return {
    electricityCost: electricity,
    filamentCost: filament,
    depreciationCost: depreciation,
    totalCost: electricity + filament + depreciation,
  };
};
```

- [ ] **Step 6: Run tests, all pass**

Run: `npm test -- --watchAll=false src/costCalculations.test.ts`
Expected: 4 pass.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: remove unused PrinterSelector and add calculator tests"
```

---

## Task 2: Persistence layer

**Files:**
- Create: `src/lib/persistence.ts`
- Create: `src/lib/persistence.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/persistence.test.ts`:

```ts
import { loadSettings, saveSettings, SETTINGS_KEY, PersistedSettings } from './persistence';

const sample: PersistedSettings = {
  electricityCost: '1.36',
  printerPower: '0.2',
  filamentCost: '100',
  currency: 'PLN',
  showDepreciation: false,
  printerCost: '2800',
  printerLifespan: '5',
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
```

- [ ] **Step 2: Run tests, expect failure**

Run: `npm test -- --watchAll=false src/lib/persistence.test.ts`
Expected: module not found.

- [ ] **Step 3: Implement persistence**

Create `src/lib/persistence.ts`:

```ts
export const SETTINGS_KEY = 'cost-slicer:settings:v1';
const VERSION = 1;

export type Currency = 'PLN' | 'USD' | 'EUR';

export interface PersistedSettings {
  electricityCost: string;
  printerPower: string;
  filamentCost: string;
  currency: Currency;
  showDepreciation: boolean;
  printerCost: string;
  printerLifespan: string;
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
```

- [ ] **Step 4: Run tests, all pass**

Run: `npm test -- --watchAll=false src/lib/persistence.test.ts`
Expected: 5 pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/persistence.ts src/lib/persistence.test.ts
git commit -m "feat: add typed localStorage settings persistence"
```

---

## Task 3: Form reducer

**Files:**
- Create: `src/state/formReducer.ts`
- Create: `src/state/formReducer.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/state/formReducer.test.ts`:

```ts
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
      },
    });
    expect(next.printTime).toEqual({ hours: 1, minutes: 23 });
    expect(next.filamentWeight).toBe('47.2');
    expect(next.filamentType).toBe('PLA');
    expect(next.printerModel).toBe('MK4');
    expect(next.importSource).toBe('PrusaSlicer');
  });

  it('clearImport resets job-only fields', () => {
    const imported = formReducer(initialState, {
      type: 'import',
      payload: { flavor: 'PrusaSlicer', printTime: { hours: 1, minutes: 0 }, filamentWeightGrams: 10, filamentWeightEstimated: false, filamentType: null, printerModel: null },
    });
    const cleared = formReducer(imported, { type: 'clearImport' });
    expect(cleared.importSource).toBeNull();
    expect(cleared.filamentWeight).toBe('');
    expect(cleared.printTime).toEqual({ hours: 0, minutes: 0 });
  });
});
```

- [ ] **Step 2: Run tests, expect failure (module missing)**

Run: `npm test -- --watchAll=false src/state/formReducer.test.ts`
Expected: cannot find module.

- [ ] **Step 3: Implement reducer**

Create `src/state/formReducer.ts`:

```ts
import { Currency, PersistedSettings } from '../lib/persistence';
import { ParsedJob, SlicerFlavor } from '../gcode/types';

export interface FormState {
  printTime: { hours: number; minutes: number };
  filamentWeight: string;
  filamentType: string | null;
  printerModel: string | null;
  filamentWeightEstimated: boolean;
  electricityCost: string;
  printerPower: string;
  filamentCost: string;
  currency: Currency;
  showDepreciation: boolean;
  printerCost: string;
  printerLifespan: string;
  importSource: SlicerFlavor | null;
}

export const initialState: FormState = {
  printTime: { hours: 0, minutes: 0 },
  filamentWeight: '',
  filamentType: null,
  printerModel: null,
  filamentWeightEstimated: false,
  electricityCost: '1.36',
  printerPower: '0.200',
  filamentCost: '100',
  currency: 'PLN',
  showDepreciation: false,
  printerCost: '2800',
  printerLifespan: '5',
  importSource: null,
};

export type FormAction =
  | { type: 'setField'; field: keyof FormState; value: FormState[keyof FormState] }
  | { type: 'setPrintTime'; value: { hours: number; minutes: number } }
  | { type: 'hydrate'; payload: PersistedSettings }
  | { type: 'import'; payload: ParsedJob }
  | { type: 'clearImport' };

export function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'setField':
      return { ...state, [action.field]: action.value } as FormState;
    case 'setPrintTime':
      return { ...state, printTime: action.value };
    case 'hydrate':
      return { ...state, ...action.payload };
    case 'import':
      return {
        ...state,
        printTime: action.payload.printTime ?? state.printTime,
        filamentWeight:
          action.payload.filamentWeightGrams != null
            ? String(action.payload.filamentWeightGrams)
            : state.filamentWeight,
        filamentWeightEstimated: action.payload.filamentWeightEstimated,
        filamentType: action.payload.filamentType,
        printerModel: action.payload.printerModel,
        importSource: action.payload.flavor,
      };
    case 'clearImport':
      return {
        ...state,
        printTime: { hours: 0, minutes: 0 },
        filamentWeight: '',
        filamentType: null,
        printerModel: null,
        filamentWeightEstimated: false,
        importSource: null,
      };
  }
}
```

Note: Task 4 creates the `ParsedJob` and `SlicerFlavor` types this reducer imports. Tests in this task pass because `tsc` only checks during the test run; jest uses Babel and resolves types at runtime. If TypeScript fails this task standalone, run Task 4 first or stub the types.

- [ ] **Step 4: Stub types to keep this task standalone**

Create `src/gcode/types.ts` (will be expanded in Task 4):

```ts
export type SlicerFlavor =
  | 'PrusaSlicer' | 'SuperSlicer' | 'OrcaSlicer' | 'BambuStudio' | 'Cura';

export interface ParsedJob {
  flavor: SlicerFlavor;
  printTime: { hours: number; minutes: number } | null;
  filamentWeightGrams: number | null;
  filamentWeightEstimated: boolean;
  filamentType: string | null;
  printerModel: string | null;
}

export type ParseErrorKind =
  | 'unsupported_slicer' | 'empty_file' | 'too_large' | 'read_failed';

export interface ParseError {
  kind: ParseErrorKind;
  message: string;
}
```

- [ ] **Step 5: Run reducer tests**

Run: `npm test -- --watchAll=false src/state/formReducer.test.ts`
Expected: 4 pass.

- [ ] **Step 6: Commit**

```bash
git add src/state/ src/gcode/types.ts
git commit -m "feat: add form reducer and gcode types"
```

---

## Task 4: G-code parser fixtures

**Files:**
- Create: `src/gcode/__fixtures__/prusaslicer.gcode`
- Create: `src/gcode/__fixtures__/orcaslicer.gcode`
- Create: `src/gcode/__fixtures__/bambustudio.gcode`
- Create: `src/gcode/__fixtures__/cura.gcode`
- Create: `src/gcode/__fixtures__/cura_length_only.gcode`
- Create: `src/gcode/__fixtures__/superslicer.gcode`
- Create: `src/gcode/__fixtures__/unknown.gcode`

These are tiny synthetic files using only the comments the parser will key on. Real slicer headers contain hundreds of lines; we keep just the ones that matter.

- [ ] **Step 1: Create PrusaSlicer fixture**

`src/gcode/__fixtures__/prusaslicer.gcode`:

```
; generated by PrusaSlicer 2.7.4 on 2026-01-15 at 12:34:56
; printer_model = MK4
; filament_type = PLA
G28 ; home
M104 S210
; filament used [g] = 47.2
; estimated printing time (normal mode) = 1h 23m 45s
M84
```

- [ ] **Step 2: Create OrcaSlicer fixture**

`src/gcode/__fixtures__/orcaslicer.gcode`:

```
; generated by OrcaSlicer 2.1.1 on 2026-02-01
; printer_model = Voron 2.4
; filament_type = PETG;PETG
G28
; filament used [g] = 12.5;3.0
; estimated printing time (normal mode) = 2h 5m 10s
```

- [ ] **Step 3: Create BambuStudio fixture**

`src/gcode/__fixtures__/bambustudio.gcode`:

```
; HEADER_BLOCK_START
; generated by BambuStudio 1.9.0
; printer_model = Bambu Lab X1 Carbon
; filament_settings_id = "Bambu PLA Basic"
; total estimated time: 45m 12s
; total filament weight [g]: 22.4
; HEADER_BLOCK_END
G28
```

- [ ] **Step 4: Create Cura fixture (weight present)**

`src/gcode/__fixtures__/cura.gcode`:

```
;FLAVOR:Marlin
;Generated with Cura_SteamEngine 5.6.0
;TARGET_MACHINE.NAME:Ender 3
;TIME:4567
;Filament used: 1.234m
;Filament type:PLA
;Filament weight:30.5
G28
```

- [ ] **Step 5: Create Cura fixture (length only, density estimate)**

`src/gcode/__fixtures__/cura_length_only.gcode`:

```
;FLAVOR:Marlin
;Generated with Cura_SteamEngine 5.0.0
;TARGET_MACHINE.NAME:Prusa Mini
;TIME:1800
;Filament used: 1.000m
;Filament type:PLA
G28
```

- [ ] **Step 6: Create SuperSlicer fixture**

`src/gcode/__fixtures__/superslicer.gcode`:

```
; generated by SuperSlicer 2.5.59 on 2025-12-01
; printer_model = MK3S
; filament_type = ABS
; filament used [g] = 18.3
; estimated printing time (normal mode) = 35m 0s
```

- [ ] **Step 7: Create unknown-slicer fixture**

`src/gcode/__fixtures__/unknown.gcode`:

```
; some random gcode
G28
G1 X10
```

- [ ] **Step 8: Commit fixtures**

```bash
git add src/gcode/__fixtures__/
git commit -m "test: add gcode parser fixtures for each slicer"
```

---

## Task 5: G-code parser implementation

**Files:**
- Create: `src/gcode/slicerProfiles.ts`
- Create: `src/gcode/gcodeParser.ts`
- Create: `src/gcode/gcodeParser.test.ts`
- Modify: `src/gcode/types.ts` (already created in Task 3 — no changes needed)

- [ ] **Step 1: Write failing parser tests**

Create `src/gcode/gcodeParser.test.ts`:

```ts
import fs from 'fs';
import path from 'path';
import { parseGcode } from './gcodeParser';
import { ParsedJob, ParseError } from './types';

const fixture = (name: string) =>
  fs.readFileSync(path.join(__dirname, '__fixtures__', name), 'utf8');

const ok = (r: ParsedJob | ParseError): ParsedJob => {
  if ('kind' in r) throw new Error(`expected ParsedJob, got error ${r.kind}`);
  return r;
};

describe('parseGcode', () => {
  it('parses PrusaSlicer headers', () => {
    const r = ok(parseGcode(fixture('prusaslicer.gcode')));
    expect(r.flavor).toBe('PrusaSlicer');
    expect(r.printTime).toEqual({ hours: 1, minutes: 23 });
    expect(r.filamentWeightGrams).toBeCloseTo(47.2, 5);
    expect(r.filamentType).toBe('PLA');
    expect(r.printerModel).toBe('MK4');
    expect(r.filamentWeightEstimated).toBe(false);
  });

  it('parses OrcaSlicer with multi-extruder weight summing', () => {
    const r = ok(parseGcode(fixture('orcaslicer.gcode')));
    expect(r.flavor).toBe('OrcaSlicer');
    expect(r.filamentWeightGrams).toBeCloseTo(15.5, 5); // 12.5 + 3.0
    expect(r.printTime).toEqual({ hours: 2, minutes: 5 });
  });

  it('parses BambuStudio headers', () => {
    const r = ok(parseGcode(fixture('bambustudio.gcode')));
    expect(r.flavor).toBe('BambuStudio');
    expect(r.printTime).toEqual({ hours: 0, minutes: 45 });
    expect(r.filamentWeightGrams).toBeCloseTo(22.4, 5);
    expect(r.printerModel).toBe('Bambu Lab X1 Carbon');
    expect(r.filamentType).toBe('Bambu PLA Basic');
  });

  it('parses Cura with explicit weight', () => {
    const r = ok(parseGcode(fixture('cura.gcode')));
    expect(r.flavor).toBe('Cura');
    expect(r.printTime).toEqual({ hours: 1, minutes: 16 }); // 4567s = 76.1m
    expect(r.filamentWeightGrams).toBeCloseTo(30.5, 5);
    expect(r.printerModel).toBe('Ender 3');
    expect(r.filamentWeightEstimated).toBe(false);
  });

  it('parses Cura length-only and flags weight as estimated', () => {
    const r = ok(parseGcode(fixture('cura_length_only.gcode')));
    expect(r.filamentWeightGrams).not.toBeNull();
    expect(r.filamentWeightEstimated).toBe(true);
    // 1.000m of 1.75mm PLA at 1.24 g/cm³ ≈ 2.98g
    expect(r.filamentWeightGrams).toBeCloseTo(2.98, 1);
  });

  it('parses SuperSlicer', () => {
    const r = ok(parseGcode(fixture('superslicer.gcode')));
    expect(r.flavor).toBe('SuperSlicer');
    expect(r.printTime).toEqual({ hours: 0, minutes: 35 });
    expect(r.filamentWeightGrams).toBeCloseTo(18.3, 5);
  });

  it('returns unsupported_slicer error for unknown gcode', () => {
    const r = parseGcode(fixture('unknown.gcode'));
    expect('kind' in r && r.kind).toBe('unsupported_slicer');
  });

  it('returns empty_file error for empty input', () => {
    const r = parseGcode('');
    expect('kind' in r && r.kind).toBe('empty_file');
  });

  it('returns too_large error for >50MB strings', () => {
    const r = parseGcode('x'.repeat(50 * 1024 * 1024 + 1));
    expect('kind' in r && r.kind).toBe('too_large');
  });
});
```

- [ ] **Step 2: Run tests, expect failure (module missing)**

Run: `npm test -- --watchAll=false src/gcode/gcodeParser.test.ts`
Expected: cannot find module `./gcodeParser`.

- [ ] **Step 3: Implement slicer profiles**

Create `src/gcode/slicerProfiles.ts`:

```ts
import { ParsedJob, SlicerFlavor } from './types';

const FILAMENT_DENSITY: Record<string, number> = {
  PLA: 1.24, PETG: 1.27, ABS: 1.04, PC: 1.20, TPU: 1.21, ASA: 1.07, NYLON: 1.14,
};
const DEFAULT_DENSITY = 1.24;
const FILAMENT_DIAMETER_MM = 1.75;

const minutesFromDhms = (s: string): number => {
  let total = 0;
  const m = s.match(/(?:(\d+)d)?\s*(?:(\d+)h)?\s*(?:(\d+)m)?\s*(?:(\d+(?:\.\d+)?)s)?/);
  if (!m) return 0;
  total += (parseInt(m[1] || '0', 10)) * 24 * 60;
  total += (parseInt(m[2] || '0', 10)) * 60;
  total += (parseInt(m[3] || '0', 10));
  total += Math.floor(parseFloat(m[4] || '0') / 60);
  return total;
};

const toHM = (mins: number) => ({ hours: Math.floor(mins / 60), minutes: mins % 60 });

const sumFloats = (raw: string): number =>
  raw.split(/[;,]/).map(s => parseFloat(s.trim())).filter(n => !isNaN(n)).reduce((a, b) => a + b, 0);

const firstMatch = (text: string, re: RegExp): string | null => {
  const m = text.match(re);
  return m ? m[1].trim() : null;
};

const stripQuotes = (s: string) => s.replace(/^"(.*)"$/, '$1');

export interface SlicerProfile {
  flavor: SlicerFlavor;
  detect: (head: string) => boolean;
  extract: (text: string) => Omit<ParsedJob, 'flavor'>;
}

const prusaLike = (flavor: SlicerFlavor, signature: RegExp): SlicerProfile => ({
  flavor,
  detect: (head) => signature.test(head),
  extract: (text) => {
    const timeStr = firstMatch(text, /;\s*estimated printing time \(normal mode\)\s*=\s*(.+)/i);
    const weightStr = firstMatch(text, /;\s*filament used \[g\]\s*=\s*(.+)/i);
    const type = firstMatch(text, /;\s*filament_type\s*=\s*(.+)/i);
    const printer = firstMatch(text, /;\s*printer_model\s*=\s*(.+)/i);
    const totalMins = timeStr ? minutesFromDhms(timeStr) : null;
    return {
      printTime: totalMins != null ? toHM(totalMins) : null,
      filamentWeightGrams: weightStr ? sumFloats(weightStr) : null,
      filamentWeightEstimated: false,
      filamentType: type ? type.split(/[;,]/)[0].trim() : null,
      printerModel: printer,
    };
  },
});

const bambu: SlicerProfile = {
  flavor: 'BambuStudio',
  detect: (head) => /^; HEADER_BLOCK_START/m.test(head) || /generated by BambuStudio/i.test(head),
  extract: (text) => {
    const timeStr = firstMatch(text, /;\s*total estimated time:\s*(.+)/i);
    const weightStr = firstMatch(text, /;\s*total filament weight \[g\]:\s*(.+)/i);
    const type = firstMatch(text, /;\s*filament_settings_id\s*=\s*(.+)/i);
    const printer = firstMatch(text, /;\s*printer_model\s*=\s*(.+)/i);
    const totalMins = timeStr ? minutesFromDhms(timeStr) : null;
    return {
      printTime: totalMins != null ? toHM(totalMins) : null,
      filamentWeightGrams: weightStr ? parseFloat(weightStr) : null,
      filamentWeightEstimated: false,
      filamentType: type ? stripQuotes(type.split(/[;,]/)[0].trim()) : null,
      printerModel: printer,
    };
  },
};

const cura: SlicerProfile = {
  flavor: 'Cura',
  detect: (head) => /^;Generated with Cura_SteamEngine/m.test(head) || /^;FLAVOR:/m.test(head),
  extract: (text) => {
    const timeS = firstMatch(text, /;TIME:(\d+)/);
    const weightDirect = firstMatch(text, /;Filament weight:([\d.]+)/i);
    const lengthM = firstMatch(text, /;Filament used:\s*([\d.]+)m/i);
    const type = firstMatch(text, /;Filament type:(.+)/i);
    const printer = firstMatch(text, /;TARGET_MACHINE\.NAME:(.+)/i);

    const totalMins = timeS ? Math.floor(parseInt(timeS, 10) / 60) : null;

    let weight: number | null = null;
    let estimated = false;
    if (weightDirect) {
      weight = parseFloat(weightDirect);
    } else if (lengthM) {
      const lenMm = parseFloat(lengthM) * 1000;
      const radius = FILAMENT_DIAMETER_MM / 2;
      const volumeCm3 = (Math.PI * radius * radius * lenMm) / 1000;
      const density = (type && FILAMENT_DENSITY[type.toUpperCase().trim()]) || DEFAULT_DENSITY;
      weight = volumeCm3 * density;
      estimated = true;
    }

    return {
      printTime: totalMins != null ? toHM(totalMins) : null,
      filamentWeightGrams: weight,
      filamentWeightEstimated: estimated,
      filamentType: type ? type.trim() : null,
      printerModel: printer,
    };
  },
};

export const profiles: SlicerProfile[] = [
  bambu, // most specific signature first
  prusaLike('OrcaSlicer', /generated by OrcaSlicer/i),
  prusaLike('SuperSlicer', /generated by SuperSlicer/i),
  prusaLike('PrusaSlicer', /generated by PrusaSlicer/i),
  cura,
];
```

- [ ] **Step 4: Implement parser orchestrator**

Create `src/gcode/gcodeParser.ts`:

```ts
import { ParsedJob, ParseError } from './types';
import { profiles } from './slicerProfiles';

const MAX_BYTES = 50 * 1024 * 1024;
const HEAD_LINES = 300;
const TAIL_LINES = 300;

const sliceHeadAndTail = (text: string): string => {
  const lines = text.split('\n');
  if (lines.length <= HEAD_LINES + TAIL_LINES) return text;
  return [
    ...lines.slice(0, HEAD_LINES),
    ...lines.slice(-TAIL_LINES),
  ].join('\n');
};

export function parseGcode(text: string): ParsedJob | ParseError {
  if (text.length === 0) return { kind: 'empty_file', message: 'File is empty.' };
  if (text.length > MAX_BYTES) return { kind: 'too_large', message: 'File exceeds 50 MB.' };

  const sliced = sliceHeadAndTail(text);
  const head = sliced.split('\n').slice(0, HEAD_LINES).join('\n');

  const profile = profiles.find(p => p.detect(head));
  if (!profile) {
    return {
      kind: 'unsupported_slicer',
      message: 'Couldn\'t identify the slicer. Supported: PrusaSlicer, OrcaSlicer, BambuStudio, SuperSlicer, Cura.',
    };
  }

  return { flavor: profile.flavor, ...profile.extract(sliced) };
}
```

- [ ] **Step 5: Run tests**

Run: `npm test -- --watchAll=false src/gcode/gcodeParser.test.ts`
Expected: 9 pass.

- [ ] **Step 6: Commit**

```bash
git add src/gcode/gcodeParser.ts src/gcode/slicerProfiles.ts src/gcode/gcodeParser.test.ts
git commit -m "feat: add gcode parser with per-slicer profile registry"
```

---

## Task 6: Theme refresh

**Files:**
- Modify: `src/theme.ts`

- [ ] **Step 1: Replace theme**

Replace `src/theme.ts` contents:

```ts
import { createTheme, ThemeOptions } from '@mui/material/styles';

const ACCENT = '#D97757';
const ACCENT_DARK = '#B85F44';

export const buildTheme = (mode: 'light' | 'dark'): ThemeOptions => ({
  palette: {
    mode,
    primary: { main: mode === 'dark' ? ACCENT_DARK : ACCENT, contrastText: '#ffffff' },
    background: mode === 'dark'
      ? { default: '#121212', paper: '#1c1c1c' }
      : { default: '#fafaf7', paper: '#ffffff' },
  },
  shape: { borderRadius: 12 },
  typography: {
    h1: { fontSize: '2.25rem', fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontSize: '1.25rem', fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiPaper: { defaultProps: { elevation: 1 } },
    MuiButton: { styleOverrides: { root: { borderRadius: 10 } } },
    MuiTextField: { defaultProps: { variant: 'outlined', size: 'small' } },
  },
});

export const themeForMode = (mode: 'light' | 'dark') => createTheme(buildTheme(mode));
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/theme.ts
git commit -m "feat: terracotta accent and shape/typography tokens"
```

---

## Task 7: ResultCard component

**Files:**
- Create: `src/components/ResultCard.tsx`
- Create: `src/components/ResultCard.test.tsx`

- [ ] **Step 1: Write component test**

Create `src/components/ResultCard.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResultCard from './ResultCard';

const costs = { electricityCost: 0.4, filamentCost: 5, depreciationCost: 1, totalCost: 6.4 };

test('renders three stat tiles and total', () => {
  render(<ResultCard costs={costs} currency="PLN" showDepreciation grams={50} hours={2} />);
  expect(screen.getByText(/6\.40/)).toBeInTheDocument();
  expect(screen.getByText(/Electricity/i)).toBeInTheDocument();
  expect(screen.getByText(/Filament/i)).toBeInTheDocument();
  expect(screen.getByText(/Depreciation/i)).toBeInTheDocument();
});

test('hides depreciation tile when disabled', () => {
  render(<ResultCard costs={{ ...costs, depreciationCost: 0 }} currency="PLN" showDepreciation={false} grams={50} hours={2} />);
  expect(screen.queryByText(/Depreciation/i)).not.toBeInTheDocument();
});

test('copy summary writes formatted text to clipboard', async () => {
  const writeText = jest.fn().mockResolvedValue(undefined);
  Object.assign(navigator, { clipboard: { writeText } });
  render(<ResultCard costs={costs} currency="PLN" showDepreciation grams={50} hours={2} />);
  await userEvent.click(screen.getByRole('button', { name: /copy summary/i }));
  expect(writeText).toHaveBeenCalledWith(expect.stringContaining('Total: 6.40 PLN'));
});
```

- [ ] **Step 2: Run, expect failure**

Run: `npm test -- --watchAll=false src/components/ResultCard.test.tsx`
Expected: cannot find module.

- [ ] **Step 3: Implement ResultCard**

Create `src/components/ResultCard.tsx`:

```tsx
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { CostBreakdown } from '../costCalculations';

interface Props {
  costs: CostBreakdown;
  currency: string;
  showDepreciation: boolean;
  grams: number;
  hours: number;
}

const Tile = ({ label, value, currency }: { label: string; value: number; currency: string }) => (
  <Paper sx={{ p: 2, flex: 1, minWidth: 0 }} variant="outlined">
    <Typography variant="caption" color="text.secondary">{label}</Typography>
    <Typography variant="h6" sx={{ mt: 0.5 }}>{value.toFixed(2)} {currency}</Typography>
  </Paper>
);

const ResultCard = ({ costs, currency, showDepreciation, grams, hours }: Props) => {
  const perGram = grams > 0 ? costs.totalCost / grams : 0;
  const perHour = hours > 0 ? costs.totalCost / hours : 0;

  const onCopy = () => {
    const lines = [
      `Cost Slicer summary`,
      `Total: ${costs.totalCost.toFixed(2)} ${currency}`,
      `Electricity: ${costs.electricityCost.toFixed(2)} ${currency}`,
      `Filament: ${costs.filamentCost.toFixed(2)} ${currency}`,
      ...(showDepreciation ? [`Depreciation: ${costs.depreciationCost.toFixed(2)} ${currency}`] : []),
      `Per gram: ${perGram.toFixed(3)} ${currency}/g`,
      `Per hour: ${perHour.toFixed(2)} ${currency}/h`,
    ];
    navigator.clipboard?.writeText(lines.join('\n'));
  };

  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Typography variant="caption" color="text.secondary">Total cost</Typography>
      <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
        {costs.totalCost.toFixed(2)} <Typography component="span" variant="h5" color="text.secondary">{currency}</Typography>
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
        <Tile label="Electricity" value={costs.electricityCost} currency={currency} />
        <Tile label="Filament" value={costs.filamentCost} currency={currency} />
        {showDepreciation && (
          <Tile label="Depreciation" value={costs.depreciationCost} currency={currency} />
        )}
      </Stack>

      <Box sx={{ mt: 2, color: 'text.secondary', fontSize: 14 }}>
        {perGram > 0 && <span>{perGram.toFixed(3)} {currency}/g · </span>}
        {perHour > 0 && <span>{perHour.toFixed(2)} {currency}/h</span>}
      </Box>

      <Button startIcon={<ContentCopyIcon />} onClick={onCopy} sx={{ mt: 2 }}>
        Copy summary
      </Button>
    </Paper>
  );
};

export default ResultCard;
```

- [ ] **Step 4: Run tests**

Run: `npm test -- --watchAll=false src/components/ResultCard.test.tsx`
Expected: 3 pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/ResultCard.tsx src/components/ResultCard.test.tsx
git commit -m "feat: ResultCard component with stat tiles and copy summary"
```

---

## Task 8: FileDropZone component

**Files:**
- Create: `src/components/FileDropZone.tsx`
- Create: `src/components/FileDropZone.test.tsx`

- [ ] **Step 1: Write component tests**

Create `src/components/FileDropZone.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileDropZone from './FileDropZone';

const prusaSample = `; generated by PrusaSlicer 2.7.4
; printer_model = MK4
; filament_type = PLA
; filament used [g] = 47.2
; estimated printing time (normal mode) = 1h 23m 45s
`;

test('reads dropped file, parses, and calls onImport', async () => {
  const onImport = jest.fn();
  const onError = jest.fn();
  render(<FileDropZone onImport={onImport} onError={onError} />);

  const file = new File([prusaSample], 'sample.gcode', { type: 'text/plain' });
  const input = screen.getByLabelText(/g-code file input/i) as HTMLInputElement;
  await userEvent.upload(input, file);

  await waitFor(() => expect(onImport).toHaveBeenCalledTimes(1));
  expect(onImport.mock.calls[0][0].flavor).toBe('PrusaSlicer');
});

test('calls onError for unsupported file', async () => {
  const onImport = jest.fn();
  const onError = jest.fn();
  render(<FileDropZone onImport={onImport} onError={onError} />);

  const file = new File(['not a gcode'], 'sample.gcode', { type: 'text/plain' });
  const input = screen.getByLabelText(/g-code file input/i) as HTMLInputElement;
  await userEvent.upload(input, file);

  await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
  expect(onError.mock.calls[0][0].kind).toBe('unsupported_slicer');
});

test('shows imported summary when importedSource provided', () => {
  render(
    <FileDropZone
      onImport={() => {}}
      onError={() => {}}
      imported={{ source: 'PrusaSlicer', printer: 'MK4', filamentType: 'PLA', grams: 47.2, hoursLabel: '1h 23m' }}
      onClearImport={() => {}}
    />,
  );
  expect(screen.getByText(/PrusaSlicer/)).toBeInTheDocument();
  expect(screen.getByText(/MK4/)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run, expect failure**

Run: `npm test -- --watchAll=false src/components/FileDropZone.test.tsx`
Expected: cannot find module.

- [ ] **Step 3: Implement FileDropZone**

Create `src/components/FileDropZone.tsx`:

```tsx
import { useCallback, useRef, useState } from 'react';
import { Box, Button, Chip, Link, Paper, Typography } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { parseGcode } from '../gcode/gcodeParser';
import { ParsedJob, ParseError } from '../gcode/types';

interface ImportedSummary {
  source: string;
  printer: string | null;
  filamentType: string | null;
  grams: number | null;
  hoursLabel: string | null;
}

interface Props {
  onImport: (job: ParsedJob) => void;
  onError: (err: ParseError) => void;
  imported?: ImportedSummary | null;
  onClearImport?: () => void;
}

const SUPPORTED_LABEL = 'PrusaSlicer · OrcaSlicer · BambuStudio · SuperSlicer · Cura';

const FileDropZone = ({ onImport, onError, imported, onClearImport }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const result = parseGcode(text);
      if ('kind' in result) onError(result);
      else onImport(result);
    } catch {
      onError({ kind: 'read_failed', message: 'Could not read the file.' });
    }
  }, [onImport, onError]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) void handleFile(f);
    e.target.value = '';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) void handleFile(f);
  };

  if (imported) {
    return (
      <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Chip label={imported.source} color="primary" size="small" />
        <Typography variant="body2" sx={{ flex: 1 }}>
          {[imported.printer, imported.hoursLabel, imported.grams != null ? `${imported.grams.toFixed(1)} g` : null, imported.filamentType]
            .filter(Boolean).join(' · ') || 'Imported'}
        </Typography>
        <Link component="button" onClick={onClearImport} underline="hover">Import another</Link>
      </Paper>
    );
  }

  return (
    <Paper
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      sx={{
        p: 4, textAlign: 'center', border: '2px dashed',
        borderColor: dragOver ? 'primary.main' : 'divider',
        backgroundColor: dragOver ? 'action.hover' : 'background.paper',
        transition: 'background-color 120ms, border-color 120ms',
        cursor: 'pointer',
      }}
      onClick={() => inputRef.current?.click()}
    >
      <UploadFileIcon sx={{ fontSize: 40, color: 'primary.main' }} />
      <Typography variant="h6" sx={{ mt: 1 }}>Drop a .gcode file</Typography>
      <Typography variant="body2" color="text.secondary">or click to browse</Typography>
      <Box sx={{ mt: 2 }}>
        <Button variant="outlined" size="small" onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}>
          Choose file
        </Button>
      </Box>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
        {SUPPORTED_LABEL}
      </Typography>
      <input
        ref={inputRef}
        type="file"
        aria-label="g-code file input"
        accept=".gcode,.gco,.g,text/plain"
        style={{ display: 'none' }}
        onChange={onChange}
      />
    </Paper>
  );
};

export default FileDropZone;
```

- [ ] **Step 4: Run tests**

Run: `npm test -- --watchAll=false src/components/FileDropZone.test.tsx`
Expected: 3 pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/FileDropZone.tsx src/components/FileDropZone.test.tsx
git commit -m "feat: FileDropZone component with drag-drop and click-to-browse"
```

---

## Task 9: SettingsCard and JobInputsCard

**Files:**
- Create: `src/components/SettingsCard.tsx`
- Create: `src/components/JobInputsCard.tsx`
- Create: `src/components/Footer.tsx`

These are presentational extractions from the current `App.tsx` body. No new tests beyond manual smoke (covered by Task 10's integration test).

- [ ] **Step 1: Implement JobInputsCard**

Create `src/components/JobInputsCard.tsx`:

```tsx
import { ChangeEvent } from 'react';
import { Box, InputAdornment, Paper, TextField, Typography } from '@mui/material';
import TimeInput from '../TimeInput';

interface Props {
  printTime: { hours: number; minutes: number };
  onPrintTimeChange: (value: { hours: number; minutes: number }) => void;
  filamentWeight: string;
  onFilamentWeightChange: (value: string) => void;
  estimated?: boolean;
}

const JobInputsCard = ({ printTime, onPrintTimeChange, filamentWeight, onFilamentWeightChange, estimated }: Props) => (
  <Paper sx={{ p: 3 }}>
    <Typography variant="h2" component="h2" sx={{ mb: 2 }}>This print</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Total print time</Typography>
    <TimeInput value={printTime} onChange={onPrintTimeChange} />
    <Box sx={{ mt: 3 }}>
      <TextField
        fullWidth
        label="Filament weight"
        type="number"
        value={filamentWeight}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onFilamentWeightChange(e.target.value)}
        inputProps={{ min: 0 }}
        InputProps={{
          endAdornment: <InputAdornment position="end">g</InputAdornment>,
        }}
        helperText={estimated ? '≈ estimated from filament length — verify' : ' '}
      />
    </Box>
  </Paper>
);

export default JobInputsCard;
```

- [ ] **Step 2: Implement SettingsCard**

Create `src/components/SettingsCard.tsx`:

```tsx
import { ChangeEvent, useState } from 'react';
import {
  Box, Collapse, FormControlLabel, IconButton, InputAdornment, MenuItem, Paper,
  Select, SelectChangeEvent, Stack, Switch, TextField, Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { Currency } from '../lib/persistence';

interface Props {
  currency: Currency;
  onCurrencyChange: (c: Currency) => void;
  electricityCost: string;
  onElectricityCostChange: (v: string) => void;
  printerPower: string;
  onPrinterPowerChange: (v: string) => void;
  filamentCost: string;
  onFilamentCostChange: (v: string) => void;
  showDepreciation: boolean;
  onShowDepreciationChange: (v: boolean) => void;
  printerCost: string;
  onPrinterCostChange: (v: string) => void;
  printerLifespan: string;
  onPrinterLifespanChange: (v: string) => void;
  startCollapsed?: boolean;
}

const SettingsCard = (p: Props) => {
  const [open, setOpen] = useState(!p.startCollapsed);

  const onText = (setter: (v: string) => void) =>
    (e: ChangeEvent<HTMLInputElement>) => setter(e.target.value);

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography variant="h2" component="h2" sx={{ flex: 1 }}>Cost settings</Typography>
        <IconButton onClick={() => setOpen(o => !o)} aria-label={open ? 'collapse settings' : 'expand settings'}>
          {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>
      <Collapse in={open}>
        <Box sx={{ mt: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Select fullWidth size="small" value={p.currency} onChange={(e: SelectChangeEvent) => p.onCurrencyChange(e.target.value as Currency)}>
              <MenuItem value="PLN">PLN</MenuItem>
              <MenuItem value="USD">USD</MenuItem>
              <MenuItem value="EUR">EUR</MenuItem>
            </Select>
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
            <TextField fullWidth label="Electricity rate" type="number" value={p.electricityCost} onChange={onText(p.onElectricityCostChange)}
              InputProps={{ endAdornment: <InputAdornment position="end">{p.currency}/kWh</InputAdornment> }} />
            <TextField fullWidth label="Printer power" type="number" value={p.printerPower} onChange={onText(p.onPrinterPowerChange)}
              InputProps={{ endAdornment: <InputAdornment position="end">kW</InputAdornment> }} />
          </Stack>
          <TextField fullWidth label="Filament cost" type="number" value={p.filamentCost} onChange={onText(p.onFilamentCostChange)}
            sx={{ mt: 2 }}
            InputProps={{ endAdornment: <InputAdornment position="end">{p.currency}/kg</InputAdornment> }} />
          <FormControlLabel
            sx={{ mt: 2 }}
            control={<Switch checked={p.showDepreciation} onChange={(_, v) => p.onShowDepreciationChange(v)} />}
            label="Include printer depreciation"
          />
          <Collapse in={p.showDepreciation}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1 }}>
              <TextField fullWidth label="Printer cost" type="number" value={p.printerCost} onChange={onText(p.onPrinterCostChange)}
                InputProps={{ endAdornment: <InputAdornment position="end">{p.currency}</InputAdornment> }} />
              <TextField fullWidth label="Printer lifespan" type="number" value={p.printerLifespan} onChange={onText(p.onPrinterLifespanChange)}
                InputProps={{ endAdornment: <InputAdornment position="end">years</InputAdornment> }} />
            </Stack>
          </Collapse>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default SettingsCard;
```

- [ ] **Step 3: Implement Footer**

Create `src/components/Footer.tsx`:

```tsx
import { Box, Link, Typography } from '@mui/material';

const Footer = () => (
  <Box sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
    <Typography variant="body2" color="text.secondary">
      Made in Poland with ❤️ ·{' '}
      <Link
        href="https://github.com/tdi/cost-slicer/issues"
        target="_blank"
        rel="noopener noreferrer"
        underline="hover"
      >
        Suggestions & issues
      </Link>
    </Typography>
  </Box>
);

export default Footer;
```

- [ ] **Step 4: TypeScript check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/SettingsCard.tsx src/components/JobInputsCard.tsx src/components/Footer.tsx
git commit -m "feat: extract SettingsCard, JobInputsCard, Footer components"
```

---

## Task 10: Wire it together in App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Replace App.tsx**

Replace `src/App.tsx` contents:

```tsx
import { useEffect, useMemo, useReducer, useState } from 'react';
import { Box, Button, Container, CssBaseline, Stack, ThemeProvider, Typography, useMediaQuery } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { Helmet } from 'react-helmet-async';
import { Analytics } from '@vercel/analytics/react';

import { themeForMode } from './theme';
import { calculatePrintCost, CostBreakdown } from './costCalculations';
import { formReducer, initialState } from './state/formReducer';
import { loadSettings, saveSettings, PersistedSettings } from './lib/persistence';
import FileDropZone from './components/FileDropZone';
import JobInputsCard from './components/JobInputsCard';
import SettingsCard from './components/SettingsCard';
import ResultCard from './components/ResultCard';
import Footer from './components/Footer';
import { ParseError } from './gcode/types';

const settingsFromState = (s: typeof initialState): PersistedSettings => ({
  electricityCost: s.electricityCost,
  printerPower: s.printerPower,
  filamentCost: s.filamentCost,
  currency: s.currency,
  showDepreciation: s.showDepreciation,
  printerCost: s.printerCost,
  printerLifespan: s.printerLifespan,
});

const App = () => {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const theme = useMemo(() => themeForMode(prefersDark ? 'dark' : 'light'), [prefersDark]);

  const [state, dispatch] = useReducer(formReducer, initialState);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [costs, setCosts] = useState<CostBreakdown | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const persisted = loadSettings();
    if (persisted) dispatch({ type: 'hydrate', payload: persisted });
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    const id = setTimeout(() => saveSettings(settingsFromState(state)), 300);
    return () => clearTimeout(id);
  }, [hasHydrated, state]);

  const handleCalculate = () => {
    setError('');
    setCosts(null);
    try {
      const t = state.printTime.hours * 60 + state.printTime.minutes;
      const w = parseFloat(state.filamentWeight);
      if (!Number.isFinite(w)) throw new Error('Enter a filament weight in grams.');
      const r = calculatePrintCost(
        t, w,
        parseFloat(state.electricityCost),
        parseFloat(state.printerPower),
        parseFloat(state.filamentCost),
        state.showDepreciation,
        parseFloat(state.printerCost),
        parseFloat(state.printerLifespan),
      );
      setCosts(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    }
  };

  const handleParseError = (err: ParseError) => {
    setError(err.message);
    setCosts(null);
  };

  const importedSummary = state.importSource ? {
    source: state.importSource,
    printer: state.printerModel,
    filamentType: state.filamentType,
    grams: parseFloat(state.filamentWeight) || null,
    hoursLabel: `${state.printTime.hours}h ${state.printTime.minutes}m`,
  } : null;

  const dynamicTitle = state.importSource && state.printerModel
    ? `Cost Slicer — ${state.printerModel}${state.filamentType ? ` · ${state.filamentType}` : ''}`
    : 'Cost Slicer — 3D Print Cost Calculator';

  return (
    <ThemeProvider theme={theme}>
      <Helmet><title>{dynamicTitle}</title></Helmet>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Container maxWidth="md" sx={{ py: { xs: 3, sm: 5 } }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h1" component="h1" sx={{ color: 'primary.main' }}>Cost Slicer</Typography>
            <Typography variant="body1" color="text.secondary">
              Estimate the real cost of any 3D print in seconds.
            </Typography>
          </Box>

          <Stack spacing={3}>
            <FileDropZone
              onImport={(job) => { setError(''); dispatch({ type: 'import', payload: job }); }}
              onError={handleParseError}
              imported={importedSummary}
              onClearImport={() => dispatch({ type: 'clearImport' })}
            />
            <JobInputsCard
              printTime={state.printTime}
              onPrintTimeChange={(v) => dispatch({ type: 'setPrintTime', value: v })}
              filamentWeight={state.filamentWeight}
              onFilamentWeightChange={(v) => dispatch({ type: 'setField', field: 'filamentWeight', value: v })}
              estimated={state.filamentWeightEstimated}
            />
            <SettingsCard
              currency={state.currency}
              onCurrencyChange={(v) => dispatch({ type: 'setField', field: 'currency', value: v })}
              electricityCost={state.electricityCost}
              onElectricityCostChange={(v) => dispatch({ type: 'setField', field: 'electricityCost', value: v })}
              printerPower={state.printerPower}
              onPrinterPowerChange={(v) => dispatch({ type: 'setField', field: 'printerPower', value: v })}
              filamentCost={state.filamentCost}
              onFilamentCostChange={(v) => dispatch({ type: 'setField', field: 'filamentCost', value: v })}
              showDepreciation={state.showDepreciation}
              onShowDepreciationChange={(v) => dispatch({ type: 'setField', field: 'showDepreciation', value: v })}
              printerCost={state.printerCost}
              onPrinterCostChange={(v) => dispatch({ type: 'setField', field: 'printerCost', value: v })}
              printerLifespan={state.printerLifespan}
              onPrinterLifespanChange={(v) => dispatch({ type: 'setField', field: 'printerLifespan', value: v })}
              startCollapsed={!!loadSettings()}
            />

            <Button variant="contained" size="large" onClick={handleCalculate}>
              Slice Costs
            </Button>

            {error && (
              <Typography color="error">{error}</Typography>
            )}
            {costs && (
              <ResultCard
                costs={costs}
                currency={state.currency}
                showDepreciation={state.showDepreciation}
                grams={parseFloat(state.filamentWeight) || 0}
                hours={state.printTime.hours + state.printTime.minutes / 60}
              />
            )}
          </Stack>

          <Footer />
        </Container>
        <Analytics />
      </LocalizationProvider>
    </ThemeProvider>
  );
};

export default App;
```

- [ ] **Step 2: Update `src/index.tsx` to provide HelmetProvider**

Read current `src/index.tsx`. After the existing imports, ensure the tree is wrapped with `HelmetProvider`. Replace the render call so that `<App />` is wrapped:

```tsx
import { HelmetProvider } from 'react-helmet-async';
// ...
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>
);
```

- [ ] **Step 3: Install react-helmet-async**

Run: `npm install react-helmet-async@^2.0.5`
Expected: installs without warnings beyond peer-dep notes.

- [ ] **Step 4: Update App.test.tsx so it doesn't crash on Helmet**

Replace `src/App.test.tsx` with:

```tsx
import { render, screen } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';

test('renders Cost Slicer hero title', () => {
  render(<HelmetProvider><App /></HelmetProvider>);
  expect(screen.getByRole('heading', { level: 1, name: /cost slicer/i })).toBeInTheDocument();
});

test('renders Suggestions & issues link', () => {
  render(<HelmetProvider><App /></HelmetProvider>);
  const link = screen.getByRole('link', { name: /suggestions & issues/i });
  expect(link).toHaveAttribute('href', 'https://github.com/tdi/cost-slicer/issues');
  expect(link).toHaveAttribute('target', '_blank');
});
```

- [ ] **Step 5: Run full test suite**

Run: `npm test -- --watchAll=false`
Expected: all suites green.

- [ ] **Step 6: Smoke-test in browser**

Run (in a separate terminal): `npm start`
- Confirm the app loads at `http://localhost:3000`.
- Drop the `src/gcode/__fixtures__/prusaslicer.gcode` file onto the dropzone.
- Confirm fields populate (1h 23m, 47.2 g, MK4, PLA chip).
- Click "Slice Costs" — Result card appears.
- Toggle depreciation — third tile appears.
- Reload — settings persist, job fields cleared.
- Click "Suggestions & issues" — opens GitHub issues in new tab.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: wire dropzone, reducer, and result card into App"
```

---

## Task 11: SEO meta + assets

**Files:**
- Modify: `public/index.html`
- Modify: `public/manifest.json`
- Create: `public/robots.txt`
- Create: `public/sitemap.xml`

- [ ] **Step 1: Replace `public/index.html` head**

Replace the entire `<head>` section with:

```html
<head>
  <meta charset="utf-8" />
  <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="theme-color" content="#D97757" />
  <meta name="description" content="Estimate the real cost of any 3D print in seconds. Drop a G-code file and get electricity, filament, and depreciation costs." />
  <link rel="canonical" href="https://cost-slicer.vercel.app/" />
  <link rel="apple-touch-icon" href="%PUBLIC_URL%/logo192.png" />
  <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />

  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://cost-slicer.vercel.app/" />
  <meta property="og:title" content="Cost Slicer — 3D Print Cost Calculator" />
  <meta property="og:description" content="Estimate the real cost of any 3D print in seconds. Drop a G-code file." />
  <meta property="og:image" content="https://cost-slicer.vercel.app/og-image.png" />
  <meta property="og:locale" content="en_US" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Cost Slicer — 3D Print Cost Calculator" />
  <meta name="twitter:description" content="Estimate the real cost of any 3D print in seconds. Drop a G-code file." />
  <meta name="twitter:image" content="https://cost-slicer.vercel.app/og-image.png" />

  <title>Cost Slicer — 3D Print Cost Calculator</title>

  <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Cost Slicer",
      "description": "Estimate the real cost of any 3D print in seconds.",
      "applicationCategory": "UtilitiesApplication",
      "operatingSystem": "Web",
      "url": "https://cost-slicer.vercel.app/",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
    }
  </script>
</head>
```

Set `<html lang="en">`.

- [ ] **Step 2: Update `public/manifest.json`**

Replace contents with:

```json
{
  "short_name": "Cost Slicer",
  "name": "Cost Slicer — 3D Print Cost Calculator",
  "icons": [
    { "src": "favicon.ico", "sizes": "64x64 32x32 24x24 16x16", "type": "image/x-icon" },
    { "src": "logo192.png", "type": "image/png", "sizes": "192x192" },
    { "src": "logo512.png", "type": "image/png", "sizes": "512x512" }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#D97757",
  "background_color": "#fafaf7"
}
```

- [ ] **Step 3: Create `public/robots.txt`**

```
User-agent: *
Allow: /

Sitemap: https://cost-slicer.vercel.app/sitemap.xml
```

- [ ] **Step 4: Create `public/sitemap.xml`**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://cost-slicer.vercel.app/</loc>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```

- [ ] **Step 5: Add OG image placeholder**

If you don't have artwork yet, create `public/og-image.png` as a 1200×630 PNG with the brand color and "Cost Slicer" text. A placeholder is fine for now — replace before announcing publicly.

- [ ] **Step 6: Build to confirm no template errors**

Run: `npm run build`
Expected: build succeeds, `build/index.html` contains the new tags.

- [ ] **Step 7: Commit**

```bash
git add public/
git commit -m "feat: SEO meta tags, robots.txt, sitemap.xml, manifest"
```

---

## Task 12: Final verification

- [ ] **Step 1: Full test suite**

Run: `CI=true npm test`
Expected: all green.

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: build succeeds. Note bundle size in summary.

- [ ] **Step 4: Lighthouse (manual)**

Serve: `npx serve -s build` and run Lighthouse on `http://localhost:3000` in Chrome DevTools.
Targets:
- Performance ≥ 90
- Accessibility ≥ 95
- Best Practices ≥ 95
- SEO = 100

If any are below threshold, capture the issue and fix before merge.

- [ ] **Step 5: Manual smoke checklist**

- Drop each fixture (`prusaslicer`, `orcaslicer`, `bambustudio`, `cura`, `cura_length_only`, `superslicer`) and confirm correct chip + populated fields.
- Drop `unknown.gcode` — friendly error appears.
- Toggle dark mode (OS-level) — accent visible, contrast acceptable.
- Resize to mobile width — dropzone, cards, tiles stack cleanly.
- "Copy summary" — clipboard contains formatted text.
- "Suggestions & issues" link opens correct URL in new tab.

- [ ] **Step 6: Final commit if any fixes were made**

```bash
git add -A && git commit -m "chore: post-verification fixes" || echo "nothing to commit"
```

---

## Self-review summary

Spec sections mapped to tasks:
- §2 Architecture → Tasks 3, 5, 7, 8, 9, 10
- §3 Parser → Tasks 4, 5
- §4 UX refresh → Tasks 6, 7, 8, 9, 10
- §4.4 Persistence → Task 2, wired in Task 10
- §5 SEO → Task 11 (assets), Task 10 (dynamic title)
- §6 Testing → Tasks 1, 2, 3, 5, 7, 8, 10
- §7 Component contracts → enforced in Tasks 5, 7, 8, 9
- §9 Risks → covered by tests (slicer drift) and explicit "estimated" flag (Cura)

No placeholders. Type names consistent across tasks (`ParsedJob`, `ParseError`, `PersistedSettings`, `FormState`, `Currency`).
