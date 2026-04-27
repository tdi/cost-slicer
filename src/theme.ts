import { createTheme, ThemeOptions } from '@mui/material/styles';

const ACCENT = '#D97757';
const ACCENT_DARK = '#B85F44';

export const buildTheme = (mode: 'light' | 'dark'): ThemeOptions => ({
  palette: {
    mode,
    primary: { main: mode === 'dark' ? ACCENT_DARK : ACCENT, contrastText: '#ffffff' },
    background: mode === 'dark'
      ? { default: '#121212', paper: '#1c1c1c' }
      : { default: '#fafaf7', paper: '#ffffff' },
  },
  shape: { borderRadius: 12 },
  typography: {
    h1: { fontSize: '2.25rem', fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontSize: '1.25rem', fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiPaper: { defaultProps: { elevation: 1 } },
    MuiButton: { styleOverrides: { root: { borderRadius: 10 } } },
    MuiTextField: { defaultProps: { variant: 'outlined', size: 'small' } },
  },
});

export const themeForMode = (mode: 'light' | 'dark') => createTheme(buildTheme(mode));
