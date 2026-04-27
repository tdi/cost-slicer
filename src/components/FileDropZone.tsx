import { useCallback, useRef, useState } from 'react';
import { Box, Button, Chip, Link, Paper, Typography } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { parseGcode } from '../gcode/gcodeParser';
import { parse3mf } from '../gcode/threemfParser';
import { ParsedJob, ParseError } from '../gcode/types';

interface ImportedSummary {
  source: string;
  printer: string | null;
  filamentType: string | null;
  grams: number | null;
  hoursLabel: string | null;
}

interface Props {
  onImport: (job: ParsedJob) => void;
  onError: (err: ParseError) => void;
  imported?: ImportedSummary | null;
  onClearImport?: () => void;
}

const SUPPORTED_LABEL = 'PrusaSlicer · OrcaSlicer · BambuStudio · SuperSlicer · Cura · .3mf';

const is3mf = (file: File) => file.name.toLowerCase().endsWith('.3mf');

const readAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  if (typeof file.arrayBuffer === 'function') return file.arrayBuffer();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
};

const readAsText = (file: File): Promise<string> => {
  if (typeof file.text === 'function') return file.text();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
};

const FileDropZone = ({ onImport, onError, imported, onClearImport }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    try {
      let result: ParsedJob | ParseError;
      if (is3mf(file)) {
        const buf = await readAsArrayBuffer(file);
        result = await parse3mf(buf);
      } else {
        const text = await readAsText(file);
        result = parseGcode(text);
      }
      if ('kind' in result) onError(result);
      else onImport(result);
    } catch {
      onError({ kind: 'read_failed', message: 'Could not read the file.' });
    }
  }, [onImport, onError]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) void handleFile(f);
    e.target.value = '';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) void handleFile(f);
  };

  if (imported) {
    return (
      <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Chip label={imported.source} color="primary" size="small" />
        <Typography variant="body2" sx={{ flex: 1 }}>
          {[imported.printer, imported.hoursLabel, imported.grams != null ? `${imported.grams.toFixed(1)} g` : null, imported.filamentType]
            .filter(Boolean).join(' · ') || 'Imported'}
        </Typography>
        <Link component="button" onClick={onClearImport} underline="hover">Import another</Link>
      </Paper>
    );
  }

  return (
    <Paper
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      sx={{
        p: 4, textAlign: 'center', border: '2px dashed',
        borderColor: dragOver ? 'primary.main' : 'divider',
        backgroundColor: dragOver ? 'action.hover' : 'background.paper',
        transition: 'background-color 120ms, border-color 120ms',
        cursor: 'pointer',
      }}
      onClick={() => inputRef.current?.click()}
    >
      <UploadFileIcon sx={{ fontSize: 40, color: 'primary.main' }} />
      <Typography variant="h6" sx={{ mt: 1 }}>Drop a .gcode or .3mf file</Typography>
      <Typography variant="body2" color="text.secondary">or click to browse</Typography>
      <Box sx={{ mt: 2 }}>
        <Button variant="outlined" size="small" onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}>
          Choose file
        </Button>
      </Box>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
        {SUPPORTED_LABEL}
      </Typography>
      <input
        ref={inputRef}
        type="file"
        aria-label="g-code file input"
        accept=".gcode,.gco,.g,.3mf,text/plain,application/octet-stream"
        style={{ display: 'none' }}
        onChange={onChange}
      />
    </Paper>
  );
};

export default FileDropZone;
