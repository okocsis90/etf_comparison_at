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
  const chartData = [...reportMetrics]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((m) => ({
      date: dateLabel(m.date),
      'Deemed Income': m.deemedIncomeEur,
      'ETF Price': m.etfPriceOnDateEur,
      'Deemed / Price %': m.deemedIncomeToEtfPricePercent,
    }));

  return (
    <>
      <SectionTitle>Yearly Report Metrics</SectionTitle>
      <Paper elevation={1} sx={{ p: 2, mb: 4 }}>
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={chartData} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis
              yAxisId="eur"
              orientation="left"
              tickFormatter={(v) => `€${v.toFixed(0)}`}
              tick={{ fontSize: 11 }}
              width={72}
            />
            <YAxis
              yAxisId="pct"
              orientation="right"
              tickFormatter={(v) => `${v.toFixed(2)}%`}
              tick={{ fontSize: 11 }}
              width={64}
            />
            <RechartsTooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: 13 }} />
            <Bar yAxisId="eur" dataKey="Deemed Income" fill="#e65100" opacity={0.85} radius={[3, 3, 0, 0]} />
            <Line yAxisId="eur" type="monotone" dataKey="ETF Price" stroke="#1976d2" strokeWidth={2} dot={{ r: 4 }} />
            <Line yAxisId="pct" type="monotone" dataKey="Deemed / Price %" stroke="#2e7d32" strokeWidth={2} strokeDasharray="5 3" dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </Paper>
    </>
  );
}

