import { Box, Alert, Grid, Paper, Typography, Chip } from '@mui/material';
import { useTranslation } from '../../../i18n/LanguageProvider';
import { GRADE_COLORS } from '../../etfScore/config/gradeConfig';
import ComparisonTable from './ComparisonTable';

// ── Per-ETF summary card ──────────────────────────────────────────────────────

/**
 * Header card for a single ETF showing its grade, score and confidence at a glance.
 * Rendered above the comparison table, one card per ETF.
 */
function EtfSummaryCard({ data }) {
  const { t } = useTranslation();
  const gradeColor = GRADE_COLORS[data.taxEfficiencyGrade] ?? '#546e7a';

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2.5,
        textAlign: 'center',
        height: '100%',
        borderTop: `5px solid ${gradeColor}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
      }}
    >
      {/* ISIN + name */}
      {data.name && (
        <Typography variant="body2" fontWeight={700} lineHeight={1.3} mb={0.25}>
          {data.name}
        </Typography>
      )}
      <Typography variant="caption" fontFamily="monospace" fontWeight={600} letterSpacing={1.5} color="text.secondary">
        {data.isin}
      </Typography>
      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', justifyContent: 'center', mb: 0.5 }}>
        {data.ticker && <Chip label={data.ticker} size="small" variant="outlined" color="secondary" />}
        <Chip label={data.originalCurrency} size="small" color="primary" variant="outlined" />
      </Box>

      {/* Grade badge */}
      <Box
        sx={{
          bgcolor: gradeColor,
          color: 'white',
          borderRadius: 2,
          py: 1.25,
          px: 3,
          mt: 0.5,
          minWidth: 90,
        }}
      >
        <Typography variant="h3" fontWeight={900} lineHeight={1} color="inherit">
          {data.taxEfficiencyGrade}
        </Typography>
        <Typography variant="caption" fontWeight={700} color="inherit" display="block" letterSpacing={0.5} mt={0.25}>
          {t('labels.taxEfficiency')}
        </Typography>
        <Typography variant="caption" color="inherit" sx={{ opacity: 0.85 }}>
          {t(`grades.${data.taxEfficiencyGrade}`)}
        </Typography>
      </Box>

      {/* Score + confidence */}
      <Typography variant="body2" color="text.secondary">
        {t('labels.score')}: <strong style={{ color: gradeColor }}>{data.taxEfficiencyScore} / 100</strong>
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {data.confidenceLabel} · {data.totalReports} {data.totalReports !== 1 ? t('labels.reports_plural') : t('labels.report')}
      </Typography>
    </Paper>
  );
}

// ── Result orchestrator ───────────────────────────────────────────────────────

/**
 * Renders the full comparison view: error alerts for failed ISINs,
 * a row of summary cards for successful ones, and the metric comparison table.
 *
 * @param {{ results: Array<{ isin: string, data: object|null, error: string|null }> }} props
 */
export default function EtfComparisonResult({ results }) {
  const successful = results.filter((r) => r.data !== null);
  const failed = results.filter((r) => r.error !== null);

  return (
    <Box>
      {/* Error alerts */}
      {failed.map((r) => (
        <Alert key={r.isin} severity="error" sx={{ mb: 1 }}>
          <strong>{r.isin}</strong>: {r.error}
        </Alert>
      ))}

      {/* Need at least 2 successful results to show a comparison */}
      {successful.length < 2 && (
        <Alert severity="warning" sx={{ mt: 1 }}>
          {t('etfComparison.need_at_least_two')}
        </Alert>
      )}

      {successful.length >= 2 && (
        <Box>
          {/* ── Grade summary cards ──────────────────────────────────────── */}
          <Grid container spacing={2} mb={3}>
            {successful.map((r) => (
              <Grid key={r.isin} size={{ xs: 12, sm: 6, md: Math.min(6, Math.floor(12 / successful.length)) }}>
                <EtfSummaryCard data={r.data} />
              </Grid>
            ))}
          </Grid>

          {/* ── Metric comparison table ──────────────────────────────────── */}
          <ComparisonTable results={successful.map((r) => r.data)} />
        </Box>
      )}
    </Box>
  );
}

