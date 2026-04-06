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
  Tooltip,
} from '@mui/material';
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

// ── Tax Efficiency Grade ──────────────────────────────────────────────────────

const GRADE_COLORS = {
  A: '#2e7d32',
  B: '#558b2f',
  C: '#f57f17',
  D: '#e65100',
  E: '#c62828',
};

const GRADE_LABELS = {
  A: 'Excellent',
  B: 'Good',
  C: 'Moderate',
  D: 'Poor',
  E: 'High Tax Drag',
};

/** Maps a 0-100 score to the same green→red scale used by the grade badge. */
const scoreToColor = (score) => {
  if (score >= 80) return GRADE_COLORS.A;
  if (score >= 60) return GRADE_COLORS.B;
  if (score >= 40) return GRADE_COLORS.C;
  if (score >= 20) return GRADE_COLORS.D;
  return GRADE_COLORS.E;
};

function TaxGradeBadge({ grade, score, breakdown }) {
  const color = GRADE_COLORS[grade] ?? '#546e7a';

  const tooltipContent = (
    <Box sx={{ p: 0.5, maxWidth: 260 }}>
      <Typography variant="caption" fontWeight={700} display="block" mb={1}>
        Austrian Tax Efficiency — {score}/100
      </Typography>

      <Typography variant="caption" display="block">
        <strong>Tax Burden</strong> ({Math.round(breakdown.taxBurden.weight * 100)} %):&nbsp;
        {breakdown.taxBurden.score}/100
        <br />
        avg deemed/price: {breakdown.taxBurden.avgDeemedToEtfPricePct.toFixed(3)} %
      </Typography>

      <Typography variant="caption" display="block" mt={0.75}>
        <strong>Consistency</strong> ({Math.round(breakdown.consistency.weight * 100)} %):&nbsp;
        {breakdown.consistency.score}/100
        {breakdown.consistency.coefficientOfVariation !== null && (
          <> (CV: {breakdown.consistency.coefficientOfVariation.toFixed(3)})</>
        )}
        {breakdown.consistency.coefficientOfVariation === null && (
          <> (insufficient data)</>
        )}
      </Typography>

      {breakdown.deemedToGains.included ? (
        <Typography variant="caption" display="block" mt={0.75}>
          <strong>Deemed / Gains</strong> ({Math.round(breakdown.deemedToGains.weight * 100)} %):&nbsp;
          {breakdown.deemedToGains.score}/100
          <br />
          {breakdown.deemedToGains.deemedGainsToTotalGainsPct.toFixed(1)} % of total gains taxed annually
        </Typography>
      ) : (
        <Typography variant="caption" display="block" mt={0.75} sx={{ opacity: 0.7 }}>
          <strong>Deemed / Gains</strong>: excluded (gains not positive or ratio out of range)
        </Typography>
      )}
    </Box>
  );

  return (
    <Tooltip title={tooltipContent} arrow placement="left">
      <Box
        sx={{
          bgcolor: color,
          color: 'white',
          borderRadius: 2,
          px: 2.5,
          py: 1.5,
          textAlign: 'center',
          cursor: 'help',
          minWidth: 90,
          boxShadow: 3,
          userSelect: 'none',
        }}
      >
        <Typography variant="h2" fontWeight={900} lineHeight={1} color="inherit">
          {grade}
        </Typography>
        <Typography variant="caption" fontWeight={700} color="inherit" display="block" mt={0.5} letterSpacing={0.5}>
          TAX EFFICIENCY
        </Typography>
        <Typography variant="caption" color="inherit" sx={{ opacity: 0.85 }}>
          {GRADE_LABELS[grade]}
        </Typography>
      </Box>
    </Tooltip>
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
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="h5" fontWeight={700}>
            {data.isin}
          </Typography>
          <Chip label={data.originalCurrency} size="small" color="primary" variant="outlined" />
          <Chip label={`${data.totalReports} report${data.totalReports !== 1 ? 's' : ''}`} size="small" variant="outlined" />
        </Box>
        <TaxGradeBadge
          grade={data.taxEfficiencyGrade}
          score={data.taxEfficiencyScore}
          breakdown={data.taxEfficiencyScoreBreakdown}
        />
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
            tooltip="Average of (deemed income / ETF price on report date) across all reports — the primary annual tax drag indicator"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Max Deemed Income Diff"
            value={eur(data.maxDeemedIncomeDiffEur)}
            color="#d32f2f"
            tooltip="Largest absolute difference in deemed income between any two years — shows worst-case year-to-year swing in EUR"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Max Swing / Avg Price"
            value={pct(data.maxDiffToAvgEtfPricePercent)}
            color="#d32f2f"
            tooltip="Max deemed income swing as a % of average ETF price — answers 'how large was the worst-case annual tax base jump relative to my holding value?'"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Predictability Score"
            value={`${data.taxEfficiencyScoreBreakdown.consistency.score} / 100`}
            subtitle={
              data.taxEfficiencyScoreBreakdown.consistency.coefficientOfVariation !== null
                ? `CV: ${data.taxEfficiencyScoreBreakdown.consistency.coefficientOfVariation.toFixed(3)}`
                : 'Insufficient data (< 2 reports)'
            }
            color={scoreToColor(data.taxEfficiencyScoreBreakdown.consistency.score)}
            tooltip="Measures how stable the annual deemed income is relative to its own average, using the Coefficient of Variation (CV = stddev / mean of yearly deemed/price ratios). Unlike the Max Swing card, this is scale-independent — a high-but-stable ETF still scores well here. Score 100 = perfectly consistent, 0 = chaotic."
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
            <RechartsTooltip content={<ChartTooltip />} />
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

