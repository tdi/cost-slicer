import JSZip from 'jszip';
import { ParsedJob, ParseError } from './types';

interface SliceInfoPlate {
  index?: string;
  prediction?: string;
  weight?: string[];
}

interface SliceInfo {
  plate?: SliceInfoPlate[];
}

interface ProjectSettings {
  machine_type?: string;
  printer_model_id?: string;
  filament_type?: string[];
}

const toHM = (totalSeconds: number) => {
  const mins = Math.floor(totalSeconds / 60);
  return { hours: Math.floor(mins / 60), minutes: mins % 60 };
};

export async function parse3mf(buffer: ArrayBuffer): Promise<ParsedJob | ParseError> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(buffer);
  } catch {
    return { kind: 'read_failed', message: 'Could not read the .3mf file. It may be corrupted.' };
  }

  const sliceInfoFile = zip.file('Metadata/slice_info.config');
  if (!sliceInfoFile) {
    return {
      kind: 'not_sliced',
      message: "This .3mf hasn't been sliced yet. Open it in BambuStudio, slice it, then drop the file here.",
    };
  }

  let sliceInfo: SliceInfo;
  try {
    sliceInfo = JSON.parse(await sliceInfoFile.async('string'));
  } catch {
    return { kind: 'read_failed', message: 'Could not parse slice_info.config inside the .3mf.' };
  }

  if (!sliceInfo.plate || sliceInfo.plate.length === 0) {
    return {
      kind: 'not_sliced',
      message: 'This .3mf has no sliced plates. Slice it in BambuStudio first.',
    };
  }

  let totalSeconds = 0;
  let totalWeight = 0;
  for (const plate of sliceInfo.plate) {
    totalSeconds += parseFloat(plate.prediction ?? '0') || 0;
    for (const w of plate.weight ?? []) {
      totalWeight += parseFloat(w) || 0;
    }
  }

  let printerModel: string | null = null;
  let filamentType: string | null = null;

  const settingsFile = zip.file('Metadata/project_settings.config');
  if (settingsFile) {
    try {
      const settings: ProjectSettings = JSON.parse(await settingsFile.async('string'));
      printerModel = settings.machine_type ?? settings.printer_model_id ?? null;
      filamentType = settings.filament_type?.[0] ?? null;
    } catch {
      // non-fatal
    }
  }

  return {
    flavor: 'BambuStudio',
    printTime: toHM(totalSeconds),
    filamentWeightGrams: totalWeight > 0 ? totalWeight : null,
    filamentWeightEstimated: false,
    filamentType,
    printerModel,
  };
}
