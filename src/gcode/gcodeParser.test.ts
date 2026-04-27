import fs from 'fs';
import path from 'path';
import { parseGcode } from './gcodeParser';
import { ParsedJob, ParseError } from './types';

const fixture = (name: string) =>
  fs.readFileSync(path.join(__dirname, '__fixtures__', name), 'utf8');

const ok = (r: ParsedJob | ParseError): ParsedJob => {
  if ('kind' in r) throw new Error(`expected ParsedJob, got error ${r.kind}`);
  return r;
};

describe('parseGcode', () => {
  it('parses PrusaSlicer headers', () => {
    const r = ok(parseGcode(fixture('prusaslicer.gcode')));
    expect(r.flavor).toBe('PrusaSlicer');
    expect(r.printTime).toEqual({ hours: 1, minutes: 23 });
    expect(r.filamentWeightGrams).toBeCloseTo(47.2, 5);
    expect(r.filamentType).toBe('PLA');
    expect(r.printerModel).toBe('MK4');
    expect(r.filamentWeightEstimated).toBe(false);
  });

  it('parses OrcaSlicer with multi-extruder weight summing', () => {
    const r = ok(parseGcode(fixture('orcaslicer.gcode')));
    expect(r.flavor).toBe('OrcaSlicer');
    expect(r.filamentWeightGrams).toBeCloseTo(15.5, 5); // 12.5 + 3.0
    expect(r.printTime).toEqual({ hours: 2, minutes: 5 });
  });

  it('parses BambuStudio headers', () => {
    const r = ok(parseGcode(fixture('bambustudio.gcode')));
    expect(r.flavor).toBe('BambuStudio');
    expect(r.printTime).toEqual({ hours: 0, minutes: 45 });
    expect(r.filamentWeightGrams).toBeCloseTo(22.4, 5);
    expect(r.printerModel).toBe('Bambu Lab X1 Carbon');
    expect(r.filamentType).toBe('Bambu PLA Basic');
  });

  it('parses Cura with explicit weight', () => {
    const r = ok(parseGcode(fixture('cura.gcode')));
    expect(r.flavor).toBe('Cura');
    expect(r.printTime).toEqual({ hours: 1, minutes: 16 }); // 4567s = 76.1m
    expect(r.filamentWeightGrams).toBeCloseTo(30.5, 5);
    expect(r.printerModel).toBe('Ender 3');
    expect(r.filamentWeightEstimated).toBe(false);
  });

  it('parses Cura length-only and flags weight as estimated', () => {
    const r = ok(parseGcode(fixture('cura_length_only.gcode')));
    expect(r.filamentWeightGrams).not.toBeNull();
    expect(r.filamentWeightEstimated).toBe(true);
    // 1.000m of 1.75mm PLA at 1.24 g/cm³ ≈ 2.98g
    expect(r.filamentWeightGrams).toBeCloseTo(2.98, 1);
  });

  it('parses SuperSlicer', () => {
    const r = ok(parseGcode(fixture('superslicer.gcode')));
    expect(r.flavor).toBe('SuperSlicer');
    expect(r.printTime).toEqual({ hours: 0, minutes: 35 });
    expect(r.filamentWeightGrams).toBeCloseTo(18.3, 5);
  });

  it('returns unsupported_slicer error for unknown gcode', () => {
    const r = parseGcode(fixture('unknown.gcode'));
    expect('kind' in r && r.kind).toBe('unsupported_slicer');
  });

  it('returns empty_file error for empty input', () => {
    const r = parseGcode('');
    expect('kind' in r && r.kind).toBe('empty_file');
  });

  it('returns too_large error for >50MB strings', () => {
    const r = parseGcode('x'.repeat(50 * 1024 * 1024 + 1));
    expect('kind' in r && r.kind).toBe('too_large');
  });
});
