import { useState } from 'react';
import { Box, Container, Typography, AppBar, Toolbar, Tabs, Tab } from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { EtfScoreSearch } from './features/etfScore';
import { EtfComparisonSearch } from './features/etfComparison';

const TABS = [
  {
    label: 'ETF Analyser',
    icon: <AnalyticsIcon />,
    title: 'ETF Score Analyser',
    description: 'Enter an ISIN to calculate deemed income metrics, consistency scores, and price comparisons for Austrian tax purposes.',
    component: <EtfScoreSearch />,
  },
  {
    label: 'Compare ETFs',
    icon: <CompareArrowsIcon />,
    title: 'ETF Comparison',
    description: 'Compare 2 to 4 ETFs side by side across all Austrian tax efficiency metrics. The best value in each row is highlighted.',
    component: <EtfComparisonSearch />,
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState(0);
  const current = TABS[activeTab];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>

      {/* ── App bar ──────────────────────────────────────────────────────── */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'primary.main' }}>
        <Toolbar>
          <BarChartIcon sx={{ mr: 1.5 }} />
          <Typography variant="h6" fontWeight={700} letterSpacing={0.5}>
            ETF Comparison AT
          </Typography>
        </Toolbar>
      </AppBar>

      {/* ── Navigation tabs ──────────────────────────────────────────────── */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'white' }}>
        <Container maxWidth="lg">
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            textColor="primary"
            indicatorColor="primary"
          >
            {TABS.map((tab, i) => (
              <Tab key={i} label={tab.label} icon={tab.icon} iconPosition="start" />
            ))}
          </Tabs>
        </Container>
      </Box>

      {/* ── Page content ─────────────────────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            {current.title}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {current.description}
          </Typography>
        </Box>
        {current.component}
      </Container>

    </Box>
  );
}
