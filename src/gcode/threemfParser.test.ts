import JSZip from 'jszip';
import { parse3mf } from './threemfParser';

const buildZip = async (files: Record<string, string>): Promise<ArrayBuffer> => {
  const zip = new JSZip();
  for (const [path, content] of Object.entries(files)) {
    zip.file(path, content);
  }
  return zip.generateAsync({ type: 'arraybuffer' });
};

// Real BambuStudio XML format for slice_info.config
const sliceInfoXml = (plates: Array<{ prediction: string; weight: string; filamentType?: string }>) => {
  const plateTags = plates.map((p, i) => `
  <plate>
    <metadata key="index" value="${i + 1}"/>
    <metadata key="prediction" value="${p.prediction}"/>
    <metadata key="weight" value="${p.weight}"/>
    <filament id="1" tray_info_idx="GFA00" type="${p.filamentType ?? 'PLA'}" color="#FF0000" used_m="1.00" used_g="${p.weight}" />
  </plate>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
<config>
  <header>
    <header_item key="X-BBL-Client-Type" value="slicer"/>
    <header_item key="X-BBL-Client-Version" value="01.10.01.50"/>
  </header>${plateTags}
</config>`;
};

// Newer BambuStudio format — header only, no plate data
const headerOnlyXml = `<?xml version="1.0" encoding="UTF-8"?>
<config>
  <header>
    <header_item key="X-BBL-Client-Type" value="slicer"/>
    <header_item key="X-BBL-Client-Version" value="02.03.01.51"/>
  </header>
</config>`;

const projectSettings = (overrides: Record<string, unknown> = {}) =>
  JSON.stringify({
    printer_settings_id: 'Bambu Lab X1 Carbon 0.4 nozzle',
    filament_type: ['PLA'],
    ...overrides,
  });

describe('parse3mf', () => {
  it('sums time and weight across all plates', async () => {
    const buf = await buildZip({
      'Metadata/slice_info.config': sliceInfoXml([
        { prediction: '4567', weight: '27.4' },
        { prediction: '1800', weight: '12.3' },
      ]),
      'Metadata/project_settings.config': projectSettings(),
    });
    const r = await parse3mf(buf);
    if ('kind' in r) throw new Error(`unexpected error: ${r.kind}`);
    expect(r.flavor).toBe('BambuStudio');
    // total seconds: 4567 + 1800 = 6367 → 106m → 1h 46m
    expect(r.printTime).toEqual({ hours: 1, minutes: 46 });
    // total weight: 27.4 + 12.3 = 39.7
    expect(r.filamentWeightGrams).toBeCloseTo(39.7, 5);
    expect(r.filamentWeightEstimated).toBe(false);
    expect(r.printerModel).toBe('Bambu Lab X1 Carbon'); // nozzle suffix stripped
    expect(r.filamentType).toBe('PLA');
  });

  it('handles single plate with single filament', async () => {
    const buf = await buildZip({
      'Metadata/slice_info.config': sliceInfoXml([{ prediction: '3600', weight: '50.0' }]),
      'Metadata/project_settings.config': projectSettings(),
    });
    const r = await parse3mf(buf);
    if ('kind' in r) throw new Error(`unexpected error: ${r.kind}`);
    expect(r.printTime).toEqual({ hours: 1, minutes: 0 });
    expect(r.filamentWeightGrams).toBeCloseTo(50.0, 5);
  });

  it('falls back to filament used_g when weight metadata absent', async () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<config>
  <plate>
    <metadata key="index" value="1"/>
    <metadata key="prediction" value="600"/>
    <filament id="1" type="PETG" used_g="8.50" />
    <filament id="2" type="PETG" used_g="3.20" />
  </plate>
</config>`;
    const buf = await buildZip({
      'Metadata/slice_info.config': xml,
      'Metadata/project_settings.config': projectSettings({ printer_settings_id: 'P1P 0.4 nozzle' }),
    });
    const r = await parse3mf(buf);
    if ('kind' in r) throw new Error(`unexpected error: ${r.kind}`);
    expect(r.filamentWeightGrams).toBeCloseTo(11.7, 5); // 8.5 + 3.2
    expect(r.printerModel).toBe('P1P');
    expect(r.filamentType).toBe('PETG');
  });

  it('returns not_sliced when slice_info.config has no plate elements (newer BambuStudio)', async () => {
    const buf = await buildZip({
      'Metadata/slice_info.config': headerOnlyXml,
      'Metadata/project_settings.config': projectSettings(),
    });
    const r = await parse3mf(buf);
    expect('kind' in r && r.kind).toBe('not_sliced');
  });

  it('returns not_sliced when slice_info.config is absent', async () => {
    const buf = await buildZip({
      'Metadata/project_settings.config': projectSettings(),
    });
    const r = await parse3mf(buf);
    expect('kind' in r && r.kind).toBe('not_sliced');
  });

  it('returns read_failed for non-zip input', async () => {
    const buf = Buffer.from('not a zip').buffer;
    const r = await parse3mf(buf);
    expect('kind' in r && r.kind).toBe('read_failed');
  });

  it('tolerates missing project_settings.config — filament type from XML', async () => {
    const buf = await buildZip({
      'Metadata/slice_info.config': sliceInfoXml([{ prediction: '120', weight: '2.0', filamentType: 'ABS' }]),
    });
    const r = await parse3mf(buf);
    if ('kind' in r) throw new Error(`unexpected error: ${r.kind}`);
    expect(r.printerModel).toBeNull();
    expect(r.filamentType).toBe('ABS'); // from XML filament element
  });
});
