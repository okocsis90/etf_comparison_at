import {
  Alert,
  Box,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useTranslation } from '../i18n/LanguageProvider';

export default function EtfPartialResult({ data, compact = false }) {
  const { t } = useTranslation();
  const reports = data.reports ?? [];
  const warnings = data.warnings ?? [];

  return (
    <Paper elevation={compact ? 1 : 2} sx={{ p: 2, mb: 2 }}>
      <Alert severity="warning" sx={{ mb: 2 }}>
        <Typography component="div" fontWeight={700}>
          {t('etfScore.partialTitle')}
        </Typography>
        <Typography component="div" variant="body2">
          {t('etfScore.partialBody')}
        </Typography>
      </Alert>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
        {data.name && <Typography fontWeight={700}>{data.name}</Typography>}
        <Typography variant="body2" fontFamily="monospace">{data.isin}</Typography>
        {data.ticker && <Chip label={data.ticker} size="small" variant="outlined" color="secondary" />}
        {data.originalCurrency && (
          <Chip label={data.originalCurrency} size="small" variant="outlined" color="primary" />
        )}
      </Box>

      {data.currentPrice && (
        <Typography variant="body2" sx={{ mb: 1.5 }}>
          {t('etfScore.partialCurrentPrice')}: {data.currentPrice.value} {data.currentPrice.currency ?? ''}
        </Typography>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {t('etfScore.partialReports', { count: reports.length })}
      </Typography>

      {reports.length > 0 && !compact && (
        <Table size="small" aria-label={t('etfScore.partialReportsTable')}>
          <TableHead>
            <TableRow>
              <TableCell>{t('reportTable.colDate')}</TableCell>
              <TableCell align="right">
                {t('etfScore.partialDeemedIncome')}
                {data.originalCurrency ? ` (${data.originalCurrency})` : ''}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reports.map((report, index) => (
              <TableRow key={`${report.date}-${index}`}>
                <TableCell>{report.date}</TableCell>
                <TableCell align="right">{report.deemedIncome}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {warnings.length > 0 && (
        <Box component="ul" sx={{ mt: 1.5, mb: 0, pl: 2.5 }}>
          {warnings.map((warning, index) => (
            <Typography component="li" variant="body2" key={`${warning.type}-${index}`}>
              {warning.message}
            </Typography>
          ))}
        </Box>
      )}
    </Paper>
  );
}
