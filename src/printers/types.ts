export type MaterialKey = 'Default' | 'PLA' | 'PETG' | 'ABS' | 'PC' | 'TPU' | 'ASA' | 'NYLON';

export interface PrinterPreset {
  id: string;                                    // stable, kebab-case, unique
  producer: string;                              // group label
  model: string;                                 // display name
  aliases: string[];                             // strings found in gcode/3mf headers
  power: Partial<Record<MaterialKey, number>> & { Default: number }; // average steady-state watts
  enclosed?: boolean;                            // informational only
}
