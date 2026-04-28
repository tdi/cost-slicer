import { useEffect, useMemo, useReducer, useState } from 'react';
import { Box, Button, Container, CssBaseline, Stack, ThemeProvider, Typography, useMediaQuery } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { Helmet } from 'react-helmet-async';
import { Analytics } from '@vercel/analytics/react';

import { themeForMode } from './theme';
import { calculatePrintCost, CostBreakdown } from './costCalculations';
import { formReducer, initialState } from './state/formReducer';
import { loadSettings, saveSettings, PersistedSettings } from './lib/persistence';
import FileDropZone from './components/FileDropZone';
import JobInputsCard from './components/JobInputsCard';
import SettingsCard from './components/SettingsCard';
import ResultCard from './components/ResultCard';
import Footer from './components/Footer';
import { ParseError } from './gcode/types';

const settingsFromState = (s: typeof initialState): PersistedSettings => ({
  electricityCost: s.electricityCost,
  printerPower: s.printerPower,
  filamentCost: s.filamentCost,
  currency: s.currency,
  showDepreciation: s.showDepreciation,
  printerCost: s.printerCost,
  printerLifespan: s.printerLifespan,
});

const App = () => {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const theme = useMemo(() => themeForMode(prefersDark ? 'dark' : 'light'), [prefersDark]);

  const [state, dispatch] = useReducer(formReducer, initialState);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [costs, setCosts] = useState<CostBreakdown | null>(null);
  const [error, setError] = useState('');
  const [hadPersistedOnLoad, setHadPersistedOnLoad] = useState(false);

  useEffect(() => {
    const persisted = loadSettings();
    if (persisted) {
      dispatch({ type: 'hydrate', payload: persisted });
      setHadPersistedOnLoad(true);
    }
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    const id = setTimeout(() => saveSettings(settingsFromState(state)), 300);
    return () => clearTimeout(id);
  }, [hasHydrated, state]);

  const handleCalculate = () => {
    setError('');
    setCosts(null);
    try {
      const t = state.printTime.hours * 60 + state.printTime.minutes;
      const w = parseFloat(state.filamentWeight);
      if (!Number.isFinite(w)) throw new Error('Enter a filament weight in grams.');
      const r = calculatePrintCost(
        t, w,
        parseFloat(state.electricityCost),
        parseFloat(state.printerPower),
        parseFloat(state.filamentCost),
        state.showDepreciation,
        parseFloat(state.printerCost),
        parseFloat(state.printerLifespan),
      );
      setCosts(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    }
  };

  const handleParseError = (err: ParseError) => {
    setError(err.message);
    setCosts(null);
  };

  const importedSummary = state.importSource ? {
    source: state.importSource,
    printer: state.printerModel,
    filamentType: state.filamentType,
    grams: parseFloat(state.filamentWeight) || null,
    hoursLabel: `${state.printTime.hours}h ${state.printTime.minutes}m`,
    thumbnailDataUrl: state.thumbnailDataUrl,
  } : null;

  const dynamicTitle = state.importSource && state.printerModel
    ? `Cost Slicer — ${state.printerModel}${state.filamentType ? ` · ${state.filamentType}` : ''}`
    : 'Cost Slicer — 3D Print Cost Calculator';

  return (
    <ThemeProvider theme={theme}>
      <Helmet><title>{dynamicTitle}</title></Helmet>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Container maxWidth="md" sx={{ py: { xs: 3, sm: 5 } }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h1" component="h1" sx={{ color: 'primary.main' }}>Cost Slicer</Typography>
            <Typography variant="body1" color="text.secondary">
              Estimate the real cost of any 3D print in seconds.
            </Typography>
          </Box>

          <Stack spacing={3}>
            <FileDropZone
              onImport={(job) => { setError(''); dispatch({ type: 'import', payload: job }); }}
              onError={handleParseError}
              imported={importedSummary}
              onClearImport={() => dispatch({ type: 'clearImport' })}
            />
            <JobInputsCard
              printTime={state.printTime}
              onPrintTimeChange={(v) => dispatch({ type: 'setPrintTime', value: v })}
              filamentWeight={state.filamentWeight}
              onFilamentWeightChange={(v) => dispatch({ type: 'setField', field: 'filamentWeight', value: v })}
              estimated={state.filamentWeightEstimated}
            />
            <SettingsCard
              currency={state.currency}
              onCurrencyChange={(v) => dispatch({ type: 'setField', field: 'currency', value: v })}
              electricityCost={state.electricityCost}
              onElectricityCostChange={(v) => dispatch({ type: 'setField', field: 'electricityCost', value: v })}
              printerPower={state.printerPower}
              onPrinterPowerChange={(v) => dispatch({ type: 'setField', field: 'printerPower', value: v })}
              filamentCost={state.filamentCost}
              onFilamentCostChange={(v) => dispatch({ type: 'setField', field: 'filamentCost', value: v })}
              showDepreciation={state.showDepreciation}
              onShowDepreciationChange={(v) => dispatch({ type: 'setField', field: 'showDepreciation', value: v })}
              printerCost={state.printerCost}
              onPrinterCostChange={(v) => dispatch({ type: 'setField', field: 'printerCost', value: v })}
              printerLifespan={state.printerLifespan}
              onPrinterLifespanChange={(v) => dispatch({ type: 'setField', field: 'printerLifespan', value: v })}
              startCollapsed={hadPersistedOnLoad}
            />

            <Button variant="contained" size="large" onClick={handleCalculate}>
              Slice Costs
            </Button>

            {error && (
              <Typography color="error">{error}</Typography>
            )}
            {costs && (
              <ResultCard
                costs={costs}
                currency={state.currency}
                showDepreciation={state.showDepreciation}
                grams={parseFloat(state.filamentWeight) || 0}
                hours={state.printTime.hours + state.printTime.minutes / 60}
              />
            )}
          </Stack>

          <Footer />
        </Container>
        <Analytics />
      </LocalizationProvider>
    </ThemeProvider>
  );
};

export default App;
