import { MaterialKey, PrinterPreset } from './types';

const MATERIAL_KEYS: MaterialKey[] = ['PLA', 'PETG', 'ABS', 'PC', 'TPU', 'ASA', 'NYLON'];

function extractMaterialKey(material: string): MaterialKey | null {
  const upper = material.toUpperCase();
  // Prefer longer keys first so "NYLON" wins over a hypothetical "NY".
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
