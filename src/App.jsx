import { useState } from 'react';
import { Box, Container, Typography, AppBar, Toolbar, Tabs, Tab } from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { EtfScoreSearch } from './features/etfScore';
import { EtfComparisonSearch } from './features/etfComparison';
import { LanguageProvider, useTranslation } from './i18n/LanguageProvider';
import LanguageSelector from './components/LanguageSelector';
import BrandLogo from './components/BrandLogo';

function TabsDef() {
  const { t } = useTranslation();
  return [
    {
      label: t('tabs.analyser.label'),
      icon: <AnalyticsIcon />,
      title: t('tabs.analyser.title'),
      description: t('tabs.analyser.description'),
      component: <EtfScoreSearch />,
    },
    {
      label: t('tabs.compare.label'),
      icon: <CompareArrowsIcon />,
      title: t('tabs.compare.title'),
      description: t('tabs.compare.description'),
      component: <EtfComparisonSearch />,
    },
  ];
}

export default function App() {
  return (
    <LanguageProvider defaultLocale="de">
      <AppInner />
    </LanguageProvider>
  );
}

function AppInner() {
  const [activeTab, setActiveTab] = useState(0);
  const { t } = useTranslation();
  const TABS = TabsDef();
  const current = TABS[activeTab];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>

      {/* ── App bar ──────────────────────────────────────────────────────── */}
      <AppBar
        position="static"
        elevation={4}
        sx={{
          bgcolor: 'transparent',
          backgroundImage: 'linear-gradient(90deg, #0d47a1 0%, #1565c0 60%)',
        }}
      >
        <Toolbar sx={{ alignItems: 'center' }}>
          <BrandLogo size={36} />
          <Box sx={{ ml: 1 }}>
            <Typography variant="h6" fontWeight={800} letterSpacing={0.5} color="common.white">
              {t('appTitle')}
            </Typography>
          </Box>

          <Box sx={{ ml: 'auto' }}>
            <LanguageSelector />
          </Box>
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

        {/* All tab panels stay mounted so their state survives tab switches. */}
        {TABS.map((tab, i) => (
          <Box key={i} sx={{ display: activeTab === i ? 'block' : 'none' }}>
            {tab.component}
          </Box>
        ))}
      </Container>

    </Box>
  );
}
