import { useState } from 'react';
import { Box, Grid, Divider, Typography, Chip } from '@mui/material';
import { eur, pct, dateLabel } from '../../../utils/formatters';
import { scoreToColor } from '../config/gradeConfig';
import MetricCard from '../../../components/MetricCard';
import SectionTitle from '../../../components/SectionTitle';
import TaxGradeBadge from './TaxGradeBadge';
import ConfidenceBadge from './ConfidenceBadge';
import ScoreBreakdownDialog from './ScoreBreakdownDialog';
import ReportChart from './ReportChart';
import ReportTable from './ReportTable';

/**
 * Full result panel rendered after a successful score fetch.
 * This component is intentionally kept as a thin layout orchestrator —
 * all non-trivial logic and sub-sections live in their own files.
 *
 * @param {{ data: import('../api/scoreApi').ScoreResult }} props
 */
export default function EtfScoreResult({ data }) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <Box>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {data.name && (
            <Typography variant="h5" fontWeight={700} lineHeight={1.2}>
              {data.name}
            </Typography>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="body2" fontFamily="monospace" color="text.secondary" fontWeight={600} letterSpacing={1}>
              {data.isin}
            </Typography>
            {data.ticker && (
              <Chip label={data.ticker} size="small" variant="outlined" color="secondary" />
            )}
            <Chip label={data.originalCurrency} size="small" color="primary" variant="outlined" />
            <Chip label={`${data.totalReports} report${data.totalReports !== 1 ? 's' : ''}`} size="small" variant="outlined" />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'stretch' }}>
          <ConfidenceBadge
            level={data.confidenceLevel}
            label={data.confidenceLabel}
            totalReports={data.totalReports}
          />
          <TaxGradeBadge
            grade={data.taxEfficiencyGrade}
            score={data.taxEfficiencyScore}
            breakdown={data.taxEfficiencyScoreBreakdown}
            onClick={() => setDialogOpen(true)}
          />
        </Box>
      </Box>

      <ScoreBreakdownDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        grade={data.taxEfficiencyGrade}
        score={data.taxEfficiencyScore}
        breakdown={data.taxEfficiencyScoreBreakdown}
      />

      {/* ── Price Overview ─────────────────────────────────────────────────── */}
      <SectionTitle>Price Overview</SectionTitle>
      <Grid container spacing={2} mb={4}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard title="Current ETF Price" value={eur(data.currentEtfPriceEur)} color="#1976d2"
            tooltip="Latest available ETF price converted to EUR" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard title="Price at Period Start" value={eur(data.etfPriceAtFirstBusinessYearStartEur)}
            subtitle={dateLabel(data.firstBusinessYearStart)} color="#7b1fa2"
            tooltip="ETF price at the start of the first business year (Geschäftsjahr Beginn as reported in the OeKB fund tax report), in EUR" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard title="Price at Period End" value={eur(data.etfPriceAtLastBusinessYearEndEur)}
            subtitle={dateLabel(data.lastBusinessYearEnd)} color="#7b1fa2"
            tooltip="ETF price at the end of the last business year (Geschäftsjahr Ende as reported in the OeKB fund tax report), in EUR" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard title="Total Gains (Period)" value={eur(data.totalGains)}
            color={data.totalGains >= 0 ? '#2e7d32' : '#c62828'}
            tooltip="Price appreciation over the analysis period in EUR. Dates come from the OeKB fund tax reports (business year = Geschäftsjahr start/end reported by OeKB)." />
        </Grid>
      </Grid>

      <Divider sx={{ mb: 3 }} />

      {/* ── Deemed Income Summary ──────────────────────────────────────────── */}
      <SectionTitle>Deemed Income (Ausschüttungsgleiche Erträge)</SectionTitle>
      <Grid container spacing={2} mb={4}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard title="Total Deemed Gains" value={eur(data.deemedGains)} color="#e65100"
            tooltip="Sum of all deemed incomes across all reports, in EUR" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard title="Deemed / Total Gains" value={pct(data.deemedGainsToTotalGainsPercent)} color="#e65100"
            tooltip="Deemed gains as a percentage of total price gains over the period" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard title="Avg Deemed Income / Year" value={eur(data.avgDeemedIncomeEur)} color="#f57c00"
            tooltip="Average deemed income per report year, in EUR" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard title="Avg Deemed / Current Price" value={pct(data.avgDeemedIncomeToCurrentEtfPricePercent)} color="#f57c00"
            tooltip="Average yearly deemed income as a percentage of the current ETF price — useful for comparing the ongoing annual tax burden between ETFs (shows the yearly tax cost relative to your current holding value)." />
        </Grid>
      </Grid>

      <Divider sx={{ mb: 3 }} />

      {/* ── Consistency Metrics ────────────────────────────────────────────── */}
      <SectionTitle>Consistency Metrics</SectionTitle>
      <Grid container spacing={2} mb={4}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard title="Avg Deemed / ETF Price %" value={pct(data.avgDeemedIncomeToEtfPricePercent)} color="#00796b"
            tooltip="Average of (deemed income / ETF price on report date) across all reports — the primary annual tax burden indicator (shows typical yearly deemed income relative to ETF value)." />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard title="Max Deemed Income Diff" value={eur(data.maxDeemedIncomeDiffEur)} color="#d32f2f"
            tooltip="Largest absolute difference in deemed income between any two years — shows worst-case year-to-year swing in EUR" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard title="Max Swing / Avg Price" value={pct(data.maxDiffToAvgEtfPricePercent)} color="#d32f2f"
            tooltip="Max deemed income swing as a % of average ETF price — answers 'how large was the worst-case annual tax base jump relative to my holding value?'" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Predictability Score"
            value={`${data.taxEfficiencyScoreBreakdown.consistency.score} / 100`}
            subtitle={
              data.taxEfficiencyScoreBreakdown.consistency.coefficientOfVariation !== null
                ? `CV: ${data.taxEfficiencyScoreBreakdown.consistency.coefficientOfVariation.toFixed(3)}`
                : 'Insufficient data or mean too small to compute CV'
            }
            color={scoreToColor(data.taxEfficiencyScoreBreakdown.consistency.score)}
            tooltip="Measures how stable the annual deemed income is relative to its average. We compute the Coefficient of Variation (CV = stddev / mean) of the yearly deemed/price ratios and map it to 0–100 (higher = more predictable). Note: CV is undefined when the mean is too small or when there are fewer than 2 reports; in those cases a neutral predictability is shown. CV measures typical dispersion, not worst-case jumps or directional trends." />
        </Grid>
      </Grid>

      <Divider sx={{ mb: 3 }} />

      {/* ── Chart & Table ──────────────────────────────────────────────────── */}
      <ReportChart reportMetrics={data.reportMetrics} />
      <ReportTable
        reportMetrics={data.reportMetrics}
        avgDeemedIncomeToEtfPricePercent={data.avgDeemedIncomeToEtfPricePercent}
      />

    </Box>
  );
}

