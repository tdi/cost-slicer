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
