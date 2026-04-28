import { Paper, Typography } from '@mui/material';
import TimeInput from '../TimeInput';
import NumberField from './NumberField';

interface Props {
  printTime: { hours: number; minutes: number };
  onPrintTimeChange: (value: { hours: number; minutes: number }) => void;
  filamentWeight: string;
  onFilamentWeightChange: (value: string) => void;
  estimated?: boolean;
}

const JobInputsCard = ({ printTime, onPrintTimeChange, filamentWeight, onFilamentWeightChange, estimated }: Props) => (
  <Paper sx={{ p: 3 }}>
    <Typography variant="h2" component="h2" sx={{ mb: 2 }}>Job</Typography>
    <TimeInput value={printTime} onChange={onPrintTimeChange} />
    <NumberField
      fullWidth
      label="Filament weight"
      value={filamentWeight}
      onChange={onFilamentWeightChange}
      suffix="g"
      helperText={estimated ? '≈ estimated from filament length — verify' : ' '}
    />
  </Paper>
);

export default JobInputsCard;
