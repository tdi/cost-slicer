import { ParsedJob, ParseError } from './types';
import { profiles } from './slicerProfiles';

const MAX_BYTES = 50 * 1024 * 1024;
const HEAD_LINES = 300;
const TAIL_LINES = 300;

const sliceHeadAndTail = (text: string): string => {
  const lines = text.split('\n');
  if (lines.length <= HEAD_LINES + TAIL_LINES) return text;
  return [
    ...lines.slice(0, HEAD_LINES),
    ...lines.slice(-TAIL_LINES),
  ].join('\n');
};

export function parseGcode(text: string): ParsedJob | ParseError {
  if (text.length === 0) return { kind: 'empty_file', message: 'File is empty.' };
  if (text.length > MAX_BYTES) return { kind: 'too_large', message: 'File exceeds 50 MB.' };

  const sliced = sliceHeadAndTail(text);
  const head = sliced.split('\n').slice(0, HEAD_LINES).join('\n');

  const profile = profiles.find(p => p.detect(head));
  if (!profile) {
    return {
      kind: 'unsupported_slicer',
      message: 'Couldn\'t identify the slicer. Supported: PrusaSlicer, OrcaSlicer, BambuStudio, SuperSlicer, Cura.',
    };
  }

  return { flavor: profile.flavor, ...profile.extract(sliced) };
}
