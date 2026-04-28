import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { CostBreakdown } from '../costCalculations';

interface Props {
  costs: CostBreakdown;
  currency: string;
  showDepreciation: boolean;
  grams: number;
  hours: number;
}

const Tile = ({ label, value, currency }: { label: string; value: number; currency: string }) => (
  <Paper sx={{ p: 2, flex: 1, minWidth: 0 }} variant="outlined">
    <Typography variant="caption" color="text.secondary">{label}</Typography>
    <Typography variant="h6" sx={{ mt: 0.5 }}>{value.toFixed(2)} {currency}</Typography>
  </Paper>
);

const ResultCard = ({ costs, currency, showDepreciation, grams, hours }: Props) => {
  const perGram = grams > 0 ? costs.totalCost / grams : 0;
  const perHour = hours > 0 ? costs.totalCost / hours : 0;

  const onCopy = () => {
    const lines = [
      `Cost Slicer summary`,
      `Total: ${costs.totalCost.toFixed(2)} ${currency}`,
      `Electricity: ${costs.electricityCost.toFixed(2)} ${currency}`,
      `Filament: ${costs.filamentCost.toFixed(2)} ${currency}`,
      ...(showDepreciation ? [`Depreciation: ${costs.depreciationCost.toFixed(2)} ${currency}`] : []),
      `Per gram: ${perGram.toFixed(3)} ${currency}/g`,
      `Per hour: ${perHour.toFixed(2)} ${currency}/h`,
    ];
    navigator.clipboard?.writeText(lines.join('\n'));
  };

  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Typography variant="caption" color="text.secondary">Total cost</Typography>
      <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
        {costs.totalCost.toFixed(2)} <Typography component="span" variant="h5" color="text.secondary">{currency}</Typography>
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
        <Tile label="Electricity" value={costs.electricityCost} currency={currency} />
        <Tile label="Filament" value={costs.filamentCost} currency={currency} />
        {showDepreciation && (
          <Tile label="Depreciation" value={costs.depreciationCost} currency={currency} />
        )}
      </Stack>

      <Box sx={{ mt: 2, color: 'text.secondary', fontSize: 14 }}>
        {perGram > 0 && <span>{perGram.toFixed(3)} {currency}/g · </span>}
        {perHour > 0 && <span>{perHour.toFixed(2)} {currency}/h</span>}
      </Box>

      <Button startIcon={<ContentCopyIcon />} onClick={onCopy} sx={{ mt: 2 }}>
        Copy summary
      </Button>
    </Paper>
  );
};

export default ResultCard;
