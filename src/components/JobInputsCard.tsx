import { ChangeEvent } from 'react';
import { Box, InputAdornment, Paper, TextField, Typography } from '@mui/material';
import TimeInput from '../TimeInput';

interface Props {
  printTime: { hours: number; minutes: number };
  onPrintTimeChange: (value: { hours: number; minutes: number }) => void;
  filamentWeight: string;
  onFilamentWeightChange: (value: string) => void;
  estimated?: boolean;
}

const JobInputsCard = ({ printTime, onPrintTimeChange, filamentWeight, onFilamentWeightChange, estimated }: Props) => (
  <Paper sx={{ p: 3 }}>
    <Typography variant="h2" component="h2" sx={{ mb: 2 }}>This print</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Total print time</Typography>
    <TimeInput value={printTime} onChange={onPrintTimeChange} />
    <Box sx={{ mt: 3 }}>
      <TextField
        fullWidth
        label="Filament weight"
        type="number"
        value={filamentWeight}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onFilamentWeightChange(e.target.value)}
        inputProps={{ min: 0 }}
        InputProps={{
          endAdornment: <InputAdornment position="end">g</InputAdornment>,
        }}
        helperText={estimated ? '≈ estimated from filament length — verify' : ' '}
      />
    </Box>
  </Paper>
);

export default JobInputsCard;
