import { createTheme } from '@mui/material/styles';
import { PaletteMode } from '@mui/material';

export const getTheme = (mode: PaletteMode) => createTheme({
  palette: {
    mode,
    primary: {
      main: mode === 'light' ? '#3f51b5' : '#90caf9',
    },
    secondary: {
      main: mode === 'light' ? '#f50057' : '#f48fb1',
    },
    background: {
      default: mode === 'light' ? '#f5f5f5' : '#303030',
      paper: mode === 'light' ? '#ffffff' : '#424242',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 3px 5px 2px rgba(0, 0, 0, .1)',
        },
      },
    },
  },
});