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

// ── Metric definitions ────────────────────────────────────────────────────────
// Each metric has:
//   label        — display name
//   get(d)       — accessor on a score result object
//   format(v)    — how to display the raw value
//   lowerIsBetter / higherIsBetter — used for winner highlighting
//   tooltip      — explanation shown on hover

const SECTIONS = [
  {
    title: 'Tax Efficiency',
    metrics: [
        {
          label: 'Overall Score',
          get: (d) => d.taxEfficiencyScore,
          format: (v) => `${v} / 100`,
          higherIsBetter: true,
          tooltip: 'Composite tax efficiency score (0–100). Combines tax burden, predictability, and the share of deemed vs total gains. Higher is better.',
        },
        {
          label: 'Avg Deemed / ETF Price %',
          get: (d) => d.avgDeemedIncomeToEtfPricePercent,
          format: pct,
          lowerIsBetter: true,
          tooltip: 'Average annual deemed income as a percentage of the ETF price — the primary annual tax burden indicator. Shows the typical yearly deemed income relative to ETF value; lower values mean a smaller annual tax cost.',
        },
        {
          label: 'Predictability Score',
          get: (d) => d.taxEfficiencyScoreBreakdown.consistency.score,
          format: (v) => `${v} / 100`,
          higherIsBetter: true,
          tooltip: 'How predictable the annual deemed income is. Computed from the Coefficient of Variation (CV = stddev / mean) of yearly deemed/price ratios; the CV is inverted and scaled to 0–100 so that higher = more predictable.',
        },
    ],
  },
  {
    title: 'Price Overview',
    metrics: [
      {
        label: 'Current ETF Price',
        get: (d) => d.currentEtfPriceEur,
        format: eur,
        tooltip: 'Latest available ETF price in EUR.',
      },
        {
          label: 'Total Gains (Period)',
          get: (d) => d.totalGains,
          format: eur,
          higherIsBetter: true,
          tooltip: 'Price appreciation over the analysis period in EUR. Dates are taken from the OeKB fund tax reports (business year = "Geschäftsjahr" start/end reported by OeKB).',
        },
    ],
  },
  {
    title: 'Deemed Income',
    metrics: [
      {
        label: 'Total Deemed Gains',
        get: (d) => d.deemedGains,
        format: eur,
        lowerIsBetter: true,
        tooltip: 'Sum of all deemed incomes across all reports, in EUR.',
      },
      {
        label: 'Deemed / Total Gains',
        get: (d) => d.deemedGainsToTotalGainsPercent,
        format: pct,
        lowerIsBetter: true,
        tooltip: 'Deemed gains as a % of total price gains over the analysis period.',
      },
      {
        label: 'Avg Deemed Income / Year',
        get: (d) => d.avgDeemedIncomeEur,
        format: eur,
        lowerIsBetter: true,
        tooltip: 'Average deemed income per report year, in EUR.',
      },
        {
          label: 'Avg Deemed / Current Price',
          get: (d) => d.avgDeemedIncomeToCurrentEtfPricePercent,
          format: pct,
          lowerIsBetter: true,
          tooltip: 'Average yearly deemed income as a percentage of the current ETF price — useful for comparing the ongoing annual tax burden between ETFs (shows the yearly tax cost relative to your current holding value).',
        },
    ],
  },
  {
    title: 'Consistency',
    metrics: [
      {
        label: 'Max Swing / Avg Price',
        get: (d) => d.maxDiffToAvgEtfPricePercent,
        format: pct,
        lowerIsBetter: true,
        tooltip: 'Worst-case year-to-year swing in deemed income as % of average ETF price.',
      },
        {
          label: 'Coefficient of Variation',
          get: (d) => d.taxEfficiencyScoreBreakdown.consistency.coefficientOfVariation,
          format: (v) => (v !== null ? v.toFixed(3) : '—'),
          lowerIsBetter: true,
          tooltip: 'Coefficient of Variation (CV) = standard deviation ÷ mean of yearly deemed/price ratios. A lower CV means the annual deemed income is more stable (more predictable).',
        },
      {
        label: 'Reports Available',
        get: (d) => d.totalReports,
        format: (v) => String(v),
        higherIsBetter: true,
        tooltip: 'Number of yearly reports available. More reports = more reliable analysis.',
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
  return (
    <TableContainer component={Paper} elevation={2} sx={{ overflowX: 'auto' }}>
      <Table size="small" stickyHeader>

        {/* ── Column headers ──────────────────────────────────────────────── */}
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.100', minWidth: 210 }}>
              Metric
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
          {SECTIONS.map((section) => (
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
                          <Tooltip title={metric.tooltip} arrow placement="right">
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
                        {val !== null && val !== undefined ? metric.format(val) : '—'}
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

