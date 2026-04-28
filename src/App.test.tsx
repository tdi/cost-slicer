import { render, screen } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';

test('renders Cost Slicer hero title', () => {
  render(<HelmetProvider><App /></HelmetProvider>);
  expect(screen.getByRole('heading', { level: 1, name: /cost slicer/i })).toBeInTheDocument();
});

test('renders Suggestions & issues link', () => {
  render(<HelmetProvider><App /></HelmetProvider>);
  const link = screen.getByRole('link', { name: /suggestions & issues/i });
  expect(link).toHaveAttribute('href', 'https://github.com/tdi/cost-slicer/issues');
  expect(link).toHaveAttribute('target', '_blank');
});
