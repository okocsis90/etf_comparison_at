import { createTheme } from '@mui/material';

export default function createAppTheme(mode = 'light') {
  const dark = mode === 'dark';
  return createTheme({
    palette: {
      mode,
      primary: dark
        ? { main: '#70bddb', dark: '#4c9cbb', light: '#b4e0ef' }
        : { main: '#155e85', dark: '#104665', light: '#e4f0f5' },
      secondary: dark
        ? { main: '#65d6a5', dark: '#40b982', light: '#a0ebca' }
        : { main: '#2f9e74', dark: '#247a59', light: '#e4f4ec' },
      background: dark
        ? { default: '#101a20', paper: '#18262e' }
        : { default: '#f3f7f6', paper: '#ffffff' },
      text: dark
        ? { primary: '#e6eff2', secondary: '#a9bbc3' }
        : { primary: '#182b36', secondary: '#5c6d76' },
      divider: dark ? 'rgba(220, 238, 244, 0.12)' : 'rgba(24, 43, 54, 0.12)',
    },
    typography: {
      fontFamily: 'Inter, system-ui, sans-serif',
      h4: { letterSpacing: '-0.035em' },
      button: { fontWeight: 700, textTransform: 'none' },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiButton: {
        styleOverrides: {
          root: { borderRadius: 10, boxShadow: 'none' },
          contained: {
            '&:hover': {
              boxShadow: dark
                ? '0 4px 12px rgba(0, 0, 0, 0.28)'
                : '0 4px 12px rgba(21, 94, 133, 0.2)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: { borderRadius: 10 },
        },
      },
    },
  });
}
