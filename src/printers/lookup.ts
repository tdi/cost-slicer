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
