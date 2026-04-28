import React from 'react';
import { Box } from '@mui/material';
import NumberField from './components/NumberField';

interface TimeInputProps {
  value: { hours: number; minutes: number };
  onChange: (newValue: { hours: number; minutes: number }) => void;
}

const safeInt = (s: string): number => {
  if (s === '') return 0;
  const n = parseInt(s, 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

const TimeInput: React.FC<TimeInputProps> = ({ value, onChange }) => (
  <Box display="flex" gap={2}>
    <NumberField
      fullWidth
      decimal={false}
      label="Hours"
      value={value.hours === 0 ? '' : String(value.hours)}
      onChange={(v) => onChange({ ...value, hours: safeInt(v) })}
      helperText=" "
    />
    <NumberField
      fullWidth
      decimal={false}
      label="Minutes"
      value={value.minutes === 0 ? '' : String(value.minutes)}
      onChange={(v) => onChange({ ...value, minutes: safeInt(v) })}
      helperText=" "
    />
  </Box>
);

export default TimeInput;
