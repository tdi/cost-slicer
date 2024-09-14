export interface CostBreakdown {
  electricityCost: number;
  filamentCost: number;
  depreciationCost: number;
  totalCost: number;
}

export const calculatePrintCost = (
  printTimeMinutes: number,
  filamentWeightGrams: number,
  electricityCost: number,
  printerPower: number,
  filamentCost: number,
  showDepreciation: boolean,
  printerCost: number,
  printerLifespan: number
): CostBreakdown => {
  const printTimeHours = printTimeMinutes / 60;
  const electricityCostResult = printTimeHours * printerPower * electricityCost;
  const filamentCostResult = (filamentWeightGrams / 1000) * filamentCost;
  const printerLifespanHours = printerLifespan * 365 * 24; // Convert years to hours
  const depreciationCost = showDepreciation ? (printerCost / printerLifespanHours) * printTimeHours : 0;
  const totalCost = electricityCostResult + filamentCostResult + depreciationCost;

  return { electricityCost: electricityCostResult, filamentCost: filamentCostResult, depreciationCost, totalCost };
};
