import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Box,
  Typography,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { eur, pct } from '../../../utils/formatters';
import { useTranslation } from '../../../i18n/LanguageProvider';

// ── Metric definitions ────────────────────────────────────────────────────────
// Each metric has:
//   label        — display name
//   get(d)       — accessor on a score result object
//   format(v)    — how to display the raw value
//   lowerIsBetter / higherIsBetter — used for winner highlighting
//   tooltip      — explanation shown on hover

const SECTIONS = (t) => [
  {
    title: t('sections.taxEfficiency'),
    metrics: [
        {
          label: t('comparison.metric_overallScore'),
          get: (d) => d.taxEfficiencyScore,
          format: (v) => `${v} / 100`,
          higherIsBetter: true,
          tooltip: t('comparison.overallScore_tooltip'),
        },
        {
          label: t('etfScore.metric_avgDeemedEtfPct'),
          get: (d) => d.avgDeemedIncomeToEtfPricePercent,
          format: pct,
          lowerIsBetter: true,
          tooltip: t('etfScore.predictability_tooltip'),
        },
        {
          label: t('etfScore.metric_predictabilityScore'),
          get: (d) => d.taxEfficiencyScoreBreakdown.consistency.score,
          format: (v) => `${v} / 100`,
          higherIsBetter: true,
          tooltip: t('comparison.predictability_tooltip'),
        },
    ],
  },
  {
    title: t('sections.priceOverview'),
    metrics: [
        {
          label: t('etfScore.metric_currentPrice'),
          get: (d) => d.currentEtfPriceEur,
          format: eur,
          tooltip: t('etfScore.currentPrice_tooltip'),
        },
        {
          label: t('etfScore.metric_totalGainsPeriod'),
          get: (d) => d.totalGains,
          format: eur,
          higherIsBetter: true,
          tooltip: t('etfScore.totalGains_tooltip'),
        },
    ],
  },
  {
    title: t('sections.deemedIncome'),
    metrics: [
        {
          label: t('etfScore.metric_totalDeemedGains'),
          get: (d) => d.deemedGains,
          format: eur,
          lowerIsBetter: true,
          tooltip: t('scoreDialog.taxBurden_explain'),
        },
        {
          label: t('etfScore.metric_deemedToTotal'),
          get: (d) => d.deemedGainsToTotalGainsPercent,
          format: pct,
          lowerIsBetter: true,
          tooltip: t('scoreDialog.deemed_explain'),
        },
        {
          label: t('etfScore.metric_avgDeemedPerYear'),
          get: (d) => d.avgDeemedIncomeEur,
          format: eur,
          lowerIsBetter: true,
          tooltip: t('scoreDialog.taxBurden_explain'),
        },
        {
          label: t('etfScore.metric_avgDeemedToCurrent'),
          get: (d) => d.avgDeemedIncomeToCurrentEtfPricePercent,
          format: pct,
          lowerIsBetter: true,
          tooltip: t('etfScore.avgDeemedToCurrent_tooltip'),
        },
    ],
  },
  {
    title: t('sections.consistency'),
    metrics: [
      {
        label: t('etfScore.metric_maxSwingAvgPrice'),
        get: (d) => d.maxDiffToAvgEtfPricePercent,
        format: pct,
        lowerIsBetter: true,
        tooltip: (t) => t('comparison.maxSwing_tooltip'),
      },
        {
          label: t('scoreDialog.cv_label'),
          get: (d) => d.taxEfficiencyScoreBreakdown.consistency.coefficientOfVariation,
          format: (v) => (v !== null ? v.toFixed(3) : '—'),
          lowerIsBetter: true,
          tooltip: (t) => t('comparison.cv_tooltip'),
        },
        {
          label: t('comparison.metric_reportsAvailable'),
          get: (d) => d.totalReports,
          format: (v) => String(v),
          higherIsBetter: true,
          tooltip: t('comparison.reports_tooltip'),
        },
    ],
  },
];

// ── Winner detection ──────────────────────────────────────────────────────────

/**
 * Returns the index of the winning column for a metric, or -1 if no clear winner
 * (tie, or metric has no direction preference).
 */
function getWinnerIndex(values, metric) {
  if (!metric.lowerIsBetter && !metric.higherIsBetter) return -1;
  const nums = values.map((v) => (typeof v === 'number' ? v : null));
  const validNums = nums.filter((n) => n !== null);
  if (validNums.length < 2) return -1;
  const best = metric.lowerIsBetter ? Math.min(...validNums) : Math.max(...validNums);
  const ties = nums.filter((n) => n === best).length;
  return ties === 1 ? nums.indexOf(best) : -1;
}

// ── Table ─────────────────────────────────────────────────────────────────────

/**
 * Renders a side-by-side metric comparison table.
 * The first column lists metric names; each subsequent column is one ETF.
 * The winning cell per row is highlighted in green.
 *
 * @param {{ results: object[] }} props  — array of successful score API responses
 */
export default function ComparisonTable({ results }) {
  const { t } = useTranslation();
  const sections = SECTIONS(t);

  return (
    <TableContainer component={Paper} elevation={2} sx={{ overflowX: 'auto' }}>
      <Table size="small" stickyHeader>

        {/* ── Column headers ──────────────────────────────────────────────── */}
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.100', minWidth: 210 }}>
              {t('comparison.metric_label')}
            </TableCell>
            {results.map((d) => (
              <TableCell
                key={d.isin}
                align="center"
                sx={{ fontWeight: 700, bgcolor: 'grey.100', minWidth: 160 }}
              >
                {d.name && (
                  <Typography variant="caption" display="block" fontWeight={700} lineHeight={1.3} mb={0.25}>
                    {d.name}
                  </Typography>
                )}
                <Typography variant="caption" fontWeight={600} fontFamily="monospace" letterSpacing={1} color="text.secondary">
                  {d.isin}
                </Typography>
                {d.ticker && (
                  <Typography variant="caption" display="block" color="secondary.main" fontWeight={600} mt={0.25}>
                    {d.ticker}
                  </Typography>
                )}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        {/* ── Metric rows ─────────────────────────────────────────────────── */}
        <TableBody>
          {sections.map((section) => (
            <>
              {/* Section heading row */}
              <TableRow key={`section-${section.title}`}>
                <TableCell
                  colSpan={results.length + 1}
                  sx={{
                    bgcolor: 'grey.50',
                    py: 0.75,
                    borderBottom: '2px solid',
                    borderColor: 'grey.300',
                  }}
                >
                  <Typography variant="overline" fontWeight={700} color="text.secondary" letterSpacing={1}>
                    {section.title}
                  </Typography>
                </TableCell>
              </TableRow>

              {/* One row per metric */}
              {section.metrics.map((metric) => {
                const values = results.map((d) => {
                  try { return metric.get(d); } catch { return null; }
                });
                const winnerIdx = getWinnerIndex(values, metric);

                return (
                  <TableRow key={metric.label} hover>
                    {/* Metric label + optional tooltip */}
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="body2">{metric.label}</Typography>
                        {metric.tooltip && (
                          <Tooltip title={typeof metric.tooltip === 'function' ? metric.tooltip(t) : metric.tooltip} arrow placement="right">
                            <InfoOutlinedIcon sx={{ fontSize: 13, color: 'text.disabled', cursor: 'help' }} />
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>

                    {/* Value cells */}
                    {values.map((val, i) => (
                      <TableCell
                        key={i}
                        align="center"
                        sx={{
                          bgcolor: winnerIdx === i ? '#e8f5e9' : 'transparent',
                          fontWeight: winnerIdx === i ? 700 : 400,
                          color: winnerIdx === i ? '#2e7d32' : 'inherit',
                          transition: 'background-color 0.2s',
                        }}
                      >
                        {val !== null && val !== undefined ? metric.format(val) : t('common.na')}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

