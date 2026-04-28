import { Autocomplete, Box, TextField, Typography } from '@mui/material';
import { printers } from '../printers/database';
import { PrinterPreset } from '../printers/types';

interface Props {
  selectedId: string | null;
  onSelect: (preset: PrinterPreset | null) => void;
}

const sortedPrinters = [...printers].sort((a, b) => {
  if (a.producer !== b.producer) return a.producer.localeCompare(b.producer);
  return a.model.localeCompare(b.model);
});

const PrinterPicker = ({ selectedId, onSelect }: Props) => {
  const value = sortedPrinters.find(p => p.id === selectedId) ?? null;

  return (
    <Autocomplete
      size="small"
      fullWidth
      options={sortedPrinters}
      groupBy={(p) => p.producer}
      getOptionLabel={(p) => p.model}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      value={value}
      onChange={(_, v) => onSelect(v)}
      renderInput={(params) => (
        <TextField {...params} label="Printer model" placeholder="Select to auto-fill power" />
      )}
      renderOption={(props, option) => (
        <Box component="li" {...props} key={option.id} sx={{ display: 'flex', justifyContent: 'space-between !important', gap: 2 }}>
          <Typography variant="body2">{option.model}</Typography>
          <Typography variant="caption" color="text.secondary">{option.power.Default} W avg</Typography>
        </Box>
      )}
      sx={{ mb: 1 }}
    />
  );
};

export default PrinterPicker;
