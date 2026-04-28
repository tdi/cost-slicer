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
];
