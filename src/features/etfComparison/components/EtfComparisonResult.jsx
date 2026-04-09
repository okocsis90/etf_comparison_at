import { Box, Alert, Grid, Paper, Typography, Chip } from '@mui/material';
import { GRADE_COLORS, GRADE_LABELS } from '../../etfScore/config/gradeConfig';
import ComparisonTable from './ComparisonTable';

// ── Per-ETF summary card ──────────────────────────────────────────────────────

/**
 * Header card for a single ETF showing its grade, score and confidence at a glance.
 * Rendered above the comparison table, one card per ETF.
 */
function EtfSummaryCard({ data }) {
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
      {/* ISIN */}
      <Typography variant="caption" fontFamily="monospace" fontWeight={800} letterSpacing={1.5}>
        {data.isin}
      </Typography>
      <Chip label={data.originalCurrency} size="small" color="primary" variant="outlined" />

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
          TAX EFFICIENCY
        </Typography>
        <Typography variant="caption" color="inherit" sx={{ opacity: 0.85 }}>
          {GRADE_LABELS[data.taxEfficiencyGrade]}
        </Typography>
      </Box>

      {/* Score + confidence */}
      <Typography variant="body2" color="text.secondary">
        Score: <strong style={{ color: gradeColor }}>{data.taxEfficiencyScore} / 100</strong>
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {data.confidenceLabel} · {data.totalReports} report{data.totalReports !== 1 ? 's' : ''}
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
          At least 2 ETFs must load successfully to show a comparison.
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

