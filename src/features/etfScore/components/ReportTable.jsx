import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import { eur, pct, dateLabel } from '../../../utils/formatters';
import SectionTitle from '../../../components/SectionTitle';
import { useTranslation } from '../../../i18n/LanguageProvider';

/**
 * Per-report detail table. Rows above the average deemed/price ratio are
 * highlighted in amber so outlier years stand out immediately.
 *
 * @param {{
 *   reportMetrics: import('../api/scoreApi').ReportMetric[],
 *   avgDeemedIncomeToEtfPricePercent: number,
 * }} props
 */
export default function ReportTable({ reportMetrics, avgDeemedIncomeToEtfPricePercent }) {
  const { t } = useTranslation();
  const sorted = [...reportMetrics].sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <>
      <SectionTitle>{t('reportTable.title')}</SectionTitle>
      <TableContainer component={Paper} elevation={1}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 700, backgroundColor: 'grey.100' } }}>
              <TableCell>{t('reportTable.colDate')}</TableCell>
              <TableCell align="right">{t('reportTable.colDeemedEur')}</TableCell>
              <TableCell align="right">{t('reportTable.colPriceEur')}</TableCell>
              <TableCell align="right">{t('reportTable.colDeemedPct')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sorted.map((m, i) => (
              <TableRow key={i} hover sx={{ '&:last-child td': { border: 0 } }}>
                <TableCell>{dateLabel(m.date)}</TableCell>
                <TableCell align="right">{eur(m.deemedIncomeEur)}</TableCell>
                <TableCell align="right">{eur(m.etfPriceOnDateEur)}</TableCell>
                <TableCell align="right">
                  <Chip
                    label={pct(m.deemedIncomeToEtfPricePercent)}
                    size="small"
                    sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                    color={m.deemedIncomeToEtfPricePercent > avgDeemedIncomeToEtfPricePercent ? 'warning' : 'default'}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}

