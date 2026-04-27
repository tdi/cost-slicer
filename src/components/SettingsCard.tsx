import { ChangeEvent, useState } from 'react';
import {
  Box, Collapse, FormControlLabel, IconButton, InputAdornment, MenuItem, Paper,
  Select, SelectChangeEvent, Stack, Switch, TextField, Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { Currency } from '../lib/persistence';

interface Props {
  currency: Currency;
  onCurrencyChange: (c: Currency) => void;
  electricityCost: string;
  onElectricityCostChange: (v: string) => void;
  printerPower: string;
  onPrinterPowerChange: (v: string) => void;
  filamentCost: string;
  onFilamentCostChange: (v: string) => void;
  showDepreciation: boolean;
  onShowDepreciationChange: (v: boolean) => void;
  printerCost: string;
  onPrinterCostChange: (v: string) => void;
  printerLifespan: string;
  onPrinterLifespanChange: (v: string) => void;
  startCollapsed?: boolean;
}

const SettingsCard = (p: Props) => {
  const [open, setOpen] = useState(!p.startCollapsed);

  const onText = (setter: (v: string) => void) =>
    (e: ChangeEvent<HTMLInputElement>) => setter(e.target.value);

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography variant="h2" component="h2" sx={{ flex: 1 }}>Cost settings</Typography>
        <IconButton onClick={() => setOpen(o => !o)} aria-label={open ? 'collapse settings' : 'expand settings'}>
          {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>
      <Collapse in={open}>
        <Box sx={{ mt: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Select fullWidth size="small" value={p.currency} onChange={(e: SelectChangeEvent) => p.onCurrencyChange(e.target.value as Currency)}>
              <MenuItem value="PLN">PLN</MenuItem>
              <MenuItem value="USD">USD</MenuItem>
              <MenuItem value="EUR">EUR</MenuItem>
              <MenuItem value="GBP">GBP</MenuItem>
            </Select>
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
            <TextField fullWidth label="Electricity rate" type="number" value={p.electricityCost} onChange={onText(p.onElectricityCostChange)}
              InputProps={{ endAdornment: <InputAdornment position="end">{p.currency}/kWh</InputAdornment> }} />
            <TextField fullWidth label="Printer power" type="number" value={p.printerPower} onChange={onText(p.onPrinterPowerChange)}
              InputProps={{ endAdornment: <InputAdornment position="end">kW</InputAdornment> }} />
          </Stack>
          <TextField fullWidth label="Filament cost" type="number" value={p.filamentCost} onChange={onText(p.onFilamentCostChange)}
            sx={{ mt: 2 }}
            InputProps={{ endAdornment: <InputAdornment position="end">{p.currency}/kg</InputAdornment> }} />
          <FormControlLabel
            sx={{ mt: 2 }}
            control={<Switch checked={p.showDepreciation} onChange={(_, v) => p.onShowDepreciationChange(v)} />}
            label="Include printer depreciation"
          />
          <Collapse in={p.showDepreciation}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1 }}>
              <TextField fullWidth label="Printer cost" type="number" value={p.printerCost} onChange={onText(p.onPrinterCostChange)}
                InputProps={{ endAdornment: <InputAdornment position="end">{p.currency}</InputAdornment> }} />
              <TextField fullWidth label="Printer lifespan" type="number" value={p.printerLifespan} onChange={onText(p.onPrinterLifespanChange)}
                InputProps={{ endAdornment: <InputAdornment position="end">years</InputAdornment> }} />
            </Stack>
          </Collapse>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default SettingsCard;
