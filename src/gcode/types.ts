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
  | 'unsupported_slicer' | 'empty_file' | 'too_large' | 'read_failed' | 'not_sliced';

export interface ParseError {
  kind: ParseErrorKind;
  message: string;
}
