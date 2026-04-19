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
import { useTranslation } from '../../../i18n/LanguageProvider';

/**
 * Full result panel rendered after a successful score fetch.
 * This component is intentionally kept as a thin layout orchestrator —
 * all non-trivial logic and sub-sections live in their own files.
 *
 * @param {{ data: import('../api/scoreApi').ScoreResult }} props
 */
export default function EtfScoreResult({ data }) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const { t } = useTranslation();

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
            <Chip label={`${data.totalReports} ${data.totalReports !== 1 ? t('labels.reports_plural') : t('labels.report')}`} size="small" variant="outlined" />
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
      <SectionTitle>{t('etfScore.section_priceOverview')}</SectionTitle>
      <Grid container spacing={2} mb={4}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard title={t('etfScore.metric_currentPrice')} value={eur(data.currentEtfPriceEur)} color="#1976d2"
            tooltip={t('etfScore.currentPrice_tooltip')} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard title={t('etfScore.metric_pricePeriodStart')} value={eur(data.etfPriceAtFirstBusinessYearStartEur)}
            subtitle={dateLabel(data.firstBusinessYearStart)} color="#7b1fa2"
            tooltip={t('etfScore.periodStart_tooltip')} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard title={t('etfScore.metric_pricePeriodEnd')} value={eur(data.etfPriceAtLastBusinessYearEndEur)}
            subtitle={dateLabel(data.lastBusinessYearEnd)} color="#7b1fa2"
            tooltip={t('etfScore.periodEnd_tooltip')} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard title={t('etfScore.metric_totalGainsPeriod')} value={eur(data.totalGains)}
            color={data.totalGains >= 0 ? '#2e7d32' : '#c62828'}
            tooltip={t('etfScore.totalGains_tooltip')} />
        </Grid>
      </Grid>

      <Divider sx={{ mb: 3 }} />

      {/* ── Deemed Income Summary ──────────────────────────────────────────── */}
      <SectionTitle>{t('etfScore.section_deemedIncome')}</SectionTitle>
      <Grid container spacing={2} mb={4}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard title={t('etfScore.metric_totalDeemedGains')} value={eur(data.deemedGains)} color="#e65100"
            tooltip={t('scoreDialog.taxBurden_explain')} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard title={t('etfScore.metric_deemedToTotal')} value={pct(data.deemedGainsToTotalGainsPercent)} color="#e65100"
            tooltip={t('scoreDialog.deemed_explain')} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard title={t('etfScore.metric_avgDeemedPerYear')} value={eur(data.avgDeemedIncomeEur)} color="#f57c00"
            tooltip={t('scoreDialog.taxBurden_explain')} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard title={t('etfScore.metric_avgDeemedToCurrent')} value={pct(data.avgDeemedIncomeToCurrentEtfPricePercent)} color="#f57c00"
            tooltip={t('etfScore.avgDeemedToCurrent_tooltip')} />
        </Grid>
      </Grid>

      <Divider sx={{ mb: 3 }} />

      {/* ── Consistency Metrics ────────────────────────────────────────────── */}
      <SectionTitle>{t('etfScore.section_consistency')}</SectionTitle>
      <Grid container spacing={2} mb={4}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard title={t('etfScore.metric_avgDeemedEtfPct')} value={pct(data.avgDeemedIncomeToEtfPricePercent)} color="#00796b"
            tooltip={t('etfScore.predictability_tooltip')} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard title={t('etfScore.metric_maxDeemedDiff')} value={eur(data.maxDeemedIncomeDiffEur)} color="#d32f2f"
            tooltip={t('comparison.maxSwing_tooltip')} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard title={t('etfScore.metric_maxSwingAvgPrice')} value={pct(data.maxDiffToAvgEtfPricePercent)} color="#d32f2f"
            tooltip={t('comparison.maxSwing_tooltip')} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title={t('etfScore.metric_predictabilityScore')}
            value={`${data.taxEfficiencyScoreBreakdown.consistency.score} / 100`}
            subtitle={
              data.taxEfficiencyScoreBreakdown.consistency.coefficientOfVariation !== null
                ? `CV: ${data.taxEfficiencyScoreBreakdown.consistency.coefficientOfVariation.toFixed(3)}`
                : t('scoreDialog.cv_unavailable')
            }
            color={scoreToColor(data.taxEfficiencyScoreBreakdown.consistency.score)}
            tooltip={t('etfScore.predictability_tooltip')} />
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

