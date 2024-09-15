import React, { useState, ChangeEvent } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  SelectChangeEvent,
  Switch,
  FormControlLabel
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import TimeInput from './TimeInput';
import { calculatePrintCost, CostBreakdown } from './costCalculations';
import { Analytics } from "@vercel/analytics/react"

const App: React.FC = () => {
  const [printTime, setPrintTime] = useState<{ hours: number; minutes: number }>({ hours: 0, minutes: 0 });
  const [filamentWeight, setFilamentWeight] = useState<string>('');
  const [electricityCost, setElectricityCost] = useState<string>('1.36');
  const [printerPower, setPrinterPower] = useState<string>('0.200');
  const [filamentCost, setFilamentCost] = useState<string>('100');
  const [costs, setCosts] = useState<CostBreakdown | null>(null);
  const [error, setError] = useState<string>('');
  const [currency, setCurrency] = useState<string>('PLN');
  const [showDepreciation, setShowDepreciation] = useState<boolean>(false);
  const [printerCost, setPrinterCost] = useState<string>('2800');
  const [printerLifespan, setPrinterLifespan] = useState<string>('5');
  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
  };

  const handlePrintTimeChange = (newValue: { hours: number; minutes: number }) => {
    setPrintTime(newValue);
  };

  const handleCalculate = () => {
    setError('');
    try {
      const timeInMinutes = printTime.hours * 60 + printTime.minutes;
      const weight = parseFloat(filamentWeight);
      if (isNaN(weight)) {
        throw new Error("Invalid filament weight. Please enter a number.");
      }
      const calculatedCosts = calculatePrintCost(
        timeInMinutes,
        weight,
        parseFloat(electricityCost),
        parseFloat(printerPower),
        parseFloat(filamentCost),
        showDepreciation,
        parseFloat(printerCost),
        parseFloat(printerLifespan)
      );
      setCosts(calculatedCosts);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    }
  };
  const handleCurrencyChange = (event: SelectChangeEvent) => {
    setCurrency(event.target.value as string);
  };

  const handleShowDepreciationChange = (event: ChangeEvent<HTMLInputElement>) => {
    setShowDepreciation(event.target.checked);
  };

  return (

    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="sm">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Cost Slicer: 3D Print Cost Calculator
          </Typography>
            <TimeInput value={printTime} onChange={handlePrintTimeChange} />

          <TextField
            fullWidth
            label="Projected Total Print Filament Weight (grams)"
            type="number"
            value={filamentWeight}
            onChange={handleInputChange(setFilamentWeight)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Electricity Cost (per kWh)"
            type="number"
            value={electricityCost}
            onChange={handleInputChange(setElectricityCost)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Printer Power Consumption (kW)"
            type="number"
            value={printerPower}
            onChange={handleInputChange(setPrinterPower)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Filament Cost (per kg)"
            type="number"
            value={filamentCost}
            onChange={handleInputChange(setFilamentCost)}
            margin="normal"
          />
          <Select
            value={currency}
            onChange={handleCurrencyChange}
            fullWidth
            sx={{ mt: 2 }}
          >
            <MenuItem value="PLN">PLN</MenuItem>
            <MenuItem value="USD">USD</MenuItem>
            <MenuItem value="EUR">EUR</MenuItem>
          </Select>
          <FormControlLabel
            control={
              <Switch
                checked={showDepreciation}
                onChange={handleShowDepreciationChange}
                color="primary"
              />
            }
            label="Include Printer Depreciation"
            sx={{ mt: 2 }}
          />
          {showDepreciation && (
            <>
              <TextField
                fullWidth
                label="Printer Cost"
                type="number"
                value={printerCost}
                onChange={handleInputChange(setPrinterCost)}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Printer Lifespan (years)"
                type="number"
                value={printerLifespan}
                onChange={handleInputChange(setPrinterLifespan)}
                margin="normal"
              />
            </>
          )}
          <Button variant="contained" onClick={handleCalculate} sx={{ mt: 2 }}>
            Slice Costs
          </Button>
          {error && (
            <Typography color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
          {costs && (
            <TableContainer component={Paper} sx={{ mt: 4 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Cost Type</TableCell>
                    <TableCell align="right">Amount ({currency})</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Electricity Cost</TableCell>
                    <TableCell align="right">{costs.electricityCost.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Filament Cost</TableCell>
                    <TableCell align="right">{costs.filamentCost.toFixed(2)}</TableCell>
                  </TableRow>
                  {showDepreciation && (
                    <TableRow>
                      <TableCell>Printer Depreciation</TableCell>
                      <TableCell align="right">{costs.depreciationCost.toFixed(2)}</TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell><strong>Total Cost</strong></TableCell>
                    <TableCell align="right"><strong>{costs.totalCost.toFixed(2)}</strong></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
                <Box sx={{ mt: 4, mb: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Made in Poland with ❤️
          </Typography>
        </Box>
      </Container>
      <Analytics />
    </LocalizationProvider>
  );
}

export default App;
