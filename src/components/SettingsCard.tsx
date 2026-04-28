import { useState } from 'react';
import {
  Box, Collapse, FormControlLabel, IconButton, Paper, Stack, Switch,
  ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { Currency } from '../lib/persistence';
import NumberField from './NumberField';
import PrinterPicker from './PrinterPicker';
import { PrinterPreset } from '../printers/types';
import { resolvePower } from '../printers/power';

interface Props {
  currency: Currency;
  onCurrencyChange: (c: Currency) => void;
  electricityCost: string;
  onElectricityCostChange: (v: string) => void;
  printerPower: string;
  onPrinterPowerChange: (v: string) => void;
  selectedPrinterId: string | null;
  onPrinterSelect: (preset: PrinterPreset | null) => void;
  filamentType: string | null;
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

const CURRENCIES: Currency[] = ['PLN', 'USD', 'EUR', 'GBP'];

const SettingsCard = (p: Props) => {
  const [open, setOpen] = useState(!p.startCollapsed);

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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 2 }}>
            <Typography variant="body2" color="text.secondary">Currency</Typography>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={p.currency}
              onChange={(_, v) => v && p.onCurrencyChange(v as Currency)}
              aria-label="currency"
            >
              {CURRENCIES.map(c => (
                <ToggleButton key={c} value={c} sx={{ px: 1.75, fontWeight: 600, letterSpacing: '0.04em' }}>{c}</ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>

          <PrinterPicker
            selectedId={p.selectedPrinterId}
            onSelect={(preset) => {
              p.onPrinterSelect(preset);
              if (preset) {
                const watts = resolvePower(preset, p.filamentType);
                p.onPrinterPowerChange((watts / 1000).toFixed(3));
              }
            }}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <NumberField
              fullWidth
              label="Electricity rate"
              value={p.electricityCost}
              onChange={p.onElectricityCostChange}
              suffix={`${p.currency}/kWh`}
            />
            <NumberField
              fullWidth
              label="Printer power"
              value={p.printerPower}
              onChange={p.onPrinterPowerChange}
              suffix="kW"
            />
          </Stack>

          <NumberField
            fullWidth
            label="Filament cost"
            value={p.filamentCost}
            onChange={p.onFilamentCostChange}
            suffix={`${p.currency}/kg`}
          />

          <FormControlLabel
            sx={{ mt: 1 }}
            control={<Switch checked={p.showDepreciation} onChange={(_, v) => p.onShowDepreciationChange(v)} />}
            label="Include printer depreciation"
          />
          <Collapse in={p.showDepreciation}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1 }}>
              <NumberField
                fullWidth
                label="Printer cost"
                value={p.printerCost}
                onChange={p.onPrinterCostChange}
                suffix={p.currency}
              />
              <NumberField
                fullWidth
                label="Printer lifespan"
                value={p.printerLifespan}
                onChange={p.onPrinterLifespanChange}
                suffix="years"
                decimal={false}
              />
            </Stack>
          </Collapse>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default SettingsCard;
