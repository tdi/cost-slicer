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
