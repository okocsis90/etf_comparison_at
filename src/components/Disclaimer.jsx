import { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { useTranslation } from '../i18n/LanguageProvider';

const DISCLAIMER_STORAGE_KEY = 'etf-comparison-disclaimer-accepted-v1';

export default function Disclaimer() {
  const { locale, setLocale, t } = useTranslation();
  const [open, setOpen] = useState(
    () => localStorage.getItem(DISCLAIMER_STORAGE_KEY) !== 'true'
  );

  const acceptDisclaimer = () => {
    localStorage.setItem(DISCLAIMER_STORAGE_KEY, 'true');
    setOpen(false);
  };

  return (
    <>
      <Dialog
        open={open}
        disableEscapeKeyDown
        maxWidth="sm"
        fullWidth
        aria-labelledby="disclaimer-title"
      >
        <DialogTitle id="disclaimer-title">{t('disclaimer.title')}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 2 }}>
            {['de', 'en'].map((language) => (
              <Button
                key={language}
                size="small"
                variant={locale === language ? 'contained' : 'outlined'}
                onClick={() => setLocale(language)}
              >
                {t(`lang.${language}`)}
              </Button>
            ))}
          </Box>
          <Typography paragraph>{t('disclaimer.intro')}</Typography>
          <Typography paragraph>{t('disclaimer.advice')}</Typography>
          <Typography>{t('disclaimer.reliance')}</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="contained" onClick={acceptDisclaimer} autoFocus>
            {t('disclaimer.accept')}
          </Button>
        </DialogActions>
      </Dialog>

      <Box component="footer" sx={{ mt: 'auto', py: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'white' }}>
        <Container maxWidth="lg">
          <Typography variant="caption" color="text.secondary" textAlign="center" display="block">
            {t('disclaimer.footer')}
          </Typography>
        </Container>
      </Box>
    </>
  );
}
