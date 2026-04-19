import React from 'react';
import { Box, IconButton, Tooltip, Button, useTheme, useMediaQuery } from '@mui/material';
import AtFlag from '../assets/flags/at.svg';
import GbFlag from '../assets/flags/gb.svg';
import { useTranslation } from '../i18n/LanguageProvider';

export default function LanguageSelector() {
  const { locale, setLocale, t } = useTranslation();
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box sx={{ marginLeft: 'auto', display: 'flex', gap: 1 }}>
      {compact ? (
        // small screens: show icon buttons only
        <>
          <Tooltip title={t('lang.de')}>
            <IconButton
              size="small"
              onClick={() => setLocale('de')}
              color="inherit"
              aria-label={t('lang.de')}
              sx={{ opacity: locale === 'de' ? 1 : 0.8 }}
            >
              <img src={AtFlag} alt={t('lang.de')} style={{ width: 18, height: 12, display: 'block' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('lang.en')}>
            <IconButton
              size="small"
              onClick={() => setLocale('en')}
              color="inherit"
              aria-label={t('lang.en')}
              sx={{ opacity: locale === 'en' ? 1 : 0.8 }}
            >
              <img src={GbFlag} alt={t('lang.en')} style={{ width: 18, height: 12, display: 'block' }} />
            </IconButton>
          </Tooltip>
        </>
      ) : (
        // larger screens: show button with flag and text
        <>
          <Button
            onClick={() => setLocale('de')}
            startIcon={<img src={AtFlag} alt="AT" style={{ width: 18, height: 12, display: 'block' }} />}
            color="inherit"
            variant="text"
            size="small"
            sx={{ fontWeight: locale === 'de' ? 700 : 500, textTransform: 'none' }}
          >
            {t('lang.de')}
          </Button>
          <Button
            onClick={() => setLocale('en')}
            startIcon={<img src={GbFlag} alt="GB" style={{ width: 18, height: 12, display: 'block' }} />}
            color="inherit"
            variant="text"
            size="small"
            sx={{ fontWeight: locale === 'en' ? 700 : 500, textTransform: 'none' }}
          >
            {t('lang.en')}
          </Button>
        </>
      )}
    </Box>
  );
}


