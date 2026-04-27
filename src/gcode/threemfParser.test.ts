import JSZip from 'jszip';
import { parse3mf } from './threemfParser';

const buildZip = async (files: Record<string, string>): Promise<ArrayBuffer> => {
  const zip = new JSZip();
  for (const [path, content] of Object.entries(files)) {
    zip.file(path, content);
  }
  return zip.generateAsync({ type: 'arraybuffer' });
};

const sliceInfo = (plates: Array<{ prediction: string; weight: string[] }>) =>
  JSON.stringify({
    plate: plates.map((p, i) => ({ index: String(i + 1), ...p })),
  });

const projectSettings = (overrides: Record<string, unknown> = {}) =>
  JSON.stringify({
    machine_type: 'Bambu Lab X1 Carbon',
    filament_type: ['PLA'],
    filament_settings_id: ['Bambu PLA Basic'],
    ...overrides,
  });

describe('parse3mf', () => {
  it('sums time and weight across all plates', async () => {
    const buf = await buildZip({
      'Metadata/slice_info.config': sliceInfo([
        { prediction: '4567', weight: ['22.4', '5.0'] },
        { prediction: '1800', weight: ['12.3'] },
      ]),
      'Metadata/project_settings.config': projectSettings(),
    });
    const r = await parse3mf(buf);
    if ('kind' in r) throw new Error(`unexpected error: ${r.kind}`);
    expect(r.flavor).toBe('BambuStudio');
    // total seconds: 4567 + 1800 = 6367 → 106.1m → 1h 46m
    expect(r.printTime).toEqual({ hours: 1, minutes: 46 });
    // total weight: 22.4 + 5.0 + 12.3 = 39.7
    expect(r.filamentWeightGrams).toBeCloseTo(39.7, 5);
    expect(r.filamentWeightEstimated).toBe(false);
    expect(r.printerModel).toBe('Bambu Lab X1 Carbon');
    expect(r.filamentType).toBe('PLA');
  });

  it('handles single plate with single filament', async () => {
    const buf = await buildZip({
      'Metadata/slice_info.config': sliceInfo([
        { prediction: '3600', weight: ['50.0'] },
      ]),
      'Metadata/project_settings.config': projectSettings(),
    });
    const r = await parse3mf(buf);
    if ('kind' in r) throw new Error(`unexpected error: ${r.kind}`);
    expect(r.printTime).toEqual({ hours: 1, minutes: 0 });
    expect(r.filamentWeightGrams).toBeCloseTo(50.0, 5);
  });

  it('falls back to printer_model_id when machine_type absent', async () => {
    const buf = await buildZip({
      'Metadata/slice_info.config': sliceInfo([{ prediction: '60', weight: ['1.0'] }]),
      'Metadata/project_settings.config': JSON.stringify({
        printer_model_id: 'P1P',
        filament_type: ['PETG'],
      }),
    });
    const r = await parse3mf(buf);
    if ('kind' in r) throw new Error(`unexpected error: ${r.kind}`);
    expect(r.printerModel).toBe('P1P');
    expect(r.filamentType).toBe('PETG');
  });

  it('returns not_sliced when slice_info.config is absent', async () => {
    const buf = await buildZip({
      'Metadata/project_settings.config': projectSettings(),
    });
    const r = await parse3mf(buf);
    expect('kind' in r && r.kind).toBe('not_sliced');
  });

  it('returns not_sliced when plate array is empty', async () => {
    const buf = await buildZip({
      'Metadata/slice_info.config': JSON.stringify({ plate: [] }),
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

  it('tolerates missing project_settings.config (printer is null)', async () => {
    const buf = await buildZip({
      'Metadata/slice_info.config': sliceInfo([{ prediction: '120', weight: ['2.0'] }]),
    });
    const r = await parse3mf(buf);
    if ('kind' in r) throw new Error(`unexpected error: ${r.kind}`);
    expect(r.printerModel).toBeNull();
    expect(r.filamentType).toBeNull();
  });
});
