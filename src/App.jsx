import { useEffect, useMemo, useState } from 'react';
import { Box, Container, Typography, AppBar, Toolbar, Tabs, Tab, ThemeProvider, CssBaseline } from '@mui/material';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { EtfScoreSearch } from './features/etfScore';
import { EtfComparisonSearch } from './features/etfComparison';
import { LanguageProvider, useTranslation } from './i18n/LanguageProvider';
import LanguageSelector from './components/LanguageSelector';
import ColorModeToggle from './components/ColorModeToggle';
import BrandLogo from './components/BrandLogo';
import Disclaimer from './components/Disclaimer';
import createAppTheme from './theme';

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
  const [mode, setMode] = useState(
    () => localStorage.getItem('etf-comparison-color-mode') === 'dark' ? 'dark' : 'light'
  );
  const theme = useMemo(() => createAppTheme(mode), [mode]);

  const toggleColorMode = () => {
    const nextMode = mode === 'light' ? 'dark' : 'light';
    localStorage.setItem('etf-comparison-color-mode', nextMode);
    setMode(nextMode);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LanguageProvider defaultLocale="de">
        <AppInner mode={mode} onToggleColorMode={toggleColorMode} />
      </LanguageProvider>
    </ThemeProvider>
  );
}

function AppInner({ mode, onToggleColorMode }) {
  const [activeTab, setActiveTab] = useState(0);
  const { locale, t } = useTranslation();
  const TABS = TabsDef();
  const current = TABS[activeTab];

  useEffect(() => {
    const title = t('seo.title');
    const description = t('seo.description');
    document.title = title;
    document.documentElement.lang = locale;

    document.querySelector('meta[name="description"]')?.setAttribute('content', description);
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
    document.querySelector('meta[property="og:locale"]')?.setAttribute('content', t('seo.locale'));
    document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', title);
    document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', description);
  }, [locale, t]);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>

      {/* ── App bar ──────────────────────────────────────────────────────── */}
      <AppBar
        position="static"
        elevation={0}
        sx={{
          bgcolor: 'transparent',
          backgroundImage: 'linear-gradient(110deg, #12344a 0%, #155e85 72%, #167c79 100%)',
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 3,
            background: 'linear-gradient(90deg, #2f9e74, #83d3a2 55%, transparent)',
          },
        }}
      >
        <Toolbar sx={{ alignItems: 'center', minHeight: { xs: 58, sm: 72 }, px: { xs: 1.5, sm: 3 }, gap: { xs: 0, sm: 0.5 } }}>
          <BrandLogo size={32} />
          <Box sx={{ ml: { xs: 0.75, sm: 1 }, minWidth: 0 }}>
            <Typography
              variant="h6"
              fontSize={{ xs: '0.9rem', sm: '1.25rem' }}
              fontWeight={800}
              letterSpacing={0.1}
              color="common.white"
              noWrap
            >
              {t('appTitle')}
            </Typography>
          </Box>

          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: { xs: 0, sm: 1 }, flexShrink: 0 }}>
            <ColorModeToggle mode={mode} onToggle={onToggleColorMode} />
            <LanguageSelector />
          </Box>
        </Toolbar>
      </AppBar>

      {/* ── Navigation tabs ──────────────────────────────────────────────── */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            textColor="primary"
            indicatorColor="secondary"
            sx={{
              minHeight: { xs: 50, sm: 58 },
              '& .MuiTab-root': {
                minHeight: { xs: 50, sm: 58 },
                minWidth: { xs: 0, sm: 120 },
                px: { xs: 1.5, sm: 2 },
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                fontWeight: 700,
                textTransform: 'none',
              },
              '& .MuiTab-iconWrapper': { fontSize: { xs: 18, sm: 20 } },
              '& .MuiTabs-flexContainer': { justifyContent: { xs: 'space-around', sm: 'flex-start' } },
              '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0' },
            }}
          >
            {TABS.map((tab, i) => (
              <Tab key={i} label={tab.label} icon={tab.icon} iconPosition="start" />
            ))}
          </Tabs>
        </Container>
      </Box>

      {/* ── Page content ─────────────────────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 5 }, px: { xs: 1.5, sm: 3 }, flexGrow: 1 }}>
        <Box
          sx={{
            mb: 3,
            p: { xs: 2, sm: 3.5 },
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            background: mode === 'dark'
              ? 'linear-gradient(115deg, #1b342f, #1c3039 72%, #18262e)'
              : 'linear-gradient(115deg, rgba(228, 244, 236, 0.9), rgba(228, 240, 245, 0.75) 72%, #fff)',
          }}
        >
          <Typography variant="h4" fontSize={{ xs: '1.45rem', sm: '2.125rem' }} fontWeight={800} gutterBottom>
            {current.title}
          </Typography>
          <Typography variant="body1" fontSize={{ xs: '0.9rem', sm: '1rem' }} color="text.secondary" sx={{ maxWidth: 850, lineHeight: 1.7 }}>
            {current.description}
          </Typography>
        </Box>

        {/* All tab panels stay mounted so their state survives tab switches. */}
        {TABS.map((tab, i) => (
          <Box
            key={i}
            sx={{
              display: activeTab === i ? 'block' : 'none',
              p: { xs: 1.5, sm: 3 },
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              boxShadow: mode === 'dark'
                ? '0 10px 32px rgba(0, 0, 0, 0.18)'
                : '0 10px 32px rgba(24, 43, 54, 0.045)',
            }}
          >
            {tab.component}
          </Box>
        ))}
      </Container>

      <Disclaimer />
    </Box>
  );
}
