import { Box, Paper, Typography } from '@mui/material';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';
import { eur, dateLabel } from '../../../utils/formatters';
import SectionTitle from '../../../components/SectionTitle';
import { useTranslation } from '../../../i18n/LanguageProvider';

// ── File-local tooltip rendered inside the chart ──────────────────────────────

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <Paper elevation={4} sx={{ p: 1.5, minWidth: 200 }}>
      <Typography variant="caption" fontWeight={700} display="block" mb={0.5}>
        {label}
      </Typography>
      {payload.map((entry) => (
        <Box key={entry.name} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <Typography variant="caption" color={entry.color}>{entry.name}</Typography>
          <Typography variant="caption" fontWeight={600}>
            {typeof entry.value === 'number' && entry.name.includes('%')
              ? `${entry.value.toFixed(4)} %`
              : eur(entry.value)}
          </Typography>
        </Box>
      ))}
    </Paper>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Bar + line composed chart of yearly deemed income, ETF price, and the
 * deemed/price percentage for each report date.
 *
 * @param {{ reportMetrics: import('../api/scoreApi').ReportMetric[] }} props
 */
export default function ReportChart({ reportMetrics }) {
  const { t } = useTranslation();
  const chartData = [...reportMetrics]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((m) => ({
      date: dateLabel(m.date),
      [t('reportChart.deemedIncome')]: m.deemedIncomeEur,
      [t('reportChart.etfPrice')]: m.etfPriceOnDateEur,
      [t('reportChart.deemedPct')]: m.deemedIncomeToEtfPricePercent,
    }));

  return (
    <>
      <SectionTitle>{t('reportChart.title')}</SectionTitle>
      <Paper elevation={1} sx={{ p: { xs: 0.5, sm: 2 }, mb: 4, minWidth: 0, overflow: 'hidden' }}>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={chartData} margin={{ top: 8, right: 6, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#dce6e7" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis
              yAxisId="eur"
              orientation="left"
              tickFormatter={(v) => `€${v.toFixed(0)}`}
              tick={{ fontSize: 11 }}
              width={48}
            />
            <YAxis
              yAxisId="pct"
              orientation="right"
              tickFormatter={(v) => `${v.toFixed(2)}%`}
              tick={{ fontSize: 11 }}
              width={44}
            />
            <RechartsTooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: 13 }} />
            <Bar yAxisId="eur" dataKey={t('reportChart.deemedIncome')} fill="#b68a47" opacity={0.9} radius={[3, 3, 0, 0]} />
            <Line yAxisId="eur" type="monotone" dataKey={t('reportChart.etfPrice')} stroke="#155e85" strokeWidth={2} dot={{ r: 4 }} />
            <Line yAxisId="pct" type="monotone" dataKey={t('reportChart.deemedPct')} stroke="#2f876a" strokeWidth={2} strokeDasharray="5 3" dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </Paper>
    </>
  );
}
