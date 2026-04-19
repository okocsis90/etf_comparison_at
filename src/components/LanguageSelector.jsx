import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import { useTranslation } from '../i18n/LanguageProvider';

export default function LanguageSelector() {
  const { locale, setLocale, t } = useTranslation();

  return (
    <Box sx={{ marginLeft: 'auto', display: 'flex', gap: 1 }}>
      <Tooltip title={t('lang.de')}>
        <IconButton size="small" onClick={() => setLocale('de')} color={locale === 'de' ? 'inherit' : 'default'}>
          <span style={{ fontSize: 18 }}>🇦🇹</span>
        </IconButton>
      </Tooltip>
      <Tooltip title={t('lang.en')}>
        <IconButton size="small" onClick={() => setLocale('en')} color={locale === 'en' ? 'inherit' : 'default'}>
          <span style={{ fontSize: 18 }}>🇬🇧</span>
        </IconButton>
      </Tooltip>
    </Box>
  );
}


