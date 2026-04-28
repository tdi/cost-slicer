import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResultCard from './ResultCard';

const costs = { electricityCost: 0.4, filamentCost: 5, depreciationCost: 1, totalCost: 6.4 };

test('renders three stat tiles and total', () => {
  render(<ResultCard costs={costs} currency="PLN" showDepreciation grams={50} hours={2} />);
  expect(screen.getByText(/6\.40/)).toBeInTheDocument();
  expect(screen.getByText(/Electricity/i)).toBeInTheDocument();
  expect(screen.getByText(/Filament/i)).toBeInTheDocument();
  expect(screen.getByText(/Depreciation/i)).toBeInTheDocument();
});

test('hides depreciation tile when disabled', () => {
  render(<ResultCard costs={{ ...costs, depreciationCost: 0 }} currency="PLN" showDepreciation={false} grams={50} hours={2} />);
  expect(screen.queryByText(/Depreciation/i)).not.toBeInTheDocument();
});

test('copy summary writes formatted text to clipboard', async () => {
  const writeText = jest.fn().mockResolvedValue(undefined);
  Object.assign(navigator, { clipboard: { writeText } });
  render(<ResultCard costs={costs} currency="PLN" showDepreciation grams={50} hours={2} />);
  await userEvent.click(screen.getByRole('button', { name: /copy summary/i }));
  expect(writeText).toHaveBeenCalledWith(expect.stringContaining('Total: 6.40 PLN'));
});
