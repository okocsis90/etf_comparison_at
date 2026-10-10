import { createTheme } from '@mui/material';

const theme = createTheme({
  palette: {
    primary: { main: '#155e85', dark: '#104665', light: '#e4f0f5' },
    secondary: { main: '#2f9e74', dark: '#247a59', light: '#e4f4ec' },
    background: { default: '#f3f7f6', paper: '#ffffff' },
    text: { primary: '#182b36', secondary: '#5c6d76' },
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
          '&:hover': { boxShadow: '0 4px 12px rgba(21, 94, 133, 0.2)' },
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

export default theme;
