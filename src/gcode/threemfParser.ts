import JSZip from 'jszip';
import { ParsedJob, ParseError } from './types';

interface ProjectSettings {
  printer_settings_id?: string;
  machine_type?: string;
  printer_model_id?: string;
  filament_type?: string[];
}

const toHM = (totalSeconds: number) => {
  const mins = Math.floor(totalSeconds / 60);
  return { hours: Math.floor(mins / 60), minutes: mins % 60 };
};

const metaValue = (plate: Element, key: string): string | null =>
  plate.querySelector(`metadata[key="${key}"]`)?.getAttribute('value') ?? null;

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

  // slice_info.config is XML (not JSON)
  const xmlText = await sliceInfoFile.async('string');
  const doc = new DOMParser().parseFromString(xmlText, 'text/xml');
  if (doc.querySelector('parsererror')) {
    return { kind: 'read_failed', message: 'Could not parse slice_info.config inside the .3mf.' };
  }

  const plates = Array.from(doc.querySelectorAll('plate'));
  if (plates.length === 0) {
    return {
      kind: 'not_sliced',
      message: 'This .3mf has no sliced plates. Slice it in BambuStudio first.',
    };
  }

  let totalSeconds = 0;
  let totalWeight = 0;
  let filamentType: string | null = null;

  for (const plate of plates) {
    totalSeconds += parseFloat(metaValue(plate, 'prediction') ?? '0') || 0;

    const plateWeight = metaValue(plate, 'weight');
    if (plateWeight != null) {
      totalWeight += parseFloat(plateWeight) || 0;
    } else {
      // Fallback: sum per-filament used_g attributes
      const filaments = plate.querySelectorAll('filament');
      for (let i = 0; i < filaments.length; i++) {
        totalWeight += parseFloat(filaments[i].getAttribute('used_g') ?? '0') || 0;
      }
    }

    if (!filamentType) {
      filamentType = plate.querySelector('filament')?.getAttribute('type') ?? null;
    }
  }

  // Thumbnail: BambuStudio writes plate_1.png (and plate_no_light_1.png) — pick the first non-empty one
  let thumbnailDataUrl: string | null = null;
  const thumbCandidates = ['Metadata/plate_1.png', 'Metadata/top_1.png', 'Metadata/plate_no_light_1.png'];
  for (const path of thumbCandidates) {
    const f = zip.file(path);
    if (f) {
      try {
        const b64 = await f.async('base64');
        if (b64) { thumbnailDataUrl = `data:image/png;base64,${b64}`; break; }
      } catch { /* ignore */ }
    }
  }

  // Printer name from project_settings.config (JSON)
  let printerModel: string | null = null;
  const settingsFile = zip.file('Metadata/project_settings.config');
  if (settingsFile) {
    try {
      const settings: ProjectSettings = JSON.parse(await settingsFile.async('string'));
      // printer_settings_id e.g. "Bambu Lab X1 Carbon 0.4 nozzle" — strip nozzle suffix
      const raw = settings.printer_settings_id ?? settings.machine_type ?? settings.printer_model_id ?? null;
      printerModel = raw ? raw.replace(/\s+\d+\.?\d*\s*nozzle$/i, '').trim() : null;
      if (!filamentType) filamentType = settings.filament_type?.[0] ?? null;
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
    thumbnailDataUrl,
  };
}
