import {
  Box,
  Typography,
  Grid,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import MetricCard from './MetricCard';

// ── Formatters ────────────────────────────────────────────────────────────────

const eur = (v) =>
  new Intl.NumberFormat('de-AT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

const pct = (v) =>
  new Intl.NumberFormat('de-AT', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v / 100);

const dateLabel = (d) =>
  new Date(d).toLocaleDateString('de-AT', { year: 'numeric', month: '2-digit', day: '2-digit' });

// ── Custom chart tooltip ──────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <Paper elevation={4} sx={{ p: 1.5, minWidth: 200 }}>
      <Typography variant="caption" fontWeight={700} display="block" mb={0.5}>
        {label}
      </Typography>
      {payload.map((entry) => (
        <Box key={entry.name} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <Typography variant="caption" color={entry.color}>
            {entry.name}
          </Typography>
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

// ── Section heading ───────────────────────────────────────────────────────────

function SectionTitle({ children }) {
  return (
    <Typography variant="overline" color="text.secondary" fontWeight={700} letterSpacing={1} display="block" mb={1.5}>
      {children}
    </Typography>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function EtfScoreResult({ data }) {
  const chartData = [...data.reportMetrics]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((m) => ({
      date: dateLabel(m.date),
      'Deemed Income': m.deemedIncomeEur,
      'ETF Price': m.etfPriceOnDateEur,
      'Deemed / Price %': m.deemedIncomeToEtfPricePercent,
    }));

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          {data.isin}
        </Typography>
        <Chip label={data.originalCurrency} size="small" color="primary" variant="outlined" />
        <Chip label={`${data.totalReports} report${data.totalReports !== 1 ? 's' : ''}`} size="small" variant="outlined" />
      </Box>

      {/* ── Price Overview ─────────────────────────────────────────────────── */}
      <SectionTitle>Price Overview</SectionTitle>
      <Grid container spacing={2} mb={4}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Current ETF Price"
            value={eur(data.currentEtfPriceEur)}
            color="#1976d2"
            tooltip="Latest available ETF price converted to EUR"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Price at Period Start"
            value={eur(data.etfPriceAtFirstBusinessYearStartEur)}
            subtitle={dateLabel(data.firstBusinessYearStart)}
            color="#7b1fa2"
            tooltip="ETF price at the start of the first business year, in EUR"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Price at Period End"
            value={eur(data.etfPriceAtLastBusinessYearEndEur)}
            subtitle={dateLabel(data.lastBusinessYearEnd)}
            color="#7b1fa2"
            tooltip="ETF price at the end of the last business year, in EUR"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Total Gains (Period)"
            value={eur(data.totalGains)}
            color={data.totalGains >= 0 ? '#2e7d32' : '#c62828'}
            tooltip="Price appreciation from first business year start to last business year end, in EUR"
          />
        </Grid>
      </Grid>

      <Divider sx={{ mb: 3 }} />

      {/* ── Deemed Income Summary ──────────────────────────────────────────── */}
      <SectionTitle>Deemed Income (Ausschüttungsgleiche Erträge)</SectionTitle>
      <Grid container spacing={2} mb={4}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Total Deemed Gains"
            value={eur(data.deemedGains)}
            color="#e65100"
            tooltip="Sum of all deemed incomes across all reports, in EUR"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Deemed / Total Gains"
            value={pct(data.deemedGainsToTotalGainsPercent)}
            color="#e65100"
            tooltip="Deemed gains as a percentage of total price gains over the period"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Avg Deemed Income / Year"
            value={eur(data.avgDeemedIncomeEur)}
            color="#f57c00"
            tooltip="Average deemed income per report year, in EUR"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Avg Deemed / Current Price"
            value={pct(data.avgDeemedIncomeToCurrentEtfPricePercent)}
            color="#f57c00"
            tooltip="Average yearly deemed income as a % of the current ETF price — useful for comparing ongoing tax drag"
          />
        </Grid>
      </Grid>

      <Divider sx={{ mb: 3 }} />

      {/* ── Volatility / Consistency ───────────────────────────────────────── */}
      <SectionTitle>Consistency Metrics</SectionTitle>
      <Grid container spacing={2} mb={4}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Avg Deemed / ETF Price %"
            value={pct(data.avgDeemedIncomeToEtfPricePercent)}
            color="#00796b"
            tooltip="Average of (deemed income / ETF price on report date) across all reports"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Max Deemed Income Diff"
            value={eur(data.maxDeemedIncomeDiffEur)}
            color="#d32f2f"
            tooltip="Maximum difference between any two yearly deemed incomes — indicates volatility"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Max Diff / Avg ETF Price %"
            value={pct(data.maxDiffToAvgEtfPricePercent)}
            color="#d32f2f"
            tooltip="Max deemed income difference as a % of average ETF price on report dates"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Analysis Period"
            value={`${data.totalReports} years`}
            subtitle={`${dateLabel(data.firstBusinessYearStart)} → ${dateLabel(data.lastBusinessYearEnd)}`}
            color="#546e7a"
          />
        </Grid>
      </Grid>

      <Divider sx={{ mb: 3 }} />

      {/* ── Chart ──────────────────────────────────────────────────────────── */}
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
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: 13 }} />
            <Bar yAxisId="eur" dataKey="Deemed Income" fill="#e65100" opacity={0.85} radius={[3, 3, 0, 0]} />
            <Line yAxisId="eur" type="monotone" dataKey="ETF Price" stroke="#1976d2" strokeWidth={2} dot={{ r: 4 }} />
            <Line yAxisId="pct" type="monotone" dataKey="Deemed / Price %" stroke="#2e7d32" strokeWidth={2} strokeDasharray="5 3" dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </Paper>

      {/* ── Per-report Table ───────────────────────────────────────────────── */}
      <SectionTitle>Per-Report Detail</SectionTitle>
      <TableContainer component={Paper} elevation={1}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 700, backgroundColor: 'grey.100' } }}>
              <TableCell>Report Date</TableCell>
              <TableCell align="right">Deemed Income (EUR)</TableCell>
              <TableCell align="right">ETF Price (EUR)</TableCell>
              <TableCell align="right">Deemed / Price</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {[...data.reportMetrics]
              .sort((a, b) => new Date(a.date) - new Date(b.date))
              .map((m, i) => (
                <TableRow key={i} hover sx={{ '&:last-child td': { border: 0 } }}>
                  <TableCell>{dateLabel(m.date)}</TableCell>
                  <TableCell align="right">{eur(m.deemedIncomeEur)}</TableCell>
                  <TableCell align="right">{eur(m.etfPriceOnDateEur)}</TableCell>
                  <TableCell align="right">
                    <Chip
                      label={pct(m.deemedIncomeToEtfPricePercent)}
                      size="small"
                      sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                      color={m.deemedIncomeToEtfPricePercent > data.avgDeemedIncomeToEtfPricePercent ? 'warning' : 'default'}
                    />
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

