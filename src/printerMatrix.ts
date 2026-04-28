interface PrinterMaterialPower {
  producer: string;
  printer: string;
  material: string;
  avgPower: number;
}

export const printerMatrix: PrinterMaterialPower[] = [
  { producer: "BambuLab", printer: "X1E", material: "PLA", avgPower: 185 },
  { producer: "BambuLab", printer: "X1E", material: "ABS", avgPower: 260 },
  { producer: "BambuLab", printer: "X1E", material: "PC", avgPower: 230 },
  { producer: "BambuLab", printer: "X1E", material: "Default", avgPower: 225 },
  { producer: "BambuLab", printer: "A1", material: "PLA", avgPower: 95 },
  { producer: "BambuLab", printer: "A1", material: "ABS", avgPower: 200 },
  { producer: "BambuLab", printer: "A1", material: "PC", avgPower: 150 },
  { producer: "BambuLab", printer: "A1", material: "Default", avgPower: 148 },
  { producer: "BambuLab", printer: "X1/X1C", material: "PLA", avgPower: 105 },
  { producer: "BambuLab", printer: "X1/X1C", material: "ABS", avgPower: 150 },
  { producer: "BambuLab", printer: "X1/X1C", material: "PC", avgPower: 135 },
  { producer: "BambuLab", printer: "X1/X1C", material: "Default", avgPower: 130 },
  { producer: "BambuLab", printer: "P1P", material: "PLA", avgPower: 110 },
  { producer: "BambuLab", printer: "P1P", material: "ABS", avgPower: 170 },
  { producer: "BambuLab", printer: "P1P", material: "PC", avgPower: 160 },
  { producer: "BambuLab", printer: "P1P", material: "Default", avgPower: 147 },
  { producer: "BambuLab", printer: "P1S", material: "PLA", avgPower: 105 },
  { producer: "BambuLab", printer: "P1S", material: "ABS", avgPower: 140 },
  { producer: "BambuLab", printer: "P1S", material: "PC", avgPower: 135 },
  { producer: "BambuLab", printer: "P1S", material: "Default", avgPower: 127 },
  { producer: "BambuLab", printer: "A1 mini", material: "PLA", avgPower: 80 },
  { producer: "BambuLab", printer: "A1 mini", material: "PETG", avgPower: 75 },
  { producer: "BambuLab", printer: "A1 mini", material: "Default", avgPower: 78 },
];