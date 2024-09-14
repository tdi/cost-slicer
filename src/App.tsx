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
  SelectChangeEvent
} from '@mui/material';

interface CostBreakdown {
  electricityCost: number;
  filamentCost: number;
  depreciationCost: number;
  totalCost: number;
}

const App: React.FC = () => {
  const [printTime, setPrintTime] = useState<string>('');
  const [filamentWeight, setFilamentWeight] = useState<string>('');
  const [electricityCost, setElectricityCost] = useState<string>('1.36');
  const [printerPower, setPrinterPower] = useState<string>('0.200');
  const [filamentCost, setFilamentCost] = useState<string>('100');
  const [costs, setCosts] = useState<CostBreakdown | null>(null);
  const [error, setError] = useState<string>('');
  const [currency, setCurrency] = useState<string>('PLN');

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
  };

  const parseTime = (timeStr: string): number => {
    const match = timeStr.match(/(?:(\d+)h)?(?:(\d+)m)?/);
    if (!match) {
      throw new Error("Invalid time format. Please use the format 'XhYm', e.g., '4h30m' or '45m'.");
    }
    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    return hours * 60 + minutes;
  };

  const calculatePrintCost = (printTimeMinutes: number, filamentWeightGrams: number): CostBreakdown => {
    const printTimeHours = printTimeMinutes / 60;
    const electricityCostValue = parseFloat(electricityCost);
    const printerPowerValue = parseFloat(printerPower);
    const filamentCostValue = parseFloat(filamentCost);

    const electricityCostResult = printTimeHours * printerPowerValue * electricityCostValue;
    const filamentCostResult = (filamentWeightGrams / 1000) * filamentCostValue;
    const depreciationCost = 0;
    const totalCost = electricityCostResult + filamentCostResult + depreciationCost;

    return { electricityCost: electricityCostResult, filamentCost: filamentCostResult, depreciationCost, totalCost };
  };

  const handleCalculate = () => {
    setError('');
    try {
      const timeInMinutes = parseTime(printTime);
      const weight = parseFloat(filamentWeight);
      if (isNaN(weight)) {
        throw new Error("Invalid filament weight. Please enter a number.");
      }
      const calculatedCosts = calculatePrintCost(timeInMinutes, weight);
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

  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Cost Slicer: 3D Print Cost Calculator
        </Typography>
        <TextField
          fullWidth
          label="Projected Model Print Time (e.g., 4h30m)"
          value={printTime}
          onChange={handleInputChange(setPrintTime)}
          margin="normal"
        />
        <TextField
          fullWidth
          label="Projected Print Filament Weight (grams)"
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
                <TableRow>
                  <TableCell>Printer Depreciation</TableCell>
                  <TableCell align="right">{costs.depreciationCost.toFixed(2)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><strong>Total Cost</strong></TableCell>
                  <TableCell align="right"><strong>{costs.totalCost.toFixed(2)}</strong></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Container>
  );
}

export default App;