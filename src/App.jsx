import { Box, Container, Typography, AppBar, Toolbar } from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';
import EtfScoreSearch from './features/etfScore/EtfScoreSearch';
export default function App() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'primary.main' }}>
        <Toolbar>
          <BarChartIcon sx={{ mr: 1.5 }} />
          <Typography variant="h6" fontWeight={700} letterSpacing={0.5}>
            ETF Comparison AT
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            ETF Score Analyser
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Enter an ISIN to calculate deemed income metrics, consistency scores, and price comparisons for Austrian tax purposes.
          </Typography>
        </Box>
        <EtfScoreSearch />
      </Container>
    </Box>
  );
}
