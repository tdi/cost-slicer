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
  selectedPrinterId: string | null;
  thumbnailDataUrl: string | null;
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
  selectedPrinterId: null,
  thumbnailDataUrl: null,
};

export type FormAction =
  | { type: 'setField'; field: keyof FormState; value: FormState[keyof FormState] }
  | { type: 'setPrintTime'; value: { hours: number; minutes: number } }
  | { type: 'hydrate'; payload: PersistedSettings }
  | { type: 'import'; payload: ParsedJob }
  | { type: 'clearImport' };

export function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'setField': {
      const next = { ...state, [action.field]: action.value } as FormState;
      // Manually editing printerPower clears the picked preset.
      if (action.field === 'printerPower' && action.value !== state.printerPower) {
        next.selectedPrinterId = null;
      }
      return next;
    }
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
        thumbnailDataUrl: action.payload.thumbnailDataUrl,
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
        thumbnailDataUrl: null,
      };
  }
}
