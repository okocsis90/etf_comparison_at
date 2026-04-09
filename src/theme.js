import { createTheme } from '@mui/material';

const theme = createTheme({
  palette: {
    primary: { main: '#1565c0' },
    secondary: { main: '#e65100' },
    background: { default: '#f5f5f5' },
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  shape: { borderRadius: 8 },
});

export default theme;

