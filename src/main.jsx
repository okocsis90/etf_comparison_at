import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import App from './App.jsx';
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
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
