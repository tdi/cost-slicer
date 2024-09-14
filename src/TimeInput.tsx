import React from 'react';
import { TextField, Box, Typography } from '@mui/material';

interface TimeInputProps {
  value: { hours: number; minutes: number };
  onChange: (newValue: { hours: number; minutes: number }) => void;
}

const TimeInput: React.FC<TimeInputProps> = ({ value, onChange }) => {
  const handleHoursChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const hours = event.target.value === '' ? 0 : Math.max(0, parseInt(event.target.value));
    onChange({ ...value, hours });
  };

  const handleMinutesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const minutes = event.target.value === '' ? 0 : Math.max(0, parseInt(event.target.value));
    onChange({ ...value, minutes });
  };

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        Projected Total Print Time
      </Typography>
      <Box display="flex" gap={2}>
        <TextField
          label="Hours"
          type="number"
          value={value.hours || ''}
          onChange={handleHoursChange}
          inputProps={{ min: 0 }}
        />
        <TextField
          label="Minutes"
          type="number"
          value={value.minutes || ''}
          onChange={handleMinutesChange}
          inputProps={{ min: 0 }}
        />
      </Box>
    </Box>
  );
};

export default TimeInput;