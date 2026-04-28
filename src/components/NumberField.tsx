import { ChangeEvent } from 'react';
import { InputAdornment, TextField, TextFieldProps } from '@mui/material';

type Props = Omit<TextFieldProps, 'onChange' | 'type'> & {
  value: string;
  onChange: (next: string) => void;
  suffix?: string;
  decimal?: boolean;
};

const sanitize = (raw: string, decimal: boolean): string => {
  const cleaned = raw.replace(decimal ? /[^0-9.]/g : /[^0-9]/g, '');
  if (!decimal) return cleaned;
  // collapse multiple dots — keep the first
  const firstDot = cleaned.indexOf('.');
  if (firstDot === -1) return cleaned;
  return cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '');
};

const NumberField = ({ value, onChange, suffix, decimal = true, InputProps, helperText, sx, ...rest }: Props) => (
  <TextField
    {...rest}
    type="text"
    value={value}
    onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(sanitize(e.target.value, decimal))}
    inputProps={{ inputMode: decimal ? 'decimal' : 'numeric', pattern: decimal ? '[0-9]*[.,]?[0-9]*' : '[0-9]*', autoComplete: 'off', ...rest.inputProps }}
    InputProps={{
      ...(InputProps || {}),
      endAdornment: suffix ? <InputAdornment position="end">{suffix}</InputAdornment> : InputProps?.endAdornment,
    }}
    helperText={helperText ?? ' '}
    sx={{
      '& .MuiFormHelperText-root': { minHeight: '1.25em' },
      ...sx,
    }}
  />
);

export default NumberField;
